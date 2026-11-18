import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Trash2,
  Download,
  Maximize2,
  Disc,
  FileText,
} from 'lucide-react';
import { ConceptItem, ConceptMediaItem, MVItem, UserAccount } from '../types';
import { formatLongDate } from '../lib/utils';
import { downloadMediaDirectly, useResolvedMediaUrl } from '../lib/mediaDb';
import {
  addConceptComment,
  deleteConcept,
  deleteConceptComment,
  voteConcept,
} from '../lib/storage';
import { InteractionBar } from '../components/InteractionBar';
import { LightboxModal } from '../components/LightboxModal';

interface ConceptDetailPageProps {
  concepts: ConceptItem[];
  mvs: MVItem[];
  currentUser: UserAccount;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

const LinkedCoverBanner: React.FC<{ mv: MVItem }> = ({ mv }) => {
  const coverUrl = useResolvedMediaUrl(mv.coverUrl);
  return (
    <Link
      to={`/mv/${mv.id}`}
      className="flex items-center gap-3 p-3 rounded-2xl bg-[#181210] border border-[#2B211E] hover:border-[#F25C4D]/50 transition-colors"
    >
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#120D0C] shrink-0">
        {coverUrl ? (
          <img src={coverUrl} alt={mv.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Disc className="w-5 h-5 text-[#F25C4D]" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#F25C4D]">
          Bağlı Cover ({mv.category})
        </p>
        <p className="text-sm font-bold text-white truncate">{mv.title}</p>
      </div>
    </Link>
  );
};

const ConceptMediaCard: React.FC<{
  media: ConceptMediaItem;
  index: number;
  onInspect: () => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}> = ({ media, index, onInspect, onNotify }) => {
  const resolved = useResolvedMediaUrl(media.url);

  const handleDownload = async () => {
    onNotify('İndirme başlatıldı...');
    const ok = await downloadMediaDirectly(media.url, media.name);
    if (!ok) onNotify('Dosya indirilemedi.', 'error');
  };

  return (
    <div className="bg-[#181210] border border-[#2B211E] rounded-2xl overflow-hidden">
      <div className="relative bg-black flex items-center justify-center">
        {resolved ? (
          media.type === 'video' ? (
            <video
              src={resolved}
              controls
              playsInline
              className="w-full max-h-[70vh] object-contain"
            />
          ) : (
            <img
              src={resolved}
              alt={media.name}
              onClick={onInspect}
              className="w-full max-h-[70vh] object-contain cursor-zoom-in"
            />
          )
        ) : (
          <div className="h-56 flex items-center justify-center text-xs text-[#9C8E8A]">
            Medya yükleniyor...
          </div>
        )}
      </div>

      <div className="px-4 py-3 flex items-center justify-between gap-2 border-t border-[#2B211E]">
        <span className="text-xs sm:text-sm font-medium text-[#B5A8A4] truncate">
          {media.type === 'video' ? `Konsept video ${index + 1}` : `Konsept fotoğraf ${index + 1}`}
        </span>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onInspect}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>İncele</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#241B19] hover:bg-[#2F2421] border border-white/10 text-xs font-semibold text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>İndir</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const ConceptDetailPage: React.FC<ConceptDetailPageProps> = ({
  concepts,
  mvs,
  currentUser,
  onNotify,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const concept = concepts.find((c) => c.id === id);

  if (!concept) {
    return (
      <div className="min-h-screen pt-20 pb-28 px-4 max-w-2xl mx-auto">
        <Link
          to="/konseptler"
          className="inline-flex items-center gap-2 text-sm text-[#9C8E8A] hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Konseptler</span>
        </Link>
        <div className="bg-[#181210] border border-[#2B211E] rounded-2xl p-8 text-center text-sm text-[#9C8E8A]">
          Bu konsept bulunamadı veya silinmiş.
        </div>
      </div>
    );
  }

  // Null-safe lookup: if linked cover was deleted later, page still renders cleanly without errors
  const linkedMV = concept.coverId
    ? mvs.find((m) => m.id === concept.coverId)
    : undefined;

  const handleDelete = async () => {
    if (!window.confirm('Bu konsept içeriği silinsin mi?')) return;
    await deleteConcept(concept.id);
    onNotify('Konsept silindi.');
    navigate('/konseptler');
  };

  return (
    <div className="carenfest-glow min-h-screen pt-20 pb-28 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <Link
          to="/konseptler"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#9C8E8A] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Konseptler</span>
        </Link>

        {/* Title & Member Pill */}
        <div className="space-y-2.5">
          <p className="text-xs text-[#9C8E8A]">{formatLongDate(concept.createdAt)}</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
            {concept.title}
          </h1>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B1412] border border-[#2E2320] text-xs font-semibold text-white">
              <User className="w-3.5 h-3.5 text-[#F25C4D]" />
              <span>{concept.member}</span>
            </span>
          </div>
        </div>

        {/* Linked Cover (if selected and still exists) */}
        {linkedMV && <LinkedCoverBanner mv={linkedMV} />}

        {/* Admin Note (if written) */}
        {concept.note && concept.note.trim().length > 0 && (
          <div className="bg-[#181210] border border-[#2B211E] rounded-2xl p-4 flex items-start gap-3">
            <FileText className="w-4 h-4 text-[#F25C4D] shrink-0 mt-0.5" />
            <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
              {concept.note}
            </p>
          </div>
        )}

        {/* Action Bar: Likes, Dislikes, Copy Link ONLY, Delete */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* We render the top action row here so it matches screenshot 5 above the media, and comments below */}
        </div>

        {/* Media List */}
        <div className="space-y-4">
          {concept.media.map((m, idx) => (
            <ConceptMediaCard
              key={m.id}
              media={m}
              index={idx}
              onInspect={() => setLightboxIdx(idx)}
              onNotify={onNotify}
            />
          ))}
        </div>

        {/* Likes, Dislikes, Copy Link & Comments */}
        <InteractionBar
          likes={concept.likes}
          dislikes={concept.dislikes}
          comments={concept.comments}
          currentUser={currentUser}
          shareUrl={window.location.href}
          onVote={(type) => voteConcept(concept.id, currentUser.id, type)}
          onAddComment={(text) => addConceptComment(concept.id, currentUser, text)}
          onDeleteComment={(cmtId) => deleteConceptComment(concept.id, cmtId)}
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
          slides={concept.media.map((m, idx) => ({
            url: m.url,
            name: m.name,
            type: m.type,
            caption: `${concept.title} (${idx + 1}/${concept.media.length})`,
          }))}
          currentIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onNavigate={setLightboxIdx}
          onNotify={onNotify}
        />
      )}
    </div>
  );
};
