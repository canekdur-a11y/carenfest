import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Music2, Clock, ThumbsUp, MessageSquare } from 'lucide-react';
import { MVCategory, MVItem, UserAccount } from '../types';
import { formatDateTimeTR, formatShortDate } from '../lib/utils';
import { useResolvedMediaUrl } from '../lib/mediaDb';

interface MVsPageProps {
  mvs: MVItem[];
  currentUser: UserAccount;
}

const CATEGORIES: Array<'Tümü' | MVCategory> = [
  'Tümü',
  'Klip Cover',
  'Şarkı Cover',
  'Dans Cover',
];

const MVCard: React.FC<{ mv: MVItem; isScheduled: boolean }> = ({ mv, isScheduled }) => {
  const coverResolved = useResolvedMediaUrl(mv.coverUrl);

  return (
    <Link
      to={`/mv/${mv.id}`}
      className="group block bg-[#181210] border border-[#2B211E] hover:border-[#F25C4D]/50 rounded-2xl overflow-hidden transition-all"
    >
      <div className="relative aspect-video bg-[#120D0C] overflow-hidden">
        {coverResolved ? (
          <img
            src={coverResolved}
            alt={mv.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#6D605C] text-xs">
            Kapak yükleniyor...
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Category Pill */}
        <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold bg-[#F25C4D] text-white shadow">
          {mv.category}
        </span>

        {/* Scheduled Indicator (Only visible to Admin) */}
        {isScheduled && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/90 text-black">
            <Clock className="w-3 h-3" />
            Zamanlandı
          </span>
        )}

        {/* Center Play Circle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 text-[#0D0A09] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Bottom Meta inside Cover */}
        <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-xs text-white/85">
          <span>{isScheduled ? formatDateTimeTR(mv.publishAt) : formatShortDate(mv.publishAt)}</span>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <ThumbsUp className="w-3.5 h-3.5" />
              {mv.likes.length}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              {mv.comments.length}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h2 className="text-base sm:text-lg font-bold text-white group-hover:text-[#F25C4D] transition-colors line-clamp-1">
          {mv.title}
        </h2>
        {mv.originalSong && (
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#9C8E8A] line-clamp-1">
            <Music2 className="w-3.5 h-3.5 text-[#F25C4D] shrink-0" />
            <span>{mv.originalSong}</span>
          </p>
        )}
      </div>
    </Link>
  );
};

export const MVsPage: React.FC<MVsPageProps> = ({ mvs, currentUser }) => {
  const [selectedCategory, setSelectedCategory] = useState<'Tümü' | MVCategory>('Tümü');

  const visibleMVs = useMemo(() => {
    const now = Date.now();
    return mvs.filter((mv) => {
      const pubTime = new Date(mv.publishAt).getTime();
      const isReleased = isNaN(pubTime) || pubTime <= now;
      if (!currentUser.isAdmin && !isReleased) return false;
      if (selectedCategory !== 'Tümü' && mv.category !== selectedCategory) return false;
      return true;
    });
  }, [mvs, currentUser.isAdmin, selectedCategory]);

  return (
    <div className="carenfest-glow min-h-screen pt-20 pb-28 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <p className="text-xs font-extrabold tracking-widest text-[#F25C4D] uppercase">
            CARENFEST
          </p>
          <h1 className="text-3xl font-extrabold text-white mt-0.5">MV'ler</h1>
        </div>

        {/* Horizontally scrollable category pills so "Dans Cover" never gets clipped on mobile */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all ${
                  active
                    ? 'bg-white text-[#0D0A09] border-white shadow'
                    : 'bg-[#181210] text-[#9C8E8A] border-[#2B211E] hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {visibleMVs.length === 0 ? (
          <div className="bg-[#181210] border border-[#2B211E] rounded-2xl py-12 px-6 text-center text-sm text-[#9C8E8A]">
            Henüz yayınlanmış bir MV yok.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visibleMVs.map((mv) => {
              const isScheduled = new Date(mv.publishAt).getTime() > Date.now();
              return <MVCard key={mv.id} mv={mv} isScheduled={isScheduled} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
};
