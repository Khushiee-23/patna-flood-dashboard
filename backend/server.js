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
// let sensors = {};

// // === SIMULATION FUNCTION ===
// function runSimulation() {
//     const now = Date.now() / 1000;
//     const rain = 0.2 + Math.random() * 8 + (Math.sin(now / 3600) * 2);
//     const waterBase = 48.2 + Math.sin(now / 86400) * 1.8;
//     const waterGlobal = Math.min(55, waterBase + rain * 0.4 + Math.random() * 0.5);

//     const status = waterGlobal > 52 ? 'FLOOD' : waterGlobal > 50 ? 'WARNING' : 'SAFE';

//     const panchayats = [
//         { name: 'Maner', water: (waterGlobal + 0.3 + Math.random() * 0.4).toFixed(2), lat: 25.65, lng: 85.00, status },
//         { name: 'Bihta', water: (waterGlobal - 0.2 + Math.random() * 0.3).toFixed(2), lat: 25.50, lng: 84.90, status },
//         { name: 'Daniawan', water: (waterGlobal + 0.1 + Math.random() * 0.5).toFixed(2), lat: 25.55, lng: 85.20, status },
//         { name: 'Masaurhi', water: (waterGlobal - 0.5 + Math.random() * 0.4).toFixed(2), lat: 25.38, lng: 85.12, status },
//         { name: 'Phulwari Sharif', water: (waterGlobal + 0.4 + Math.random() * 0.3).toFixed(2), lat: 25.58, lng: 85.15, status }
//     ];

//     sensors = {
//         timestamp: new Date().toISOString(),
//         location: 'Patna District, Bihar (Ganga Basin)',
//         global: {
//             water_level_m: waterGlobal.toFixed(2),
//             rainfall_mm_hr: rain.toFixed(1),
//             status,
//             danger_mark: '52.0m (Ghat avg)'
//         },
//         panchayats,
//         rs_images: ['sentinel_cloud.jpg', 'flood_extent.jpg'],
//         raw_data: { rain_samples: [rain - 0.5, rain, rain + 0.5] }
//     };




//     // 🔥 FIREBASE SYNC (UNCOMMENTED!)
//     // Inside runSimulation(), after db.ref().set():
//     //     db.ref('sensors/latest').set(sensors)
//     //         .then(() => {
//     //             console.log('✅ Firebase synced');
//     //             io.emit('sensorUpdate', sensors); // ← ADD THIS LINE
//     //         })
//     //         .catch(err => console.error('Firebase error:', err));
//     // }


//     // Save to history collection
//     db.ref('sensors/history').push({
//         timestamp: new Date().toISOString(),
//         water_level: waterGlobal.toFixed(2),
//         rainfall: rain.toFixed(1),
//         status
//     });

//     // Also save to latest
//     db.ref('sensors/latest').set(sensors)
//         .then(() => {
//             console.log('✅ Firebase synced');
//             io.emit('sensorUpdate', sensors); // ← ADD THIS LINE
//         })
//         .catch(err => console.error('Firebase error:', err));
// }







// === GLOBAL VARIABLES ===
let sensors = {};
let accumulatedRainfall = 0; // Track rainfall over time
let baseWaterLevel = 49.2; // Starting Ganga level at Patna

// === FETCH REAL WEATHER DATA ===
async function fetchRealWeather() {
    try {
        const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
            params: {
                q: 'Patna,IN',
                appid: process.env.API_KEY,
                units: 'metric'
            }
        });

        let currentRain = 0;
        if (response.data.rain && response.data.rain['1h']) {
            currentRain = response.data.rain['1h'];
        }
        const weatherDesc = response.data.weather[0].description;

        console.log(`🌧️ Real weather: ${currentRain}mm/hr - ${weatherDesc}`);

        return {
            rainfall_mm_hr: currentRain,
            description: weatherDesc,
            temp: response.data.main.temp,
            humidity: response.data.main.humidity
        };
    } catch (err) {
        console.error('Weather API error:', err.message);
        return { rainfall_mm_hr: 0, description: 'unknown', temp: 0, humidity: 0 };
    }
}



