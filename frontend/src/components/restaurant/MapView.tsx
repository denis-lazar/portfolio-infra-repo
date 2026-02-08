import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Restaurant } from '../../types';
import 'leaflet/dist/leaflet.css';

// Custom Premium Marker Creator
const createCustomIcon = (cuisine: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative group flex items-center justify-center">
        <!-- Pulse Effect -->
        <div class="absolute inset-0 w-12 h-12 -mt-2 -ml-2 bg-indigo-500/20 rounded-full animate-ping group-hover:bg-indigo-500/40 transition-all"></div>
        
        <!-- Main Pin -->
        <div class="relative w-8 h-8 bg-white rounded-2xl rounded-bl-none rotate-45 border-4 border-indigo-600 shadow-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:border-white">
          <!-- Inner Icon Logic -->
          <div class="-rotate-45 text-indigo-600 group-hover:text-white font-black text-[10px] uppercase">
            ${cuisine.charAt(0)}
          </div>
        </div>
        
        <!-- Bottom Point Shadow -->
        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/20 rounded-full blur-[2px]"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    tooltipAnchor: [0, -32]
  });
};

interface MapViewProps {
  restaurants: Restaurant[];
  onSelectRestaurant: (id: string) => void;
}

const MapView: React.FC<MapViewProps> = ({ restaurants, onSelectRestaurant }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Professional Auto-Scroll to Map
  useEffect(() => {
    if (mapRef.current) {
      const timer = setTimeout(() => {
        mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  // Center of New York (Default) or average of restaurants
  const centerPosition: [number, number] = restaurants.length > 0 
    ? [restaurants[0].lat, restaurants[0].lng]
    : [40.730610, -73.935242];

  return (
    <div 
      ref={mapRef}
      className="relative h-[750px] w-full bg-[#0f172a] rounded-[4rem] overflow-hidden shadow-[0_30px_100px_-20px_rgba(79,70,229,0.3)] border-[12px] border-white cursor-grab active:cursor-grabbing group animate-fadeIn transition-all duration-700 hover:shadow-[0_40px_120px_-20px_rgba(79,70,229,0.4)]"
    >
      {/* Premium Gradient Overlay */}
      <div className="absolute inset-0 pointer-events-none z-[1000] shadow-[inset_0_0_150px_rgba(0,0,0,0.4)] ring-1 ring-black/5 rounded-[3.2rem]"></div>
      
      <MapContainer 
        center={centerPosition} 
        zoom={14} 
        scrollWheelZoom={true} 
        zoomControl={false}
        className="h-full w-full grayscale-[0.3] contrast-[1.2]"
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {restaurants.map((rest) => (
          <Marker 
            key={rest.id} 
            position={[rest.lat, rest.lng]}
            icon={createCustomIcon(rest.cuisine)}
            eventHandlers={{
              click: () => onSelectRestaurant(rest.id)
            }}
          >
            {/* Using Tooltip for fast hover visibility instead of click-to-open Popup */}
            <Tooltip 
              sticky 
              direction="top" 
              className="custom-map-tooltip"
              opacity={1}
            >
              <div className="p-4 min-w-[260px] bg-white rounded-[2rem] border-none shadow-2xl animate-pop overflow-hidden">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl p-2 shadow-inner border border-slate-100 flex-shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform">
                    <img src={rest.logo} className="w-full h-full object-contain relative z-10" alt="logo" />
                    <div className="absolute inset-0 bg-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-slate-900 text-lg leading-tight uppercase tracking-tight">{rest.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-[8px] font-black bg-indigo-600 text-white px-2 py-1 rounded-lg uppercase tracking-widest">{rest.cuisine}</span>
                      <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg uppercase tracking-widest border border-emerald-100">
                        {rest.rating} ★
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Available Now</span>
                  <div className="flex items-center text-indigo-600 space-x-1">
                    <span className="text-[10px] font-black uppercase tracking-widest">View Menu</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                  </div>
                </div>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>

      {/* Control UI Overlays */}
      <div className="absolute top-8 left-8 z-[1000] space-y-2">
        <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-2xl border border-white/50 flex items-center space-x-3">
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Interactive Discovery</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;
