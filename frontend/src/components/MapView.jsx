import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapView = ({ panchayats }) => {
    const center = [25.5941, 85.1376]; // Patna center

    const getColor = (status) => {
        if (status === 'FLOOD') return '#ef4444';
        if (status === 'WARNING') return '#f59e0b';
        return '#10b981';
    };

    if (!panchayats || panchayats.length === 0) {
        return (
            <div style={{ 
                height: '500px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: '#f0f0f0',
                borderRadius: '12px'
            }}>
                <p>Loading map data...</p>
            </div>
        );
    }

    return (
        <div style={{ height: '500px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
            <MapContainer center={center} zoom={10} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                
                {panchayats.map((p, idx) => (
                    <React.Fragment key={idx}>
                        <Circle
                            center={[p.lat, p.lng]}
                            radius={2000}
                            pathOptions={{
                                color: getColor(p.status),
                                fillColor: getColor(p.status),
                                fillOpacity: 0.2
                            }}
                        />
                        <Marker position={[p.lat, p.lng]}>
                            <Popup>
                                <strong>{p.name}</strong><br/>
                                Water Level: {p.water}m<br/>
                                Status: <span style={{ color: getColor(p.status), fontWeight: 'bold' }}>
                                    {p.status}
                                </span>
                            </Popup>
                        </Marker>
                    </React.Fragment>
                ))}
            </MapContainer>
        </div>
    );
};

export default MapView;