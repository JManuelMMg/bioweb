
import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import SensorCard from './components/SensorCard';
import History from './components/History';
import AlertNotification from './components/AlertNotification'; // Importamos el nuevo componente
import './App.css';

const levels = {
  SIN_PRODUCCION: { limit: 150, color: '#b22222', label: 'SIN PRODUCCION' },
  PROD_BAJA: { limit: 300, color: '#b8860b', label: 'PROD. BAJA' },
  PROD_MEDIA: { limit: 600, color: '#6B8E23', label: 'PROD. MEDIA' },
  PROD_ALTA: { limit: Infinity, color: '#2c5c2d', label: 'PROD. ALTA' },
};

const getGasLevel = (ppm) => {
  if (ppm < levels.SIN_PRODUCCION.limit) return levels.SIN_PRODUCCION;
  if (ppm < levels.PROD_BAJA.limit) return levels.PROD_BAJA;
  if (ppm < levels.PROD_MEDIA.limit) return levels.PROD_MEDIA;
  return levels.PROD_ALTA;
};

function App() {
  const [readingsBySensor, setReadingsBySensor] = useState({});
  const [connected, setConnected] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedSensorForHistory, setSelectedSensorForHistory] = useState('');
  const [alert, setAlert] = useState({ show: false, message: '', level: null });

  const historyRef = useRef();

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket('ws://localhost:9090');

      ws.onopen = () => setConnected(true);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'history') {
          setReadingsBySensor(data.payload);
          if (!selectedSensorForHistory) {
            const firstSensorId = Object.keys(data.payload)[0];
            if (firstSensorId) setSelectedSensorForHistory(firstSensorId);
          }
        } else if (data.type === 'new_reading') {
          const { sensorId, ppm } = data.payload;
          setReadingsBySensor(prev => ({
            ...prev,
            [sensorId]: [data.payload, ...(prev[sensorId] || [])],
          }));

          // Lógica para mostrar la alerta
          const currentLevel = getGasLevel(ppm);
          if (currentLevel.label === 'SIN PRODUCCION') {
            setAlert({ 
                show: true, 
                message: `¡Atención! El sensor ${sensorId} no detecta producción de gas.`,
                level: currentLevel
            });
          }

          if (!selectedSensorForHistory) {
            setSelectedSensorForHistory(sensorId);
          }
        }
      };

      ws.onclose = () => {
        setConnected(false);
        setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error('Error en WebSocket:', error);
        ws.close();
      };
    };

    connect();
  }, [selectedSensorForHistory]);

  const handleHistoryExport = async () => {
    const element = historyRef.current;
    if (!element) return;

    const canvas = await html2canvas(element, { backgroundColor: '#1a1a1a', scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    pdf.addImage(imgData, 'PNG', 0, 15, pdfWidth, 0);
    pdf.save(`historial-gas-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };
  
  const handleTextExport = () => {
    const historyData = readingsBySensor[selectedSensorForHistory] || [];
    let textContent = "Historial de Mediciones de Gas\n\n";
    historyData.forEach(r => {
        textContent += `Fecha: ${format(new Date(r.timestamp), 'Pp')} | PPM: ${r.ppm.toFixed(1)} | Nivel: ${getGasLevel(r.ppm).label}\n`;
    });
    const blob = new Blob([textContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historial-gas-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    link.click();
  };
  
  const sensorIds = Object.keys(readingsBySensor);

  return (
    // El fondo ahora es estático
    <div className="App">
      <header className="App-header">
        <h1>Dashboard de Monitoreo de Gas</h1>
        <div className="status-light" style={{ backgroundColor: connected ? '#2ecc71' : '#e74c3c' }} />
        <span style={{ marginLeft: '10px' }}>{connected ? 'Conectado' : 'Desconectado'}</span>
      </header>

      <main>
        <div className="dashboard-container">
            {sensorIds.length > 0 ? (
                sensorIds.map(sensorId => {
                    const readings = readingsBySensor[sensorId];
                    const currentReading = readings && readings.length > 0 ? readings[0] : { ppm: 0 };
                    const level = getGasLevel(currentReading.ppm);
                    return (
                        <SensorCard 
                            key={sensorId} 
                            sensorId={sensorId}
                            readings={readings}
                            currentPPM={currentReading.ppm}
                            level={level.label}
                        />
                    )
                })
            ) : (
                <p className='loading-sensors'>Esperando a que los sensores se conecten...</p>
            )}
        </div>

        <div ref={historyRef} className="history-section-wrapper">
          <div className="history-controls">
              <div className="sensor-selector-container">
                <label htmlFor="sensor-select">Ver historial de:</label>
                <select 
                  id="sensor-select"
                  value={selectedSensorForHistory}
                  onChange={e => setSelectedSensorForHistory(e.target.value)}
                >
                  {sensorIds.map(id => <option key={id} value={id}>{id}</option>)
                  }
                </select>
              </div>
              <DatePicker selected={startDate} onChange={date => setStartDate(date)} placeholderText="Fecha de inicio" />
              <DatePicker selected={endDate} onChange={date => setEndDate(date)} placeholderText="Fecha de fin" />
              <button onClick={handleHistoryExport}>Exportar a PDF</button>
              <button onClick={handleTextExport}>Exportar a Texto</button>
          </div>
          <History readings={readingsBySensor[selectedSensorForHistory] || []} />
        </div>
      </main>

      {/* Aquí renderizamos la notificación de alerta */}
      {alert.show && (
        <AlertNotification 
            message={alert.message}
            level={alert.level}
            onClose={() => setAlert({ show: false, message: '', level: null })}
        />
      )}
    </div>
  );
}

export default App;
