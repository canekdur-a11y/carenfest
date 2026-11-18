import React from 'react';
import { NavLink } from 'react-router-dom';
import { Film, Images, ShieldCheck } from 'lucide-react';

interface BottomNavProps {
  isAdmin: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ isAdmin }) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 h-16 bg-[#0D0A09]/95 backdrop-blur-md border-t border-white/[0.07]">
      <div className="max-w-2xl mx-auto h-full px-4 flex items-center justify-around">
        <NavLink
          to="/mv"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              isActive ? 'text-[#F25C4D]' : 'text-[#9C8E8A] hover:text-white'
            }`
          }
        >
          <Film className="w-5 h-5" />
          <span>MV'ler</span>
        </NavLink>

        <NavLink
          to="/konseptler"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              isActive ? 'text-[#F25C4D]' : 'text-[#9C8E8A] hover:text-white'
            }`
          }
        >
          <Images className="w-5 h-5" />
          <span>Konseptler</span>
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                isActive ? 'text-[#F25C4D]' : 'text-[#9C8E8A] hover:text-white'
              }`
            }
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Admin Paneli</span>
          </NavLink>
        )}
      </div>
    </nav>
  );
};
