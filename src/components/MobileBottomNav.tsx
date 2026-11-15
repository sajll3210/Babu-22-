import React from 'react';
import { Home, Gamepad2, Plane, PlusCircle, User } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenDeposit: () => void;
  onOpenProfile: () => void;
  onLaunchAviator: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenDeposit,
  onOpenProfile,
  onLaunchAviator,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/95 backdrop-blur-md border-t border-gray-800/90 px-2 py-1.5 flex items-center justify-around h-16 safe-bottom">
      {/* 1: Home */}
      <button
        onClick={() => onSelectTab('all')}
        className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] transition-colors ${
          activeTab === 'all' ? 'text-amber-400' : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-medium mt-1">হোম</span>
      </button>

      {/* 2: Slots */}
      <button
        onClick={() => onSelectTab('slots')}
        className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] transition-colors ${
          activeTab === 'slots' ? 'text-amber-400' : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        <Gamepad2 className="w-5 h-5" />
        <span className="text-[10px] font-medium mt-1">স্লটস</span>
      </button>

      {/* 3: Aviator Center Highlight Button */}
      <button
        onClick={onLaunchAviator}
        className="flex flex-col items-center justify-center -translate-y-2 min-w-[56px] min-h-[44px]"
      >
        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-rose-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-900/50 active:scale-95 transition-transform">
          <Plane className="w-5 h-5 -rotate-45" />
        </div>
        <span className="text-[10px] font-bold text-rose-400 mt-0.5">এভিয়েটর</span>
      </button>

      {/* 4: Deposit */}
      <button
        onClick={onOpenDeposit}
        className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] text-amber-400 hover:text-amber-300 transition-colors"
      >
        <PlusCircle className="w-5 h-5" />
        <span className="text-[10px] font-medium mt-1">ডিপোজিট</span>
      </button>

      {/* 5: Profile */}
      <button
        onClick={onOpenProfile}
        className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] text-gray-400 hover:text-gray-200 transition-colors"
      >
        <User className="w-5 h-5" />
        <span className="text-[10px] font-medium mt-1">প্রোফাইল</span>
      </button>
    </nav>
  );
};
