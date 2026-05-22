# Plan técnico de implementación — Plataforma de bots modulares (multi-tenant)

## 1) Objetivo
Implementar una arquitectura modular de bots por cliente (`siteId`) que permita:
- Mantener la personalización actual del bot (config/estilo/contenido).
- Habilitar funcionalidades por plan (features contratables).
- Persistir conversaciones para analítica y captura de leads.
- Agregar módulos futuros sin reescribir el núcleo.

---

## 2) Alcance funcional (v1)
### Core incluido (todos los planes)
- Bot informativo (empresa, FAQs, links/redes).
- Personalización visual y de comportamiento por cliente.

### Features contratables (add-ons)
- `lead_capture`: guardar información de conversaciones y leads.
- `appointments`: crear y consultar turnos.
- `commerce_assistant`: mostrar ofertas y guiar compra.

---

## 3) Arquitectura objetivo

### 3.1 Capas
- **Routes**: endpoints HTTP delgados.
- **Controllers**: validación inicial + orquestación.
- **Services**: lógica de negocio por dominio.
- **Repositories**: acceso a Firestore.
- **Policies**: reglas plan→permisos→features.

### 3.2 Estructura propuesta
```txt
controllers/
  chatController.js
  configController.js
services/
  botConfigService.js
  featureGateService.js
  llmOrchestratorService.js
  conversationService.js
  leadService.js
  appointmentsService.js
  commerceService.js
repositories/
  botRepository.js
  conversationRepository.js
  leadRepository.js
  appointmentsRepository.js
policies/
  planPolicies.js
routes/
  chatRoutes.js
  configRoutes.js
```

---

## 4) Diseño de datos (Firestore)

## 4.1 Mantener documento actual de personalización
`bots/{siteId}` (se mantiene el esquema existente):
- `config` (nombre, empresa, colores, imagen, activo, etc.)
- `respuestas` (saludos, opciones, links)
- `systemPrompt`

## 4.2 Extensión de plan/features/permisos
Agregar al mismo documento (`bots/{siteId}`):

```json
{
  "plan": {
    "code": "starter|pro|premium",
    "status": "active|past_due|paused"
  },
  "features": {
    "info_bot": { "enabled": true },
    "lead_capture": { "enabled": false },
    "appointments": { "enabled": false },
    "commerce_assistant": { "enabled": false }
  },
  "permissions": {
    "canReadPublicInfo": true,
    "canCaptureLead": false,
    "canCreateAppointment": false,
    "canReadAppointments": false,
    "canShowOffers": false,
    "canGuidePurchase": false
  }
}
```

## 4.3 Subcolecciones
- `bots/{siteId}/conversations/{conversationId}`
- `bots/{siteId}/conversations/{conversationId}/messages/{messageId}`
- `bots/{siteId}/leads/{leadId}`
- `bots/{siteId}/appointments/{appointmentId}`
- `bots/{siteId}/order_intents/{intentId}` (opcional para e-commerce)

---

## 5) Roadmap por fases con tareas concretas

## Fase 0 — Preparación y hardening (sin romper comportamiento actual)
**Objetivo:** separar responsabilidades con cambios mínimos visibles.

### Tareas
1. Crear `controllers/chatController.js` y mover la lógica de `/api/chat`.
2. Crear `controllers/configController.js` y mover la lógica de `/api/config/:siteId`.
3. Crear `services/botConfigService.js` con función `getBotConfig(siteId)`.
4. Crear `repositories/botRepository.js` para encapsular lecturas a Firestore.
5. Mantener los mismos contratos de respuesta HTTP.

### Criterio de aceptación
- `POST /api/chat` y `GET /api/config/:siteId` responden igual que antes.
- No hay lógica de negocio en rutas.

---

## Fase 1 — Feature gate mínimo viable
**Objetivo:** bloquear/habilitar funcionalidades por plan.

### Tareas
1. Crear `policies/planPolicies.js` con mapping plan→features/permisos.
2. Crear `services/featureGateService.js` con:
   - `isBotActive(botConfig)`
   - `isFeatureEnabled(botConfig, featureKey)`
   - `can(botConfig, permissionKey)`
3. En `chatController`, antes de ejecutar acciones, validar permisos.
4. Definir respuesta estándar para acción no habilitada (`FEATURE_NOT_ENABLED`).

### Criterio de aceptación
- Un bot `starter` no puede ejecutar acciones de turnos/commerce/leads.
- Un bot `pro/premium` sí, según policy.

---

## Fase 2 — Persistencia de conversaciones
**Objetivo:** registrar interacciones para trazabilidad y analytics.

### Tareas
1. Crear `repositories/conversationRepository.js`.
2. Crear `services/conversationService.js`.
3. Persistir al menos:
   - `siteId`, `sessionId`, `startedAt`, `updatedAt`, `origin`.
   - Mensajes (`role`, `text`, `timestamp`, `featureUsed`, `intentDetected`).
4. Integrar persistencia en `chatController`:
   - guardar mensaje usuario antes de IA.
   - guardar respuesta bot luego de IA.
5. Mantener `sessionId` en frontend para continuidad.

### Criterio de aceptación
- Cada conversación tiene historial consultable por `siteId/sessionId`.

---

## Fase 3 — Feature `lead_capture`
**Objetivo:** convertir conversaciones en leads cuando el plan lo permita.

### Tareas
1. Crear `repositories/leadRepository.js` y `services/leadService.js`.
2. Definir `lead schema`:
   - `name`, `phone`, `email`, `interest`, `source`, `conversationId`, `status`, `score`, `consent`, `createdAt`.
