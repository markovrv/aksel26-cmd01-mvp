import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

function MapFocusPopup({ focus, companies, markerRefs }) {
  const map = useMap();

  useEffect(() => {
    if (!focus?.id) return;
    const company = companies.find((c) => c.id === focus.id);
    if (!company?.latitude || !company?.longitude) return;

    const lat = parseFloat(company.latitude);
    const lng = parseFloat(company.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    const marker = markerRefs.current[focus.id];
    const targetZoom = Math.max(map.getZoom(), 14);
    map.flyTo([lat, lng], targetZoom, { duration: 0.45 });

    const t = setTimeout(() => {
      if (marker && typeof marker.openPopup === 'function') {
        marker.openPopup();
      }
    }, 480);
    return () => clearTimeout(t);
  }, [focus?.id, focus?.nonce, companies, map, markerRefs]);

  return null;
}

function MapComponent({ companies, onCompanyClick, focus }) {
  const markerRefs = useRef({});
  // Киров координаты
  const kirovCoords = [58.596, 49.6199];

  // Create custom markers for companies with cases
  const getMarkerIcon = (activeCasesCount, hasStudentSolution) => {
    let color = '#6c757d'; // серый по умолчанию
    let emoji = '🏭';

    if (hasStudentSolution) {
      color = '#28a745'; // зеленый - студент отправил решение
      emoji = '✅';
    } else if (activeCasesCount > 0) {
      color = '#007bff'; // синий - есть активные кейсы
      emoji = '📋';
    }

    return L.divIcon({
      html: `<div style="background-color: ${color}; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
        ${emoji}
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

        <MapFocusPopup focus={focus} companies={companies} markerRefs={markerRefs} />

        {companies.map((company) => (
          <Marker
            key={company.id}
            ref={(instance) => {
              if (instance) {
                markerRefs.current[company.id] = instance;
              } else {
                delete markerRefs.current[company.id];
              }
            }}
            position={[parseFloat(company.latitude), parseFloat(company.longitude)]}
            icon={getMarkerIcon(company.active_cases_count, company.has_student_solution)}
          >
            <Popup>
              <div className="popup-content">
                <h4>{company.name}</h4>
                <p><strong>{company.city}</strong></p>
                <p>{company.short_description}</p>
                <p>📋 Активных кейсов: {company.active_cases_count}</p>
                <button
                  onClick={() => onCompanyClick(company.id)}
                  className="btn btn-primary btn-small"
                >
                  Посмотреть кейсы
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
