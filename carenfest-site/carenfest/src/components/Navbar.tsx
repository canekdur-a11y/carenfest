import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, ShieldCheck } from 'lucide-react';
import { UserAccount } from '../types';

interface NavbarProps {
  user: UserAccount;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  return (
    <header className="fixed top-0 inset-x-0 z-40 h-14 bg-[#0D0A09]/90 backdrop-blur-md border-b border-white/[0.06]">
      <div className="max-w-2xl mx-auto h-full px-4 flex items-center justify-between">
        <Link to="/mv" className="text-lg font-extrabold tracking-tight select-none">
          <span className="text-white">CAREN</span>
          <span className="text-[#F25C4D]">FEST</span>
        </Link>

        <div className="flex items-center gap-3">
          {user.isAdmin && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F25C4D]/15 text-[#F25C4D] border border-[#F25C4D]/30">
              <ShieldCheck className="w-3 h-3" />
              Admin
            </span>
          )}
          <span className="text-sm text-[#9C8E8A] font-medium truncate max-w-[150px]">
            @{user.username}
          </span>
          <button
            type="button"
            onClick={onLogout}
            title="Çıkış yap"
            className="p-1.5 rounded-lg text-[#9C8E8A] hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
