import React from 'react';

const SensorCard = ({ title, value, unit, status }) => {
    const getStatusColor = () => {
        if (status === 'FLOOD') return '#ef4444';
        if (status === 'WARNING') return '#f59e0b';
        return '#10b981';
    };

    return (
        <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: `2px solid ${getStatusColor()}`
        }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                {title}
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#333' }}>
                {value} <span style={{ fontSize: '18px', color: '#999' }}>{unit}</span>
            </div>
           {status && (
    <>
        <div style={{
            marginTop: '12px',
            padding: '6px 12px',
            background: getStatusColor(),
            color: 'white',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'inline-block'
        }}>
            {status}
        </div>
        <div style={{
            marginTop: '8px',
            fontSize: '10px',
            color: '#10b981',
            fontWeight: 'bold'
        }}>
            ✓ Real-time OpenWeather data
        </div>
    </>
)}
        </div>
    );
};

export default SensorCard;