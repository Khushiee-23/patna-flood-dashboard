import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const WeatherChart = () => {
    const [weatherData, setWeatherData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:5000/api/weather')
            .then(res => res.json())
            .then(data => {
                const formatted = data.forecast.map(item => ({
                    time: new Date(item.time).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    }),
                    rainfall: item.rain_mm,
                    temp: item.temp_c,
                    humidity: item.humidity
                }));
                setWeatherData(formatted);
                setLoading(false);
            })
            .catch(err => {
                console.error('Weather fetch error:', err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div style={{ 
                background: 'white', 
                padding: '20px', 
                borderRadius: '12px',
                textAlign: 'center'
            }}>
                Loading weather forecast...
            </div>
        );
    }

    return (
        <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>
                24-Hour Weather Forecast
            </h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weatherData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="rainfall" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Rainfall (mm)"
                    />
                    <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="temp" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        name="Temperature (°C)"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default WeatherChart;