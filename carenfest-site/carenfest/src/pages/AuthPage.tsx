import React, { useEffect, useState } from 'react';
import { PromoPhoto } from '../types';
import { loginUser, registerUser } from '../lib/storage';
import { useResolvedMediaUrl } from '../lib/mediaDb';

interface AuthPageProps {
  promos: PromoPhoto[];
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

const PromoSlideBackground: React.FC<{ url?: string }> = ({ url }) => {
  const resolved = useResolvedMediaUrl(url);
  if (!resolved) return null;
  return (
    <img
      src={resolved}
      alt="CARENFEST Tanıtım"
      className="absolute inset-0 w-full h-full object-cover opacity-35 scale-105 transition-opacity duration-1000"
    />
  );
};

export const AuthPage: React.FC<AuthPageProps> = ({ promos, onNotify }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    if (promos.length <= 1) return;
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % promos.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [promos.length]);

  const activePromo = promos[slideIdx % Math.max(1, promos.length)];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res =
        mode === 'login'
          ? await loginUser(username, password)
          : await registerUser(username, password);
      if (!res.ok) {
        onNotify(res.error || 'Bir hata oluştu.', 'error');
      } else if (res.user?.isAdmin) {
        onNotify('Admin olarak giriş yapıldı.');
      } else {
        onNotify(`Hoş geldin @${res.user?.username}!`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0D0A09] flex flex-col justify-between overflow-hidden">
      {/* Background Promo Slideshow */}
      <div className="absolute inset-0 pointer-events-none">
        <PromoSlideBackground url={activePromo?.url} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D0A09]/70 via-[#0D0A09]/75 to-[#0D0A09]" />
      </div>

      {/* Top Brand Logo */}
      <div className="relative z-10 max-w-md w-full mx-auto px-5 pt-6">
        <span className="text-xl font-extrabold tracking-tight">
          <span className="text-white">CAREN</span>
          <span className="text-[#F25C4D]">FEST</span>
        </span>
      </div>

      {/* Center Card */}
      <div className="relative z-10 max-w-md w-full mx-auto px-4 my-auto py-8">
        <div className="bg-[#181210]/90 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {mode === 'login' ? 'Tekrar hoş geldin' : 'Ekibe katıl'}
          </h1>
          <p className="text-sm text-[#9C8E8A] mt-1.5">
            {mode === 'login'
              ? 'Kullanıcı adın ve şifrenle giriş yap.'
              : 'Bir kullanıcı adı ve şifre seç.'}
          </p>

          {/* Toggle Pills */}
          <div className="grid grid-cols-2 bg-[#120D0C] p-1 rounded-full border border-white/[0.06] mt-6">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`py-2.5 rounded-full text-sm font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-[#F25C4D] text-white shadow-md'
                  : 'text-[#9C8E8A] hover:text-white'
              }`}
            >
              Giriş
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`py-2.5 rounded-full text-sm font-semibold transition-all ${
                mode === 'register'
                  ? 'bg-[#F25C4D] text-white shadow-md'
                  : 'text-[#9C8E8A] hover:text-white'
              }`}
            >
              Kayıt ol
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#B8AAA6] mb-1.5">
                Kullanıcı adı
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ornek_uye"
                autoComplete="username"
                className="w-full bg-[#120D0C] border border-[#2D221F] focus:border-[#F25C4D] rounded-xl px-4 py-3 text-sm text-white placeholder-[#685D5A] outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#B8AAA6] mb-1.5">
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifren"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full bg-[#120D0C] border border-[#2D221F] focus:border-[#F25C4D] rounded-xl px-4 py-3 text-sm text-white placeholder-[#685D5A] outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3.5 rounded-full bg-[#F25C4D] hover:bg-[#E04B3C] active:scale-[0.99] text-white text-sm font-extrabold tracking-wide uppercase transition-all shadow-lg shadow-[#F25C4D]/25"
            >
              {mode === 'login' ? 'GİRİŞ YAP' : 'KAYIT OL'}
            </button>
          </form>
        </div>
      </div>

      <div className="h-4" />
    </div>
  );
};
