# Threads Content Engine

Sistema de generación asistida por IA, revisión editorial y publicación controlada en Threads (Meta).

## Principio Fundamental

> **Human-in-the-Loop:** La IA genera ideas y borradores estructurados, pero **nunca publica de forma autónoma**. Toda publicación requiere revisión, edición y aprobación explícita de un redactor o editor humano.

---

## Stack Tecnológico

- **Monorepo:** `pnpm` workspaces
- **Backend API & Workers:** Node.js · Fastify · TypeScript · Zod
- **Base de Datos & ORM:** PostgreSQL 16 · Prisma ORM
- **Colas y Tareas en Segundo Plano:** BullMQ · Redis 7
- **Frontend Web:** React 19 · Vite · TypeScript · Tailwind CSS · TanStack Query
- **Testing:** Vitest

---

## Estructura del Proyecto

```text
threads-content-engine/
├── apps/
│   ├── api/                     # Backend Fastify + Workers BullMQ
│   │   └── src/
│   │       ├── modules/         # generation, editorial, publishing, dashboard
│   │       ├── infrastructure/  # database (Prisma), queue (BullMQ), logger
│   │       ├── adapters/        # ai-generator (Mock/LLM), threads-publisher (Mock/Meta)
│   │       └── workers/         # generation.worker, publishing.worker
│   └── web/                     # Panel Editorial en React + Vite
│       └── src/
│           ├── components/      # PostCard, PostEditorModal, RejectModal, HistoryModal, etc.
│           └── lib/             # Cliente API tipado con Zod y contratos compartidos
├── packages/
│   └── contracts/               # Esquemas Zod y tipos TypeScript compartidos
├── prisma/
│   └── schema.prisma            # Modelos: ContentPost, ContentGeneration, PublishAttempt, etc.
├── docker-compose.yml           # PostgreSQL 16 y Redis 7
├── tests/                       # Pruebas de integración con Vitest
└── .env.example
```

---

## Secciones Editoriales Diarias

La aplicación genera automáticamente 3 borradores diarios con control de idempotencia (`daily-generation:AAAA-MM-DD`):

1. **Bajos que cambiaron el mundo** (`BASS_HISTORY`): Historia musical, líneas icónicas de bajo y grandes leyendas.
2. **Bajista, si tuvieras que…** (`COMMUNITY`): Preguntas dilemáticas, debate y participación comunitaria.
3. **La cocina del bajo** (`EDUCATION`): Técnica, tips prácticos, armonía y ecualización.

---

## Máquina de Estados y Reglas de Negocio

$$\text{IDEA} \rightarrow \text{GENERATING} \rightarrow \text{PENDING\_REVIEW} \rightarrow \text{APPROVED} \rightarrow \text{SCHEDULED} \rightarrow \text{PUBLISHING} \rightarrow \text{PUBLISHED}$$

- **Invalidación de Aprobación:** Si se modifica el texto de un borrador ya aprobado, la aprobación se invalida automáticamente, regresando el post a `PENDING_REVIEW` y registrando una revisión histórica en `ContentRevision`.
- **Publicación Bloqueada:** Es imposible publicar un post que no esté en estado `APPROVED` o `SCHEDULED`.
- **Idempotencia Externa:** La publicación se realiza en dos pasos (creación de contenedor y publicación en Threads) registrando `PublishAttempt` con clave de idempotencia única.

---

## Cómo Levantar la Aplicación

### 1. Iniciar Base de Datos y Redis
```bash
docker compose up -d
```

### 2. Migraciones de Base de Datos
```bash
pnpm db:migrate
```

### 3. Iniciar Backend y Frontend en Desarrollo
```bash
# Iniciar ambos simultáneamente:
pnpm dev

# O en terminales separadas:
pnpm dev:api    # Escucha en http://localhost:3001
pnpm dev:web    # Panel React en http://localhost:5173
```

### 4. Iniciar Workers de Colas (Opcional en desarrollo)
```bash
pnpm --filter @threads-engine/api run worker:generation
pnpm --filter @threads-engine/api run worker:publishing
```

### 5. Ejecutar Pruebas Automatizadas
```bash
pnpm test
```

### Probar generación con Gemini
Configurá `AI_PROVIDER=gemini` y una clave nueva en `GEMINI_API_KEY` dentro de `apps/api/.env`. Luego ejecutá:
```bash
pnpm --filter @threads-engine/api run test:gemini
```

La clave no debe compartirse ni incluirse en el repositorio. Si se expuso, revocala y generá una nueva antes de usar Gemini.
