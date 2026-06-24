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
const FUNC_ID = 'send_assignment_email';

async function main() {
    const vars = await functions.listVariables(FUNC_ID);
    const existing = vars.variables.find(v => v.key === 'RESEND_FROM_EMAIL');
    
    const newValue = 'Evaluaciones CN (No Responder) <noreply@centraldenegociosmx.com>';

    await functions.updateVariable({
        functionId: FUNC_ID,
        variableId: existing.$id,
        key: 'RESEND_FROM_EMAIL',
        value: newValue
    });
    console.log(`✅ Updated: ${newValue}`);
}
main();
