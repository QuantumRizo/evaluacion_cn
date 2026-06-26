import { Client, Databases, Query } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DB_ID = 'evaluacion_desempeno';
const EMPLOYEES = 'employees';
const ASSIGNMENTS = 'evaluation_assignments';

async function deduplicateEmployees() {
  try {
    console.log('Fetching employees...');
    const response = await databases.listDocuments(DB_ID, EMPLOYEES, [Query.limit(100)]);
    const employees = response.documents;
    
    const byEmail = {};
    employees.forEach(emp => {
      const email = emp.email.toLowerCase();
      if (!byEmail[email]) byEmail[email] = [];
      byEmail[email].push(emp);
    });

    for (const [email, emps] of Object.entries(byEmail)) {
      if (emps.length > 1) {
        console.log(`\nFound ${emps.length} duplicates for ${email}`);
        
        // Sort by createdAt descending (newest first)
        emps.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());
        
        const newest = emps[0];
        const duplicates = emps.slice(1);
        
        console.log(`Keeping NEWEST: ${newest.$id} (${newest.name})`);
        
        for (const dup of duplicates) {
          console.log(`Processing duplicate OLD: ${dup.$id}`);
          
          const evalAs = await databases.listDocuments(DB_ID, ASSIGNMENTS, [Query.equal('evaluated_id', dup.$id)]);
          for (const a of evalAs.documents) {
            await databases.updateDocument(DB_ID, ASSIGNMENTS, a.$id, { evaluated_id: newest.$id });
            console.log(`Updated evaluated_id in assignment ${a.$id}`);
          }
          
          const evalRs = await databases.listDocuments(DB_ID, ASSIGNMENTS, [Query.equal('evaluator_id', dup.$id)]);
          for (const a of evalRs.documents) {
            await databases.updateDocument(DB_ID, ASSIGNMENTS, a.$id, { evaluator_id: newest.$id });
            console.log(`Updated evaluator_id in assignment ${a.$id}`);
          }
          
          await databases.deleteDocument(DB_ID, EMPLOYEES, dup.$id);
          console.log(`Deleted duplicate employee ${dup.$id}`);
        }
      }
    }
    console.log('\nDeduplication finished.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

deduplicateEmployees();
