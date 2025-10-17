
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 9090;

// Objeto para almacenar las lecturas, organizado por sensorId.
// Ejemplo: { "sensor-01": [lectura1, lectura2], "sensor-02": [...] }
let readingsBySensor = {};
const MAX_READINGS_PER_SENSOR = 100;

// Endpoint para que los dispositivos Arduino envíen datos
app.get('/api/readings', (req, res) => {
  const { ppm, raw, rs, level, sensorId = 'main_sensor' } = req.query; // Se añade sensorId, con un valor por defecto

  if (ppm && raw && rs && level) {
    const newReading = {
      sensorId, // Se incluye el ID del sensor en la lectura
      ppm: parseFloat(ppm),
      raw: parseInt(raw),
      rs: parseFloat(rs),
      level: level,
      timestamp: new Date(),
    };

    // Si es la primera vez que vemos este sensor, inicializamos su array
    if (!readingsBySensor[sensorId]) {
      readingsBySensor[sensorId] = [];
    }

    // Añadir la nueva lectura y mantener solo las últimas N
    readingsBySensor[sensorId].unshift(newReading);
    readingsBySensor[sensorId] = readingsBySensor[sensorId].slice(0, MAX_READINGS_PER_SENSOR);

    // Enviar la nueva lectura a todos los clientes WebSocket conectados
    // El payload ahora contiene el sensorId, para que el frontend sepa qué actualizar
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'new_reading', payload: newReading }));
      }
    });

    console.log(`Lectura recibida de [${sensorId}]:`, newReading);
    res.status(200).send('OK');
  } else {
    res.status(400).send('Faltan parámetros');
  }
});

// Endpoint para obtener el historial de lecturas (ahora también filtra por sensor)
app.get('/api/history', (req, res) => {
  const { startDate, endDate, sensorId = 'main_sensor' } = req.query;
  
  const sensorHistory = readingsBySensor[sensorId] || [];
  let filteredReadings = sensorHistory;

  if (startDate || endDate) {
    try {
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      filteredReadings = sensorHistory.filter(reading => {
        const readingDate = new Date(reading.timestamp);
        return (!start || readingDate >= start) && (!end || readingDate <= end);
      });
    } catch (error) {
      // Ignorar fechas inválidas y devolver el historial completo del sensor
    }
  }
  res.json(filteredReadings);
});

// Manejo de conexiones WebSocket
wss.on('connection', (ws) => {
  console.log('Cliente WebSocket conectado');

  // Enviar todo el historial de todos los sensores al nuevo cliente
  ws.send(JSON.stringify({ type: 'history', payload: readingsBySensor }));

  ws.on('close', () => {
    console.log('Cliente WebSocket desconectado');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});
