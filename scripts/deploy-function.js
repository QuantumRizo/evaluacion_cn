import { Client, Functions, ID, Permission, Role } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env.local') });

const ENDPOINT   = process.env.VITE_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID;
const API_KEY    = process.env.APPWRITE_API_KEY;

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('❌ Faltan variables de entorno. Revisa APPWRITE_API_KEY en .env.local');
  process.exit(1);
}

const client = new Client();
client.setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const functions = new Functions(client);

async function main() {
  console.log('🚀 Iniciando despliegue de Appwrite Function...');

  // 1. Empaquetar la función en un tar.gz
  const funcDir = resolve(__dirname, '../functions/create-employee');
  const tarPath = resolve(__dirname, '../functions/code.tar.gz');
  console.log('📦 Empaquetando código...');
  execSync(`tar -czf ${tarPath} -C ${funcDir} .`);

  // 2. Obtener o crear la función
  console.log('⚙️  Verificando función en Appwrite...');
  const funcList = await functions.list();
  let func = funcList.functions.find(f => f.name === 'Sync New Employee');
  
  if (!func) {
    console.log('No existe, creándola...');
    func = await functions.create({
      functionId: ID.unique(),
      name: 'Sync New Employee',
      runtime: 'node-18.0',
      execute: [Role.users()],
      events: ['users.*.create']
    });
  } else {
    console.log(`Función encontrada: ${func.$id}`);
  }
  
  const functionId = func.$id;

  // 3. Configurar Variable de Entorno
  console.log('🔑 Configurando variables de entorno...');
  
  const varsToCreate = [
    { key: 'APPWRITE_API_KEY', value: API_KEY },
    { key: 'APPWRITE_ENDPOINT', value: ENDPOINT },
    { key: 'APPWRITE_PROJECT_ID', value: PROJECT_ID }
  ];

  for (const v of varsToCreate) {
    try {
      await functions.createVariable({
        functionId: functionId,
        variableId: v.key.toLowerCase(),
        key: v.key,
        value: v.value
      });
      console.log(`Variable ${v.key} creada.`);
    } catch (err) {
      if (err.code !== 409) throw err;
      console.log(`La variable ${v.key} ya existe.`);
    }
  }

  // 4. Crear Deployment y activarlo
  console.log('☁️  Subiendo código y desplegando...');
  const code = InputFile.fromPath(tarPath, 'code.tar.gz');
  
  const deployment = await functions.createDeployment({
    functionId: functionId,
    code: code,
    activate: true,
    entrypoint: 'src/main.js',
    commands: 'npm install'
  });
  console.log(`✅ Despliegue creado con ID: ${deployment.$id}`);

  // Limpiar archivo tar
  fs.unlinkSync(tarPath);

  console.log('\n🎉 ¡La función ha sido desplegada correctamente y está activa!');
}

main().catch((err) => {
  console.error('\n❌ Error durante el despliegue:', err.message);
  process.exit(1);
});
