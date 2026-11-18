import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Maximize2,
  Music2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { MVItem, UserAccount } from '../types';
import { formatLongDate } from '../lib/utils';
import { downloadMediaDirectly, useResolvedMediaUrl } from '../lib/mediaDb';
import {
  addMVComment,
  deleteMV,
  deleteMVComment,
  voteMV,
} from '../lib/storage';
import { InteractionBar } from '../components/InteractionBar';
import { LightboxModal } from '../components/LightboxModal';

interface MVDetailPageProps {
  mvs: MVItem[];
  currentUser: UserAccount;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export const MVDetailPage: React.FC<MVDetailPageProps> = ({
  mvs,
  currentUser,
  onNotify,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const mv = mvs.find((m) => m.id === id);
  const videoResolved = useResolvedMediaUrl(mv?.videoUrl);
  const coverResolved = useResolvedMediaUrl(mv?.coverUrl);

  if (!mv) {
    return (
      <div className="min-h-screen pt-20 pb-28 px-4 max-w-2xl mx-auto">
        <Link
          to="/mv"
          className="inline-flex items-center gap-2 text-sm text-[#9C8E8A] hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>MV'ler</span>
        </Link>
        <div className="bg-[#181210] border border-[#2B211E] rounded-2xl p-8 text-center text-sm text-[#9C8E8A]">
          Bu MV bulunamadı veya kaldırılmış.
        </div>
      </div>
    );
  }

  const isScheduled = new Date(mv.publishAt).getTime() > Date.now();
  if (isScheduled && !currentUser.isAdmin) {
    return (
      <div className="min-h-screen pt-20 pb-28 px-4 max-w-2xl mx-auto">
        <Link
          to="/mv"
          className="inline-flex items-center gap-2 text-sm text-[#9C8E8A] hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>MV'ler</span>
        </Link>
        <div className="bg-[#181210] border border-[#2B211E] rounded-2xl p-8 text-center text-sm text-[#9C8E8A]">
          Bu MV henüz yayınlanma saatine ulaşmadı.
        </div>
      </div>
    );
  }

  const handleDownloadVideo = async () => {
    onNotify('Video indiriliyor...');
    const ok = await downloadMediaDirectly(mv.videoUrl, mv.videoName || `${mv.title}.mp4`);
    if (!ok) onNotify('Video indirilemedi.', 'error');
  };

  const handleDownloadCover = async () => {
    onNotify('Kapak resmi indiriliyor...');
    const ok = await downloadMediaDirectly(mv.coverUrl, mv.coverName || `${mv.title}_kapak.jpg`);
    if (!ok) onNotify('Kapak resmi indirilemedi.', 'error');
  };

  const handleDelete = async () => {
    if (!window.confirm('Bu MV kalıcı olarak silinsin mi?')) return;
    await deleteMV(mv.id);
    onNotify('MV silindi.');
    navigate('/mv');
  };

  const isSongUrl =
    mv.originalSong &&
    (mv.originalSong.startsWith('http://') || mv.originalSong.startsWith('https://'));

  return (
    <div className="carenfest-glow min-h-screen pt-20 pb-28 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <Link
          to="/mv"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#9C8E8A] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>MV'ler</span>
        </Link>

        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#9C8E8A]">{formatLongDate(mv.publishAt)}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F25C4D]/20 text-[#F25C4D] border border-[#F25C4D]/30">
              {mv.category}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
            {mv.title}
          </h1>

          {mv.originalSong && (
            <div className="pt-1">
              {isSongUrl ? (
                <a
                  href={mv.originalSong}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#181210] border border-[#2B211E] text-xs font-medium text-white/90 hover:border-[#F25C4D]"
                >
                  <Music2 className="w-3.5 h-3.5 text-[#F25C4D]" />
                  <span>Gerçek Şarkı</span>
                  <ExternalLink className="w-3 h-3 text-[#9C8E8A]" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#181210] border border-[#2B211E] text-xs font-medium text-white/90">
                  <Music2 className="w-3.5 h-3.5 text-[#F25C4D]" />
                  <span>Gerçek Şarkı: {mv.originalSong}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Video Player Card */}
        <div className="bg-[#181210] border border-[#2B211E] rounded-2xl overflow-hidden">
          <div className="relative bg-black aspect-video flex items-center justify-center">
            {videoResolved ? (
              <video
                src={videoResolved}
                poster={coverResolved || undefined}
                controls
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-xs text-[#9C8E8A]">Video hazırlanıyor...</span>
            )}
          </div>

          <div className="p-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#2B211E]">
            <span className="text-xs text-[#9C8E8A] truncate max-w-[180px]">
              {mv.videoName}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLightboxIdx(0)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>İncele</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCover}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Kapak</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadVideo}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F25C4D] hover:bg-[#E04B3C] text-xs font-semibold text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>İndir</span>
              </button>
            </div>
          </div>
        </div>

        {/* Likes, Dislikes, Copy Link & Comments */}
        <InteractionBar
          likes={mv.likes}
          dislikes={mv.dislikes}
          comments={mv.comments}
          currentUser={currentUser}
          shareUrl={window.location.href}
          onVote={(type) => voteMV(mv.id, currentUser.id, type)}
          onAddComment={(text) => addMVComment(mv.id, currentUser, text)}
          onDeleteComment={(cmtId) => deleteMVComment(mv.id, cmtId)}
          onNotify={onNotify}
          extraActions={
            currentUser.isAdmin ? (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium text-[#F25C4D] hover:bg-[#F25C4D]/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sil</span>
              </button>
            ) : null
          }
        />
      </div>

      {lightboxIdx !== null && (
        <LightboxModal
          slides={[
            { url: mv.videoUrl, name: mv.videoName, type: 'video', caption: mv.title },
            { url: mv.coverUrl, name: mv.coverName, type: 'image', caption: `${mv.title} (Kapak)` },
          ]}
          currentIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNavigate={setLightboxIdx}
          onNotify={onNotify}
        />
      )}
    </div>
  );
};
