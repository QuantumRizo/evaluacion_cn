# Manual del Administrador
Sistema de Evaluación de Desempeño Corporativo

Este manual detalla los procedimientos necesarios para administrar, gestionar y analizar las evaluaciones de desempeño del personal utilizando la plataforma.

---

## 1. Acceso al Sistema

Para ingresar al panel de administración:
1. Navegue a la página de inicio de sesión de la plataforma.
2. Ingrese su correo corporativo y contraseña (proporcionados durante la configuración inicial).
3. Si su cuenta tiene privilegios administrativos, el sistema lo redirigirá automáticamente al **Panel de Administrador** (/admin).

---

## 2. Gestión de Usuarios (Alta de Empleados)

Debido a los requerimientos de seguridad, los empleados no pueden registrarse libremente. El administrador debe dar de alta las cuentas.

**Paso A: Crear las credenciales de acceso**
1. Ingrese a la consola de **Appwrite Cloud**.
2. Diríjase a la sección **Auth** > **Users**.
3. Haga clic en "Create User".
4. Ingrese el Nombre, Correo y asigne una Contraseña segura para el empleado.
5. Comparta estas credenciales de forma segura con el empleado.

*Nota: La primera vez que el empleado inicie sesión en la plataforma, el sistema creará automáticamente su perfil en la base de datos con el rol de "Empleado". No es necesario que usted cree el registro en la base de datos manualmente.*

**Otorgar permisos de Administrador a otro usuario:**
Si necesita que otro empleado sea administrador, una vez que haya iniciado sesión por primera vez, vaya a **Appwrite Console** > **Databases** > `evaluacion_desempeno` > `employees`. Busque al empleado y cambie su campo `role` de `employee` a `admin`.

---

## 3. Gestión de Ciclos de Evaluación

Un Ciclo de Evaluación es el periodo durante el cual la plataforma se "abre" para recibir calificaciones.

**Crear un Ciclo:**
1. En el Panel de Administrador, haga clic en "Nuevo Ciclo".
2. Asigne un nombre descriptivo (ej. "Evaluación Anual 2026").
3. Opcionalmente, agregue una descripción de los objetivos del ciclo.
4. El ciclo se creará en estado **Borrador (Draft)**.

**Activar un Ciclo:**
Para que los empleados comiencen a evaluarse, debe activar el ciclo. Solo puede haber un ciclo activo a la vez.
1. Localice el ciclo en estado Borrador en su panel.
2. Haga clic en **Activar**.
3. A partir de este momento, cualquier empleado que inicie sesión verá las encuestas habilitadas.

**Cerrar un Ciclo:**
Una vez transcurrido el tiempo límite que la empresa determine para las evaluaciones:
1. Localice el ciclo activo en su panel.
2. Haga clic en **Cerrar Ciclo**.
3. El sistema dejará de aceptar nuevas respuestas y congelará los resultados para su análisis.

---

## 4. Análisis y Reportes Finales

Mientras un ciclo está activo o una vez cerrado, el Administrador puede revisar el progreso de cada empleado.

1. En el Panel de Administrador, seleccione a un empleado específico para ver su reporte.
2. **Resultados mostrados:**
   - **Autoevaluación:** Promedio de las calificaciones que el empleado se dio a sí mismo.
   - **Evaluación Colectiva:** Promedio de las calificaciones que le otorgaron sus compañeros y líderes.
   - **Desglose por Categoría:** Una tabla detallando el puntaje obtenido en cada área (Liderazgo, Trabajo en Equipo, etc.) comparando cómo se percibe el empleado vs. cómo lo percibe el resto.
3. **Puntuación Final y Comentarios:**
   El administrador tiene la potestad de escribir un resumen cualitativo y asignar la "Calificación Final" basada en los promedios. Guarde los cambios al terminar.

---

## 5. Exportar a PDF

Para generar el reporte impreso o en PDF para el expediente del empleado:
1. Abra el reporte final de un empleado.
2. Haga clic en el botón **Imprimir / Exportar a PDF** situado en la esquina superior.
3. El sistema ocultará los botones y la navegación para mostrar una vista limpia de reporte corporativo.
4. Utilice el diálogo de impresión de su navegador web y seleccione "Guardar como PDF".
