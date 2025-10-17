
import React from 'react';
import Gauge from './Gauge';
import RealtimeLineChart from './RealtimeLineChart';
import './SensorCard.css';

const SensorCard = ({ sensorId, readings, currentPPM, level }) => {
  // Las últimas 20 lecturas para la gráfica en tiempo real
  const recentReadings = readings.slice(0, 20);

  return (
    <div className={`sensor-card level-bg-${level ? level.toLowerCase() : 'normal'}`}>
      <h3 className="sensor-title">{sensorId}</h3>
      <div className="card-content">
        <div className="gauge-container-card">
            <Gauge value={currentPPM} />
        </div>
        <div className="realtime-chart-container">
            <RealtimeLineChart data={recentReadings} level={level} />
        </div>
      </div>
    </div>
  );
};

export default SensorCard;
