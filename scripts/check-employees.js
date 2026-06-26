import { Client, Databases } from 'node-appwrite';
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

async function checkEmployees() {
  try {
    const response = await databases.listDocuments(DB_ID, EMPLOYEES);
    console.log(`Total employees in DB: ${response.total}`);
    response.documents.forEach(doc => {
      console.log(`- ${doc.name} (ID: ${doc.$id}, Email: ${doc.email})`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkEmployees();
