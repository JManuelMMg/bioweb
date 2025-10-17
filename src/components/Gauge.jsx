
import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const getPpmColor = (ppm) => {
  if (ppm < 150) return '#4caf50'; // Normal (Verde)
  if (ppm < 300) return '#ffc107'; // Atención (Ámbar)
  if (ppm < 600) return '#f44336'; // Peligro (Rojo)
  return '#b71c1c'; // Crítico (Rojo Oscuro)
};

const Gauge = ({ ppm }) => {
  const color = getPpmColor(ppm);
  const maxPpm = 1000; // Un valor máximo razonable para la visualización

  return (
    <div className="gauge-container">
      <CircularProgressbar
        value={ppm}
        maxValue={maxPpm}
        text={`${Math.round(ppm)}`}
        styles={buildStyles({
          rotation: 0.75,
          strokeLinecap: 'butt',
          textSize: '16px',
          pathTransitionDuration: 0.5,
          pathColor: color,
          textColor: color,
          trailColor: '#d6d6d6',
          backgroundColor: '#3e98c7',
        })}
      />
      <div style={{ textAlign: 'center', marginTop: '10px', color: '#fff' }}>PPM</div>
    </div>
  );
};

export default Gauge;
