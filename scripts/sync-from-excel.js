import { Client, Users, Databases, ID, Query } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const usersClient = new Users(client);
const databases = new Databases(client);

const DB_ID = 'evaluacion_desempeno';
const EMPLOYEES = 'employees';
const PASSWORD = '12345678';

// Data from the Excel - existing users to update (email -> { name, position })
const toUpdate = [
  { email: 'patricia@centraldenegociosmx.com',  name: 'Paty Martínez',         position: 'COO Central Simi y cuentas CN' },
  { email: 'maricela@centraldenegociosmx.com',  name: 'Maricela García',        position: 'Director Trading Central Simi y cuentas CN' },
  { email: 'adriana@centraldenegociosmx.com',   name: 'Adriana Celis',          position: 'Directora de cuenta' },
  { email: 'irais@centraldenegociosmx.com',     name: 'Irais de León',          position: 'Coordinadora de cuenta' },
  { email: 'manuel@centraldenegociosmx.com',    name: 'Manuel Morán',           position: 'Coordinador OOH' },
  { email: 'jazmin@centraldenegociosmx.com',    name: 'Jazmin Cruz',            position: 'Ejecutiva de medios OOH' },
  { email: 'agustin@centraldenegociosmx.com',   name: 'Agustín Santiago',       position: 'Planner Medios TV' },
  { email: 'arturop@centraldenegociosmx.com',   name: 'Arturo Perez',           position: 'Ejecutivo Medios Radio' },
  { email: 'diego@centraldenegociosmx.com',     name: 'Diego Negrete',          position: 'Coordinador TV y Prensa' },
  { email: 'diana@centraldenegociosmx.com',     name: 'Diana Ortíz',            position: 'Ejecutiva TV y Prensa' },
  { email: 'edmundo@centraldenegociosmx.com',   name: 'Edmundo González',       position: 'Planner Medios Radio y Revistas' },
  { email: 'karla@centraldenegociosmx.com',     name: 'Daniela Padilla',        position: 'Ejecutiva Radio y Revistas' },
];

// New users to create (from Excel, not yet in system)
const toCreate = [
  { name: 'Irad Abril Muñoz Guadarrama', email: 'abril@centraldenegociosmx.com',    position: 'Assistant Trading' },
  { name: 'Nora Cervantes',              email: 'nora@centraldenegociosmx.com',      position: 'Directora de cuenta' },
  { name: 'Susana Medrano',              email: 'susana@centraldenegociosmx.com',    position: 'Supervisor Radio y Revistas' },
  { name: 'Verónica Ramírez',            email: 'veronicar@centraldenegociosmx.com', position: 'Director de cuenta' },
  { name: 'Martha Velasco',              email: 'martha@centraldenegociosmx.com',    position: 'Coordinadora de cuenta y Trade' },
  { name: 'Juan Pablo Millán',           email: 'juan@centraldenegociosmx.com',      position: 'Project Manager & Business Development' },
  { name: 'Carolina Anaya',              email: 'carolina@centraldenegociosmx.com',  position: 'Digital Media Manager' },
];

async function syncFromExcel() {
  // Fetch all auth users and employees once
  const authResponse = await usersClient.list();
  const authUsers = authResponse.users;

  const empResponse = await databases.listDocuments(DB_ID, EMPLOYEES, [Query.limit(100)]);
  const employees = empResponse.documents;

  console.log('=== UPDATING EXISTING USERS ===');
  for (const item of toUpdate) {
    const authUser = authUsers.find(u => u.email.toLowerCase() === item.email.toLowerCase());
    const empDoc = employees.find(e => e.email?.toLowerCase() === item.email.toLowerCase());

    if (!authUser) {
      console.log(`[SKIP] No auth user found for ${item.email}`);
      continue;
    }

    // Update Auth name
    try {
      await usersClient.updateName(authUser.$id, item.name);
      console.log(`[AUTH UPDATED] ${item.name} (${item.email})`);
    } catch (e) {
      console.error(`[AUTH ERROR] ${item.email}: ${e.message}`);
    }

    // Update Employee doc (name + position as department)
    if (empDoc) {
      try {
        await databases.updateDocument(DB_ID, EMPLOYEES, empDoc.$id, {
          name: item.name,
          department: item.position,
        });
        console.log(`[EMP UPDATED]  ${item.name} → Área: ${item.position}`);
      } catch (e) {
        console.error(`[EMP ERROR] ${item.email}: ${e.message}`);
      }
    } else {
      console.log(`[WARN] No employee doc found for ${item.email}`);
    }
  }

  console.log('\n=== CREATING NEW USERS ===');
  for (const user of toCreate) {
    // Create Auth user
    let authId;
    try {
      const created = await usersClient.create(ID.unique(), user.email, undefined, PASSWORD, user.name);
      authId = created.$id;
      console.log(`[AUTH CREATED] ${user.name} (${user.email})`);
    } catch (e) {
      if (e.code === 409) {
        console.log(`[AUTH EXISTS] ${user.name} (${user.email})`);
        const existing = authUsers.find(u => u.email.toLowerCase() === user.email.toLowerCase());
        authId = existing?.$id;
      } else {
        console.error(`[AUTH ERROR] ${user.email}: ${e.message}`);
        continue;
      }
    }

    // Create Employee doc
    try {
      await databases.createDocument(DB_ID, EMPLOYEES, ID.unique(), {
        name: user.name,
        email: user.email,
        department: user.position,
        role: 'employee',
        auth_user_id: authId ?? '',
      });
      console.log(`[EMP CREATED]  ${user.name} → Área: ${user.position}`);
    } catch (e) {
      console.error(`[EMP ERROR] ${user.email}: ${e.message}`);
    }
  }

  console.log('\n✅ Done!');
}

syncFromExcel();
