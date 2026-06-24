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
    const list = await functions.list();
    const emailFunc = list.functions.find(f => f.$id === 'send_assignment_email');
    console.log(`Function: ${emailFunc.name} (${emailFunc.$id})`);
    
    const vars = await functions.listVariables(emailFunc.$id);
    console.log('\nCurrent variables:');
    for (const v of vars.variables) {
        console.log(`  ID: ${v.$id} | Key: ${v.key} | Value: ${v.value}`);
    }
}
main();
