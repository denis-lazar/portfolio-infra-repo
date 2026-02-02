
import React from 'react';
import { User, Restaurant } from '../types';

interface ProfileViewProps {
  user: User;
  restaurants: Restaurant[];
  onSelectRestaurant: (id: string) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, restaurants, onSelectRestaurant }) => {
  const favoriteRestaurants = restaurants.filter(r => user.favorites?.includes(r.id));

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 animate-fadeIn">
      <div className="bg-white rounded-[3rem] p-12 shadow-xl border border-slate-100 mb-10">
        <div className="flex items-center space-x-8 mb-10">
          <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black">
            {user.name[0]}
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-800">{user.name}</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              My Favorites
            </h2>
            <div className="space-y-4">
              {favoriteRestaurants.length > 0 ? favoriteRestaurants.map(r => (
                <div 
                  key={r.id} 
                  onClick={() => onSelectRestaurant(r.id)}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:border-indigo-300 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <img src={r.logo} className="w-12 h-12 rounded-xl object-contain bg-white p-1" />
                    <div>
                      <p className="font-bold text-slate-800">{r.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{r.cuisine}</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )) : (
                <p className="text-slate-400 italic text-sm">No favorites yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-12 border-t border-slate-100">
          <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center">
            <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            My Activity (Reviews)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {restaurants.flatMap(r => {
              const reviews = [];
              const restReview = r.reviews?.find(rev => rev.userId === user.id);
              if (restReview) reviews.push({ type: 'RESTAURANT', restaurant: r, review: restReview });
              
              r.menu.forEach(dish => {
                const dishReview = dish.reviews?.find(rev => rev.userId === user.id);
                if (dishReview) reviews.push({ type: 'DISH', restaurant: r, dish, review: dishReview });
              });
              return reviews;
            }).map((item, idx) => (
              <div 
                key={idx}
                onClick={() => onSelectRestaurant(item.restaurant.id)}
                className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-indigo-300 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">
                      {item.type === 'RESTAURANT' ? 'Restaurant Review' : `Dish: ${item.dish?.name}`}
                    </p>
                    <p className="font-black text-slate-800">{item.restaurant.name}</p>
                  </div>
                  <div className="flex items-center space-x-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                    <span className="text-[10px] font-black text-amber-700">{item.review.rating}.0</span>
                    <svg className="w-3 h-3 text-amber-500 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
                <p className="text-slate-500 text-sm italic line-clamp-2">"{item.review.comment}"</p>
                <div className="mt-4 flex justify-end">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest group-hover:text-indigo-600">Click to edit →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
