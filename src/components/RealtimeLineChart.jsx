
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const RealtimeLineChart = ({ data, level }) => {

  const getLineColor = () => {
    switch (level) {
      case 'ATENCION':
        return '#FFC107'; // Naranja
      case 'PELIGRO':
        return '#FF5722'; // Naranja oscuro
      case 'CRITICO':
        return '#F44336'; // Rojo
      default:
        return '#4CAF50'; // Verde
    }
  };

  const formattedData = data.map(item => ({
    ...item,
    // Formato corto de hora para el eje X
    timestamp: new Date(item.timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
  })).reverse(); // Orden cronológico

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart 
        data={formattedData}
        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
      >
        <XAxis dataKey="timestamp" stroke="#aaa" tick={{ fontSize: 10 }} />
        <YAxis stroke="#aaa" tick={{ fontSize: 10 }} />
        <Tooltip 
          contentStyle={{ backgroundColor: 'rgba(30, 40, 50, 0.9)', border: '1px solid #555'}} 
          labelStyle={{ color: '#eee'}}
        />
        <Line 
          type="monotone" 
          dataKey="ppm" 
          stroke={getLineColor()} 
          strokeWidth={2}
          dot={false}
          isAnimationActive={false} // Desactivamos animación por defecto para un look más "en vivo"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default RealtimeLineChart;
