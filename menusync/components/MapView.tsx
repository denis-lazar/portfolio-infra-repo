import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Restaurant } from '../types';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  restaurants: Restaurant[];
  onSelectRestaurant: (id: string) => void;
}

const MapView: React.FC<MapViewProps> = ({ restaurants, onSelectRestaurant }) => {
  // Center of New York
  const position: [number, number] = [40.730610, -73.935242];

  return (
    <div className="relative h-[700px] w-full bg-[#0f172a] rounded-[3.5rem] overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border-[16px] border-white cursor-grab active:cursor-grabbing group animate-fadeIn">
      {/* Visual Overlay for extra depth */}
      <div className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_100px_rgba(0,0,0,0.2)]"></div>
      
      <MapContainer 
        center={position} 
        zoom={13} 
        scrollWheelZoom={true} 
        className="h-full w-full grayscale-[0.2] contrast-[1.1]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {restaurants.map((rest) => (
          <Marker 
            key={rest.id} 
            position={[rest.lat, rest.lng]}
          >
            <Popup className="premium-popup">
              <div className="p-4 min-w-[240px] bg-white rounded-3xl overflow-hidden">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl p-2 shadow-sm border border-slate-100 flex-shrink-0">
                    <img src={rest.logo} className="w-full h-full object-contain" alt="logo" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg leading-tight uppercase">{rest.name}</h3>
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-md uppercase tracking-wider">{rest.cuisine}</span>
                      <span className="text-[9px] font-bold text-slate-400">• {rest.rating} ★</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onSelectRestaurant(rest.id)}
                  className="group relative w-full py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest overflow-hidden transition-all hover:bg-indigo-600 active:scale-95"
                >
                  <span className="relative z-10">Enter Restaurant</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;