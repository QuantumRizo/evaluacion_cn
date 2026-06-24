import { Client, Functions } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env.local') });

const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const RESEND_API_KEY = "re_Y7MHSARP_Ar5JF77Hda2EcjkjfFnSsoEQ";

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const functions = new Functions(client);

async function deploy() {
    let functionId = "send_assignment_email";
    
    console.log("1. Buscando o creando la función...");
    try {
        await functions.create(
            functionId,
            "EnviarCorreoResend",
            "node-18.0",
            [], // execute
            ["databases.evaluacion_desempeno.collections.evaluation_assignments.documents.*.create"] // events
        );
        console.log("   Función creada.");
    } catch (err) {
        if (err.code === 409) {
            console.log("   La función ya existe. Actualizando eventos...");
            await functions.update(
                functionId,
                "EnviarCorreoResend",
                "node-18.0",
                [], // execute
                ["databases.evaluacion_desempeno.collections.evaluation_assignments.documents.*.create"] // events
            );
        } else {
            console.error(err);
            process.exit(1);
        }
    }

    console.log("2. Configurando variables de entorno...");
    const vars = [
        { key: 'APPWRITE_API_KEY', value: API_KEY },
        { key: 'RESEND_API_KEY', value: RESEND_API_KEY },
        { key: 'RESEND_FROM_EMAIL', value: 'onboarding@resend.dev' }
    ];

    for (const v of vars) {
        try {
            await functions.createVariable(functionId, v.key, v.value);
            console.log(`   Variable ${v.key} creada.`);
        } catch (err) {
            if (err.code === 409) {
                // Actualizar si ya existe
                try {
                    await functions.updateVariable(functionId, v.key, v.key, v.value);
                    console.log(`   Variable ${v.key} actualizada.`);
                } catch(e) {
                    console.log(`   Variable ${v.key} ya configurada.`);
                }
            } else {
                console.error(`   Error seteando ${v.key}:`, err.message);
            }
        }
    }

    console.log("3. Creando despliegue (Deployment)...");
    try {
        const deployment = await functions.createDeployment(
            functionId,
            'src/main.js',
            InputFile.fromPath(resolve(__dirname, '..', 'code.tar.gz'), 'code.tar.gz'),
            true // activate
        );
        console.log("✅ ¡Despliegue activado con éxito! ID:", deployment.$id);
    } catch (err) {
        console.error("❌ Error en el despliegue:", err.message);
    }
}
deploy();
