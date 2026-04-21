import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapComponent.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function MapComponent({ events, onEventClick }) {
  // Киров координаты
  const kirovCoords = [58.596, 49.6199];

  // Create custom markers for different event types
  const getMarkerIcon = (type) => {
    const colors = {
      case: '#007bff',
      internship: '#28a745',
      tour: '#fd7e14',
    };

    return L.divIcon({
      html: `<div style="background-color: ${colors[type] || '#6c757d'}; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
        ${type === 'case' ? '📋' : type === 'internship' ? '🎓' : '👁️'}
      </div>`,
      iconSize: [30, 30],
      className: 'custom-marker',
    });
  };

  return (
    <div className="map-container">
      <MapContainer
        center={kirovCoords}
        zoom={11}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {events.map((event) => (
          <Marker
            key={event.id}
            position={[58.596, 49.6199 + Math.random() * 0.1 - 0.05]}
            icon={getMarkerIcon(event.type)}
          >
            <Popup>
              <div className="popup-content">
                <h4>{event.title}</h4>
                <p><strong>{event.company_name}</strong></p>
                <p>
                  {event.type === 'case'
                    ? '📋 Кейс'
                    : event.type === 'internship'
                    ? '🎓 Стажировка'
                    : '👁️ Экскурсия'}
                </p>
                <p>
                  <small>
                    {new Date(event.application_deadline).toLocaleDateString('ru-RU')}
                  </small>
                </p>
                <button
                  onClick={() => onEventClick(event.id)}
                  className="btn btn-primary btn-small"
                >
                  Подробнее
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default MapComponent;
