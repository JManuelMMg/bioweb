
# Proyecto: Dashboard Multi-Sensor de Gas en Tiempo Real

## Visión General

El objetivo de este proyecto es crear una aplicación web escalable que funcione como un **centro de monitoreo en tiempo real** para múltiples sensores de gas (MQ-2) conectados a dispositivos Arduino (ESP8266). La aplicación presenta un dashboard dinámico que se adapta automáticamente a los sensores activos, ofreciendo visualizaciones detalladas tanto en tiempo real como históricas para cada dispositivo.

## Arquitectura y Características Implementadas

### Frontend: Dashboard Interactivo (React)

*   **Dashboard Multi-Sensor Dinámico:**
    *   La interfaz principal muestra una **parrilla de tarjetas (`SensorCard`)**, donde cada tarjeta representa un sensor único que está enviando datos.
    *   El sistema es **auto-configurable**: detecta nuevos sensores (`sensorId`) y renderiza su tarjeta correspondiente de forma automática.

*   **Tarjeta de Sensor (`SensorCard`):** Cada tarjeta es un micro-dashboard que contiene:
    *   **Identificador del Sensor:** Muestra claramente el `sensorId` (ej. "Sensor-Comedor").
    *   **Medidor (Gauge) de PPM:** Un medidor circular para la lectura de Partes por Millón más reciente.
    *   **Gráfica de Líneas en Tiempo Real:** Una gráfica (`recharts`) que visualiza las últimas 20 lecturas, permitiendo observar fluctuaciones y tendencias inmediatas.
    *   **Feedback Visual de Riesgo:** La propia tarjeta cambia de color sutilmente según su nivel de riesgo actual.

*   **Alerta Visual Global:**
    *   El color de fondo de toda la aplicación se sincroniza con el sensor que presenta el **nivel de riesgo más alto**, asegurando que la alerta más crítica siempre sea visible de un vistazo.

*   **Historial de Mediciones Avanzado y Filtrable:**
    *   **Selector de Sensor:** Se ha añadido un menú desplegable que permite al usuario **seleccionar de qué sensor desea ver el historial detallado**.
    *   **Gráfica de Historial por Sensor:** La gran gráfica de barras animada muestra el historial del sensor seleccionado, con barras coloreadas por riesgo y tooltips interactivos.
    *   **Tabla de Datos por Sensor:** La tabla de datos también se actualiza para mostrar únicamente las lecturas del sensor elegido.

*   **Análisis y Exportación de Datos:**
    *   **Filtrado por Fechas:** Funcionalidad completa para filtrar los datos del sensor seleccionado por un rango de fechas.
    *   **Exportación de Informes (PDF/Texto):** Permite generar informes (en PDF o texto) del historial del sensor que se esté visualizando.

### Backend: Servidor Multi-Tenencia (Node.js)

*   **API y WebSocket Multi-Sensor:**
    *   El endpoint `/api/readings` y la comunicación por WebSocket ahora procesan y transmiten un `sensorId` con cada lectura.
    *   El servidor gestiona un objeto `readingsBySensor` que almacena los historiales de cada sensor de forma separada y organizada.
*   **Historial por Sensor:** El endpoint `/api/history` ha sido optimizado para servir el historial de un `sensorId` específico, soportando también el filtrado por fechas sobre esos datos.

### Firmware del Dispositivo (Arduino/ESP8266)

*   **Identificación Única:** El código del firmware debe ser configurado con un `sensorId` único para cada dispositivo físico antes de su despliegue.
*   **Características de Robustez:**
    *   **Calibración Automática con Memoria (EEPROM):** Asegura mediciones precisas a lo largo del tiempo.
    *   **Reconexión Automática de Wi-Fi:** Garantiza la operación continua del sensor.
    *   **Lecturas Estabilizadas:** Promedia lecturas para reducir el ruido y aumentar la fiabilidad.

## Plan de Desarrollo (Completado)

*   **Refactorización a Multi-Sensor:**
    *   Actualizado el backend (Node.js) para manejar datos por `sensorId`.
    *   Reconstruido el frontend (React) para soportar un dashboard dinámico con tarjetas por sensor.
    *   Creados los nuevos componentes `SensorCard.jsx` y `RealtimeLineChart.jsx`.
    *   Añadido el selector de sensor en la sección de historial.
*   **Visualización de Datos:**
    *   Implementada la gráfica de líneas en tiempo real dentro de cada tarjeta de sensor.
*   **Documentación:**
    *   Actualizado este `blueprint.md` para reflejar la nueva arquitectura multi-sensor del proyecto.
