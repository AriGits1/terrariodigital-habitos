# Reporte de Avance del Proyecto — Parte 03

**Curso:** CC451 Interacción Humano Computador
**Proyecto:** Terrario Digital de Hábitos y Bienestar
**Grupo 1:** Cinver Espinoza Valera · Martin Centeno Leon · Ariana Mercado Taype

---

## 1. Introducción

Este documento reporta el avance de la Parte 03 del proyecto **Terrario Digital**,
una aplicación web con interfaces no convencionales donde los hábitos diarios del
usuario construyen un ecosistema 3D vivo. El objetivo de esta entrega es presentar
la **Especificación de Requisitos del Sistema** con la implementación de las
capacidades obligatorias, los **casos de uso** y su trazabilidad con los
requisitos, y las **especificaciones de usabilidad**, junto al prototipo funcional
al 70%.

La aplicación es **original**, está licenciada como **open source (MIT)** y corre
en una laptop convencional a través del navegador. Además es una **PWA
instalable** en dispositivos móviles (ícono propio y pantalla completa), con
diseño responsive. Cada bioma presenta flora distinta —árboles (bosque), cactus
(desierto) y flores (jardín zen)— para reforzar la personalización visual.

---

## 2. Especificación de Requisitos del Sistema (SRS)

### 2.1 Capacidades obligatorias y su implementación

Las tres interfaces no convencionales exigidas están **implementadas y
funcionando** en el prototipo:

| Capacidad obligatoria | Implementación | Tecnología | Ubicación en el código | Estado |
|---|---|---|---|---|
| **Interfaz gráfica no convencional** | Bioma 3D interactivo que crece y se degrada | Three.js + react-three-fiber | `src/features/biome` · ruta `/` | ✅ Implementado |
| **Interfaz de voz** | Diario matutino con dictado de voz | Web Speech API (es-ES) | `src/features/voice` · ruta `/diario` | ✅ Implementado |
| **Interfaz con LLM** | Dos agentes (Coach + Terapeuta) | Google Gemini (`gemini-2.5-flash`) | `src/features/agents` · rutas `/coach`, `/reframe` | ✅ Implementado |

Adicionalmente se implementó **retroalimentación háptica** (Vibration API) en el
módulo de mindfulness, como capacidad complementaria.

### 2.2 Requisitos funcionales (RF)

| ID | Descripción | Prioridad | Estado en PC03 |
|---|---|---|---|
| RF-01 | CRUD de hábitos con periodicidad y peso relativo | Alta | ✅ Implementado |
| RF-02 | Registro de cumplimiento diario de hábitos | Alta | ✅ Implementado |
| RF-03 | Motor de crecimiento/degradación del bioma según hábitos | Alta | ✅ Implementado |
| RF-04 | Captura de diario matutino por voz | Alta | ✅ Implementado |
| RF-05 | Inferencia de estado de ánimo mediante LLM | Alta | ✅ Implementado |
| RF-06 | Adaptación continua del bioma al perfil emocional | Alta | ✅ Implementado |
| RF-07 | Agente Coach con sugerencias contextuales | Alta | ✅ Implementado |
| RF-08 | Conversación con los agentes (chat persistente) | Media | ✅ Implementado |
| RF-09 | Reencuadre cognitivo de pensamientos negativos | Media | ✅ Implementado |
| RF-10 | Analíticas semanales (racha, cumplimiento, ánimo) | Media | ✅ Implementado |
| RF-11 | Onboarding e inicialización del perfil | Media | ✅ Implementado |
| RF-12 | Configuración de perfil y preferencias | Baja | ✅ Implementado |
| RF-14 | Entrada multimodal: voz + texto + mood cards (accesibilidad) | Alta | ✅ Implementado |
| RF-15 | Retroalimentación háptica sincronizada con mindfulness | Media | ✅ Implementado |

### 2.3 Requisitos no funcionales (RNF)

| ID | Descripción | Valor objetivo | Estado |
|---|---|---|---|
| RNF-01 | Latencia de actualización del bioma | < 1.5 s | ✅ Cumple (revalidación server-side) |
| RNF-02 | Resiliencia del LLM ante fallos de red | Degradación a stub | ✅ Cumple (fallback automático) |
| RNF-03 | Tiempo de respuesta de los agentes | < 2 s típico | 🟡 Sujeto a la API de Gemini |
| RNF-05 | Rendimiento del motor 3D | ≥ 30 FPS gama media | ✅ Cumple (escena low-poly) |
| RNF-06 | Seguridad de credenciales | Clave nunca en cliente ni en repo | ✅ Cumple (server-side + `.gitignore`) |
| RNF-07 | Accesibilidad | WCAG 2.1 AA (objetivo) | 🟡 Parcial (multimodal + `aria-*`, sin auditoría formal) |

---

## 3. Casos de Uso y su relación con los requisitos

### 3.1 Catálogo de casos de uso

| UC | Nombre | Actor principal | Pantalla |
|---|---|---|---|
| UC-01 | Registro multimodal de estado matutino | Usuario | `/diario` |
| UC-02 | Orquestación semántica y reencuadre cognitivo | Usuario + Coach LLM | `/coach`, `/reframe` |
| UC-03 | Renderizado, gamificación y degradación del ecosistema 3D | Usuario + Sistema | `/` |
| UC-04 | Intervención de mindfulness con alertas hápticas | Terapeuta LLM | `/mindfulness` |
| UC-05 | Onboarding e inicialización del perfil | Usuario nuevo | `/onboarding` |
| UC-06 | Visualización de analíticas y métricas semanales | Usuario | `/analiticas` |

