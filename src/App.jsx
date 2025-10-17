
import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import SensorCard from './components/SensorCard';
import History from './components/History';
import './App.css';

// Objeto de configuración para los niveles de riesgo
const levels = {
  NORMAL: { limit: 400, color: '#2c5c2d', label: 'NORMAL' },
  ATENCION: { limit: 600, color: '#b8860b', label: 'ATENCION' },
  PELIGRO: { limit: 1000, color: '#b22222', label: 'PELIGRO' },
  CRITICO: { limit: Infinity, color: '#8b0000', label: 'CRITICO' },
};

const getGasLevel = (ppm) => {
  if (ppm < levels.NORMAL.limit) return levels.NORMAL;
  if (ppm < levels.ATENCION.limit) return levels.ATENCION;
  if (ppm < levels.PELIGRO.limit) return levels.PELIGRO;
  return levels.CRITICO;
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

  const getHighestRiskLevel = () => {
      let highestLevel = levels.NORMAL;
      Object.values(readingsBySensor).forEach(readings => {
          if (readings && readings.length > 0) {
              const currentLevel = getGasLevel(readings[0].ppm);
              if (currentLevel.limit > highestLevel.limit) {
                  highestLevel = currentLevel;
              }
          }
      });
      return highestLevel;
  };

  const overallLevel = getHighestRiskLevel();
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
