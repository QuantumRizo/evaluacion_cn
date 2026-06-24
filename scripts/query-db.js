import { Client, Databases } from 'node-appwrite';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env.local') });

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function main() {
    try {
        console.log("Fetching employees...");
        const emps = await databases.listDocuments('evaluacion_desempeno', 'employees');
        console.log("Employees found:");
        for (const emp of emps.documents) {
            console.log(`  ID: ${emp.$id} | Name: ${emp.name} | Email: ${emp.email} | Role: ${emp.role} | AuthUserID: ${emp.auth_user_id}`);
        }

        console.log("\nFetching evaluation_cycles...");
        const cycles = await databases.listDocuments('evaluacion_desempeno', 'evaluation_cycles');
        console.log("Cycles found:");
        for (const c of cycles.documents) {
            console.log(`  ID: ${c.$id} | Name: ${c.name} | Status: ${c.status}`);
        }

        console.log("\nFetching evaluation_assignments...");
        const assn = await databases.listDocuments('evaluacion_desempeno', 'evaluation_assignments');
        console.log("Assignments found:");
        for (const a of assn.documents) {
            console.log(`  ID: ${a.$id} | Cycle: ${a.cycle_id} | Evaluated: ${a.evaluated_id} | Evaluator: ${a.evaluator_id}`);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
