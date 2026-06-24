# Manual del Administrador
### Sistema de Gestión y Evaluación de Desempeño — Central de Negocios

Este manual detalla los procedimientos para la administración, gestión y análisis de las evaluaciones de desempeño. Está diseñado especialmente para el rol de **Administración de Capital Humano / Operaciones** (no requiere conocimientos técnicos ni acceso a bases de datos).

---

## 1. Acceso al Panel Administrativo

1. Ingrese a la URL: https://evaluacion-cn.vercel.app/evaluaciones
2. Inicie sesión con su **correo corporativo** y la **contraseña** asignada.
3. Al detectar su rol, el sistema le habilitará el menú lateral con dos secciones clave:
   * **Dashboard Admin**: Vista exclusiva para gestionar ciclos, ver reportes y descargar resultados.
   * **Mis Evaluaciones**: Panel donde usted podrá realizar su propia evaluación y evaluar al equipo.

---

## 2. Rol Activo del Administrador en las Evaluaciones

En esta plataforma, **el Administrador también participa activamente en el proceso de evaluación**:
* **Usted es evaluado:** Aparecerá en la lista de colaboradores para que el resto del equipo pueda calificar su desempeño de manera confidencial.
* **Usted evalúa:** Desde la sección **"Mis Evaluaciones"**, podrá realizar su **Autoevaluación** y evaluar a los demás colaboradores.

---

## 3. Gestión de Ciclos de Evaluación

El sistema funciona mediante **Ciclos de Evaluación** (periodos de tiempo definidos en los que la plataforma está abierta para recibir calificaciones).

```
 ┌──────────┐    Activar     ┌──────────┐     Cerrar     ┌────────────┐
 │ Borrador │  ───────────>  │  Activo  │  ───────────>  │ Finalizado │
 └──────────┘                └──────────┘                └────────────┘
```

### Crear un Ciclo Nuevo
1. En el **Dashboard Admin**, haga clic en **"Nuevo Ciclo"**.
2. Escriba un nombre claro (ej. `Evaluación de Desempeño - Primer Semestre 2026`).
3. Defina una fecha límite sugerida para motivar a los colaboradores.
4. El ciclo se guardará inicialmente en estado **Borrador**. En este estado, los empleados aún no pueden completar encuestas.

### Activar el Ciclo
1. Busque el ciclo creado en estado borrador.
2. Presione el botón **Activar**.
3. **Importante:** Solo puede haber un (1) ciclo activo a la vez en la plataforma. Al activarlo, se habilitarán las evaluaciones de manera inmediata para todo el personal.

### Cerrar el Ciclo
1. Una vez transcurrido el plazo para evaluar, busque el ciclo activo y haga clic en **Cerrar Ciclo**.
2. Al cerrar el ciclo, el sistema **bloquea** el ingreso de nuevas evaluaciones y consolida de forma definitiva los promedios y reportes para su análisis.

---

## 4. Análisis de Resultados y Reportes

Durante un ciclo activo o una vez finalizado, usted podrá ingresar a la ficha de cada colaborador desde la tabla general de resultados.

### Estructura del Reporte
* **Autoevaluación (Self):** Muestra la percepción que el empleado tiene de su propio trabajo.
* **Evaluación Colectiva (Peer/Upward):** Muestra el promedio consolidado y anónimo de las evaluaciones que sus compañeros (y usted) le realizaron.
* **Gráfico y Desglose por Competencia:** Tabla comparativa por categorías (Orientación a Resultados, Liderazgo, Trabajo en Equipo, etc.) que contrasta la autoevaluación vs. la evaluación colectiva.

### Calificación Final y Comentarios del Admin
1. En la parte inferior del reporte de cada empleado, encontrará la sección de **Evaluación de la Dirección**.
2. Analice los promedios y redacte una **Retroalimentación Cualitativa** constructiva.
3. Seleccione una **Calificación Final** (ej: *Sobresaliente, Cumple con las expectativas, Requiere mejora*).
4. Guarde los cambios para congelar la evaluación formal del colaborador.

---

## 5. Descarga y Exportación (Excel y PDF)

### Exportar Datos a Excel / CSV
Para descargar la información consolidada de todos los colaboradores del ciclo y poder analizarla en Excel:
1. Diríjase al **Dashboard Admin**.
2. Haga clic en el botón **Exportar CSV** ubicado en la sección del listado general.
3. El sistema descargará un archivo en formato `.csv` con los datos clave del progreso y las calificaciones de los colaboradores, el cual puede ser abierto directamente en Excel para generar gráficos o tablas dinámicas.

### Exportar Reporte Individual a PDF
Para almacenar físicamente la evaluación o adjuntarla al expediente digital del colaborador:
1. Abra el reporte final del colaborador.
2. Presione el botón **Imprimir / Exportar a PDF** en la esquina superior derecha.
3. El sistema optimizará el diseño automáticamente, ocultando botones, barras de navegación y menús innecesarios para entregar un documento formal y limpio.
4. En el cuadro de diálogo de impresión de su navegador, seleccione la opción **Guardar como PDF** o **Save as PDF**.

