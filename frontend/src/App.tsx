
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { User, Restaurant } from './types';
import Header from './components/layout/Header';
import RestaurantCard from './components/restaurant/RestaurantCard';
import MenuView from './components/restaurant/MenuView';
import ManagerPanel from './components/manager/ManagerPanel';
import MapView from './components/restaurant/MapView';
import LoginView from './components/auth/LoginView';
import ProfileView from './components/profile/ProfileView';
import AdminDashboard from './components/admin/AdminDashboard';
import { api } from './services/api';

const ALL_TAGS = ['All', 'Kosher', 'Meat', 'Vegan', 'Healthy', 'Italian', 'American', 'Sushi', 'Japanese'];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(api.getCurrentUser());
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [view, setView] = useState<'LIST' | 'MAP' | 'DETAIL' | 'PROFILE' | 'ADMIN_MANAGE'>('LIST');
  const [activeTag, setActiveTag] = useState<string>('All');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const isNotFound = window.location.pathname !== '/' && window.location.pathname !== '';

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await api.getRestaurants();
      setRestaurants(data);
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Centralized Real-time WebSocket sync
  useEffect(() => {
    // Managers watch their restaurant. 
    // Customers watch 'global' if on list/map, or the specific rest if in detail.
    let targetId = 'global';
    if (user?.role === 'MANAGER') {
      targetId = user.restaurantId || 'global';
    } else if (view === 'DETAIL' && selectedRestaurantId) {
      targetId = selectedRestaurantId;
    }
    
    console.log(`Subscribing to real-time updates for channel: ${targetId}`);
    const unsubscribe = api.subscribeToRestaurant(targetId, (data) => {
      if (data.type === 'INGREDIENT_UPDATE') {
        setRestaurants(prev => prev.map(r =>
          r.id === data.restaurantId
            ? { ...r, ingredients: r.ingredients.map(ing =>
                ing.id === data.ingredientId ? { ...ing, inStock: data.inStock } : ing
              )}
            : r
        ));
      } else if (data.type === 'HARDWARE_UPDATE') {
        setRestaurants(prev => prev.map(r =>
          r.id === data.restaurantId
            ? { ...r, hardware: r.hardware.map(hw =>
                hw.id === data.hardwareId ? { ...hw, operational: data.operational } : hw
              )}
            : r
        ));
      } else {
        loadData(false);
      }
    });
    return () => unsubscribe();
  }, [user, selectedRestaurantId, view, loadData]);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    loadData();
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setSelectedRestaurantId(null);
    setView('LIST');
  };

  const goHome = useCallback(() => {
    setSelectedRestaurantId(null);
    setView('LIST');
  }, []);

  const filteredRestaurants = useMemo(() => {
    if (activeTag === 'All') return restaurants;
    return restaurants.filter(r => r.tags.includes(activeTag) || r.cuisine === activeTag);
  }, [restaurants, activeTag]);

  const selectedRestaurant = useMemo(() => 
    restaurants.find(r => r.id === selectedRestaurantId),
    [restaurants, selectedRestaurantId]
  );

  const managerRestaurant = useMemo(() => {
    if (user?.role === 'MANAGER' && user.restaurantId) {
      return restaurants.find(r => r.id === user.restaurantId);
    }
    return null;
  }, [restaurants, user]);

  const updateIngredient = async (restaurantId: string, ingredientId: string, inStock: boolean) => {
    setRestaurants(prev => prev.map(r =>
      r.id === restaurantId
        ? { ...r, ingredients: r.ingredients.map(ing =>
            ing.id === ingredientId ? { ...ing, inStock } : ing
          )}
        : r
    ));

    try {
      await api.updateIngredient(restaurantId, ingredientId, inStock);
    } catch {
      setRestaurants(prev => prev.map(r =>
        r.id === restaurantId
          ? { ...r, ingredients: r.ingredients.map(ing =>
              ing.id === ingredientId ? { ...ing, inStock: !inStock } : ing
            )}
          : r
      ));
      showNotification("Failed to update ingredient", "error");
    }
  };

  const updateHardware = async (restaurantId: string, hardwareId: string, operational: boolean) => {
    setRestaurants(prev => prev.map(r =>
      r.id === restaurantId
        ? { ...r, hardware: r.hardware.map(hw =>
            hw.id === hardwareId ? { ...hw, operational } : hw
          )}
        : r
    ));

    try {
      await api.updateHardware(restaurantId, hardwareId, operational);
    } catch {
      setRestaurants(prev => prev.map(r =>
        r.id === restaurantId
          ? { ...r, hardware: r.hardware.map(hw =>
              hw.id === hardwareId ? { ...hw, operational: !operational } : hw
            )}
          : r
      ));
      showNotification("Failed to update hardware", "error");
    }
  };

  const handleRestaurantSelect = (id: string) => {
    setSelectedRestaurantId(id);
    setView('DETAIL');
  };

  const handleManagerClaim = async (restaurantId: string) => {
    if (!user) return;
    try {
      const updatedUser = await api.updateManagerRestaurant(user.id, restaurantId);
      setUser(updatedUser);
      loadData();
      showNotification(`Successfully claimed ${restaurants.find(r => r.id === restaurantId)?.name}!`);
    } catch (e: any) {
      showNotification(e.message || "Failed to claim restaurant", 'error');
    }
  };

  const toggleFavorite = async (id?: string) => {
    const targetId = (id && typeof id === 'string') ? id : selectedRestaurantId;
    if (!user || !targetId) return;
    const updatedUser = await api.toggleFavorite(user.id, targetId);
    setUser(updatedUser);
  };

  const handleUpdateRestaurant = (updated: Restaurant) => {
    setRestaurants(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const handleDeleteRestaurant = (id: string) => {
    setRestaurants(prev => prev.filter(r => r.id !== id));
    showNotification("Restaurant deleted successfully");
  };

  const handleAddRestaurant = (r: Restaurant) => {
    setRestaurants(prev => [...prev, r]);
    showNotification("New restaurant added!");
  };

  const handleAdminSelectManage = (id: string) => {
    setSelectedRestaurantId(id);
    setView('ADMIN_MANAGE');
  };

  if (!user) {
    return <LoginView onLoginSuccess={handleLogin} />;
  }

  if (isNotFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-9xl font-black text-indigo-600/20">404</div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Oops! Page not found.</h1>
          <p className="text-slate-500 font-medium">
            The path <span className="text-indigo-600 font-bold">"{window.location.pathname}"</span> doesn't exist in the MenuSync ecosystem.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            <span>Back to Safety</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col animate-fadeIn">
      <Header 
        user={user} 
        onLogout={handleLogout} 
        onHome={goHome}
        view={view}
        setView={setView}
        onProfile={() => setView('PROFILE')}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">Syncing with database...</p>
          </div>
        ) : (
          <>
            {user.role === 'ADMIN' && view !== 'DETAIL' && view !== 'PROFILE' && view !== 'ADMIN_MANAGE' ? (
              <AdminDashboard 
                restaurants={restaurants}
                user={user}
                onUpdateRestaurant={handleUpdateRestaurant}
                onDeleteRestaurant={handleDeleteRestaurant}
                onSelectRestaurant={handleAdminSelectManage}
                onAddRestaurant={handleAddRestaurant}
              />
            ) : user.role === 'ADMIN' && view === 'ADMIN_MANAGE' && selectedRestaurant ? (
              <div className="space-y-8">
                <button 
                  onClick={() => setView('LIST')}
                  className="flex items-center space-x-2 text-slate-400 hover:text-indigo-600 transition-all font-black text-[10px] uppercase tracking-[0.2em] group mb-4"
                >
                  <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back to Dashboard</span>
                </button>
                <ManagerPanel 
                  restaurant={selectedRestaurant} 
                  user={user}
                  onUpdateIngredient={updateIngredient}
                  onUpdateHardware={updateHardware}
                  onUpdateRestaurant={handleUpdateRestaurant}
                  onToggleFavorite={() => toggleFavorite(selectedRestaurant.id)}
                />
              </div>
            ) : user.role === 'MANAGER' ? (
              <div className="space-y-8">
                <div className="flex justify-between items-end animate-slideUp">
                  <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Manager Console</h1>
                    <p className="text-slate-500 text-sm font-medium">
                      {managerRestaurant ? `Real-time status management for ${managerRestaurant.name}` : "Claim your restaurant to start managing"}
                    </p>
                  </div>
                  {managerRestaurant && (
                    <div className="flex items-center space-x-2 text-[10px] font-black text-green-600 bg-green-50 px-4 py-2 rounded-2xl border border-green-100 uppercase tracking-widest shadow-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-radar absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span>Live Syncing</span>
                    </div>
                  )}
                </div>
                
                {managerRestaurant ? (
                  <ManagerPanel 
                    restaurant={managerRestaurant} 
                    user={user}
                    onUpdateIngredient={updateIngredient}
                    onUpdateHardware={updateHardware}
                    onUpdateRestaurant={handleUpdateRestaurant}
                    onToggleFavorite={() => toggleFavorite(managerRestaurant.id)}
                  />
                ) : (
                  <div className="bg-white p-12 rounded-[4rem] shadow-xl border border-slate-100 text-center animate-pop">
                    <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Select your restaurant</h2>
                    <p className="text-slate-500 text-sm font-medium mb-10 max-w-md mx-auto">
                      Choose the location you represent to access availability controls and live inventory syncing.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {restaurants.map((r, i) => (
                        <div 
                          key={r.id}
                          onClick={() => handleManagerClaim(r.id)}
                          className="group bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 cursor-pointer hover:border-indigo-600 hover:bg-white transition-all shadow-sm hover:shadow-2xl animate-slideUp flex flex-col items-center text-center"
                          style={{ animationDelay: `${i * 100}ms` }}
                        >
                          <div className="w-24 h-24 bg-white rounded-3xl p-4 shadow-sm border border-slate-100 mb-6 group-hover:scale-110 transition-transform duration-500">
                            <img src={r.logo} className="w-full h-full object-contain" />
                          </div>
                          <h3 className="font-black text-slate-800 text-xl mb-2">{r.name}</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{r.cuisine} • {r.address.split(',')[0]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {view === 'PROFILE' ? (
                  <ProfileView 
                    user={user} 
                    restaurants={restaurants} 
                    onSelectRestaurant={handleRestaurantSelect}
                  />
                ) : (
                  <>
                    {(view === 'LIST' || view === 'MAP') && (
                      <div className="space-y-10 mb-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-slideUp">
                          <div>
                            <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Nearby Places</h1>
                            <p className="text-slate-500 text-sm font-medium uppercase tracking-[0.2em] mt-1">Real-time Ingredient Tracking</p>
                          </div>
                          <div className="flex bg-slate-200/50 backdrop-blur-md rounded-2xl p-1 shadow-inner self-end">
                            <button 
                              onClick={() => setView('LIST')}
                              className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${view === 'LIST' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                              Browse List
                            </button>
                            <button 
                              onClick={() => setView('MAP')}
                              className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${view === 'MAP' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                              Open Map
                            </button>
                          </div>
                        </div>

                        <div className="flex overflow-x-auto pb-4 space-x-3 scrollbar-hide animate-slideUp" style={{ animationDelay: '200ms' }}>
                          {ALL_TAGS.map(tag => (
                            <button
                              key={tag}
                              onClick={() => setActiveTag(tag)}
                              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border transform active:scale-95 ${activeTag === tag ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-200' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'}`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="relative">
                      {view === 'LIST' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                          {filteredRestaurants.map((rest, i) => (
                            <RestaurantCard 
                              key={rest.id} 
                              restaurant={rest} 
                              user={user}
                              index={i}
                              onToggleFavorite={toggleFavorite}
                              onClick={() => handleRestaurantSelect(rest.id)}
                            />
                          ))}
                        </div>
                      )}

                      {view === 'MAP' && (
                        <MapView 
                          restaurants={filteredRestaurants} 
                          onSelectRestaurant={handleRestaurantSelect}
                        />
                      )}

                      {view === 'DETAIL' && selectedRestaurant && (
                        <MenuView 
                          restaurant={selectedRestaurant} 
                          user={user} 
                          onUpdateRestaurant={handleUpdateRestaurant}
                          onToggleFavorite={toggleFavorite}
                          showNotification={showNotification}
                          onBack={goHome}
                          isManager={false} // Explicitly false for customer view
                        />
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-100 py-12 text-center mt-auto animate-fadeIn">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
            <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
              MenuSync &copy; 2026 • Precision Dining
            </div>
          </div>
        </div>
      </footer>

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 rounded-3xl shadow-2xl border animate-pop flex items-center space-x-3 ${
          notification.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white'
        }`}>
          {notification.type === 'success' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
          )}
          <span className="font-black text-xs uppercase tracking-widest">{notification.message}</span>
        </div>
      )}
    </div>
  );
};

export default App;
