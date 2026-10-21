# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

---

## Envío de Resumen de Tareas por Email (Vercel Serverless Function & AWS SES)

El proyecto incluye un endpoint serverless en `api/send-email.ts` que permite enviar un resumen de las tareas del usuario por correo electrónico a través de **AWS SES**, validando la identidad del usuario en el servidor mediante **Firebase Admin SDK**.

### 1. Variables de Entorno Requeridas (`.env`)

Para el funcionamiento del backend serverless, se deben definir en el archivo `.env` local (y en las Environment Variables del proyecto en Vercel para producción):

```env
# AWS Simple Email Service (SES)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu_access_key_id
AWS_SECRET_ACCESS_KEY=tu_secret_access_key
SES_FROM_EMAIL=tu_correo_verificado@dominio.com

# Firebase Admin SDK (Servidor)
FIREBASE_ADMIN_PROJECT_ID=tu_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=tu_service_account_email@...iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

#### Cómo obtener las credenciales de Firebase Admin manualmente:
1. Dirigite a la [Consola de Firebase](https://console.firebase.google.com/).
2. Accedé a la configuración del proyecto (ícono de engranaje) -> **Cuentas de servicio** (Service accounts).
3. Asegurate de que esté seleccionado Node.js y hacé clic en **Generar nueva clave privada**.
4. Se descargará un archivo JSON con los datos requeridos:
   - `FIREBASE_ADMIN_PROJECT_ID`: el valor del campo `project_id`.
   - `FIREBASE_ADMIN_CLIENT_EMAIL`: el valor del campo `client_email`.
   - `FIREBASE_ADMIN_PRIVATE_KEY`: el valor del campo `private_key` (encerralo entre comillas dobles en `.env` para que los saltos de línea `\n` se interpreten adecuadamente).

### 2. Consideraciones importantes sobre AWS SES (Sandbox Mode)
- **Modo Sandbox:** Si tu cuenta de AWS SES se encuentra en modo sandbox (estado inicial por defecto de AWS), **tanto el remitente (`SES_FROM_EMAIL`) como el destinatario (el correo del usuario autenticado)** deben estar verificados en AWS SES (en la sección *Verified Identities* de la consola de SES). Si intentás enviar un correo a un destinatario no verificado en sandbox, SES rechazará la solicitud con un error `MessageRejected`.
- **Región de SES:** La variable `AWS_REGION` debe coincidir exactamente con la región de AWS donde verificaste tu identidad y creaste las credenciales (por ejemplo, `us-east-1`).

### 3. Ejecución Local con Vercel CLI

> **Nota:** Al ejecutar `npm run dev`, Vite únicamente levanta el servidor de desarrollo del frontend (SPA). Las Serverless Functions ubicadas en `api/` no se ejecutan con `vite`.

Para probar el frontend junto con la función serverless de manera local:
1. Instalá Vercel CLI globalmente (si aún no lo tenés):
   ```bash
   npm install -g vercel
   ```
2. En la raíz del proyecto, ejecutá:
   ```bash
   vercel dev
   ```
3. Vercel CLI levantará tanto la aplicación React como el entorno de ejecución de las Serverless Functions en `http://localhost:3000`, enrutando las peticiones a `/api/send-email` directamente a `api/send-email.ts` con acceso a las variables de entorno de `.env`.



## Pruebas automatizadas

Ejecutar todos los tests una vez:

```bash
npm run test
```

Ejecutar en modo interactivo, repitiendo al modificar archivos:

```bash
npm run test:watch
```

Las pruebas usan Vitest, React Testing Library, user-event y jsdom.
Cubren creación y edición con validaciones, estados de carga y error,
listas vacías, cambios de estado, confirmación de eliminación y envío
del resumen desde el botón y el servicio HTTP.

Los mocks sustituyen Firebase y las respuestas HTTP por simulaciones
controladas. No se cargan archivos .env, no se usan credenciales ni se
hacen solicitudes reales. Estas pruebas no sustituyen las comprobaciones
de reglas de Firestore, entrega real con SES o funcionamiento en producción.

Antigravity instaló las dependencias de testing, pero su ejecución se
interrumpió por límite de cuota. La configuración y las pruebas se
completaron con Codex, revisando los resultados de tests, build y lint.