3. Implementar scoring inicial simple (reglas determinísticas).
4. Implementar disparadores:
   - explícito: usuario quiere contacto / deja datos.
   - implícito: score supera umbral.
5. Crear endpoint opcional `GET /api/leads/:siteId` (uso interno/admin).

### Criterio de aceptación
- Con `lead_capture.enabled=true` se crean leads.
- Con `lead_capture.enabled=false` no se crea lead (aunque haya conversación).

---

## Fase 4 — Feature `appointments`
**Objetivo:** agendar y consultar turnos por cliente.

### Tareas
1. Crear `repositories/appointmentsRepository.js` y `services/appointmentsService.js`.
2. Definir `appointment schema`:
   - `customerName`, `customerPhone|email`, `service`, `dateTime`, `status`, `notes`, `createdAt`.
3. Crear acciones:
   - `createAppointment`
   - `getAppointmentsByCustomer`
   - `cancelAppointment` (opcional v1.1)
4. Integrar con `featureGateService`:
   - `canCreateAppointment`
   - `canReadAppointments`
5. Agregar validaciones:
   - disponibilidad,
   - formato fecha,
   - duplicados.

### Criterio de aceptación
- Flujo completo de alta/consulta de turno según permisos del plan.

---

## Fase 5 — Feature `commerce_assistant`
**Objetivo:** respuestas comerciales con ofertas y navegación de compra.

### Tareas
1. Crear `services/commerceService.js`.
2. Definir esquema de catálogo/ofertas por cliente:
   - `bots/{siteId}/catalog/*`
   - `bots/{siteId}/offers/*`
3. Implementar acciones:
   - `listOffers`
   - `findProducts`
   - `guidePurchase`
4. Registrar `order_intents` para medir intención de compra.
5. Gate por permisos:
   - `canShowOffers`
   - `canGuidePurchase`

### Criterio de aceptación
- El bot comercial muestra ofertas solo si la feature está habilitada.

---

## Fase 6 — Orquestador IA por herramientas
**Objetivo:** controlar qué ejecuta la IA y cómo.

### Tareas
1. Crear `services/llmOrchestratorService.js`.
2. Definir acciones internas (tools) con contrato estricto:
   - `replyInformational`
   - `captureLead`
   - `createAppointment`
   - `listOffers`
3. Implementar pipeline:
   - clasificar intención,
   - validar permisos,
   - ejecutar tool,
   - responder al usuario.
4. Agregar fallback seguro cuando una tool falla.

### Criterio de aceptación
- Toda acción con side-effects pasa por validación de permisos.

---

## Fase 7 — Seguridad multi-tenant de embebido
**Objetivo:** reducir spoofing de `siteId` y abuso.

### Tareas
1. Agregar token efímero firmado para inicializar widget.
2. Validar `origin` contra allowlist por bot.
3. Rate limiting por `siteId` + IP.
4. Sanitizar entrada y salida en endpoints críticos.

### Criterio de aceptación
- Requests inválidos por origin/token son rechazados.

---

## Fase 8 — Observabilidad y operación SaaS
**Objetivo:** operar y monetizar con métricas reales.

### Tareas
1. Logging estructurado por `siteId`, `sessionId`, `feature`.
2. Métricas básicas:
   - conversaciones por día
   - costo IA estimado por cliente
   - leads/día
   - turnos creados
   - uso por feature
3. Dashboard interno mínimo (puede iniciar como endpoint + export CSV).

### Criterio de aceptación
- KPIs disponibles para facturación y decisiones de producto.

---

## 6) Planes y reglas de negocio (ejemplo)

### Starter
- `info_bot` ✅
- `lead_capture` ❌
- `appointments` ❌
- `commerce_assistant` ❌

### Pro
- `info_bot` ✅
- `lead_capture` ✅
- `appointments` ✅
- `commerce_assistant` ❌

### Premium
- Todas ✅

---

## 7) Endpoints sugeridos
- `GET /api/config/:siteId`
- `POST /api/chat`
- `GET /api/conversations/:siteId/:sessionId` (interno)
- `GET /api/leads/:siteId` (interno)
- `POST /api/appointments/:siteId`
- `GET /api/appointments/:siteId`
- `GET /api/offers/:siteId`

---

## 8) Checklist de implementación (ejecución)

### Semana 1
- [ ] Fase 0 completada (controller/service/repository base).
- [ ] Fase 1 completada (feature gate).

### Semana 2
- [ ] Fase 2 completada (persistencia conversaciones).
- [ ] Fase 3 iniciada (lead schema + repository + service).

### Semana 3
- [ ] Fase 3 completada (captura de leads operativa).
- [ ] Fase 4 iniciada (turnos create/read).

### Semana 4
- [ ] Fase 4 completada.
- [ ] Fase 5 iniciada (commerce básico).

### Semana 5+
- [ ] Fase 6 (orquestador IA tools).
- [ ] Fase 7 (seguridad embed).
- [ ] Fase 8 (observabilidad y métricas).

---

## 9) Definición de terminado (DoD)
Una feature se considera terminada si cumple:
1. Policy + permisos implementados.
2. Persistencia de eventos/mensajes asociada.
3. Manejo de errores con códigos consistentes.
4. Tests mínimos (unit/service + integración endpoint).
5. Métrica de uso registrada.

---

## 10) Nota de migración gradual
No reemplazar todo de una vez. Mantener operación actual y migrar endpoint por endpoint:
1. Refactor de estructura interna.
2. Activar feature gates sin apagar funcionalidad base.
3. Encender features por cliente progresivamente.
