# AGENTS.md — multi-bot-server

## Descripción del proyecto
API REST en Node.js + Express que potencia chatbots incrustables en sitios web de terceros.
No tiene motor de vistas propio — el frontend es HTML/JS estático servido desde `public/`.
Los clientes alquilan bots configurados para distintos fines: informativos, agendamiento
de citas, atención al cliente, etc. El sitio propio tiene un bot de demo funcional.

## Stack técnico
- **Runtime**: Node.js
- **Framework**: Express.js v5
- **IA actual**: Dialogflow (en proceso de migración) + OpenAI SDK ya instalado
- **Base de datos**: Firebase Admin (Firestore probablemente)
- **Email**: Nodemailer y/o Resend
- **Otros**: uuid para IDs únicos, dotenv para variables de entorno

## Migración en curso
Estamos reemplazando Dialogflow por un LLM (Gemini o GPT) con llamadas directas a API.
- `testDialogflow.js` es código legacy — ignorar o eliminar
- Los paquetes `@google-cloud/dialogflow`, `dialogflow`, `dialogflow-fulfillment`
  serán removidos al completar la migración
- El SDK de OpenAI ya está instalado (`openai` ^5.12.0) y puede usarse como referencia

## Estructura del proyecto
- `server.js` — Entry point. Configura Express, middlewares, importa rutas, arranca server.
- `routes/` — Endpoints HTTP agrupados por dominio (bot, clientes, webhooks, etc).
- `controllers/` — Lógica de negocio. Reciben requests y orquestan respuestas.
- `config/` — Configuraciones: Firebase, variables de entorno, settings de proveedores IA.
- `utils/` — Helpers reutilizables e integraciones externas (email, IA, etc).
- `public/` — Widget del chat (HTML/CSS/JS), assets estáticos servidos al cliente.
- `.env` — Variables sensibles. NUNCA commitear. Incluye API keys y credenciales Firebase.

## Variables de entorno esperadas (.env)
- `OPENAI_API_KEY` o `GEMINI_API_KEY` — clave del proveedor de IA
- Credenciales de Firebase Admin
- Credenciales de email (Nodemailer/Resend)

## Arquitectura del bot
- Cada bot tiene un `system prompt` configurable que define personalidad y conocimiento.
- El widget se incrusta en sitios externos vía `<script>` o `<iframe>`.
- Las conversaciones se persisten en Firebase.
- Algunos bots envían emails (confirmaciones de citas, notificaciones).

## Convenciones
- Async/await siempre (sin callbacks).
- Variables de entorno vía `process.env.NOMBRE` — nunca hardcodeadas.
- Try/catch en todos los controllers.
- Lógica del bot centralizada en `utils/` o en un futuro directorio `services/`.

## Lo que NO hacer
- No tocar `node_modules/`.
- No hardcodear API keys ni credenciales de Firebase.
- No mezclar lógica de negocio en las rutas (va en controllers).
- No usar los paquetes de Dialogflow en código nuevo.