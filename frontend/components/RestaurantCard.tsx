import React from 'react';
import { Restaurant, User } from '../types';

interface RestaurantCardProps {
  restaurant: Restaurant;
  user?: User | null;
  onClick: () => void;
  onToggleFavorite?: (id: string) => void;
  index?: number;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, user, index, onToggleFavorite, onClick }) => {
  const isFavorite = user?.favorites?.includes(restaurant.id);

  const getAvailableCount = () => {
    return restaurant.menu.filter(item => {
      const missingIng = item.requiredIngredients.filter(id => 
        !restaurant.ingredients.find(i => i.id === id)?.inStock
      );
      const brokenHw = item.requiredHardware.filter(id => 
        !restaurant.hardware.find(h => h.id === id)?.operational
      );
      return missingIng.length === 0 && brokenHw.length === 0;
    }).length;
  };

  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-[4rem] p-10 border border-slate-100 shadow-sm hover:shadow-[0_40px_80px_-15px_rgba(79,70,229,0.15)] transition-all duration-700 cursor-pointer animate-slideUp relative overflow-hidden flex flex-col items-center text-center"
      style={{ animationDelay: `${(index || 0) * 100}ms` }}
    >
      {/* Decorative Background - Gradient Accent */}
      <div className="absolute top-0 left-0 w-full h-44 bg-gradient-to-b from-indigo-50/50 to-white border-b border-slate-50 transition-all duration-700 group-hover:h-48"></div>
      
      {/* Massive Logo Container */}
      <div className="relative z-10 w-48 h-48 bg-white rounded-[3.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-50 mb-10 group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-700 ease-out mt-2">
        <img 
          src={restaurant.logo} 
          alt={restaurant.name} 
          className="w-full h-full object-contain filter transition-all duration-700"
        />
      </div>

      {/* Favorite Button (Floating) */}
      <div className="absolute top-8 right-8 z-20">
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(restaurant.id); }}
          className={`p-4 rounded-[1.5rem] transition-all duration-300 active:scale-90 shadow-xl border border-slate-100 ${isFavorite ? 'bg-red-500 text-white border-red-400' : 'bg-white text-slate-300 hover:text-red-400'}`}
        >
          <svg className="w-6 h-6" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      <div className="relative z-10 w-full px-2">
        <div className="flex flex-col items-center mb-6">
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-3 group-hover:text-indigo-600 transition-colors duration-300 uppercase">{restaurant.name}</h3>
          <div className="flex items-center gap-3">
            <span className="px-4 py-1.5 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500">{restaurant.cuisine}</span>
            <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
            <div className="flex items-center space-x-1.5">
              <svg className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-black text-slate-800">
                {restaurant.reviewCount > 0 ? restaurant.rating : 'NEW SPOT'}
              </span>
            </div>
          </div>
        </div>
        
        <p className="text-slate-400 text-sm font-medium line-clamp-2 leading-relaxed mb-10 opacity-90 max-w-sm mx-auto">
          {restaurant.description}
        </p>

        <div className="pt-8 border-t border-slate-50 w-full flex justify-center">
          <div className="flex items-center space-x-3 text-emerald-600 bg-emerald-50/50 px-6 py-3 rounded-2xl border border-emerald-100 shadow-sm group-hover:bg-emerald-50 group-hover:scale-105 transition-all duration-500">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-sm"></span>
            </div>
            <span className="text-xs font-black uppercase tracking-[0.15em]">
              {getAvailableCount()} / {restaurant.menu.length} Dishes Ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;