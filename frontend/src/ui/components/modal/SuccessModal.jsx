import React from 'react';

export default function SuccessModal({ open, message = 'Registration successful', onClose, onNavigate, buttonText = 'Close' }) {
  if (!open) return null;

  const handleButtonClick = () => {
    if (onNavigate) {
      onNavigate();
    } else {
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 1000
    }}>
      <div style={{
        width: '90%',
        maxWidth: 420,
        background: '#fff',
        borderRadius: 8,
        padding: 24,
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ 
            width: 60, 
            height: 60, 
            borderRadius: '50%', 
            backgroundColor: '#10B981', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 16px',
            color: 'white',
            fontSize: 24
          }}>
            ✓
          </div>
          <h2 style={{ margin: 0, marginBottom: 8, color: '#10B981' }}>Success!</h2>
        </div>
        <p style={{ marginTop: 0, marginBottom: 20, textAlign: 'center', color: '#6B7280' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleButtonClick}
            style={{
              padding: '12px 24px',
              borderRadius: 6,
              border: 'none',
              background: '#10B981',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#10B981'}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}