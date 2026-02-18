// === ALL REQUIRES FIRST ===
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cron = require('node-cron');
const admin = require('firebase-admin');

const app = express();
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

app.use(cors());
app.use(express.json());

// === FIREBASE SETUP ===
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://patna-flood-default-rtdb.asia-southeast1.firebasedatabase.app/" // YOUR exact URL
});
const db = admin.database();

// === GLOBAL SENSORS ===
let sensors = {};

// === SIMULATION FUNCTION ===
function runSimulation() {
    const now = Date.now() / 1000;
    const rain = 0.2 + Math.random() * 8 + (Math.sin(now / 3600) * 2);
    const waterBase = 48.2 + Math.sin(now / 86400) * 1.8;
    const waterGlobal = Math.min(55, waterBase + rain * 0.4 + Math.random() * 0.5);

    const status = waterGlobal > 52 ? 'FLOOD' : waterGlobal > 50 ? 'WARNING' : 'SAFE';

    const panchayats = [
        { name: 'Maner', water: (waterGlobal + 0.3 + Math.random() * 0.4).toFixed(2), lat: 25.65, lng: 85.00, status },
        { name: 'Bihta', water: (waterGlobal - 0.2 + Math.random() * 0.3).toFixed(2), lat: 25.50, lng: 84.90, status },
        { name: 'Daniawan', water: (waterGlobal + 0.1 + Math.random() * 0.5).toFixed(2), lat: 25.55, lng: 85.20, status },
        { name: 'Masaurhi', water: (waterGlobal - 0.5 + Math.random() * 0.4).toFixed(2), lat: 25.38, lng: 85.12, status },
        { name: 'Phulwari Sharif', water: (waterGlobal + 0.4 + Math.random() * 0.3).toFixed(2), lat: 25.58, lng: 85.15, status }
    ];

    sensors = {
        timestamp: new Date().toISOString(),
        location: 'Patna District, Bihar (Ganga Basin)',
        global: {
            water_level_m: waterGlobal.toFixed(2),
            rainfall_mm_hr: rain.toFixed(1),
            status,
            danger_mark: '52.0m (Ghat avg)'
        },
        panchayats,
        rs_images: ['sentinel_cloud.jpg', 'flood_extent.jpg'],
        raw_data: { rain_samples: [rain - 0.5, rain, rain + 0.5] }
    };

    // 🔥 FIREBASE SYNC (UNCOMMENTED!)
    // Inside runSimulation(), after db.ref().set():
    db.ref('sensors/latest').set(sensors)
        .then(() => {
            console.log('✅ Firebase synced');
            io.emit('sensorUpdate', sensors); // ← ADD THIS LINE
        })
        .catch(err => console.error('Firebase error:', err));
}
// === CRON JOBS ===
runSimulation(); // Run immediately on start
cron.schedule('*/5 * * * *', runSimulation); // Then every 5 mins

// === API ENDPOINTS ===
app.get('/api/sensor-data', (req, res) => {
    res.json(sensors);
});

app.get('/api/weather', async(req, res) => {
    try {
        const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
            params: {
                q: 'Patna,IN',
                appid: process.env.API_KEY,
                units: 'metric',
                cnt: 8
            }
        });

        const forecast = response.data.list.map(item => ({
            time: item.dt_txt,
            rain_mm: item.rain && item.rain['3h'] ? item.rain['3h'] : 0,
            temp_c: item.main.temp,
            humidity: item.main.humidity,
            description: item.weather[0].description
        }));

        res.json({
            city: 'Patna, Bihar',
            forecast,
            current_rain_mm_hr: forecast[0].rain_mm
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get data for a specific panchayat
app.get('/api/panchayat/:name', (req, res) => {
    const name = req.params.name;

    if (!sensors || !sensors.panchayats) {
        return res.status(503).json({ error: 'Sensor data not yet available' });
    }

    const panchayat = sensors.panchayats.find(
        p => p.name.toLowerCase() === name.toLowerCase()
    );

    if (panchayat) {
        res.json(panchayat);
    } else {
        res.status(404).json({ error: 'Panchayat not found' });
    }
});

// Root endpoint (MOVE THIS TO THE END!)
app.get('/', (req, res) => {
    res.json({
        message: 'Patna Flood Dashboard API 🚀',
        endpoints: ['/api/sensor-data', '/api/weather', '/api/panchayat/:name'],
        status: 'healthy'
    });
});

// === START SERVER ===
server.listen(5000, () => console.log('🚀 Backend on http://localhost:5000'));