import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom'; // <- changed

export default function AdminPanel() {
  const [lotName, setLotName] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // <- changed

  const addLot = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/lots', { name: lotName });
      if (res.data.success) {
        setMessage(`Success: ${lotName} has been added to the system.`);
        setLotName('');
      }
    } catch (err) {
      setMessage('Error: Could not connect to server.');
    }
  };

  return (
    <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Back Button */}
      <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '20px', background: '#334155' }}>
        ← Back to Map
      </button>

      {/* The Glass Card */}
      <div className="glass-card" style={{ width: '100%', maxWidth: '450px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>🏗️ Admin: Add New Parking Lot</h2>
        
        <form onSubmit={addLot}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', color: '#94a3b8' }}>Parking Lot / Section Name</label>
            <input
              type="text"
              placeholder="e.g. Floor 1 - VIP"
              value={lotName}
              onChange={(e) => setLotName(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '12px', 
                borderRadius: '8px', 
                border: '1px solid #334155', 
                background: '#1e293b', 
                color: 'white',
                boxSizing: 'border-box' 
              }}
            />
          </div>
          
          <button type="submit" style={{ width: '100%', padding: '14px' }}>
            Add Lot to System
          </button>
        </form>

        {message && (
          <div style={{ 
            marginTop: '20px', 
            padding: '10px', 
            borderRadius: '6px', 
            background: 'rgba(0, 210, 255, 0.1)', 
            color: '#00d2ff',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}