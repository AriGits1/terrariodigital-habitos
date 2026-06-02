# Mi Aporte Personal — PC03



---

## Resumen de mi aporte

En esta entrega me encargué de la **arquitectura del sistema**, la **navegación
entre pantallas** y los casos de uso **UC-01 (registro matutino)** y **UC-02
(coach y reencuadre)**, en continuidad con mi rol desde la PC02 (análisis PACT y
arquitectura).

## Actividades realizadas

- Definí la **arquitectura por features** del proyecto (separación de lógica de
  dominio, interfaz y acceso a datos).
- Diseñé la **interfaz de agentes intercambiable** (patrón Strategy) que permite
  usar un stub o Google Gemini sin cambiar el resto del código.
- Implementé el flujo de **navegación** entre las nueve pantallas.
- Trabajé en el **diario matutino** (UC-01) y en el **Coach / reencuadre** (UC-02).

## Componentes en los que trabajé

- `src/features/agents/` — contrato de agentes, stub y Gemini, factory.
- `src/features/coach/`, `src/features/reframe/` — ayuda contextual.
- `src/app/page.tsx` — navegación de la home.
- Configuración de **Prisma** y el modelo de datos.
