<div align="center">

# 🌿 Terrario Digital de Hábitos y Bienestar

**CC451 — Interacción Humano Computador · PC02 · Grupo 1**  
Universidad Nacional de Ingeniería · Lima, Perú · 2026

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Estado-En%20desarrollo-yellow.svg)]()
[![HCI](https://img.shields.io/badge/Curso-CC451%20HCI-blue.svg)]()

</div>

---

## 📋 Descripción del Proyecto

**Terrario Digital** es una aplicación móvil inteligente donde los hábitos diarios del usuario construyen un ecosistema 3D vivo. Completar tareas hace crecer la flora; abandonarlas genera degradación visual progresiva. El bioma (bosque, desierto, jardín japonés) se adapta automáticamente al perfil emocional del usuario detectado por inteligencia artificial.

### Problema que resuelve

Las apps de productividad tradicionales fallan porque:
- No generan consecuencias visibles cuando el usuario las abandona
- Las listas de pendientes generan ansiedad cognitiva en lugar de motivación
- Ninguna app combina tracking de hábitos con análisis emocional real

### Propuesta de valor

| Característica | Descripción |
|---|---|
| 🌿 **Bioma 3D adaptativo** | Ecosistema vivo que crece o se degrada según tus hábitos |
| 🎙️ **Diario de voz matutino** | Input multimodal: voz, texto o mood cards |
| 🤖 **Dos agentes LLM** | Terapeuta de Bienestar + Coach de Productividad |
| 📳 **Interfaces hápticas** | Guía rítmica durante mindfulness, alertas de burnout |
| ♿ **Accesibilidad WCAG AA** | Diseñado para usuarios con discapacidad visual, motriz y auditiva |

---

## 👥 Equipo — Grupo 1

| Integrante | Rol en el proyecto |
|---|---|
| **Cinver Espinoza Valera** | Casos de uso UC-03 al UC-06 · Alternativas de diseño · Diagrama de Gantt · Módulo háptico |
| **Martin Centeno Leon** | Análisis PACT · Casos de uso UC-01 y UC-02 · Arquitectura del sistema · Diagrama de navegación |
| **Ariana Mercado Taype** | Entrevistas con usuarios · Stakeholders · Requerimientos · Apps similares · Criterios de usabilidad · Prototipado Figma |

---

## 🏗️ Arquitectura de la Aplicación

```
┌─────────────────────────────────────────────────────┐
│                   CLIENTE MÓVIL                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Bioma 3D │  │  Voz/STT │  │  UI Accesible     │  │
│  │  (LOD)   │  │  Input   │  │  WCAG AA          │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
└─────────────────────────┬───────────────────────────┘
                          │ API REST / WebSocket
┌─────────────────────────▼───────────────────────────┐
│                    BACKEND                          │
│  ┌─────────────────────┐  ┌─────────────────────┐   │
│  │ Terapeuta de        │  │ Coach de            │   │
│  │ Bienestar (LLM)     │  │ Productividad (LLM) │   │
│  │ · Inferencia mood   │  │ · NLP semántico     │   │
│  │ · Detección burnout │  │ · Detección procras │   │
│  │ · Mindfulness       │  │ · Reframes cogn.    │   │
│  └─────────────────────┘  └─────────────────────┘   │
│  ┌─────────────────────────────────────────────┐     │
│  │ Motor de Bioma · Cron Job · Audit Log       │     │
│  └─────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
```

### Stack tecnológico (planificado)

| Capa | Tecnología |
|---|---|
| Frontend móvil | Flutter |
| Backend | Laravel 11 + PostgreSQL |
| Motor 3D | Three.js / Babylon.js |
| LLM | OpenAI GPT-4o / Gemini |
| STT | Whisper API / Google STT |
| Haptics | Core Haptics (iOS) + Vibration API (Android) |
| Infraestructura | Cloud (TBD) |

---

## 📱 Pantallas del Proyecto

El prototipo de fidelidad media incluye 9 pantallas:

| # | Pantalla | Caso de Uso |
|---|---|---|
| 01 | Splash / Onboarding | UC-05 |
| 02 | Diario Matutino | UC-01 |
| 03 | Bioma Principal (Home) | UC-03 |
| 04 | Coach de Productividad | UC-02 |
| 05 | Vista de Hábitos | UC-05 |
| 06 | Analíticas Semanales | UC-06 |
| 07 | Configuración / Perfil | RF-17 |
| 08 | Módulo de Mindfulness (modal) | UC-04 |
| 09 | Card de Reframe (modal) | UC-02 |

🔗 **Prototipo navegable en Figma:** [Ver prototipo](https://www.figma.com/design/bEQBU5VZhY4EPSP2lylNCM/PC2)

---

## 📦 Estructura del Repositorio

```
terrario-digital/
│
├── 📄 README.md                          ← Este archivo
├── 📄 LICENSE                            ← Licencia MIT
│
├── 📁 docs/                              ← Documentación del proyecto
│   ├── CC451-PCL02-Proy-CORREGIDO.docx  ← Reporte PC02 completo
│   ├── mi-aporte-Cinver-Espinoza.docx   ← Aporte personal Cinver
│   ├── mi-aporte-Martin-Centeno.docx    ← Aporte personal Martín
│   └── mi-aporte-Ariana-Mercado.docx    ← Aporte personal Ariana
│
├── 📁 design/                            ← Diseño y prototipado
│   ├── wireframes/                       ← 9 wireframes SVG
│   │   ├── 01_Onboarding.svg
│   │   ├── 02_Diario_Matutino.svg
│   │   ├── 03_Bioma_Principal.svg
│   │   ├── 04_Coach_Productividad.svg
│   │   ├── 05_Vista_Habitos.svg
│   │   ├── 06_Analiticas.svg
│   │   ├── 07_Configuracion.svg
│   │   ├── 08_Mindfulness_Modal.svg
│   │   └── 09_Reframe_Modal.svg
│   ├── wireflow_terrario.html            ← Diagrama de navegación interactivo
│   └── presentacion_pc02_v3.html        ← Presentación del proyecto
│
└── 📁 src/                               ← Código fuente (en desarrollo)
    └── .gitkeep
```

---

## 📐 Requerimientos Principales

### Funcionales (selección)

| ID | Descripción | Prioridad |
|---|---|---|
| RF-01 | CRUD de hábitos con periodicidad y peso relativo | Alta |
| RF-04 | Captura de diario de voz (máx. 60s) | Alta |
| RF-05 | Inferencia de estado de ánimo mediante LLM | Alta |
| RF-08 | Procesamiento de comandos semánticos ("regar la tesis") | Alta |
| RF-14 | Input multimodal: voz + texto + mood cards (accesibilidad) | Alta |
| RF-15 | Retroalimentación háptica sincronizada con mindfulness | Media |

### No Funcionales (selección)

| ID | Descripción | Valor objetivo |
|---|---|---|
| RNF-01 | Latencia de actualización del bioma | < 1.5 segundos |
| RNF-03 | Tiempo de respuesta del Coach (NLP) | < 2 segundos |
| RNF-05 | Rendimiento del motor 3D | ≥ 30 FPS gama media |
| RNF-07 | Cumplimiento de accesibilidad | WCAG 2.1 nivel AA |

---

## 🗺️ Casos de Uso

| UC | Nombre | Actor Principal |
|---|---|---|
| UC-01 | Registro Multimodal de Estado Matutino | Usuario |
| UC-02 | Orquestación Semántica y Detección de Procrastinación | Usuario |
| UC-03 | Renderizado, Gamificación y Degradación del Ecosistema 3D | Usuario + Sistema |
| UC-04 | Despliegue de Intervenciones de Mindfulness y Alertas Hápticas | Terapeuta LLM |
| UC-05 | Onboarding e Inicialización del Perfil | Usuario (nuevo) |
| UC-06 | Visualización de Analíticas y Métricas Semanales | Usuario |

---

## 🎯 Criterios de Usabilidad

| Criterio | Valor objetivo | Método |
|---|---|---|
| Adopción diario matutino (14 días) | ≥ 65% | Analytics |
| Registro de hábito | ≤ 2 taps / < 10 segundos | Prueba cronometrada |
| Retención a 30 días | ≥ 40% (industria: 25%) | Analytics |
| SUS Score | ≥ 68 puntos | Cuestionario |
| Violaciones WCAG | 0 críticas | Auditoría axe-core |

---

## 📅 Cronograma PC02 (Semanas 5–7)

| Semana | Tareas principales | Responsable |
|---|---|---|
| Semana 5 | Entrevistas, PACT, stakeholders, requerimientos, casos de uso | Ariana + Martín |
| Semana 6 | Arquitectura, alternativas de diseño, Gantt, repo, documentación | Martín + Cinver |
| Semana 7 | Prototipado Figma, diagrama de navegación, presentación | Ariana + Martín + Equipo |

---

## ♿ Accesibilidad

El proyecto contempla tres grupos de usuarios con discapacidad desde el diseño inicial:

- **Discapacidad visual:** Audiodescripción dinámica del bioma (TTS), paletas WCAG AA, cambios morfológicos en lugar de solo color
- **Discapacidad motriz:** Navegación por comandos de voz, touch targets ≥ 48×48dp, compatibilidad con Switch Access
- **Discapacidad auditiva/habla:** Mood cards como alternativa al diario de voz, closed captions, retroalimentación háptica diferenciada

---

## 📄 Licencia

Este proyecto está licenciado bajo la **Licencia MIT**. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

<div align="center">

**Universidad Nacional de Ingeniería · Facultad de Ciencias**  
CC451 Interacción Humano Computador · 2026  
Grupo 1: Cinver Espinoza · Martin Centeno · Ariana Mercado

</div>
