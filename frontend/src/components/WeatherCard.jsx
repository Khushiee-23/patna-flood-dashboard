import React, { useState, useEffect } from 'react';

const WeatherCard = () => {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:5000/api/weather')
            .then(res => res.json())
            .then(data => {
                const current = data.forecast[0];
                setWeather({
                    city: data.city,
                    temp: current.temp_c,
                    rain: current.rain_mm,
                    humidity: current.humidity,
                    description: current.description
                });
                setLoading(false);
            })
            .catch(err => {
                console.error('Weather error:', err);
                setLoading(false);
            });
    }, []);

    if (loading || !weather) {
        return (
            <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                Loading weather...
            </div>
        );
    }

    const getWeatherIcon = (desc) => {
        if (desc.includes('rain')) return '🌧️';
        if (desc.includes('cloud')) return '☁️';
        if (desc.includes('clear')) return '☀️';
        return '🌤️';
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
            color: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
        }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                Current Weather - {weather.city}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '48px' }}>
                    {getWeatherIcon(weather.description)}
                </div>
                <div>
                    <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
                        {weather.temp}°C
                    </div>
                    <div style={{ fontSize: '14px', textTransform: 'capitalize' }}>
                        {weather.description}
                    </div>
                </div>
            </div>
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255,255,255,0.2)'
            }}>
                <div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>Rainfall</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                        {weather.rain} mm
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>Humidity</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                        {weather.humidity}%
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeatherCard;