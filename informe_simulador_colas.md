# Informe de Desarrollo: Simulador Universal de Sistemas de Colas

**Versión:** 1  
**Asignatura:** Simulación  

### Integrantes del Equipo
* **Peralta, Juan José** – EISI530
* **Paredes, Florencia Aylen** - EISI1144
* **Luna López, Cristian Emanuel** - AISI 314

---

## 1. Introducción y Objetivo del Proyecto

El presente proyecto consistió en el diseño, desarrollo e implementación de un **Motor de Simulación de Eventos Discretos** desarrollado enteramente en tecnologías web estándar (HTML5, CSS3, JavaScript - ES6).

El objetivo principal fue dar solución computacional a los cinco problemas planteados en la guía de Trabajos Prácticos de Simulación, superando el enfoque de *"un script por problema"* mediante la creación de un **entorno universal, paramétrico y escalable**. Este motor es capaz de:
* Procesar listas de eventos futuros (FEL - *Future Event List*).
* Manejar múltiples entidades de forma simultánea (Servidores y Colas).
* Aplicar distribuciones estadísticas a variables de tiempo de forma dinámica.

---

## 2. Logros Obtenidos (Estado a la Fecha de Entrega)

Hasta la presente fecha de entrega, el repositorio cuenta con una versión estable y completamente funcional que satisface los requerimientos teóricos y gráficos solicitados. Los hitos técnicos logrados se dividen en dos áreas principales:

### A. Arquitectura del Motor de Simulación
* **Motor de Eventos Discretos:** Se implementó un reloj de simulación que avanza mediante "saltos" hacia el próximo evento inminente, optimizando el rendimiento computacional frente a los avances por diferenciales de tiempo fijos.
* **Generadores Estadísticos:** El motor matemático abandonó el uso exclusivo de constantes para incorporar variabilidad real mediante distribuciones:
  * Constante
  * Uniforme
  * Normal (implementada mediante la transformada de Box-Muller).
* **Orientación a Objetos Modular:** El sistema divide las responsabilidades en clases independientes (`Motor`, `Servidor`, `Cola`, `Renderizador`, `Menu`, `TablaDatos`). Esto permite instanciar $N$ cantidad de servidores y colas en tiempo de ejecución sin necesidad de alterar el código base.

### B. Interfaz y Experiencia de Usuario (UI/UX)
* **Menú de Configuración Dinámica:** El usuario puede configurar por completo las reglas del sistema (tiempos, reloj inicial, número de servidores, colas y tolerancias) desde la interfaz gráfica antes de iniciar la simulación, evitando la modificación manual de variables en el código fuente.
* **Simulación Paso a Paso o Completa:** Permite auditar de forma interactiva el comportamiento del sistema evento por evento con fines educativos, o bien calcular miles de iteraciones en segundos hasta alcanzar la hora límite definida.
* **Representación Visual Dinámica:** Se integró un gráfico mediante el elemento `<canvas>` que anima en tiempo real el estado del sistema. Además, se complementó con mini-gráficos CSS inyectados directamente en la tabla de datos, replicando con exactitud la notación gráfica manual solicitada por la cátedra.

---

## 3. Cobertura de la Guía de Trabajos Prácticos

El diseño universal del simulador ha permitido configurar de manera exitosa los 5 problemas de la guía original sin alterar el núcleo del sistema:

* **Problema No. 1 (Cola Simple):** Se configuraron los eventos básicos de llegadas y fines de servicio con tiempos constantes, respetando estrictamente el orden FIFO (*First In, First Out*).
* **Problema No. 2 (Descansos):** Se incorporaron los eventos temporizados de *"Salida del Servidor"* y *"Llegada del Servidor"*. El sistema inhabilita al servidor de forma lógica y visual (representado por un semicírculo rojo) durante el tiempo de descanso.
* **Problema No. 3 (Abandono de Cola):** Se integró un parámetro de *"Tolerancia"*. Las colas rastrean internamente el ID y el tiempo de llegada de cada cliente individual. Si el cliente supera su tiempo máximo de espera sin ser atendido, se ejecuta un evento de *"Abandono"* y es removido del sistema de forma automática.
* **Problema No. 4 (Prioridades):** El sistema permite crear múltiples colas (ej. *Cola A* y *Cola B*). Al liberarse un puesto, el motor barre las colas activas basándose en su nivel de prioridad para asignar el turno al cliente correcto, manteniendo su flujo regular una vez dentro del Puesto de Servicio.
* **Problema No. 5 (Zona de Seguridad):** Se modeló un sistema de "esclusa" bloqueante. Cuando está activo el tiempo de *"Tránsito"*, el cliente abandona la cola pero el Puesto de Servicio se bloquea lógica y visualmente (representado con una caja punteada **"Z.S."**) hasta que finaliza la transición física del usuario.

---

## 4. Puntos Pendientes y Mejoras en Proceso

La arquitectura actual sienta las bases sólidas para futuras actualizaciones y el repositorio continuará recibiendo mantenimiento preventivo y evolutivo. Las mejoras planificadas incluyen:

* **Módulo de Estadísticas y Métricas:** Agregar funciones lógicas automáticas al finalizar la simulación para calcular y consolidar:
  * Porcentaje de Ocupación del Servidor (Utilización).
  * Tiempo Promedio de Espera en Cola.
  * Longitud Máxima y Promedio de la Cola.
  * Tasa de Abandonos (crucial para el análisis del Problema 3).
* **Nuevas Distribuciones de Probabilidad:** Integrar generadores estadísticos adicionales como la distribución *Exponencial Negativa* (habitual para el modelado de tasas de arribos) y la de *Poisson*.
* **Exportación de Resultados:** Desarrollar un módulo de salida para descargar la tabla histórica en formato `.csv` o Excel, facilitando a los alumnos contrastar y validar la salida del software con sus tablas hechas a mano.
* **Gráficos Analíticos (Dashboards):** Implementar la librería *Chart.js* para renderizar curvas analíticas de acumulación de clientes a lo largo del tiempo acumulado de simulación.
