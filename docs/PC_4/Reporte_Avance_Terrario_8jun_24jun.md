# Reporte de avance — Terrario Digital de Hábitos y Bienestar

Periodo: 8 de junio al 24 de junio de 2026
Curso: CC451, Interacción Humano Computador
Equipo: Ariana Mercado, Cinver Espinoza, Martin Centeno

## Contexto

Este reporte cubre el trabajo realizado después de la entrega de la PC03, donde ya teníamos el proyecto base funcionando (bioma 3D, hábitos, diario de voz, agentes de coach y reframe). En esta etapa el foco estuvo en pulir y corregir lo que ya existía, cerrar varios pendientes de UX que habían quedado de la primera versión sugeridas por el docente, y agregar funcionalidades nuevas que faltaban para cumplir con todos los requisitos del curso.

## Semana del 8 de junio

Nos centramos en limpiar varias cosas que estaban a medio terminar desde la primera entrega. El chat del Coach pasó de ser una página aparte a un modal, lo que simplificó bastante la navegación porque ya no había que salir de la pantalla principal para hablar con el agente. También se sacaron las páginas independientes de coach y reframe, ya que ahora viven dentro de componentes reutilizables.

Aparte de eso, se trabajó en:

- Las instrucciones que recibe Gemini y los mensajes de respaldo para cuando no hay conexión con la API.
- La lógica de agregación semanal para el dashboard de analíticas.
- El estado visual de "marchito" en el bioma para cuando un hábito se incumple, además de un wrapper para la escena 3D.
- Un límite de cinco hábitos activos por usuario y el registro semanal de logs.
- Mejoras en la animación de respiración del módulo de mindfulness.
- Ajustes en el flujo de onboarding inicial.
- Pantallas de carga (loading) en todas las rutas principales, para que no se vea la app en blanco mientras carga algo.
- Mejor manejo de errores en el reconocimiento de voz del diario.

Fue básicamente una sesión de poner en orden todo lo que había quedado suelto de la primera versión.

## Semana del 17 de junio

Se realizaron ajustes sobre el bioma y los módulos de bienestar. La colocación de la flora en el terreno 3D se volvió más libre, con un espaciado mínimo entre plantas para que no se amontonen, y se agregó un tooltip que muestra el nombre del hábito al pasar el mouse sobre cada planta.

También se hicieron cambios en:

- El coach, que ahora manda un mensaje automático cuando se marca un hábito, en vez de depender de un bloque de sugerencias fijo. Esto también corrigió un bug donde el historial de chat se duplicaba.
- El diario, restringiendo las mood cards a un registro por día y dejando que el usuario elija entre texto libre o voz.
- El selector de ritmo de respiración en mindfulness, que pasó a un panel lateral colapsable para no ocupar tanto espacio en pantalla.
- Los agentes de IA, donde se sanitizó el historial de conversación, se agregó detección del error 429 (límite de la API alcanzado) y se cambió al modelo gemini-2.5-flash.

También se corrigió un error de tipos en la página del diario que estaba rompiendo el build.

## Semana del 21 de junio

Martin trabajó en la parte de autenticación y personalización, que eran dos pendientes grandes desde la entrega anterior.

Se implementó el sistema de cuentas multiusuario: login, sesiones guardadas en base de datos y un panel de administrador desde donde se pueden crear cuentas nuevas. Antes de esto la aplicación solo tenía un perfil fijo, así que este cambio fue necesario para que cada integrante del equipo (y eventualmente cada usuario real) tenga su propio terrario independiente.

Adicionamos 2 cosas más:

- El motor de personalización continua, que usa un promedio móvil para ir adaptando el orden de las secciones de la app según qué módulos usa más el usuario y cómo viene su estado de ánimo.
- El sistema de visitas entre usuarios, donde se puede entrar al terrario de otra persona y dejarle un mensaje de aliento.

Esto cubrió dos de los requisitos del curso que todavía no estaban implementados: personalización continua e interactividad entre usuarios.

Ariana revisó el comportamiento de los valores que se muestran en pantalla para cuenta nuevas. Se encontró que un perfil recién creado, sin ningún hábito registrado, mostraba 20 por ciento de crecimiento y 80 por ciento de salud, cuando en realidad debería partir del mínimo que calcula el motor de gamificación. Se corrigió el valor tanto en la pantalla principal como en la vista de comunidad, donde se ve el terrario de otros usuarios.

También se revisaron los textos de la interfaz, ya que varias pantallas tenían frases con modismos regionales (voseo) que no correspondían, y se reemplazaron por una redacción más neutra. Se fixearon algunos botones como el de "Felicitación".

El mismo día, Cinver implementó la tienda de semillas con decoraciones interactivas para el terrario, que permite a los usuarios usar las semillas que ganan completando hábitos para comprar elementos decorativos y ubicarlos dentro de su bioma 3D.

Se agregó el botón de mostrar y ocultar contraseña en el formulario de login, se mejoró la visibilidad del saludo principal en la pantalla de inicio y se añadió un mensaje en la tienda explicando cómo conseguir semillas completando hábitos.

En paralelo. Se implementó el sistema de rachas (streaks) por hábito, notificaciones push usando la Web Push API, y un set de herramientas de administrador pensadas para acelerar las pruebas durante el desarrollo, sin tener que esperar días reales para ver cambios en el bioma.

## Estado actual del proyecto

A la fecha, el proyecto cuenta con autenticación multiusuario, motor de personalización continua, gamificación basada en hábitos, módulo social entre usuarios, ayuda contextual mediante agentes de IA, retroalimentación háptica en mindfulness, tienda de decoraciones, sistema de rachas y notificaciones push. La mayoría de los pendientes detectados en revisiones anteriores ya fueron corregidos, y el trabajo de esta última semana se concentró en cerrar inconsistencias entre lo que calculaba el código y lo que realmente se mostraba en pantalla.

## Pendientes de mejora para la siguiente entrega
- Uso del agua enviado por la comunidad.
- Creacion del rio para presentacion en el Bioma 3D.
