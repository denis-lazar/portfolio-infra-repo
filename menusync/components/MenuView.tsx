import React, { useState, useMemo } from 'react';
import { Restaurant, MenuItem, User, Review } from '../types';
import { getUnavailableItemHelp } from '../services/geminiService';
import AvailabilityBadge from './AvailabilityBadge';
import { api } from '../services/api';

interface MenuViewProps {
  restaurant: Restaurant;
  user: User;
  onUpdateRestaurant: (r: Restaurant) => void;
  onToggleFavorite: () => void;
  showNotification: (msg: string, type?: 'success' | 'error') => void;
  onBack: () => void;
  isManager?: boolean;
}

const MenuView: React.FC<MenuViewProps> = ({ 
  restaurant, 
  user, 
  onUpdateRestaurant, 
  onToggleFavorite, 
  showNotification,
  onBack,
  isManager = false 
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [helpMessage, setHelpMessage] = useState<string | null>(null);
  const [loadingHelp, setLoadingHelp] = useState(false);
  const [viewingReviews, setViewingReviews] = useState<'REST' | 'DISH' | null>(null);
  const [targetDishId, setTargetDishId] = useState<string | null>(null);
  const [writingReview, setWritingReview] = useState<'REST' | 'DISH' | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const isFavorite = user?.favorites?.includes(restaurant.id);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    try {
      let updated: Restaurant;
      if (writingReview === 'REST') {
        updated = await api.addRestaurantReview(restaurant.id, {
          id: "temp",
          userId: user.id,
          userName: user.name,
          rating: reviewRating,
          comment: reviewComment,
          date: new Date().toISOString().split('T')[0]
        });
      } else {
        updated = await api.addDishReview(restaurant.id, targetDishId!, {
          id: "temp",
          userId: user.id,
          userName: user.name,
          rating: reviewRating,
          comment: reviewComment,
          date: new Date().toISOString().split('T')[0]
        });
      }
      onUpdateRestaurant(updated);
      setWritingReview(null);
      setReviewComment('');
      setReviewRating(5);
      showNotification("Review updated successfully!");
    } catch (err) {
      showNotification("Failed to submit review", "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleOpenReviewModal = (type: 'REST' | 'DISH', dishId?: string) => {
    setWritingReview(type);
    if (dishId) setTargetDishId(dishId);
    
    let existing: Review | undefined;
    if (type === 'REST') {
      existing = restaurant.reviews.find(r => r.userId === user.id);
    } else {
      const dish = restaurant.menu.find(m => m.id === dishId);
      existing = dish?.reviews.find(r => r.userId === user.id);
    }

    if (existing) {
      setReviewRating(existing.rating);
      setReviewComment(existing.comment);
    } else {
      setReviewRating(5);
      setReviewComment('');
    }
  };

  const categories = useMemo(() => 
    ['All', ...new Set(restaurant.menu.map(item => item.category))],
    [restaurant.menu]
  );

  const filteredMenu = useMemo(() => 
    activeCategory === 'All' 
      ? restaurant.menu 
      : restaurant.menu.filter(item => item.category === activeCategory),
    [restaurant.menu, activeCategory]
  );

  const checkAvailability = (item: MenuItem) => {
    const missingIngredients = item.requiredIngredients.filter(id => 
      !restaurant.ingredients.find(i => i.id === id)?.inStock
    );
    const brokenHardware = item.requiredHardware.filter(id => 
      !restaurant.hardware.find(h => h.id === id)?.operational
    );

    const isAvailable = missingIngredients.length === 0 && brokenHardware.length === 0;
    
    let reason = "";
    if (!isAvailable) {
      if (missingIngredients.length > 0) {
        reason = `Out of ${missingIngredients.map(id => restaurant.ingredients.find(i => i.id === id)?.name).join(', ')}`;
      } else {
        reason = `${brokenHardware.map(id => restaurant.hardware.find(h => h.id === id)?.name).join(', ')} issue`;
      }
    }

    const missingOptional = (item.optionalIngredients || [])
      .filter(id => !restaurant.ingredients.find(i => i.id === id)?.inStock)
      .map(id => restaurant.ingredients.find(i => i.id === id)?.name || "Unknown Ingredient");

    return { isAvailable, reason, missingOptional };
  };

  const handleItemClick = async (item: MenuItem) => {
    const { isAvailable, reason } = checkAvailability(item);
    if (!isAvailable) {
      setSelectedItem(item);
      setHelpMessage(null);
      setLoadingHelp(true);
      const msg = await getUnavailableItemHelp(item.name, reason);
      setHelpMessage(msg);
      setLoadingHelp(false);
    }
  };

  const handleManualVisit = async () => {
    if (!isManager) {
      try {
        await api.logVisit(user.id, restaurant.id, restaurant.name);
        showNotification(`Visit to ${restaurant.name} recorded!`);
      } catch (e: any) {
        showNotification("Failed to record visit", "error");
      }
    }
  };

  const handleViewDishReviews = (e: React.MouseEvent, dishId: string) => {
    e.stopPropagation();
    setTargetDishId(dishId);
    setViewingReviews('DISH');
  };

  const targetDish = useMemo(() => 
    restaurant.menu.find(m => m.id === targetDishId),
    [restaurant.menu, targetDishId]
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Back Button */}
      {!isManager && (
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-400 hover:text-indigo-600 transition-all font-black text-[10px] uppercase tracking-[0.2em] group mb-4"
        >
          <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Discovery</span>
        </button>
      )}

      {/* Hero Section */}
      <div className="relative h-60 md:h-80 rounded-[4rem] overflow-hidden mb-10 shadow-2xl group/hero">
        <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover transition-transform duration-[3s] group-hover/hero:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent flex flex-col justify-end p-12 text-white">
          {/* Top Floating Action (Favorite) */}
          {!isManager && (
            <div className="absolute top-10 right-10 z-20">
              <button 
                onClick={onToggleFavorite}
                className={`p-5 rounded-[2rem] transition-all duration-300 active:scale-90 shadow-2xl border backdrop-blur-md ${isFavorite ? 'bg-red-600 text-white border-red-500 ring-4 ring-red-500/20' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
              >
                <svg className="w-7 h-7" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex justify-between items-end">
            <div className="animate-slideUp">
               <h1 className="text-4xl md:text-6xl font-black mb-4 leading-none tracking-tighter uppercase">{restaurant.name}</h1>
               <div className="flex items-center space-x-4 text-white/90 text-xs">
                <span className="bg-indigo-600 px-5 py-2 rounded-2xl font-black uppercase tracking-widest shadow-xl">{restaurant.cuisine}</span>
                <button 
                  onClick={() => setViewingReviews('REST')}
                  className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl hover:bg-white/20 transition-all font-black border border-white/10"
                >
                  <svg className="w-4 h-4 mr-1.5 text-amber-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>{restaurant.reviewCount > 0 ? restaurant.rating : 'New'} ({restaurant.reviewCount} Reviews)</span>
                </button>
                <button 
                  onClick={() => handleOpenReviewModal('REST')}
                  className="flex items-center space-x-2 bg-amber-500/90 backdrop-blur-md px-4 py-2 rounded-2xl hover:bg-amber-600 transition-all font-black border border-amber-400/50 text-white shadow-lg"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>{restaurant.reviews.some(r => r.userId === user.id) ? 'Edit rating' : 'Rate place'}</span>
                </button>
                {!isManager && (
                  <button 
                    onClick={handleManualVisit}
                    className="flex items-center space-x-2 bg-emerald-500/90 backdrop-blur-md px-4 py-2 rounded-2xl hover:bg-emerald-600 transition-all font-black border border-emerald-400/50 text-white shadow-lg"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Check-in</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex overflow-x-auto pb-6 space-x-4 scrollbar-hide animate-slideUp">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-10 py-4 rounded-[1.5rem] whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all transform active:scale-95 ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredMenu.map((item, i) => {
          const { isAvailable, reason, missingOptional } = checkAvailability(item);
          return (
            <div 
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`bg-white rounded-[3rem] p-8 flex flex-col md:flex-row gap-8 border shadow-sm transition-all duration-500 animate-slideUp group ${isAvailable ? 'hover-lift cursor-default border-slate-100' : 'opacity-80 grayscale-[0.4] cursor-pointer border-red-50 bg-red-50/10'}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="relative w-full md:w-40 h-40 flex-shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full rounded-[2rem] object-cover shadow-lg" />
                {!isAvailable && (
                   <div className="absolute inset-0 bg-red-950/20 rounded-[2rem] flex items-center justify-center backdrop-blur-[2px]">
                     <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-red-600 shadow-xl">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                       </svg>
                     </div>
                   </div>
                )}
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-black text-2xl text-slate-900 tracking-tight leading-tight">{item.name}</h4>
                  <span className="text-indigo-600 font-black text-2xl">${item.price}</span>
                </div>
                
                <div className="flex items-center space-x-3 mb-4">
                   <button 
                    onClick={(e) => handleViewDishReviews(e, item.id)}
                    className="flex items-center px-4 py-2 bg-slate-50 hover:bg-indigo-50 rounded-xl transition-all border border-slate-100 group/rating"
                   >
                      <svg className="w-3.5 h-3.5 mr-2 text-amber-400 fill-current group-hover/rating:scale-125 transition-transform" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover/rating:text-indigo-600">
                        {item.rating > 0 ? `${item.rating}.0` : 'New'}
                      </span>
                      <span className="mx-2 text-slate-300">|</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover/rating:text-indigo-400">Feed</span>
                   </button>
                   <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenReviewModal('DISH', item.id); }}
                    className="flex items-center px-4 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-100 text-indigo-600 group/write"
                   >
                      <svg className="w-3.5 h-3.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {item.reviews.some(r => r.userId === user.id) ? 'Edit' : 'Rate'}
                      </span>
                   </button>
                </div>

                <p className="text-slate-500 text-sm mb-6 line-clamp-2 font-medium leading-relaxed opacity-80">{item.description}</p>
                <div className="mt-auto">
                  <AvailabilityBadge isAvailable={isAvailable} reason={reason} missingOptional={missingOptional} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Modal */}
      {viewingReviews && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-pop">
            <div className="bg-indigo-600 p-10 text-white relative">
              <button 
                onClick={() => { setViewingReviews(null); setTargetDishId(null); }}
                className="absolute top-10 right-10 p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-3xl font-black mb-1 tracking-tight">
                {viewingReviews === 'REST' ? `${restaurant.name} Reviews` : `${targetDish?.name} Feedback`}
              </h2>
            </div>
            <div className="p-10 max-h-[60vh] overflow-y-auto scrollbar-hide space-y-6">
              {(viewingReviews === 'REST' ? (restaurant.reviews || []) : (targetDish?.reviews || [])).length > 0 ? (
                (viewingReviews === 'REST' ? restaurant.reviews : targetDish?.reviews)?.map((rev, idx) => (
                  <div key={rev.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 animate-slideUp">
                    <p className="font-black text-slate-800 mb-2">{rev.userName} ({rev.rating}.0)</p>
                    <p className="text-slate-600 text-sm italic">"{rev.comment}"</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 py-10">No reviews yet.</p>
              )}
            </div>
            <div className="bg-slate-50 p-8 text-center">
               <button onClick={() => setViewingReviews(null)} className="px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      {writingReview && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-pop">
            <div className="bg-amber-500 p-10 text-white relative">
              <button 
                onClick={() => setWritingReview(null)}
                className="absolute top-10 right-10 p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-3xl font-black mb-1 tracking-tight">
                {writingReview === 'REST' ? 'Rate Restaurant' : `Rate ${targetDish?.name}`}
              </h2>
            </div>
            <form onSubmit={handleReviewSubmit} className="p-10 space-y-8">
              <div className="flex flex-col items-center">
                <div className="flex space-x-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} type="button" onClick={() => setReviewRating(star)} className={`w-12 h-12 rounded-2xl flex items-center justify-center ${reviewRating >= star ? 'bg-amber-100 text-amber-500' : 'bg-slate-50 text-slate-300'}`}>
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                required
                rows={4}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience..."
                className="w-full px-6 py-4 rounded-[1.5rem] bg-slate-50 border border-slate-100 outline-none"
              />
              <button type="submit" disabled={isSubmittingReview} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em]">
                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Unavailable Item Help Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden animate-pop">
            <div className="p-12">
              <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center text-red-600 mb-8 mx-auto shadow-inner">
                 <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                 </svg>
              </div>
              <h3 className="text-3xl font-black text-slate-900 text-center mb-2 tracking-tight">{selectedItem.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] text-center mb-10">Availability Status</p>
              
              <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 min-h-[140px] flex items-center justify-center text-center">
                {loadingHelp ? (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consulting Host...</p>
                  </div>
                ) : (
                  <p className="text-slate-700 text-xl font-medium leading-relaxed italic px-4">
                    {helpMessage}
                  </p>
                )}
              </div>
              
              <button 
                onClick={() => setSelectedItem(null)}
                className="w-full mt-10 bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-2xl active:scale-95"
              >
                Return to Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuView;