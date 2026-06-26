import { Client, Users, ID } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const usersClient = new Users(client);

async function recreatePatricia() {
  const email = 'ipatricia@centraldenegociosmx.com';
  const name = 'Patricia Ibarra';
  const password = '12345678';
  
  console.log(`Buscando a ${email}...`);
  try {
    const response = await usersClient.list();
    const user = response.users.find(u => u.email === email);
    
    if (user) {
      console.log(`Usuario encontrado con ID ${user.$id}. Eliminando...`);
      await usersClient.delete(user.$id);
      console.log('Usuario eliminado correctamente.');
    } else {
      console.log('No se encontró el usuario antiguo, procediendo a crear.');
    }

    // Un pequeño retraso para asegurar que la base de datos registra la eliminación
    await new Promise(r => setTimeout(r, 1000));

    console.log('Creando usuario nuevo...');
    await usersClient.create(
      ID.unique(),
      email,
      undefined,
      password,
      name
    );
    console.log(`[SUCCESS] Usuario ${name} (${email}) recreado con éxito.`);
  } catch (error) {
    console.error('[ERROR]', error.message);
  }
}

recreatePatricia();
