<div align="center">

# Terrario Digital de Hábitos y Bienestar

**CC451 — Interacción Humano Computador · PC03 · Grupo 1**
Universidad Nacional de Ingeniería · Lima, Perú · 2025

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)]()

</div>

---

## Descripción

**Terrario Digital** es una aplicación web donde tus hábitos diarios construyen un
ecosistema 3D vivo. Completar tareas hace crecer la flora; abandonarlas degrada el
bioma visualmente. El entorno (bosque, desierto, jardín zen) se adapta a tu perfil
emocional, inferido por IA a partir de un diario de voz.

Es una aplicación con **interfaces no convencionales** que corre en una laptop
convencional (navegador), es responsive y se puede **instalar como PWA** en el
móvil (con ícono propio y pantalla completa). Cada bioma tiene su propia flora:
🌲 árboles en el bosque, 🌵 cactus en el desierto y 🌸 flores en el jardín zen.

---

## Capacidades obligatorias y módulos

### Interfaces obligatorias

| Interfaz | Implementación |
|---|---|
| **Gráfica no convencional** | Bioma 3D interactivo con Three.js (react-three-fiber) |
| **Voz** | Diario matutino con Web Speech API (dictado en español) |
| **LLM** | Dos agentes (Coach + Terapeuta) sobre Google Gemini |

### Módulos del proyecto

| Módulo | Cómo se materializa |
|---|---|
| **Gamificación Extendida** | Bioma vivo que decae sin actividad. Mecánica de **Rachas (Streaks) 🔥**, y una **Tienda de Semillas 🌱** para comprar y posicionar decoraciones interactivamente en el entorno 3D. |
| **Personalización continua** | El tipo de bioma se adapta al promedio emocional inferido del diario. **Iluminación dinámica** que sigue el ciclo día/noche del usuario real. |
| **Ayuda contextual** | El Coach (IA) sugiere acciones basadas en el historial. Soporte de **Web Push Notifications 🔔** para recordatorios (Service Worker). |

> **Extras tecnológicos:** 
> - Retroalimentación **háptica** (Vibration API) en el módulo de mindfulness.
> - **Soporte Offline PWA**: Cacheo agresivo de assets 3D permitiendo uso sin red.
> - **Panel de Administración (Cheat Tools)**: Inyección de semillas, manipulación de rachas y envío manual de notificaciones Push.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | **Next.js 16** (App Router, Server Actions) |
| Lenguaje | **TypeScript 5** |
| Estilos | **Tailwind CSS 4** |
| 3D | **Three.js** + `@react-three/fiber` + `@react-three/drei` |
| Base de datos | **Prisma 7** ORM + **PostgreSQL 17** (dev y prod) |
| LLM | **Google Gemini** (`@google/genai`, modelo `gemini-2.5-flash`) |
| Voz | Web Speech API (nativa del navegador) |
| Háptica | Vibration API (nativa del navegador) |

> **PostgreSQL en dev y prod**: el dev local levanta Postgres con Docker
> (`docker-compose.yml`). Prisma 7 usa el driver adapter `@prisma/adapter-pg` y
> lee la conexión desde `DATABASE_URL`. En producción solo cambia esa URL.

---
### Requisitos

- **Node.js 20+** y **npm**
- **Docker** + **Docker Compose** (para la base PostgreSQL local)
- **Git**
- Un navegador basado en Chromium (Chrome/Edge) para el dictado por voz

### 1. Instalar dependencias

```bash
npm install
```

> `npm install` también genera el cliente de Prisma automáticamente (`postinstall`).
> Esto funciona sin base de datos: `prisma generate` no necesita conexión.

### 2. Levantar PostgreSQL

La base corre en un contenedor Docker definido en `docker-compose.yml`
(Postgres 17, usuario/clave/base `terrario`). **No instales Postgres a mano.**

```bash
docker compose up -d
```

> **Puerto 5433 (no 5432).** El contenedor expone Postgres en el host en el
> puerto **5433** a propósito, para no chocar con un Postgres que ya tengas
> instalado en tu máquina ocupando el 5432. Si el comando falla por puerto
> ocupado, revisá qué proceso usa el 5433 o cambialo en `docker-compose.yml`
> (recordá actualizar también la URL del `.env`).

### 3. Configurar la conexión (`.env`)

Creá un archivo **`.env`** en la raíz con la URL de la base. Este archivo está
en `.gitignore`, así que cada quien lo crea localmente:

```
DATABASE_URL="postgresql://terrario:terrario@localhost:5433/terrario?schema=public"
```

Atajo para crearlo desde la terminal (en la raíz del proyecto):

