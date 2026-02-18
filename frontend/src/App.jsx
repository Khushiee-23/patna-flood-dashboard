import React, { useState, useEffect } from 'react';
import socket from './services/socket.js';
import MapView from './components/MapView.jsx';
import SensorCard from './components/SensorCard.jsx';
import StatusBadge from './components/StatusBadge.jsx';
import './App.css';

function App() {
    const [sensors, setSensors] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Fetch initial data
        fetch('http://localhost:5000/api/sensor-data')
            .then(res => res.json())
            .then(data => setSensors(data))
            .catch(err => console.error('Error fetching data:', err));

        // Socket.io listeners
        socket.on('connect', () => {
            console.log('Connected to backend');
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from backend');
            setIsConnected(false);
        });

        socket.on('sensorUpdate', (data) => {
            console.log('Real-time update:', data);
            setSensors(data);
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('sensorUpdate');
        };
    }, []);

    if (!sensors) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2>Loading dashboard...</h2>
            </div>
        );
    }

    return (
        <div className="App">
            <header style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '24px',
                marginBottom: '24px'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 style={{ margin: '0 0 8px 0' }}>Patna Flood Monitoring System</h1>
                            <p style={{ margin: 0, opacity: 0.9 }}>
                                {sensors.location} • {new Date(sensors.timestamp).toLocaleString()}
                            </p>
                        </div>
                        <StatusBadge isLive={isConnected} />
                    </div>
                </div>
            </header>

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 40px' }}>
                {/* Global Sensors */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '16px',
                    marginBottom: '32px'
                }}>
                    <SensorCard
                        title="Water Level"
                        value={sensors.global.water_level_m}
                        unit="m"
                        status={sensors.global.status}
                    />
                    <SensorCard
                        title="Rainfall"
                        value={sensors.global.rainfall_mm_hr}
                        unit="mm/hr"
                    />
                    <SensorCard
                        title="Danger Mark"
                        value={sensors.global.danger_mark}
                        unit=""
                    />
                </div>

                {/* Map */}
                <div style={{ marginBottom: '32px' }}>
                    <h2 style={{ marginBottom: '16px' }}>Panchayat-Level Monitoring</h2>
                    <MapView panchayats={sensors.panchayats} />
                </div>

                {/* Panchayat Grid */}
                <div>
                    <h2 style={{ marginBottom: '16px' }}>All Panchayats</h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px'
                    }}>
                        {sensors.panchayats.map((p, idx) => (
                            <SensorCard
                                key={idx}
                                title={p.name}
                                value={p.water}
                                unit="m"
                                status={p.status}
                            />
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;