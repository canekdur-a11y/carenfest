import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, Image as ImageIcon } from 'lucide-react';
import { ConceptItem } from '../types';
import { formatShortDate } from '../lib/utils';
import { useResolvedMediaUrl } from '../lib/mediaDb';

interface ConceptsPageProps {
  concepts: ConceptItem[];
}

const ConceptGridCard: React.FC<{ item: ConceptItem }> = ({ item }) => {
  const firstMedia = item.media[0];
  const resolvedUrl = useResolvedMediaUrl(firstMedia?.url);
  const hasVideo = item.media.some((m) => m.type === 'video');

  return (
    <Link
      to={`/konsept/${item.id}`}
      className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#181210] border border-[#2B211E] hover:border-[#F25C4D]/50 transition-all block"
    >
      {resolvedUrl ? (
        firstMedia?.type === 'video' ? (
          <video
            src={resolvedUrl}
            muted
            playsInline
            preload="metadata"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <img
            src={resolvedUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs text-[#6D605C]">
          Önizleme yok
        </div>
      )}

      {/* Dark Gradient Overlay matching screenshot */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      <div className="absolute bottom-3.5 inset-x-3.5 space-y-1">
        <p className="text-[11px] font-extrabold tracking-wider text-[#F25C4D] uppercase">
          {item.member}
        </p>
        <h2 className="text-sm sm:text-base font-extrabold text-white leading-snug line-clamp-2">
          {item.title}
        </h2>
        <div className="flex items-center gap-2 pt-0.5 text-[11px] text-[#B5A8A4]">
          <span className="inline-flex items-center gap-1">
            {hasVideo ? (
              <Film className="w-3.5 h-3.5" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5" />
            )}
            <span>{item.media.length}</span>
          </span>
          <span>{formatShortDate(item.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
};

export const ConceptsPage: React.FC<ConceptsPageProps> = ({ concepts }) => {
  const [selectedMember, setSelectedMember] = useState<string>('Tümü');

  const members = useMemo(() => {
    const set = new Set<string>(['Eren', 'Can']);
    concepts.forEach((c) => {
      if (c.member) set.add(c.member);
    });
    return ['Tümü', ...Array.from(set)];
  }, [concepts]);

  const filtered = useMemo(() => {
    if (selectedMember === 'Tümü') return concepts;
    return concepts.filter(
      (c) => c.member.toLowerCase() === selectedMember.toLowerCase()
    );
  }, [concepts, selectedMember]);

  return (
    <div className="carenfest-glow min-h-screen pt-20 pb-28 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <p className="text-xs font-extrabold tracking-widest text-[#F25C4D] uppercase">
            TEASER
          </p>
          <h1 className="text-3xl font-extrabold text-white mt-0.5">Konseptler</h1>
        </div>

        {/* Member filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
          {members.map((m) => {
            const active = selectedMember === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMember(m)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  active
                    ? 'bg-white text-[#0D0A09] border-white'
                    : 'bg-[#181210] text-[#9C8E8A] border-[#2B211E] hover:text-white'
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-[#181210] border border-[#2B211E] rounded-2xl py-12 px-6 text-center text-sm text-[#9C8E8A]">
            Henüz yayınlanmış bir konsept yok.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5">
            {filtered.map((item) => (
              <ConceptGridCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