```bash
# macOS / Linux / Git Bash
echo 'DATABASE_URL="postgresql://terrario:terrario@localhost:5433/terrario?schema=public"' > .env

# Windows PowerShell (escribe sin BOM, que rompería el parser de --env-file)
[System.IO.File]::WriteAllText("$PWD\.env", 'DATABASE_URL="postgresql://terrario:terrario@localhost:5433/terrario?schema=public"' + "`n")
```

> Si preferís, creá el `.env` a mano en tu editor con esa única línea. Asegurate
> de guardarlo como **UTF-8 sin BOM**.

### 4. Aplicar el esquema y cargar datos

Con el contenedor arriba y el `.env` creado:

```bash
npm run db:migrate   # aplica las migraciones al Postgres del contenedor
npm run db:seed      # carga datos simulados de demostración
```

> Si `db:migrate` falla con `P1000 Authentication failed`, casi siempre es que
> `localhost:5432/5433` está pegando contra otro Postgres. Confirmá que el
> contenedor está sano con `docker compose ps` y que el `.env` apunta al **5433**.

### 5. Configurar la clave de Gemini (opcional pero recomendado)

Creá un archivo **`.env.local`** en la raíz con tu clave:

```
GEMINI_API_KEY=tu_clave_de_google_ai_studio
```

> Sin clave, los agentes funcionan igual con un **stub determinista** que imita
> los tonos. Con clave, pasan a **IA real** sin ningún otro cambio (patrón
> Strategy en `src/features/agents`).

### 6. Levantar la app

```bash
npm run dev
```

 **http://localhost:3000**.

> **Detener / reiniciar la base:** `docker compose stop` la pausa sin borrar
> datos; `docker compose down` elimina el contenedor (los datos persisten en el
> volumen `terrario_pgdata`); `docker compose down -v` borra **también** los
> datos para empezar de cero.

### Scripts disponibles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm run start` | Build y arranque de producción |
| `npm run lint` | Linter (ESLint) |
| `npm run db:migrate` | Crea / actualiza la base |
| `npm run db:seed` | Carga datos de demostración |

### 📱 Instalarla en el móvil (PWA)

La app es una **PWA instalable**. Como instalar requiere HTTPS, exponé el
servidor local con un túnel:

```bash
npx cloudflared tunnel --url http://localhost:3000
```

Abrí la URL `https://…trycloudflare.com` en el celular → menú → **"Instalar
aplicación"**. Detalle en la [Guía del equipo](docs/GUIA-EQUIPO.md).

---

##  Pantallas

| Ruta / UI | Pantalla / Componente | Caso de uso |
|---|---|---|
| `/onboarding` | Bienvenida + elección de bioma | UC-05 |
| `/` | Bioma 3D interactivo + panel de hábitos + HUD de Estadísticas | UC-03 |
| `/diario` | Diario matutino multimodal (voz/texto/cartas) | UC-01 |
| *Modal Embebido* | **Coach de Productividad**: (Aparece sobre `/` al hacer clic) | UC-02 |
| *Card Embebido* | **Reencuadre Cognitivo**: (Integrado naturalmente en `/diario`) | UC-02 |
| `/analiticas` | Analíticas semanales y visualización de progreso | UC-06 |
| `/mindfulness` | Sesión de mindfulness guiada con respuesta háptica | UC-04 |
| `/configuracion` | Perfil, ajustes de bioma y activación Web Push | RF-17 |
| `/admin` | Panel de gestión y *Cheat Tools* para profesores/evaluadores | RF-Admin |

> **Nota de Diseño (HCI):** Funciones como el *Coach* y el *Reencuadre* no fuerzan una recarga de página; se renderizan in-context como Modales y Tarjetas para evitar romper la inmersión del usuario, mejorando la usabilidad.

---

##  Arquitectura

Organización **por features** (screaming architecture), con la lógica de dominio
pura separada de la UI y del acceso a datos.

```
src/
├── app/                    # Rutas (App Router) + Server Actions
│   ├── page.tsx            # Home: bioma 3D
│   ├── diario/ coach/ ...  # Una carpeta por pantalla
├── features/               # Módulos de dominio
│   ├── biome/              # Render 3D + lógica pura del bioma
│   ├── habits/             # Gamificación (motor + acciones + UI)
│   ├── voice/              # Hook de voz + diario
│   ├── mood/               # Personalización continua
│   ├── coach/ reframe/     # Ayuda contextual
│   ├── analytics/          # Métricas (derivaciones puras)
│   ├── mindfulness/        # Sesión háptica
│   └── agents/             # Interfaz de agentes + stub + Gemini (factory)
├── lib/
│   └── db.ts               # Cliente Prisma (singleton + driver adapter)
└── generated/prisma/       # Cliente Prisma autogenerado
```

**Principios aplicados:**

- **Lógica pura aislada**: `biome-logic.ts`, `gamification.ts`, `analytics.ts`,
  `personalization.ts` no dependen de React ni de la base — son testeables y
  explicables.
- **Patrón Strategy** en `agents/`: el resto de la app depende de la interfaz
  `Agents`, nunca de un proveedor. `getAgents()` elige Gemini o stub según haya
  clave. Cada método cae al stub si la API falla (resiliencia).
- **Server Actions** para todas las mutaciones; los componentes interactivos son
  Client Components (`"use client"`).

---

##  Accesibilidad

- **Entrada multimodal** (RF-14): voz, texto y mood cards como alternativas
  equivalentes en el diario.
- Atributos `aria-*` y `role="switch"` en controles interactivos.
- Fallback automático a texto cuando el navegador no soporta dictado.
- Paletas y degradados pensados para contraste.

---

##  Equipo — Grupo 1

| Integrante | Aporte |
|---|---|
| **Cinver Espinoza Valera** | Ver `docs/mi-aporte-Cinver-Espinoza.docx` |
| **Martin Centeno Leon** | Ver `docs/mi-aporte-Martin-Centeno.docx` |
| **Ariana Mercado Taype** | Ver `docs/mi-aporte-Ariana-Mercado.docx` |

---

## 📄 Licencia

Licenciado bajo **MIT**. Ver [LICENSE](LICENSE).

<div align="center">

**Universidad Nacional de Ingeniería · Facultad de Ciencias**
CC451 Interacción Humano Computador · 2026

</div>
