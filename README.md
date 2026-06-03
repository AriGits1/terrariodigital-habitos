<div align="center">

# 🌿 Terrario Digital de Hábitos y Bienestar

**CC451 — Interacción Humano Computador · PC03 · Grupo 1**
Universidad Nacional de Ingeniería · Lima, Perú · 2025

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)]()

</div>

---

## 📋 Descripción

**Terrario Digital** es una aplicación web donde tus hábitos diarios construyen un
ecosistema 3D vivo. Completar tareas hace crecer la flora; abandonarlas degrada el
bioma visualmente. El entorno (bosque, desierto, jardín zen) se adapta a tu perfil
emocional, inferido por IA a partir de un diario de voz.

Es una aplicación con **interfaces no convencionales** que corre en una laptop
convencional (navegador) y es responsive para móvil.

---

## 🎯 Capacidades obligatorias y módulos

### Interfaces obligatorias

| Interfaz | Implementación |
|---|---|
| **Gráfica no convencional** | Bioma 3D interactivo con Three.js (react-three-fiber) |
| **Voz** | Diario matutino con Web Speech API (dictado en español) |
| **LLM** | Dos agentes (Coach + Terapeuta) sobre Google Gemini |

### Módulos del proyecto

| Módulo | Cómo se materializa |
|---|---|
| **Gamificación** | Completar hábitos hace crecer/sanar el bioma; abandonarlos lo degrada |
| **Personalización continua** | El tipo de bioma se adapta al promedio emocional inferido del diario |
| **Ayuda contextual** | El Coach sugiere acciones según tu estado real de hábitos |

> Extra: retroalimentación **háptica** (Vibration API) en el módulo de mindfulness.

---

## 🧱 Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | **Next.js 16** (App Router, Server Actions) |
| Lenguaje | **TypeScript 5** |
| Estilos | **Tailwind CSS 4** |
| 3D | **Three.js** + `@react-three/fiber` + `@react-three/drei` |
| Base de datos | **Prisma 7** ORM + **SQLite** (dev) |
| LLM | **Google Gemini** (`@google/genai`, modelo `gemini-2.5-flash`) |
| Voz | Web Speech API (nativa del navegador) |
| Háptica | Vibration API (nativa del navegador) |

> **SQLite → PostgreSQL**: el cambio a producción es de una línea (el `provider`
> del datasource en `prisma/schema.prisma` y la URL en `prisma.config.ts`). Los
> modelos no cambian.

---

## 🚀 Cómo correr el proyecto

### Requisitos

- **Node.js 20+** y **npm**
- Un navegador basado en Chromium (Chrome/Edge) para el dictado por voz

### 1. Instalar dependencias

```bash
npm install
```

### 2. Preparar la base de datos

```bash
npx prisma migrate dev   # crea la base SQLite y aplica el esquema
npx tsx prisma/seed.ts    # carga datos simulados de demostración
```

### 3. Configurar la clave de Gemini (opcional pero recomendado)

Creá un archivo **`.env.local`** en la raíz con tu clave:

```
GEMINI_API_KEY=tu_clave_de_google_ai_studio
```

Generá una clave gratis en https://aistudio.google.com/apikey

> Sin clave, los agentes funcionan igual con un **stub determinista** que imita
> los tonos. Con clave, pasan a **IA real** sin ningún otro cambio (patrón
> Strategy en `src/features/agents`).

### 4. Levantar la app

```bash
npm run dev
```

Abrí **http://localhost:3000**.

---

## 🗺️ Pantallas

| Ruta | Pantalla | Caso de uso |
|---|---|---|
| `/onboarding` | Bienvenida + elección de bioma | UC-05 |
| `/` | Bioma 3D + panel de hábitos | UC-03 |
| `/diario` | Diario matutino (voz/texto/cartas) | UC-01 |
| `/coach` | Coach de Productividad | UC-02 |
| `/analiticas` | Analíticas semanales | UC-06 |
| `/mindfulness` | Mindfulness con guía háptica | UC-04 |
| `/reframe` | Reencuadre cognitivo | UC-02 |
| `/configuracion` | Perfil y preferencias | RF-17 |

---

## 🏗️ Arquitectura

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

## ♿ Accesibilidad

- **Entrada multimodal** (RF-14): voz, texto y mood cards como alternativas
  equivalentes en el diario.
- Atributos `aria-*` y `role="switch"` en controles interactivos.
- Fallback automático a texto cuando el navegador no soporta dictado.
- Paletas y degradados pensados para contraste.

---

## 👥 Equipo — Grupo 1

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
CC451 Interacción Humano Computador · 2025

</div>
