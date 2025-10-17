
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const HistoryChart = ({ data }) => {
  // Función para obtener el color basado en el nivel de PPM/riesgo
  const getBarColor = (level) => {
    switch (level) {
      case 'ATENCION':
        return 'rgba(255, 193, 7, 0.8)'; // Naranja semitransparente
      case 'PELIGRO':
        return 'rgba(255, 87, 34, 0.8)'; // Naranja oscuro semitransparente
      case 'CRITICO':
        return 'rgba(244, 67, 54, 0.8)'; // Rojo semitransparente
      default:
        return 'rgba(76, 175, 80, 0.8)'; // Verde semitransparente
    }
  };

  // Preparamos y ordenamos los datos para la gráfica
  // La gráfica se leerá mejor con el tiempo fluyendo de izquierda a derecha
  const formattedData = data.map(item => ({
      ...item,
      // Formateamos la fecha para que sea más corta en el eje X
      timestamp: new Date(item.timestamp).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
  })).reverse(); // Invertimos para el orden cronológico

  // Un Tooltip personalizado para dar más información
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ backgroundColor: 'rgba(30, 40, 50, 0.9)', padding: '10px', border: '1px solid #555', borderRadius: '5px' }}>
          <p className="label" style={{ color: '#eee' }}>{`Hora: ${label}`}</p>
          <p className="intro" style={{ color: payload[0].payload.color }}>{`PPM: ${payload[0].value.toFixed(1)}`}</p>
          <p className="desc" style={{ color: '#ccc' }}>{`Nivel: ${payload[0].payload.level}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    // Hacemos el contenedor más alto para una mejor visualización
    <ResponsiveContainer width="100%" height={450}>
      <BarChart
        data={formattedData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
        <XAxis dataKey="timestamp" stroke="#aaa" tick={{ fontSize: 12 }} />
        <YAxis 
          label={{ value: 'Partes por Millón (PPM)', angle: -90, position: 'insideLeft', fill: '#ccc', dy: 80 }} 
          stroke="#aaa" 
        />
        <Tooltip 
          content={<CustomTooltip />} 
          cursor={{fill: 'rgba(255, 255, 255, 0.08)'}} 
        />
        <Legend wrapperStyle={{ color: '#fff', paddingTop: '10px' }} />
        
        {/* Barra con animación y colores dinámicos */}
        <Bar dataKey="ppm" name="Lectura de Gas" animationDuration={1500}>
            {
                formattedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.level)} />
                ))
            }
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default HistoryChart;