// === FETCH REAL GANGA WATER LEVEL FROM INDIA-WRIS ===
async function fetchIndiaWRISWaterLevel() {
    try {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

        const response = await axios.post(
            'https://indiawris.gov.in/wris/Data%20API%20Based%20On%20Admin%20Hierarchy/getWaterLevel', {
                stateName: "Bihar",
                districtName: "Patna",
                agencyName: "CWC",
                startdate: dateStr,
                enddate: dateStr,
                download: false,
                page: 0,
                size: 10
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'FloodMonitoringSystem/1.0'
                },
                timeout: 15000
            }
        );

        console.log('📡 India-WRIS Response:', response.data);

        // Parse the response (structure may vary)
        if (response.data && response.data.data && response.data.data.length > 0) {
            const latestReading = response.data.data[0];

            // Look for water level field (check actual response structure)
            const waterLevel = latestReading.waterLevel ||
                latestReading.water_level ||
                latestReading.level ||
                latestReading.gauge_height;

            if (waterLevel) {
                const level = parseFloat(waterLevel);
                console.log('✅ India-WRIS REAL DATA | Patna Ganga:', level, 'm');
                return level;
            }
        }

        console.log('⚠️ India-WRIS: No data available for today');
        return null;

    } catch (err) {
        if (err.response) {
            console.log('⚠️ India-WRIS API error:', err.response.status);
            console.log('Response:', err.response.data);
        } else if (err.code === 'ECONNABORTED') {
            console.log('⚠️ India-WRIS API timeout');
        } else {
            console.log('⚠️ India-WRIS error:', err.message);
        }
        return null;
    }
}



// === SIMULATION FUNCTION WITH REAL DATA ===
async function runSimulation() {
    const now = Date.now() / 1000;

    // Try to fetch REAL Ganga water level from India-WRIS
    const realLevel = await fetchIndiaWRISWaterLevel();

    if (realLevel) {
        baseWaterLevel = realLevel;
        console.log('🌊 Using REAL India-WRIS water level:', realLevel, 'm');
    } else {
        console.log('📊 Using calculated water level (India-WRIS unavailable)');
    }

    // Fetch REAL current weather
    const weather = await fetchRealWeather();
    const rain = weather.rainfall_mm_hr;



    // Accumulate rainfall (decays over 24 hours)
    accumulatedRainfall = accumulatedRainfall * 0.95 + rain; // 5% decay per 5 min

    // Calculate water level based on real rainfall
    const rainImpact = accumulatedRainfall * 0.08; // 1mm rain = 0.08m water rise
    const dailyTide = Math.sin(now / 86400) * 0.4; // Natural daily variation
    const evaporation = -0.02; // Gradual water loss

    // Update base level gradually
    baseWaterLevel = Math.max(48.5, Math.min(54, baseWaterLevel + rainImpact * 0.01 + evaporation));

    const waterGlobal = baseWaterLevel + dailyTide + (Math.random() - 0.5) * 0.1;

    // Status thresholds
    const status = waterGlobal > 52 ? 'FLOOD' : waterGlobal > 50 ? 'WARNING' : 'SAFE';

    const panchayats = [
        { name: 'Maner', water: (waterGlobal + 0.15 + Math.random() * 0.1).toFixed(2), lat: 25.65, lng: 85.00, status },
        { name: 'Bihta', water: (waterGlobal - 0.1 + Math.random() * 0.1).toFixed(2), lat: 25.50, lng: 84.90, status },
        { name: 'Daniawan', water: (waterGlobal + 0.08 + Math.random() * 0.1).toFixed(2), lat: 25.55, lng: 85.20, status },
        { name: 'Masaurhi', water: (waterGlobal - 0.12 + Math.random() * 0.1).toFixed(2), lat: 25.38, lng: 85.12, status },
        { name: 'Phulwari Sharif', water: (waterGlobal + 0.12 + Math.random() * 0.1).toFixed(2), lat: 25.58, lng: 85.15, status }
    ];

    sensors = {
        timestamp: new Date().toISOString(),
        location: 'Patna District, Bihar (Ganga Basin)',
        global: {
            water_level_m: waterGlobal.toFixed(2),
            rainfall_mm_hr: rain.toFixed(1),
            status,
            danger_mark: '52.0m (Ghat avg)',
            weather_desc: weather.description,
            accumulated_rain_24h: accumulatedRainfall.toFixed(1)
        },
        panchayats,
        rs_images: ['sentinel_cloud.jpg', 'flood_extent.jpg'],
        raw_data: {
            rain_samples: [rain - 0.5, rain, rain + 0.5],
            base_level: baseWaterLevel.toFixed(2)
        }
    };

    // Save to history
    db.ref('sensors/history').push({
        timestamp: new Date().toISOString(),
        water_level: waterGlobal.toFixed(2),
        rainfall: rain.toFixed(1),
        status,
        source: 'openweather_real'
    });

    // Save to latest
    db.ref('sensors/latest').set(sensors)
        .then(() => {
            console.log('✅ Firebase synced | Water:', waterGlobal.toFixed(2), '| Rain:', rain, 'mm/hr');
            io.emit('sensorUpdate', sensors);
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