import React, { useState } from "react";

export default function PinDialog({ isOpen, onClose, onSubmit, title = "Enter PIN" }) {
  const [pin, setPin] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(pin);
    setPin("");
  };

  const handleCancel = () => {
    setPin("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#1e1e1e',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '32px',
        maxWidth: '400px',
        width: '90%'
      }}>
        <h2 style={{ marginBottom: '16px', color: '#fff' }}>{title}</h2>
        <p style={{ marginBottom: '24px', color: '#a0a0a0' }}>
          Please enter your PIN to continue
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
            }}
            placeholder="Enter PIN"
            autoFocus
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff',
              marginBottom: '8px',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#0696D7'}
            onBlur={(e) => e.target.style.borderColor = '#444'}
          />

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            marginTop: '24px'
          }}>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: '10px 24px',
                backgroundColor: '#2a2a2a',
                border: '1px solid #444',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#333';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#2a2a2a';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 24px',
                backgroundColor: '#0696D7',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#0582BE';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#0696D7';
              }}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
