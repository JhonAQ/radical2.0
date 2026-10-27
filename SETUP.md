# Radical2.0 — Guía de configuración del entorno

Sigue esta guía **en orden** la primera vez que clones el proyecto. Cubre dependencias, Appwrite CLI, variables de entorno, y la configuración de herramientas de IA (MCP + Skills).

---

## Requisitos previos

| Herramienta | Versión mínima | Instalar |
|---|---|---|
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org) o `mise install node` |
| pnpm | ≥ 9 | `npm i -g pnpm` o `mise install pnpm` |

---

## 1. Clonar e instalar dependencias

```bash
git clone <repo-url>
cd radical2.0
pnpm install
```

---

## 2. Variables de entorno

Copia el archivo de ejemplo y completa los valores (ya están pre-cargados con el proyecto correcto):

```bash
cp .env.example .env
```

El `.env` debe contener:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=6adbd52a0017f0c3144b
```

> **Nota:** `.env` está en `.gitignore` — nunca lo commitees.

---

## 3. Appwrite CLI

### Instalar

```bash
pnpm install -g appwrite-cli
```

Si `appwrite` no es reconocido después de instalarlo, asegúrate de que `$PNPM_HOME/bin` está en tu `PATH`:

```bash
pnpm setup          # agrega PNPM_HOME a tu shell
source ~/.bashrc    # o ~/.zshrc según tu shell
```

### Autenticarse y vincular el proyecto

```bash
# 1. Login (abrirá el navegador, no requiere password en terminal)
appwrite login

# 2. Vincular este directorio al proyecto Radical2.0 en Appwrite Cloud
appwrite init project
# → Selecciona "Radical2.0" / project ID: 6adbd52a0017f0c3144b
# → Endpoint: https://nyc.cloud.appwrite.io/v1
# → Esto genera appwrite.config.json (ya versionado en el repo)
```

Verificar que funciona:

```bash
appwrite list-projects --json
```

---

## 4. Levantar el servidor de desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## 5. Configurar herramientas de IA

### 5.1 Skills (contexto de SDK para el agente)

Las skills ya están en `.agents/skills/` dentro del repo y Antigravity las carga automáticamente. Si quieres actualizar a la versión más reciente del skill oficial de Appwrite:

```bash
npx skills add appwrite/skills
# → TypeScript ✓
# → Antigravity ✓  (y cualquier otra herramienta que uses)
# → Scope: Project
# → Method: Symlink
```

### 5.2 Appwrite MCP Server

El MCP le permite al agente de IA llamar a tu proyecto de Appwrite en vivo (listar usuarios, crear colecciones, etc.).

**Antigravity (Google Gemini CLI)**

Crea o edita `~/.gemini/config/mcp_config.json`:

```json
{
  "mcpServers": {
    "appwrite": {
      "url": "https://mcp.appwrite.io"
    }
  }
}
```

Luego autentícate dentro de Antigravity:
```
⋯ (Additional Options) → MCP Servers → appwrite → Authenticate
```

**Claude Code**

```bash
claude mcp add appwrite --transport http https://mcp.appwrite.io
```

Luego dentro de Claude: `/mcp` → selecciona `appwrite` → `Authenticate`.

**Codex**

```bash
codex mcp add appwrite --url https://mcp.appwrite.io
# → Autenticará en el navegador automáticamente
```

**OpenCode / Cursor / Zed** — agrega esto a tu config de MCP del editor:

```json
{
  "mcpServers": {
    "appwrite": {
      "url": "https://mcp.appwrite.io"
    }
  }
}
```

---

## 6. Estructura del proyecto

```
radical2.0/
├── .agents/
│   └── skills/
│       ├── appwrite-typescript/   # Skill: SDK web de Appwrite
│       └── appwrite-cli/          # Skill: Appwrite CLI
├── app/
│   ├── page.tsx                   # Home con auth check
│   ├── sign-in/page.tsx
│   └── sign-up/page.tsx
├── lib/
│   └── appwrite.ts                # Cliente Appwrite inicializado
├── .env.example                   # Plantilla de variables de entorno
├── appwrite.config.json           # Configuración del proyecto Appwrite CLI
└── SETUP.md                       # Esta guía
```

---

## 7. Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Estilos | Tailwind CSS v4 |
| Lenguaje | TypeScript |
| Backend / BaaS | Appwrite Cloud (NYC) |
| Package manager | pnpm |
| Agente IA | Antigravity (Google Gemini) |

---

## Verificación final

```bash
pnpm build    # debe compilar sin errores
appwrite -v   # debe mostrar la versión del CLI
```

Si algo falla, revisa:
1. Que `.env` existe y tiene los valores correctos.
2. Que `appwrite login` fue exitoso (`appwrite list-projects` devuelve datos).
3. Que `node_modules` fue instalado (`pnpm install`).
