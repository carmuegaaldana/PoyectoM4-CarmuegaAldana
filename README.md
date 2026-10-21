# Gestor de Tareas

## Descripción del proyecto

Proyecto integrador del módulo 4 desarrollado por Aldana Carmuega.
Aplicación SPA que permite registrarse, iniciar y cerrar sesión y gestionar
tareas personales: crear, listar, editar, eliminar y marcar como completadas.
Los datos se guardan en Cloud Firestore y cada usuario accede únicamente a sus
tareas. Incluye un botón para recibir su resumen por email y una interfaz
responsive con tema oscuro.

## Decisiones arquitectónicas

Se utiliza React con TypeScript y Vite para construir la interfaz y definir los
tipos de datos. React Router administra las rutas públicas y privadas.
Firebase Authentication gestiona las identidades y Cloud Firestore almacena
las tareas. AWS SES envía los correos a través de una función de Vercel.

El código se divide por responsabilidades:

- `components`: formularios, listas, tareas y botón de email.
- `pages`: Login, Register y Home.
- `routes`: controles de acceso a las pantallas según la sesión.
- `context` y `hooks`: estado compartido de autenticación y suscripción a tareas.
- `services`: configuración de Firebase, operaciones de tareas y llamada al email.
- `types`: estructuras compartidas de autenticación y tareas.
- `api`: función del servidor para enviar el resumen.

`AuthProvider` usa `onAuthStateChanged` para restaurar y observar la sesión.
`useTasks` usa `onSnapshot` para actualizar la lista automáticamente y cancela
la suscripción al desmontar o cambiar de usuario. Las consultas filtran por
`userId` y las reglas de Firestore verifican propiedad y campos válidos.

El envío se realiza en el servidor para mantener privadas las credenciales.
Firebase Admin verifica el token y consulta las tareas del UID autenticado;
como Admin omite las reglas de Firestore, ese filtro es obligatorio.

## Instrucciones de instalación

Requisitos: Node.js 24.x, npm y cuentas configuradas en Firebase, AWS y Vercel.

```bash
git clone https://github.com/carmuegaaldana/PoyectoM4-CarmuegaAldana.git
cd PoyectoM4-CarmuegaAldana
npm ci
cp .env.example .env
```

Completar `.env` con la configuración propia indicada en la siguiente sección.
En Firebase, habilitar Email/Password en Authentication, crear Firestore en la
base `(default)` y publicar el contenido de `firestore.rules` en su consola.

Para ejecutar solo el frontend:

```bash
npm run dev
```

Para ejecutar también la función de email:

```bash
npx vercel dev
```

La CLI puede pedir inicio de sesión y vinculación con un proyecto Vercel.
Abrir la URL que indique la terminal, normalmente http://localhost:3000.
`npm run dev` por sí solo no ejecuta la función de email.

Comprobaciones disponibles:

```bash
npm run test
npm run test:watch
npm run build
npm run lint
```

Los 35 tests usan servicios simulados sin credenciales ni envíos reales.
Incluyen carga del registro, bloqueo de envíos duplicados y reintento tras errores.
Para publicar, configurar las variables en Vercel y ejecutar `npx vercel --prod`.
`vercel.json` define la compilación y el acceso directo a las rutas de la SPA.

## Variables de entorno necesarias

| Variable | Uso |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Configuración web de Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Dominio de autenticación |
| `VITE_FIREBASE_PROJECT_ID` | Proyecto Firebase del cliente |
| `VITE_FIREBASE_STORAGE_BUCKET` | Configuración web de Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Configuración web de Firebase |
| `VITE_FIREBASE_APP_ID` | Identificador de la aplicación web |
| `AWS_REGION` | Región SES; en este proyecto, `us-east-1` |
| `AWS_ACCESS_KEY_ID` | Identificador de acceso del usuario IAM |
| `AWS_SECRET_ACCESS_KEY` | Clave secreta de acceso a SES |
| `SES_FROM_EMAIL` | Correo remitente verificado en SES |
| `FIREBASE_ADMIN_PROJECT_ID` | Proyecto Firebase del servidor |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Cuenta de servicio de Firebase |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Clave privada de la cuenta de servicio |
| `NODE_OPTIONS` | En Vercel: `--experimental-require-module` |

La configuración del cliente se obtiene en Firebase, Configuración del proyecto,
General, aplicación web. La de Admin se obtiene en Cuentas de servicio al generar
una clave privada: usar `project_id`, `client_email` y `private_key` del JSON.
Ambas configuraciones deben pertenecer al mismo proyecto. Guardar el JSON fuera
del repositorio.

En `.env`, encerrar la clave privada entre comillas dobles y conservar los `\n`.
Al pegarla manualmente en Vercel, omitir las comillas exteriores.

Las variables `VITE_` son configuración pública del frontend y se cargan como
Config en Vercel. Las claves de AWS y Firebase Admin se cargan como Secret y no
llevan `VITE_`. `.env` y `.vercel` están ignorados por Git; `.env.example` contiene
solo nombres sin valores reales. En Vercel se requiere un nuevo despliegue tras
cambiar variables. `NODE_OPTIONS` habilita la compatibilidad que necesitan las
dependencias `jwks-rsa` y `jose` de Firebase Admin en ese entorno.

## URL de producción

