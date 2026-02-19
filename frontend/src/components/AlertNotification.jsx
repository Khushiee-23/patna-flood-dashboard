import React, { useEffect, useState } from 'react';

const AlertNotification = ({ status, waterLevel }) => {
    const [lastStatus, setLastStatus] = useState(status);
    const [showAlert, setShowAlert] = useState(false);

    useEffect(() => {
        // Check if status changed
        if (status !== lastStatus) {
            setLastStatus(status);
            
            // Show notification
            if (status === 'FLOOD' || status === 'WARNING') {
                setShowAlert(true);
                
                // Browser notification
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Flood Alert!', {
                        body: `Status: ${status} - Water Level: ${waterLevel}m`,
                        icon: '/favicon.ico',
                        tag: 'flood-alert'
                    });
                }
                
                // Auto-hide after 5 seconds
                setTimeout(() => setShowAlert(false), 5000);
            }
        }
    }, [status, lastStatus, waterLevel]);

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    if (!showAlert) return null;

    const getAlertColor = () => {
        if (status === 'FLOOD') return '#ef4444';
        if (status === 'WARNING') return '#f59e0b';
        return '#10b981';
    };

    return (
        <div style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            background: getAlertColor(),
            color: 'white',
            padding: '16px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 1000,
            animation: 'slideIn 0.3s ease',
            minWidth: '300px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>
                    {status === 'FLOOD' ? '🚨' : '⚠️'}
                </span>
                <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        {status === 'FLOOD' ? 'FLOOD ALERT!' : 'WARNING ALERT!'}
                    </div>
                    <div style={{ fontSize: '14px' }}>
                        Water Level: {waterLevel}m
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlertNotification;