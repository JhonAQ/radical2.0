---
name: project-setup
description: >-
  Guía de configuración del entorno para el proyecto Radical2.0.
  Cubre cómo instalar dependencias, configurar el Appwrite CLI, variables
  de entorno, MCP servers (Appwrite) y skills de IA para Antigravity,
  Claude Code y Codex. Activa esta skill cuando el usuario pregunte cómo
  configurar el entorno, cómo conectar las herramientas de IA al proyecto,
  cómo autenticar el MCP de Appwrite, o cómo instalar el CLI de Appwrite.
---

# Radical2.0 — Contexto del proyecto para el agente

## Proyecto

- **Nombre:** Radical2.0
- **Appwrite Project ID:** `6adbd52a0017f0c3144b`
- **Endpoint:** `https://nyc.cloud.appwrite.io/v1` (región NYC)
- **Framework:** Next.js 16 con App Router
- **Estilos:** Tailwind CSS v4
- **Lenguaje:** TypeScript
- **Package manager:** pnpm
- **Backend:** Appwrite Cloud (BaaS)

## Estructura de archivos clave

```
lib/appwrite.ts          → Cliente Appwrite (Client singleton)
app/page.tsx             → Home con session check
app/sign-in/page.tsx     → Login con email/password
app/sign-up/page.tsx     → Registro con email/password
.env                     → Variables de entorno (NO en git)
.env.example             → Plantilla de variables
appwrite.config.json     → Config del CLI de Appwrite (en git)
SETUP.md                 → Guía de configuración para el equipo
.agents/skills/          → Skills de IA instalados en el proyecto
```

## Variables de entorno requeridas

El archivo `.env` (copiado de `.env.example`) debe tener:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=6adbd52a0017f0c3144b
```

## Cliente Appwrite (`lib/appwrite.ts`)

```typescript
import { Client } from 'appwrite'

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)

export { client }
```

Importar siempre desde `@/lib/appwrite`, nunca crear un nuevo `Client` directamente.

## Appwrite CLI — Comandos habituales

```bash
appwrite login                  # Auth OAuth (abre navegador)
appwrite init project           # Vincula la carpeta al proyecto
appwrite pull table             # Descarga schema de tablas
appwrite push table --force     # Sube cambios al schema
appwrite list-projects --json   # Verifica auth
```

## MCP Server de Appwrite

El MCP está configurado en `~/.gemini/config/mcp_config.json`:

```json
{
  "mcpServers": {
    "appwrite": {
      "url": "https://mcp.appwrite.io"
    }
  }
}
```

Para **autenticar** el MCP en Antigravity:
1. Ve a `⋯ → MCP Servers → appwrite → Authenticate`
2. Se abrirá el navegador para OAuth con Appwrite

Para Claude Code:
```bash
claude mcp add appwrite --transport http https://mcp.appwrite.io
```
Luego: `/mcp` → `appwrite` → `Authenticate`

## Skills de IA instaladas

Las skills están en `.agents/skills/` y Antigravity las carga automáticamente:

- `appwrite-typescript` → Patterns del SDK web de Appwrite (Client SDK)
- `appwrite-cli` → Uso correcto del CLI de Appwrite

Para actualizar o reinstalar las skills:
```bash
npx skills add appwrite/skills
# Seleccionar: TypeScript → Antigravity → Project → Symlink
```

## Convenciones del proyecto

- **No emojis como iconos de UI** — usar solo SVGs vectoriales
- **No `border-left`** como acento en cards
- **No badges redundantes** dentro de cards
- Botones con icono SVG: no duplicar el prefijo en el label (ej: `[SVG+] Agendar` no `[SVG+] + Agendar`)

## Flujo de setup para un compañero nuevo

1. `git clone <repo> && cd radical2.0`
2. `pnpm install`
3. `cp .env.example .env`
4. `pnpm install -g appwrite-cli && pnpm setup && source ~/.bashrc`
5. `appwrite login && appwrite init project`
6. Configurar MCP en tu cliente de IA (ver sección MCP arriba)
7. `pnpm dev` → [http://localhost:3000](http://localhost:3000)

Lee `SETUP.md` en la raíz del proyecto para instrucciones detalladas.