[Gestor de Tareas](https://proyecto-m4-aldana-carmuega.vercel.app)

## Flujo de envío de emails

1. El usuario pulsa “Enviar resumen por email”.
2. React obtiene el ID token de Firebase y hace un POST a `/api/send-email`
   con `Authorization: Bearer <token>`.
3. Firebase Admin verifica el token y obtiene el UID y el destinatario.
   No se aceptan tareas ni destinatarios enviados por el cliente.
4. El servidor consulta las tareas de ese UID y construye el total de tareas,
   pendientes, completadas y su detalle.
5. AWS SES envía el resumen en texto UTF-8 desde `SES_FROM_EMAIL` al correo
   del usuario autenticado.
6. La interfaz informa éxito o error y deshabilita el botón durante el envío.

El usuario IAM tiene permiso `ses:SendEmail` limitado al ARN de la identidad
remitente. La región debe coincidir con aquella donde se verificó el correo.
Mientras SES esté en sandbox, también debe estar verificado el destinatario:
registrarse en la aplicación no verifica automáticamente el email en SES.
Para evaluar el envío con otra cuenta se debe coordinar esa verificación.
No se publican contraseñas ni credenciales de prueba.

## Uso de IA en el proceso de trabajo

Se usaron Codex para acompañamiento, explicación y revisión, y el agente
de Antigravity para implementar pasos concretos. Se trabajó por funcionalidades,
revisando el código y probándolo antes de cada commit.

Los siguientes son **extractos de los cuatro prompts utilizados**, con el alcance
y los requisitos centrales. Hubo otras consultas de apoyo sobre sesión,
navegación, errores y diseño que no se incluyen como prompts seleccionados.

### 1 Login con Firebase

```text
Implementá únicamente un formulario de login en src/pages/Login.tsx con
React y TypeScript, inputs controlados y signInWithEmailAndPassword.
Usá auth del servicio existente, async/await y try/catch. Mostrá mensajes
comprensibles para credenciales incorrectas, demasiados intentos y errores
de conexión, sin revelar si una cuenta existe. Mostrá carga y deshabilitá
el botón durante el envío. Permití alternar Login y Register desde App.tsx
sin instalar un router todavía. Conservá el registro. Ejecutá build y lint,
explicá los cambios y proponé pruebas manuales.
```

Resultado: login con feedback y carga, seguido por pruebas manuales de ingreso
correcto, contraseña incorrecta y cambio entre formularios. La sesión compartida
y el router se incorporaron en pasos posteriores.

### 2 CRUD de tareas y reglas

```text
Implementá el CRUD de tareas por usuario en Firestore. Separá tipos,
servicio, useTasks y componentes TodoForm, TodoList y TodoItem. Usá
onSnapshot con where userId igual al UID y cancelá la suscripción.
No muestres tareas del usuario anterior. Validá título y descripción,
permití crear, editar, cancelar, eliminar con confirmación y completar.
Mostrá carga y errores y conservá el formulario si falla el guardado.
Creá firestore.rules con propiedad por usuario, validación de campos
y dueño y fecha inmutables. No publiques reglas ni hagas commits.
Ejecutá build y lint y explicá pruebas pendientes con dos cuentas.
```

Resultado: CRUD persistente y organizado por capas. Se revisaron los errores,
se publicaron las reglas manualmente y se probaron tareas con dos cuentas y
permisos de lectura en el simulador.

### 3 Resumen por email con SES

```text
Implementá api/send-email.ts como Vercel Function con AWS SES. Aceptá
solo POST y verificá Authorization Bearer con Firebase Admin. Obtené UID
y destinatario del token, no del body. Consultá las tareas desde el
servidor filtrando por ese UID y construí el resumen. Usá SES_FROM_EMAIL
y secretos exclusivos del servidor sin VITE_. Agregá un botón y servicio
HTTP con carga, éxito y error. Actualizá .env.example sin valores y
explicá Firebase Admin, Vercel CLI y SES sandbox. No leas ni muestres
secretos, no hagas commits, deploy ni envíos durante la implementación.
Ejecutá build, lint y comprobación de tipos del backend.
```

Resultado: envío autenticado y resumen generado en servidor. Las pruebas reales
permitieron corregir el ARN de permisos IAM y la compatibilidad de módulos
necesaria en Vercel. Se confirmó la recepción del correo en producción.

### 4 Testing con mocks

```text
Implementá pruebas con Vitest y React Testing Library. Configurá scripts
para ejecución única y watch, limpieza y restauración de mocks. Probá
TodoForm, TodoList, TodoItem y SendSummaryButton, validaciones del servicio
de tareas y emailService ante éxito, error HTTP y fallo de red. Verificá
acciones y resultados observables, incluyendo errores y promesas pendientes.
Mockeá Firebase y fetch. No leas .env, uses credenciales ni hagas llamadas
reales. Conservá la funcionalidad, ejecutá tests, build y lint y documentá
qué se cubrió. No hagas commits ni deploy.
```

Resultado: Antigravity instaló las dependencias, completó la configuración y los 32 tests, comprobó tipos, build y lint.

### Decisiones y aprendizajes del proceso

La IA resultó útil para proponer la separación por capas, explicar el flujo
asíncrono y preparar escenarios de prueba. Las sugerencias se contrastaron con
el código y los resultados, en lugar de asumir que una compilación exitosa
confirmaba el funcionamiento completo.

El proceso dejó decisiones concretas: esperar la sesión antes de redirigir,
limpiar suscripciones, proteger datos en Firestore además de ocultar pantallas,
verificar tokens en el servidor y diferenciar tests con mocks de pruebas reales.
La depuración de SES y Vercel mostró la importancia de revisar permisos,
variables y entorno de ejecución al pasar de local a producción.
