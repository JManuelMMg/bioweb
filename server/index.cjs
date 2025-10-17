
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 9090;

// Almacenamiento en memoria para las lecturas de cada sensor
const readingsBySensor = {};

// Middleware para parsear JSON (aunque aquí usamos query params)
app.use(express.json());

// Función para retransmitir a todos los clientes conectados
const broadcast = (data) => {
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// Endpoint para que los ESP envíen sus datos vía HTTP GET
app.get('/api/readings', (req, res) => {
  // Extraemos los datos de los query parameters
  const { ppm, raw, rs, level } = req.query;

  // Intentamos obtener un sensorId de la petición, si no, lo creamos a partir de la IP.
  // Esto permite que varios sensores funcionen sin necesidad de hardcodear un ID.
  let sensorId = req.query.sensorId || `sensor-${req.ip}`;

  // Validamos que el PPM exista, si no, es una mala petición.
  if (ppm === undefined || ppm === null) {
    return res.status(400).json({ error: 'El parámetro PPM es requerido.' });
  }

  // Creamos el objeto de la nueva lectura
  const newReading = {
    sensorId,
    ppm: parseFloat(ppm),
    raw: parseInt(raw, 10),
    rs: parseFloat(rs),
    level: level || 'desconocido',
    timestamp: new Date().toISOString(),
  };

  // Si es la primera lectura de este sensor, inicializamos su array
  if (!readingsBySensor[sensorId]) {
    readingsBySensor[sensorId] = [];
  }

  // Añadimos la nueva lectura al principio del array (para que esté la más reciente primero)
  readingsBySensor[sensorId].unshift(newReading);

  // Limitamos el historial en memoria a las últimas 200 lecturas por sensor
  if (readingsBySensor[sensorId].length > 200) {
    readingsBySensor[sensorId].pop();
  }

  // Retransmitimos la nueva lectura a todos los clientes WebSocket (el frontend)
  broadcast({
    type: 'new_reading',
    payload: newReading,
  });

  // Respondemos al ESP con éxito
  res.status(200).json({ message: 'Lectura recibida', data: newReading });
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Cliente WebSocket conectado');

  // Al conectarse un nuevo cliente, le enviamos todo el historial disponible
  ws.send(JSON.stringify({
    type: 'history',
    payload: readingsBySensor,
  }));

  ws.on('close', () => {
    console.log('Cliente WebSocket desconectado');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});
