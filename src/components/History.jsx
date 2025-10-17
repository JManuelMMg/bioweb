
import React from 'react';
import { format } from 'date-fns';
import HistoryChart from './HistoryChart'; // Importamos el nuevo componente de gráfica
import './History.css'; // Asegurémonos de tener estilos para el historial

const History = ({ readings }) => {
  return (
    <div className="history-container">
      <h2>Historial de Mediciones</h2>

      {/* 1. La nueva gráfica animada */}
      <div className="chart-wrapper" style={{ marginBottom: '40px' }}>
        {readings && readings.length > 0 ? (
          <HistoryChart data={readings} />
        ) : (
          <p style={{ textAlign: 'center', color: '#888' }}>No hay datos históricos para mostrar en la gráfica.</p>
        )}
      </div>

      {/* 2. La tabla detallada */}
      <div className="table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>PPM</th>
              <th>Nivel</th>
              <th>Valor Raw</th>
            </tr>
          </thead>
          <tbody>
            {readings && readings.length > 0 ? (
              readings.map((reading, index) => (
                <tr key={index} className={`level-${reading.level.toLowerCase()}`}>
                  <td>{format(new Date(reading.timestamp), 'PPpp', { timeZone: 'UTC' })}</td>
                  <td>{reading.ppm.toFixed(1)}</td>
                  <td>{reading.level}</td>
                  <td>{reading.raw}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: '#888' }}>Esperando lecturas...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default History;
