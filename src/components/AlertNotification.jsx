
import React from 'react';
import './AlertNotification.css';

const AlertNotification = ({ message, level, onClose }) => {
  if (!message) return null;

  const alertStyle = {
    backgroundColor: level.color || '#b22222', // Color por defecto si no se especifica
  };

  return (
    <div className="alert-notification" style={alertStyle}>
      <p>{message}</p>
      <button onClick={onClose} className="close-btn" aria-label="Cerrar notificación">
        &times;
      </button>
    </div>
  );
};

export default AlertNotification;
