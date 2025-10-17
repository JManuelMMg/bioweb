
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import './RealTimeChart.css';

const RealTimeChart = ({ data }) => {
  // Queremos solo las últimas 30 lecturas para una vista en tiempo real, y en orden cronológico
  const chartData = data.slice(0, 30).map(item => ({
    ...item,
    // Formateamos la hora para que sea corta y clara
    time: new Date(item.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  })).reverse(); // .reverse() para que el tiempo fluya de izquierda a derecha

  // Un Tooltip personalizado para el contexto
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="realtime-tooltip">
          <p className="label">{`Hora: ${label}`}</p>
          <p className="intro">{`PPM: ${payload[0].value.toFixed(1)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="realtime-chart-container">
      <h4>Actividad en Tiempo Real (Últimas 30 lecturas)</h4>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis dataKey="time" stroke="#aaa" tick={{ fontSize: 11 }} />
          <YAxis stroke="#aaa" domain={[0, 'dataMax + 100']} />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Línea de referencia para el nivel de PELIGRO (ej. 400 PPM) */}
          <ReferenceLine y={400} label={{ value: 'Peligro', position: 'insideTopRight', fill: '#FF5722' }} stroke="#FF5722" strokeDasharray="4 4" />
          
          {/* Línea de referencia para el nivel de ATENCION (ej. 200 PPM) */}
          <ReferenceLine y={200} label={{ value: 'Atención', position: 'insideTopRight', fill: '#FFC107' }} stroke="#FFC107" strokeDasharray="4 4" />

          <Line 
            type="monotone" 
            dataKey="ppm" 
            stroke="#88ddff" 
            strokeWidth={2} 
            dot={false}
            isAnimationActive={true}
            animationDuration={300} // Animación suave con cada actualización
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RealTimeChart;
