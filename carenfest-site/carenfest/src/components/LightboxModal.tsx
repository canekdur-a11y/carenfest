import React, { useEffect } from 'react';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { downloadMediaDirectly, useResolvedMediaUrl } from '../lib/mediaDb';

export interface LightboxSlide {
  url: string;
  name: string;
  type: 'image' | 'video';
  caption?: string;
}

interface LightboxModalProps {
  slides: LightboxSlide[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  slides,
  currentIndex,
  onClose,
  onNavigate,
  onNotify,
}) => {
  const current = slides[currentIndex];
  const resolvedUrl = useResolvedMediaUrl(current?.url);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && slides.length > 1) {
        onNavigate((currentIndex + 1) % slides.length);
      }
      if (e.key === 'ArrowLeft' && slides.length > 1) {
        onNavigate((currentIndex - 1 + slides.length) % slides.length);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentIndex, slides.length, onClose, onNavigate]);

  if (!current) return null;

  const handleDownload = async () => {
    onNotify('İndirme başlatıldı...');
    const ok = await downloadMediaDirectly(current.url, current.name);
    if (!ok) {
      onNotify('Dosya indirilemedi.', 'error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/95 backdrop-blur-md flex flex-col justify-between p-4"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div
        className="max-w-4xl w-full mx-auto flex items-center justify-between gap-3 py-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {current.caption || current.name}
          </p>
          {slides.length > 1 && (
            <p className="text-xs text-[#9C8E8A]">
              {currentIndex + 1} / {slides.length}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#F25C4D] hover:bg-[#E04B3C] text-white text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>İndir</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Media */}
      <div
        className="relative flex-1 flex items-center justify-center max-w-5xl w-full mx-auto overflow-hidden my-2"
        onClick={(e) => e.stopPropagation()}
      >
        {slides.length > 1 && (
          <button
            type="button"
            onClick={() => onNavigate((currentIndex - 1 + slides.length) % slides.length)}
            className="absolute left-2 z-10 p-2.5 rounded-full bg-black/70 hover:bg-black text-white border border-white/15 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {resolvedUrl ? (
          current.type === 'video' ? (
            <video
              src={resolvedUrl}
              controls
              autoPlay
              playsInline
              className="max-h-[78vh] max-w-full rounded-2xl shadow-2xl bg-black"
            />
          ) : (
            <img
              src={resolvedUrl}
              alt={current.name}
              className="max-h-[78vh] max-w-full object-contain rounded-2xl shadow-2xl select-none"
            />
          )
        ) : (
          <div className="text-sm text-[#9C8E8A]">Yükleniyor...</div>
        )}

        {slides.length > 1 && (
          <button
            type="button"
            onClick={() => onNavigate((currentIndex + 1) % slides.length)}
            className="absolute right-2 z-10 p-2.5 rounded-full bg-black/70 hover:bg-black text-white border border-white/15 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="text-center text-xs text-[#9C8E8A] pb-1">
        Kapatmak için boşluğa dokun veya ESC tuşuna bas
      </div>
    </div>
  );
};