### 3.2 Matriz de trazabilidad (Caso de uso ↔ Requisitos)

Esta matriz evidencia la **relación entre cada caso de uso y los requisitos** que
lo sustentan:

| Caso de uso | Requisitos relacionados |
|---|---|
| UC-01 Registro matutino | RF-04, RF-05, RF-14, RNF-02 |
| UC-02 Coach y reframe | RF-07, RF-08, RF-09, RNF-03 |
| UC-03 Gamificación 3D | RF-01, RF-02, RF-03, RF-06, RNF-01, RNF-05 |
| UC-04 Mindfulness háptico | RF-15, RNF-07 |
| UC-05 Onboarding | RF-11, RF-12 |
| UC-06 Analíticas | RF-02, RF-10 |

### 3.3 Descripción del caso de uso central (UC-03)

**UC-03 — Renderizado, gamificación y degradación del ecosistema 3D**

- **Precondición:** el usuario tiene al menos un hábito registrado.
- **Flujo principal:**
  1. El usuario marca un hábito como completado.
  2. El sistema registra el cumplimiento del día (RF-02).
  3. El motor de gamificación recalcula salud (consistencia de 3 días) y
     crecimiento (esfuerzo de 7 días) del bioma (RF-03).
  4. La escena 3D se vuelve a renderizar reflejando el nuevo estado.
- **Flujo alternativo:** si el usuario abandona hábitos, la salud y el
  crecimiento descienden y el bioma se degrada visualmente.
- **Postcondición:** el estado del bioma queda persistido y refleja el
  comportamiento real del usuario.

---

## 4. Especificaciones de usabilidad

### 4.1 Criterios y métricas objetivo

| Criterio | Métrica objetivo | Método de evaluación |
|---|---|---|
| Adopción del diario matutino (14 días) | ≥ 65 % | Analítica de uso |
| Registro de un hábito | ≤ 2 toques / < 10 s | Prueba cronometrada |
| Retención a 30 días | ≥ 40 % (industria ≈ 25 %) | Analítica de uso |
| Satisfacción de usuario (SUS) | ≥ 68 puntos | Cuestionario SUS |
| Violaciones de accesibilidad críticas | 0 | Auditoría (axe-core) |

### 4.2 Decisiones de usabilidad aplicadas en el prototipo

- **Entrada multimodal (RF-14):** el diario acepta voz, texto y mood cards como
  alternativas equivalentes, reduciendo la barrera de entrada y cubriendo
  usuarios con distintas capacidades.
- **Feedback inmediato:** marcar un hábito actualiza el bioma al instante,
  reforzando el bucle de gamificación.
- **Consistencia visual:** las métricas de las analíticas usan el mismo motor que
  alimenta el bioma, evitando incoherencias entre lo que el usuario ve en 3D y
  los números.
- **Navegación clara:** acceso directo a todas las pantallas desde la home.
- **Tolerancia a fallos:** si el navegador no soporta dictado, se ofrece texto y
  cartas automáticamente.

---

## 5. Estado del prototipo funcional (≥ 70%)

| # | Pantalla | Ruta | Estado |
|---|---|---|---|
| 01 | Onboarding | `/onboarding` | ✅ |
| 02 | Diario matutino | `/diario` | ✅ |
| 03 | Bioma principal | `/` | ✅ |
| 04 | Coach de productividad | `/coach` | ✅ |
| 05 | Hábitos (panel) | `/` | ✅ |
| 06 | Analíticas | `/analiticas` | ✅ |
| 07 | Configuración | `/configuracion` | ✅ |
| 08 | Mindfulness | `/mindfulness` | ✅ |
| 09 | Reencuadre cognitivo | `/reframe` | ✅ |

**9 de 9 pantallas programadas (100%)**, superando el 70% requerido. Los tres
módulos del proyecto (Gamificación, Personalización continua, Ayuda contextual)
están funcionando, y el código está publicado en GitHub.

---

## 6. Arquitectura del prototipo

Organización **por features** (screaming architecture), con la lógica de dominio
pura separada de la interfaz y del acceso a datos.

- **Frontend/Backend:** Next.js 16 (App Router + Server Actions), TypeScript.
- **3D:** Three.js + react-three-fiber.
- **Persistencia:** Prisma 7 + SQLite en desarrollo (migrable a PostgreSQL).
- **LLM:** Google Gemini detrás de una interfaz de agentes intercambiable
  (patrón Strategy): si no hay clave de API, un stub determinista mantiene la app
  funcional; con clave, los agentes pasan a IA real sin cambiar el resto del código.

---

## 7. Conclusión y próximos pasos

El prototipo cumple y supera el avance exigido para la PC03: las tres interfaces
obligatorias y los tres módulos están implementados y funcionando, con código
limpio publicado. Los próximos pasos hacia el producto final incluyen: auditoría
formal de accesibilidad (WCAG AA), optimización responsive para móvil, pruebas de
usabilidad con usuarios reales y persistencia en PostgreSQL para producción.

---
