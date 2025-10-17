
import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import SensorCard from './components/SensorCard';
import History from './components/History';
import './App.css';

// Objeto de configuración para los niveles de producción del biodigestor
const levels = {
  SIN_PRODUCCION: { limit: 150, color: '#b22222', label: 'SIN PRODUCCION' }, // Rojo - Alerta, no hay producción
  PROD_BAJA:      { limit: 300, color: '#b8860b', label: 'PROD. BAJA' },     // Naranja - Producción baja
  PROD_MEDIA:     { limit: 600, color: '#6B8E23', label: 'PROD. MEDIA' },    // Verde Oliva - Producción saludable
  PROD_ALTA:      { limit: Infinity, color: '#2c5c2d', label: 'PROD. ALTA' },   // Verde Oscuro - Producción óptima
};

// Devuelve el nivel de producción basado en el PPM de gas.
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
  // Para el historial, seleccionamos qué sensor ver
  const [selectedSensorForHistory, setSelectedSensorForHistory] = useState(''); 

  const historyRef = useRef();

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket('ws://localhost:9090');

      ws.onopen = () => {
        setConnected(true);
        console.log('Conectado al servidor WebSocket');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'history') {
          setReadingsBySensor(data.payload);
          // Si no hay un sensor seleccionado para el historial, elegimos el primero que encontremos
          if (!selectedSensorForHistory) {
            const firstSensorId = Object.keys(data.payload)[0];
            if(firstSensorId) setSelectedSensorForHistory(firstSensorId);
          }
        } else if (data.type === 'new_reading') {
          const { sensorId } = data.payload;
          setReadingsBySensor(prevReadings => {
            const newSensorReadings = [data.payload, ...(prevReadings[sensorId] || [])];
            return {
              ...prevReadings,
              [sensorId]: newSensorReadings,
            };
          });
          // Si es el primer sensor en conectarse, lo seleccionamos para el historial
          if (!selectedSensorForHistory) {
            setSelectedSensorForHistory(sensorId);
          }
        }
      };

      ws.onclose = () => {
        setConnected(false);
        console.log('Desconectado. Intentando reconectar en 3 segundos...');
        setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error('Error en WebSocket:', error);
        ws.close();
      };
    };

    connect();
  }, [selectedSensorForHistory]); // Volver a ejecutar si cambia el sensor seleccionado

  const handleHistoryExport = async () => {
    const element = historyRef.current;
    if (!element) return;

    const canvas = await html2canvas(element, { backgroundColor: null, scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 15;

    pdf.setFontSize(20);
    pdf.text('Reporte de Historial de Gas', pdfWidth / 2, 10, { align: 'center' });
    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    pdf.save(`historial-gas-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const handleTextExport = () => {
    const historyData = readingsBySensor[selectedSensorForHistory] || [];
    let textContent = "Historial de Mediciones de Gas\n\n";
    historyData.forEach(r => {
      textContent += `Fecha: ${format(new Date(r.timestamp), 'Pp')} | PPM: ${r.ppm.toFixed(1)} | Nivel: ${r.level}\n`;
    });
    const blob = new Blob([textContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historial-gas-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    link.click();
  };

  // Determina el nivel de alerta general. La alerta se basa en el sensor con la MENOR producción.
  const getOverallAlertLevel = () => {
    // Inicia con el nivel más alto de producción posible.
    let lowestProductionLevel = levels.PROD_ALTA;
    const sensorIds = Object.keys(readingsBySensor);

    // Si no hay sensores o lecturas, por defecto se muestra "SIN PRODUCCION".
    if (sensorIds.length === 0 || sensorIds.every(id => !readingsBySensor[id] || readingsBySensor[id].length === 0)) {
      return levels.SIN_PRODUCCION;
    }

    sensorIds.forEach(sensorId => {
      const readings = readingsBySensor[sensorId];
      if (readings && readings.length > 0) {
        const currentLevel = getGasLevel(readings[0].ppm);
        // Si el nivel actual tiene un límite inferior, significa una producción más baja.
        // Se actualiza para reflejar el estado más crítico (producción más baja).
        if (currentLevel.limit < lowestProductionLevel.limit) {
          lowestProductionLevel = currentLevel;
        }
      }
    });

    return lowestProductionLevel;
  };

  const overallLevel = getOverallAlertLevel();
  const sensorIds = Object.keys(readingsBySensor);

  return (
    <div className="App" style={{ backgroundColor: overallLevel.color }}>
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
    </div>
  );
}

export default App;
