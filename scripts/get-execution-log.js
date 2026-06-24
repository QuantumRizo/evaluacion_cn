import { Client, Functions } from 'node-appwrite';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env.local') });

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const functions = new Functions(client);

async function main() {
    const ids = ['6a3bef2c8c56f1d498bd', '6a3bef2c7c9d42ea2e86'];
    for (const id of ids) {
        try {
            console.log(`\n========================================`);
            console.log(`Fetching execution details for ID: ${id}...`);
            const exec = await functions.getExecution('send_assignment_email', id);
            console.log('Status:', exec.status);
            console.log('Duration:', exec.duration, 'seconds');
            console.log('Trigger:', exec.trigger);
            console.log('Created At:', exec.$createdAt);
            console.log('--- Logs ---');
            console.log(exec.logs || '(No logs)');
            console.log('--- Errors ---');
            console.log(exec.errors || '(No errors)');
        } catch (e) {
            console.error(`Error fetching execution ${id}:`, e);
        }
    }
}

main();
