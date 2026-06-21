import { Client, Databases, ID } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  // Asegurarnos de que el evento es el de creación de usuario
  // process.env.APPWRITE_FUNCTION_EVENT normalmente contiene el nombre del evento
  const event = process.env.APPWRITE_FUNCTION_EVENT || '';
  if (event && !event.includes('users.*.create')) {
    log(`Evento ignorado: ${event}`);
    return res.json({ success: true, message: 'Evento ignorado' });
  }

  try {
    // Inicializar el SDK de Appwrite
    const client = new Client()
      .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID || process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.VITE_APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    // En funciones de Node de Appwrite, req.body trae los datos del evento parseados
    const eventData = req.body;
    
    if (!eventData || !eventData.$id) {
      error('No se recibieron datos del usuario en req.body');
      return res.json({ success: false, error: 'Sin datos' }, 400);
    }

    const userId = eventData.$id;
    const name = eventData.name || 'Sin Nombre';
    const email = eventData.email;

    log(`Creando registro de empleado para el usuario Auth: ${userId} (${email})`);

    // Insertar en la base de datos
    await databases.createDocument(
      'evaluacion_desempeno', // Tu Database ID
      'employees',            // Tu Collection ID
      ID.unique(),
      {
        name: name,
        email: email,
        auth_user_id: userId,
        role: 'employee',
      }
    );

    log(`✅ Registro de empleado creado exitosamente.`);
    return res.json({ success: true });

  } catch (err) {
    error(`❌ Error creando empleado: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
