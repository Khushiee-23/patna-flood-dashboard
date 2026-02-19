import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const WaterTrend = ({ currentLevel }) => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        // Initialize with current data
        const now = new Date();
        const initialData = [];
        
        // Generate last 6 hours of simulated history
        for (let i = 6; i >= 0; i--) {
            const time = new Date(now - i * 60 * 60 * 1000);
            const variance = (Math.random() - 0.5) * 2;
            initialData.push({
                time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                level: parseFloat(currentLevel) + variance
            });
        }
        
        setHistory(initialData);
    }, [currentLevel]);

    // useEffect(() => {
    //     // Add new data point every 5 minutes
    //     const interval = setInterval(() => {
    //         setHistory(prev => {
    //             const newData = [...prev];
    //             if (newData.length >= 12) {
    //                 newData.shift(); // Remove oldest
    //             }
    //             newData.push({
    //                 time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    //                 level: parseFloat(currentLevel)
    //             });
    //             return newData;
    //         });
    //     }, 5 * 60 * 1000); // Every 5 mins

    //     return () => clearInterval(interval);
    // }, [currentLevel]);



useEffect(() => {
    // Fetch last 6 hours from Firebase
    const dbRef = window.firebase ? window.firebase.database().ref('sensors/history') : null;
    
    if (!dbRef) {
        console.error('Firebase not initialized');
        return;
    }
    
    dbRef
        .orderByChild('timestamp')
        .limitToLast(12) // Last 12 data points (6 hours × every 5 min)
        .once('value', (snapshot) => {
            const data = [];
            snapshot.forEach(child => {
                const val = child.val();
                data.push({
                    time: new Date(val.timestamp).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    }),
                    level: parseFloat(val.water_level)
                });
            });
            setHistory(data);
        })
        .catch(err => {
            console.error('Firebase fetch error:', err);
        });
}, []);


    return (
        <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>
                Water Level Trend (Last 6 Hours)
            </h3>
            <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={history}>
                    <defs>
                        <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[48, 55]} />
                    <Tooltip />
                    <ReferenceLine y={52} stroke="#ef4444" strokeDasharray="3 3" label="Danger" />
                    <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="3 3" label="Warning" />
                    <Area 
                        type="monotone" 
                        dataKey="level" 
                        stroke="#3b82f6" 
                        fillOpacity={1} 
                        fill="url(#colorLevel)" 
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default WaterTrend;