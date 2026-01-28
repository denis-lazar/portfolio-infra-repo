
import React from 'react';

interface AvailabilityBadgeProps {
  isAvailable: boolean;
  reason?: string;
  missingOptional?: string[];
}

const AvailabilityBadge: React.FC<AvailabilityBadgeProps> = ({ isAvailable, reason, missingOptional }) => {
  if (isAvailable && (!missingOptional || missingOptional.length === 0)) {
    return (
      <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-green-200 shadow-sm animate-fadeIn">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        <span>Available</span>
      </div>
    );
  }

  if (isAvailable && missingOptional && missingOptional.length > 0) {
    return (
      <div className="flex flex-col items-start space-y-1">
        <div className="flex items-center space-x-1 px-2 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-100 shadow-sm animate-fadeIn">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Availability Warning</span>
        </div>
        <span className="text-[9px] text-amber-500 font-bold italic">
          Ready without: {missingOptional.join(', ')}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start space-y-1">
      <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-red-200 shadow-sm animate-fadeIn">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        <span>Currently Unavailable</span>
      </div>
      {reason && (
        <span className="text-[9px] text-red-500 font-medium italic truncate max-w-[120px]">
          {reason}
        </span>
      )}
    </div>
  );
};

export default AvailabilityBadge;
