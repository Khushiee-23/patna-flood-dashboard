import React from 'react';

const StatusBadge = ({ isLive }) => {
    return (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: isLive ? '#10b981' : '#6b7280',
            color: 'white',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 'bold'
        }}>
            <span style={{
                width: '8px',
                height: '8px',
                background: 'white',
                borderRadius: '50%',
                animation: isLive ? 'pulse 2s infinite' : 'none'
            }}></span>
            {isLive ? 'LIVE' : 'CONNECTING...'}
        </div>
    );
};

export default StatusBadge;