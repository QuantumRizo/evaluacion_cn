import { Client, Functions } from 'node-appwrite';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env.local') });

const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const functions = new Functions(client);

async function main() {
    const list = await functions.list();
    const emailFunc = list.functions.find(f => f.name.toLowerCase().includes('email') || f.name.toLowerCase().includes('correo') || f.name.toLowerCase().includes('resend'));
    
    if (!emailFunc) {
        console.error("Could not find the email function.");
        return;
    }
    
    const vars = [
        { id: 'appwrite_endpoint', key: 'APPWRITE_ENDPOINT', value: ENDPOINT },
        { id: 'appwrite_project_id', key: 'APPWRITE_PROJECT_ID', value: PROJECT_ID }
    ];

    for (const v of vars) {
        try {
            await functions.updateVariable({
                functionId: emailFunc.$id,
                variableId: v.id,
                key: v.key,
                value: v.value
            });
            console.log(`Updated ${v.key} successfully!`);
        } catch (e) {
            if (e.code === 404) {
                await functions.createVariable({
                    functionId: emailFunc.$id,
                    variableId: v.id,
                    key: v.key,
                    value: v.value
                });
                console.log(`Created ${v.key} successfully!`);
            } else {
                console.error(`Error with ${v.key}:`, e.message);
            }
        }
    }
}
main();
