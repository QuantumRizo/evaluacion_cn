import { Client, Functions } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import fs from 'fs';

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
    const emailFunc = list.functions.find(f => f.name.toLowerCase().includes('email') || f.name.toLowerCase().includes('correo') || f.name.toLowerCase().includes('resend'));
    
    if (!emailFunc) {
        console.error("Could not find the email function.");
        return;
    }
    
    console.log(`Found email function: ${emailFunc.name} (${emailFunc.$id})`);
    
    console.log("Updating function configuration...");
    await functions.update({
        functionId: emailFunc.$id,
        name: emailFunc.name,
        execute: ['users'], // Allow logged-in users to execute
        events: []          // Remove document creation trigger
    });
    
    // Package code
    const funcDir = resolve(__dirname, '../appwrite-functions/send-assignment-email');
    const tarPath = resolve(__dirname, '../appwrite-functions/code.tar.gz');
    console.log('📦 Empaquetando código...');
    execSync(`tar -czf ${tarPath} -C ${funcDir} .`);

    console.log("Creando despliegue (Deployment)...");
    try {
        const code = InputFile.fromPath(tarPath, 'code.tar.gz');
        // Older node-appwrite expects positional arguments or object? 
        // We know from earlier that createDeployment expects positional: 
        // createDeployment(functionId, entrypoint, code, activate, commands)
        // Wait, deploy-func.js did: createDeployment(functionId, 'src/main.js', code, true)
        // deploy-function.js did: createDeployment({ functionId, code, activate, entrypoint, commands })
        // Let's use object style since node-appwrite v11+ uses object style.
        const deployment = await functions.createDeployment({
            functionId: emailFunc.$id,
            code: code,
            activate: true,
            entrypoint: 'src/main.js',
            commands: 'npm install'
        });
        console.log("✅ ¡Despliegue activado con éxito! ID:", deployment.$id);
    } catch (err) {
        console.error("❌ Error en el despliegue:", err.message);
    } finally {
        if (fs.existsSync(tarPath)) {
            fs.unlinkSync(tarPath);
        }
    }
}
main();
