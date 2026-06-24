import { Client, Databases } from 'node-appwrite';

/**
 * Función de Appwrite para enviar un correo de notificación
 * Se ejecuta automáticamente cuando se crea un nuevo documento en `evaluation_assignments`
 */
export default async ({ req, res, log, error }) => {
  // 1. Inicializar cliente de Appwrite
  // APPWRITE_FUNCTION_PROJECT_ID es inyectado automáticamente
  // APPWRITE_API_KEY debes configurarla tú en la consola de la función
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const DB_ID = 'evaluacion_desempeno';

  // 2. Extraer el Payload del evento (el documento recién creado)
  let payload;
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (err) {
    error(`Error al parsear el payload: ${err.message}`);
    return res.json({ success: false, message: 'Invalid payload format' }, 400);
  }

  // Validar campos requeridos
  if (!payload || !payload.evaluated_id || !payload.evaluator_id || !payload.cycle_id) {
    log('El payload no contiene los IDs necesarios. Es posible que se haya ejecutado manualmente sin datos.');
    return res.json({ success: false, message: 'Missing IDs in payload' }, 400);
  }

  const { evaluated_id, evaluator_id, cycle_id } = payload;

  try {
    // 3. Consultar la base de datos para obtener los nombres reales
    log(`Consultando datos para Evaluador: ${evaluator_id}, Evaluado: ${evaluated_id}`);
    
    const [evaluated, evaluator, cycle] = await Promise.all([
      databases.getDocument(DB_ID, 'employees', evaluated_id),
      databases.getDocument(DB_ID, 'employees', evaluator_id),
      databases.getDocument(DB_ID, 'evaluation_cycles', cycle_id)
    ]);

    // Formatear la fecha límite si existe
    const deadline = cycle.end_date 
      ? new Date(cycle.end_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'pronto';

    // 4. Preparar la llamada a Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      error('No se configuró la variable de entorno RESEND_API_KEY');
      return res.json({ success: false, message: 'Config error' }, 500);
    }

    // Configura el correo de remitente que validaste en Resend
    // EJEMPLO: 'Evaluaciones Central de Negocios <notificaciones@tu-dominio.com>'
    // IMPORTANTE: Resend por defecto permite enviar correos de prueba desde 'onboarding@resend.dev' a tu correo personal verificado.
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    // Plantilla de Correo HTML
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-w-xl; margin: 0 auto; color: #333;">
        <h2 style="color: #416364;">Requerimiento de Evaluación de Desempeño</h2>
        <p>Hola <strong>${evaluator.name.split(' ')[0]}</strong>,</p>
        
        <p>Has sido seleccionado(a) para participar en el proceso de Evaluación de Desempeño corporativo de Central de Negocios para el ciclo <strong>${cycle.name}</strong>.</p>
        
        <p>Se te ha asignado la tarea de proporcionar retroalimentación constructiva sobre el desempeño de:</p>
        <div style="background-color: #f8fafc; border-left: 4px solid #416364; padding: 15px; margin: 20px 0;">
          <h3 style="margin: 0; color: #1e293b;">${evaluated.name}</h3>
          <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">${evaluated.department || 'Colaborador'}</p>
        </div>

        <p>Por favor, completa esta evaluación a más tardar el <strong>${deadline}</strong>.</p>
        
        <p>Recuerda que tus respuestas son confidenciales y fundamentales para el desarrollo y crecimiento del equipo.</p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="https://evaluacion-cn.vercel.app/" style="background-color: #416364; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; display: inline-block;">
            Ingresar al Portal de Evaluaciones
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
          Este es un correo automático generado por el Sistema de Evaluación de Central de Negocios.
        </p>
      </div>
    `;

    // 5. Ejecutar la petición HTTP a Resend
    log('Enviando correo a través de Resend API...');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: fromEmail,
        to: evaluator.email,
        subject: `Requerimiento de Evaluación: ${evaluated.name}`,
        html: htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      error(`Error de Resend: ${JSON.stringify(errorData)}`);
      return res.json({ success: false, error: errorData }, 500);
    }

    const result = await response.json();
    log(`✅ Correo enviado con éxito a ${evaluator.email} (ID: ${result.id})`);
    
    return res.json({ success: true, message: 'Correo enviado' });

  } catch (err) {
    error(`Error en la base de datos de Appwrite: ${err.message}`);
    return res.json({ success: false, message: err.message }, 500);
  }
};
