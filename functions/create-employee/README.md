# Appwrite Function: Create Employee on User Creation

Esta función se encarga de crear automáticamente un registro en la tabla `employees` cada vez que se registra un nuevo usuario en Appwrite Authentication.

## Instrucciones para instalarla en Appwrite:

1. Ve a la consola de Appwrite de tu proyecto y entra a la sección **Functions**.
2. Haz clic en **Create Function**.
3. Ponle un nombre (ej. `Sync New Employee`) y selecciona el runtime **Node.js (18.0 o superior)**.
4. En la pestaña **Settings** (Configuración) de la función:
   - **Events (Eventos):** Añade un nuevo evento y selecciona `users.*.create`. Esto hará que la función se ejecute al crear un usuario.
   - **Variables de Entorno (Variables):** Necesitas añadir la clave API con permisos para leer/escribir en la base de datos:
     - `APPWRITE_API_KEY`: Pega aquí el valor de tu API Key (la misma que usaste en `.env.local`).
5. Ve a la pestaña **Deployments** o al editor de código integrado en la consola de Appwrite y copia el contenido del archivo `src/main.js` y `package.json`.
6. Si prefieres subirlo manualmente, puedes comprimir `package.json` y la carpeta `src` en un `.zip` y subirlo, o usar el [Appwrite CLI](https://appwrite.io/docs/command-line).
7. Activa el despliegue.

¡Listo! A partir de ahora, cada vez que crees un usuario desde Authentication, se creará instantáneamente su registro como Empleado sin que tenga que iniciar sesión.
