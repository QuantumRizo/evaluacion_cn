import { Client, Users } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const usersClient = new Users(client);

async function checkUsers() {
  try {
    const response = await usersClient.list();
    console.log(`Total users found: ${response.total}`);
    console.log('List of users:');
    response.users.forEach(u => {
      console.log(`- ${u.name} (ID: ${u.$id}, Email: ${u.email})`);
    });
  } catch (error) {
    console.error('Error fetching users:', error);
  }
}

checkUsers();
