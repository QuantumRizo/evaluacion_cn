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
    console.log("Fetching functions...");
    const list = await functions.list();
    console.log("Functions found: ", list.functions.map(f => `${f.name} (${f.$id})`));
    
    // Find the one for sending email
    const emailFunc = list.functions.find(f => f.name.toLowerCase().includes('email') || f.name.toLowerCase().includes('correo') || f.name.toLowerCase().includes('resend'));
    
    if (!emailFunc) {
        console.error("Could not find the email function. List was:", list.functions.map(f => f.name));
        return;
    }
    
    console.log(`Found email function: ${emailFunc.name} (${emailFunc.$id})`);
    
    const RESEND_API_KEY = "re_Y7MHSARP_Ar5JF77Hda2EcjkjfFnSsoEQ";
    
    try {
        console.log("Trying to update RESEND_API_KEY...");
        await functions.updateVariable({
            functionId: emailFunc.$id,
            variableId: 'resend_api_key',
            key: 'RESEND_API_KEY',
            value: RESEND_API_KEY
        });
        console.log("Updated successfully!");
    } catch (e) {
        if (e.code === 404) {
            console.log("Variable doesn't exist, creating it...");
            await functions.createVariable({
                functionId: emailFunc.$id,
                variableId: 'resend_api_key',
                key: 'RESEND_API_KEY',
                value: RESEND_API_KEY
            });
            console.log("Created successfully!");
        } else {
            console.error("Error updating variable:", e.message);
        }
    }
}
main();
