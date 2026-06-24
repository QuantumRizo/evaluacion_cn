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
const FUNC_ID = 'send_assignment_email';

async function upsertVar(key, value) {
    // Try to create, if exists (409) try to update by listing first.
    try {
        await functions.createVariable({
            functionId: FUNC_ID,
            variableId: key.toLowerCase().replace(/_/g, '-'),
            key,
            value
        });
        console.log(`✅ Created: ${key}`);
    } catch (e) {
        if (e.code === 409) {
            // List variables to find the real $id
            const vars = await functions.listVariables(FUNC_ID);
            const existing = vars.variables.find(v => v.key === key);
            if (existing) {
                await functions.updateVariable({
                    functionId: FUNC_ID,
                    variableId: existing.$id,
                    key,
                    value
                });
                console.log(`✅ Updated: ${key}`);
            } else {
                console.error(`❌ Conflict but can't find ${key}`);
            }
        } else {
            console.error(`❌ Error with ${key}:`, e.message);
        }
    }
}

async function main() {
    console.log(`\nConfiguring environment variables for: ${FUNC_ID}\n`);
    console.log(`Endpoint: ${ENDPOINT}`);
    console.log(`Project:  ${PROJECT_ID}\n`);

    await upsertVar('APPWRITE_ENDPOINT', ENDPOINT);
    await upsertVar('APPWRITE_PROJECT_ID', PROJECT_ID);
    await upsertVar('APPWRITE_API_KEY', API_KEY);

    console.log('\n✅ All variables configured!');
}
main();
