import { Client, Users, ID } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const usersClient = new Users(client);

const usersToAdd = [
  { name: 'Valia Galeana', email: 'vania@centraldenegociosmx.com' },
  { name: 'Irais de León', email: 'irais@centraldenegociosmx.com' },
  { name: 'Manuel Morán', email: 'manuel@centraldenegociosmx.com' },
  { name: 'Jazmin Cruz', email: 'jazmin@centraldenegociosmx.com' },
  { name: 'Luz Fernanda Altamirano Reyes', email: 'becariomedios@centraldenegociosmx.com' },
  { name: 'Hernández Cagal Ely Cristel', email: 'becariomarcas@centraldenegociosmx.com' },
  { name: 'Guerrero Portillo Dana Sofía', email: 'sofy@centrales.com.mx' }, // Usé el correo de Sofía de tu mensaje anterior
  { name: 'Brenda Babriela De Viana Cruz', email: 'brenda@centraldenegociosmx.com' },
  { name: 'Alejandro David Mendez López', email: 'alejandro@centraldenegociosmx.com' },
  { name: 'Adriana Celis', email: 'adriana@centraldenegociosmx.com' },
  { name: 'Patricia Ibarra', email: 'ipatricia@centraldenegociosmx.com' },
  { name: 'Patricia Martínez', email: 'patricia@centraldenegociosmx.com' },
  { name: 'Daniela Padilla', email: 'karla@centraldenegociosmx.com' },
  { name: 'Agustin Santiago', email: 'agustin@centraldenegociosmx.com' },
  { name: 'Diego Negrete', email: 'diego@centraldenegociosmx.com' },
  { name: 'Diana Ortíz', email: 'diana@centraldenegociosmx.com' },
  { name: 'Edmundo Gonzalez', email: 'edmundo@centraldenegociosmx.com' },
  { name: 'Maricela García', email: 'maricela@centraldenegociosmx.com' }
];

const password = '12345678';

async function syncUsers() {
  console.log('Fetching existing users...');
  
  let allUsers = [];
  try {
    const response = await usersClient.list();
    allUsers = response.users;
    console.log(`Found ${allUsers.length} existing users.`);
  } catch (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log('Deleting users (except Patricia and Felix)...');
  for (const u of allUsers) {
    const email = (u.email || '').toLowerCase();
    const name = (u.name || '').toLowerCase();
    
    // Check if we should keep this user
    if (email.includes('patricia') || name.includes('patricia') || email.includes('felix') || name.includes('felix')) {
      console.log(`[SKIPPING DELETION] Kept user: ${u.name} (${u.email})`);
      continue;
    }

    try {
      await usersClient.delete(u.$id);
      console.log(`[DELETED] User: ${u.name} (${u.email})`);
    } catch (error) {
      console.error(`[ERROR] Failed to delete user ${u.name}:`, error.message);
    }
  }

  console.log('\nAdding new users...');
  for (const user of usersToAdd) {
    try {
      await usersClient.create(
        ID.unique(),
        user.email,
        undefined, // phone
        password,
        user.name
      );
      console.log(`[SUCCESS] User created: ${user.name} (${user.email})`);
    } catch (error) {
      // If user already exists (like Patricia which we kept)
      if (error.code === 409) {
        console.log(`[SKIPPED] User already exists: ${user.name} (${user.email})`);
      } else {
        console.error(`[ERROR] Failed to create user ${user.name} (${user.email}): ${error.message}`);
      }
    }
  }
  console.log('User synchronization finished.');
}

syncUsers();
