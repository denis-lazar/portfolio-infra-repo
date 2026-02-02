
import React, { useState } from 'react';
import { Restaurant, User } from '../types';
import { api } from '../services/api';

interface AdminDashboardProps {
  restaurants: Restaurant[];
  user: User;
  onUpdateRestaurant: (updated: Restaurant) => void;
  onDeleteRestaurant: (id: string) => void;
  onSelectRestaurant: (id: string) => void;
  onAddRestaurant: (r: Restaurant) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  restaurants, 
  user, 
  onUpdateRestaurant, 
  onDeleteRestaurant,
  onSelectRestaurant,
  onAddRestaurant
}) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleCreateRestaurant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newRest: any = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.get('name'),
      description: formData.get('description'),
      cuisine: formData.get('cuisine'),
      address: formData.get('address'),
      logo: formData.get('logo'),
      image: formData.get('image'),
      lat: parseFloat(formData.get('lat') as string),
      lng: parseFloat(formData.get('lng') as string),
      rating: 0,
      reviewCount: 0,
      tags: (formData.get('tags') as string).split(',').map(t => t.trim()),
      ingredients: [],
      hardware: [
        { id: 'stove', name: 'Stove', operational: true },
        { id: 'oven', name: 'Oven', operational: true }
      ],
      menu: [],
      reviews: []
    };

    try {
      const created = await api.createRestaurant(newRest);
      onAddRestaurant(created);
      setIsAdding(false);
    } catch (err) {
      alert("Failed to create restaurant");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure? This will delete the restaurant and all its data.")) return;
    try {
      await api.deleteRestaurant(id);
      onDeleteRestaurant(id);
    } catch (err) {
      alert("Failed to delete restaurant");
    }
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Administration</h1>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">Global Restaurant & Entity Control</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl active:scale-95"
        >
          Add New Restaurant
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {restaurants.map(rest => (
          <div key={rest.id} className="group bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl transition-all flex flex-col">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <img src={rest.logo} className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-xl">{rest.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rest.cuisine}</p>
              </div>
            </div>
            
            <div className="space-y-2 mb-8 flex-1">
               <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Menu Items</span>
                  <span className="text-slate-900">{rest.menu.length}</span>
               </div>
               <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Ingredients</span>
                  <span className="text-slate-900">{rest.ingredients.length}</span>
               </div>
               <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Reviews</span>
                  <span className="text-slate-900">{rest.reviewCount}</span>
               </div>
            </div>

            <div className="flex space-x-3">
              <button 
                onClick={() => onSelectRestaurant(rest.id)}
                className="flex-1 bg-indigo-50 text-indigo-600 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
              >
                Manage Entity
              </button>
              <button 
                onClick={() => handleDelete(rest.id)}
                className="px-4 bg-red-50 text-red-500 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-pop flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase tracking-tighter">Register New Establishment</h3>
              <button onClick={() => setIsAdding(false)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreateRestaurant} className="p-8 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Restaurant Name</label>
                <input name="name" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-slate-900" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Description</label>
                <textarea name="description" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-slate-900" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Cuisine</label>
                  <input name="cuisine" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-slate-900" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Address</label>
                  <input name="address" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-slate-900" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Logo URL</label>
                  <input name="logo" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-slate-900" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Hero Image URL</label>
                  <input name="image" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-slate-900" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Latitude</label>
                  <input name="lat" type="number" step="any" defaultValue="40.7128" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-slate-900" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Longitude</label>
                  <input name="lng" type="number" step="any" defaultValue="-74.0060" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-slate-900" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">Tags (comma separated)</label>
                <input name="tags" placeholder="Vegan, Italian, Popular" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-slate-900" />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">
                Finalize Registration
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
