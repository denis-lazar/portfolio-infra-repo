
import React, { useState } from 'react';
import { Restaurant, MenuItem, User } from '../types';
import MenuView from './MenuView';

interface ManagerPanelProps {
  restaurant: Restaurant;
  user: User;
  onUpdateIngredient: (rId: string, iId: string, status: boolean) => void;
  onUpdateHardware: (rId: string, hId: string, status: boolean) => void;
  onUpdateRestaurant: (r: Restaurant) => void;
  onToggleFavorite: () => void;
}

const ManagerPanel: React.FC<ManagerPanelProps> = ({ 
  restaurant, 
  user,
  onUpdateIngredient, 
  onUpdateHardware,
  onUpdateRestaurant,
  onToggleFavorite
}) => {
  const [activeTab, setActiveTab] = useState<'CONTROLS' | 'PREVIEW'>('CONTROLS');

  const getAffectedItems = (entityId: string, type: 'ING' | 'HW'): MenuItem[] => {
    return restaurant.menu.filter(item => {
      if (type === 'ING') return item.requiredIngredients.includes(entityId) || (item.optionalIngredients || []).includes(entityId);
      return item.requiredHardware.includes(entityId);
    });
  };

  const isIngredientCritical = (ingId: string, itemId: string): boolean => {
    const item = restaurant.menu.find(m => m.id === itemId);
    return item?.requiredIngredients.includes(ingId) || false;
  };

  return (
    <div className="space-y-8">
      <div className="flex bg-white p-1.5 rounded-3xl shadow-sm border border-slate-200 w-fit">
        <button 
          onClick={() => setActiveTab('CONTROLS')}
          className={`px-8 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${activeTab === 'CONTROLS' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Availability Controls
        </button>
        <button 
          onClick={() => setActiveTab('PREVIEW')}
          className={`px-8 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${activeTab === 'PREVIEW' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Customer Preview
        </button>
      </div>

      {activeTab === 'CONTROLS' ? (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden animate-fadeIn">
          <div className="bg-indigo-600 p-8 text-white flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-1 tracking-tight">{restaurant.name} Dashboard</h2>
              <p className="text-indigo-100 text-sm font-medium">Real-time status management for {restaurant.address}</p>
            </div>
            <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl px-6 py-3 flex items-center space-x-3 border border-white/20">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
              <span className="text-xs font-black uppercase tracking-[0.2em]">Live Sync Active</span>
            </div>
          </div>

          <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* Ingredients Section */}
            <div>
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 shadow-sm border border-amber-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Ingredient Inventory</h3>
                  <p className="text-xs text-slate-400 font-medium">Toggling affects menu items instantly</p>
                </div>
              </div>
              <div className="space-y-4">
                {restaurant.ingredients.map(ing => {
                  const affected = getAffectedItems(ing.id, 'ING');
                  
                  return (
                    <div 
                      key={ing.id} 
                      className={`group relative flex items-center justify-between p-5 rounded-3xl transition-all duration-300 border ${ing.inStock ? 'bg-slate-50 border-slate-100' : 'bg-red-50/30 border-red-100'}`}
                    >
                      <div className="flex flex-col flex-1">
                        <span className="font-bold text-slate-700">{ing.name}</span>
                        {affected.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {affected.map(a => (
                              <span key={a.id} className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${isIngredientCritical(ing.id, a.id) ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-amber-100 text-amber-600 border border-amber-200'}`}>
                                {a.name} {isIngredientCritical(ing.id, a.id) ? '(Critical)' : '(Warning Only)'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateIngredient(restaurant.id, ing.id, !ing.inStock);
                        }}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-500 focus:outline-none shadow-inner ${ing.inStock ? 'bg-indigo-600' : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-500 shadow-md ${ing.inStock ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hardware Section */}
            <div>
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 shadow-sm border border-blue-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Kitchen Operations</h3>
                  <p className="text-xs text-slate-400 font-medium">Manage operational status of equipment</p>
                </div>
              </div>
              <div className="space-y-4">
                {restaurant.hardware.map(hw => {
                  const affected = getAffectedItems(hw.id, 'HW');

                  return (
                    <div 
                      key={hw.id} 
                      className={`group relative flex items-center justify-between p-5 rounded-3xl transition-all duration-300 border ${hw.operational ? 'bg-slate-50 border-slate-100' : 'bg-red-50/30 border-red-100'}`}
                    >
                      <div className="flex flex-col flex-1">
                        <span className="font-bold text-slate-700">{hw.name}</span>
                        <div className="flex flex-col mt-1">
                          <span className={`text-[9px] font-black uppercase tracking-widest ${hw.operational ? 'text-green-500' : 'text-red-500'}`}>
                            {hw.operational ? 'Ready' : 'Down'}
                          </span>
                          {affected.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {affected.map(a => (
                                <span key={a.id} className="text-[9px] font-bold uppercase bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                                  {a.name} (Required)
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateHardware(restaurant.id, hw.id, !hw.operational);
                        }}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-500 focus:outline-none shadow-inner ${hw.operational ? 'bg-green-600' : 'bg-red-500'}`}
                      >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-500 shadow-md ${hw.operational ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="bg-slate-50 px-10 py-6 border-t border-slate-100 flex items-center justify-center space-x-3 text-slate-400 italic">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs font-medium uppercase tracking-widest">Updates are pushed via MongoDB Change Streams simulator</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl flex items-center space-x-4 text-indigo-700 shadow-sm">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <p className="text-base font-bold">Live Customer Experience</p>
              <p className="text-xs font-medium opacity-80 uppercase tracking-widest">Real-time sync validation mode</p>
            </div>
          </div>
          <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-lg ring-8 ring-slate-50">
            <MenuView 
              restaurant={restaurant} 
              user={user} 
              onUpdateRestaurant={onUpdateRestaurant} 
              onToggleFavorite={onToggleFavorite} 
              isManager={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerPanel;
