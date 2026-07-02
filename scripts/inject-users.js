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

const users = [
  { name: 'Arturo Perez', email: 'arturop@centraldenegociosmx.com' }
];

const password = '12345678';

async function injectUsers() {
  console.log('Starting user injection...');
  for (const user of users) {
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
      console.error(`[ERROR] Failed to create user ${user.name} (${user.email}): ${error.message}`);
    }
  }
  console.log('User injection finished.');
}

injectUsers();
