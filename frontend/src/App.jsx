import React, { useState, useEffect } from 'react';
import socket from './services/socket';
import MapView from './components/MapView';
import SensorCard from './components/SensorCard';
import StatusBadge from './components/StatusBadge';
import WeatherChart from './components/WeatherChart';
import WaterTrend from './components/WaterTrend';
import WeatherCard from './components/WeatherCard';
import AlertNotification from './components/AlertNotification';
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
            <div style={{ 
                padding: '40px', 
                textAlign: 'center',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>💧</div>
                    <h2>Loading Patna Flood Dashboard...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="App">
            {/* Alert Notification */}
            <AlertNotification 
                status={sensors.global.status}
                waterLevel={sensors.global.water_level_m}
            />

            {/* Header */}
            <header style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '24px',
                marginBottom: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '16px'
                    }}>
                        <div>
                            <h1 style={{ margin: '0 0 8px 0', fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
                                Patna Flood Monitoring System
                            </h1>
                            <p style={{ margin: 0, opacity: 0.9, fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                                {sensors.location} • {new Date(sensors.timestamp).toLocaleString()}
                            </p>
                        </div>
                        <StatusBadge isLive={isConnected} />
                    </div>
                </div>
            </header>

            <main style={{ 
                maxWidth: '1400px', 
                margin: '0 auto', 
                padding: '0 16px 40px',
            }}>
                {/* Global Sensors */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px'
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

                {/*  Charts Section */}
<div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
}}>
    <WeatherCard />
    <WaterTrend currentLevel={sensors.global.water_level_m} />
</div>

{/* Weather Forecast Chart (full width below) */}
<div style={{ marginBottom: '24px' }}>
    <WeatherChart />
</div>

                {/* Map */}
                <div style={{ marginBottom: '24px' }}>
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

            {/* Footer */}
            <footer style={{
                background: '#f9fafb',
                padding: '20px',
                textAlign: 'center',
                borderTop: '1px solid #e5e7eb',
                marginTop: '40px'
            }}>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                    Patna Flood Monitoring System © 2026 | Real-time IoT Dashboard | 
                    <span style={{ color: '#3b82f6', marginLeft: '8px' }}>
                        Updates every 5 minutes
                    </span>
                </p>
            </footer>
        </div>
    );
}

export default App;