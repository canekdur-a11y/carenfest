import React, { useState } from 'react';
import {
  Upload,
  ImagePlus,
  Trash2,
  KeyRound,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import {
  ConceptItem,
  ConceptMediaItem,
  MVCategory,
  MVItem,
  PromoPhoto,
  UserAccount,
} from '../types';
import {
  formatDateTimeTR,
  generateId,
  toLocalDateTimeInputValue,
} from '../lib/utils';
import { saveMediaFile, useResolvedMediaUrl } from '../lib/mediaDb';
import {
  addPromoPhoto,
  createConcept,
  createMV,
  deletePromoPhoto,
  toggleUserAdmin,
  updateUserPassword,
} from '../lib/storage';

interface AdminPageProps {
  mvs: MVItem[];
  concepts: ConceptItem[];
  promos: PromoPhoto[];
  users: UserAccount[];
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

type AdminTab = 'MV' | 'Konsept' | 'Tanıtım' | 'Üyeler';

const MV_TYPES: MVCategory[] = ['Klip Cover', 'Şarkı Cover', 'Dans Cover'];

const PromoThumbCard: React.FC<{
  photo: PromoPhoto;
  onDelete: () => void;
}> = ({ photo, onDelete }) => {
  const url = useResolvedMediaUrl(photo.url);
  return (
    <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#120D0C] border border-[#2B211E] group">
      {url ? (
        <img src={url} alt={photo.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs text-[#6D605C]">
          ...
        </div>
      )}
      <button
        type="button"
        onClick={onDelete}
        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#F25C4D] hover:bg-[#E04B3C] text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
        title="Fotoğrafı sil"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export const AdminPage: React.FC<AdminPageProps> = ({
  mvs,
  promos,
  users,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('MV');

  // --- MV Form State ---
  const [mvCategory, setMvCategory] = useState<MVCategory>('Klip Cover');
  const [mvTitle, setMvTitle] = useState('');
  const [mvVideoFile, setMvVideoFile] = useState<File | null>(null);
  const [mvCoverFile, setMvCoverFile] = useState<File | null>(null);
  const [mvPublishAt, setMvPublishAt] = useState<string>(() =>
    toLocalDateTimeInputValue()
  );
  const [mvOriginalSong, setMvOriginalSong] = useState('');
  const [mvUploading, setMvUploading] = useState(false);

  // --- Concept Form State ---
  const [conceptTitle, setConceptTitle] = useState('');
  const [conceptFiles, setConceptFiles] = useState<File[]>([]);
  const [conceptMember, setConceptMember] = useState<string>('Eren');
  const [customMember, setCustomMember] = useState<string>('');
  const [conceptCoverId, setConceptCoverId] = useState<string>('');
  const [conceptNote, setConceptNote] = useState('');
  const [conceptUploading, setConceptUploading] = useState(false);

  // --- Promo Upload State ---
  const [promoUploading, setPromoUploading] = useState(false);

  // --- Password Modal State ---
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  const handlePublishMV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mvTitle.trim()) {
      onNotify('Lütfen MV başlığı girin.', 'error');
      return;
    }
    if (!mvVideoFile) {
      onNotify('Lütfen bir video dosyası seçin.', 'error');
      return;
    }
    if (!mvCoverFile) {
      onNotify('Lütfen bir kapak resmi seçin.', 'error');
      return;
    }

    setMvUploading(true);
    try {
      const [videoUrl, coverUrl] = await Promise.all([
        saveMediaFile(mvVideoFile),
        saveMediaFile(mvCoverFile),
      ]);

      const publishIso = mvPublishAt
        ? new Date(mvPublishAt).toISOString()
        : new Date().toISOString();

      await createMV({
        title: mvTitle.trim(),
        category: mvCategory,
        videoUrl,
        videoName: mvVideoFile.name,
        coverUrl,
        coverName: mvCoverFile.name,
        publishAt: publishIso,
        originalSong: mvOriginalSong.trim() || undefined,
      });

      setMvTitle('');
      setMvVideoFile(null);
      setMvCoverFile(null);
      setMvOriginalSong('');
      setMvPublishAt(toLocalDateTimeInputValue());
      onNotify('MV başarıyla yayınlandı!');
    } catch {
      onNotify('MV yüklenirken bir hata oluştu.', 'error');
    } finally {
      setMvUploading(false);
    }
  };

  const handlePublishConcept = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenMember =
      conceptMember === 'Diğer' ? customMember.trim() : conceptMember;

    if (!conceptTitle.trim()) {
      onNotify('Lütfen konsept başlığı girin.', 'error');
      return;
    }
    if (conceptFiles.length === 0) {
      onNotify('En az bir konsept fotoğrafı veya videosu seçin.', 'error');
      return;
    }
    if (!chosenMember) {
      onNotify('Lütfen bir üye seçin veya adını yazın.', 'error');
      return;
    }

    setConceptUploading(true);
    try {
      const mediaItems: ConceptMediaItem[] = [];
      for (const file of conceptFiles) {
        const url = await saveMediaFile(file);
        const isVideo = file.type.startsWith('video/');
        mediaItems.push({
          id: generateId('m'),
          url,
          name: file.name,
          type: isVideo ? 'video' : 'image',
        });
      }

      await createConcept({
        title: conceptTitle.trim(),
        member: chosenMember,
        coverId: conceptCoverId || undefined,
        note: conceptNote.trim() || undefined,
        media: mediaItems,
      });

      setConceptTitle('');
      setConceptFiles([]);
      setConceptCoverId('');
      setConceptNote('');
      onNotify('Konsept başarıyla yayınlandı!');
    } catch {
      onNotify('Konsept yüklenirken bir hata oluştu.', 'error');
    } finally {
      setConceptUploading(false);
    }
  };

  const handlePromoFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setPromoUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const url = await saveMediaFile(file);
        await addPromoPhoto(url, file.name);
      }
      onNotify('Tanıtım fotoğrafları eklendi!');
    } catch {
      onNotify('Fotoğraf yüklenemedi.', 'error');
    } finally {
      setPromoUploading(false);
      e.target.value = '';
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !newPasswordInput.trim()) return;
    await updateUserPassword(editingUser.id, newPasswordInput);
    onNotify(`@${editingUser.username} şifresi güncellendi.`);
    setEditingUser(null);
    setNewPasswordInput('');
  };

  return (
    /* pt-20 ensures "Admin Paneli" title is NEVER clipped under the fixed top Navbar; pb-28 ensures bottom buttons are NEVER hidden behind BottomNav */
    <div className="carenfest-glow min-h-screen pt-20 pb-28 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Admin Paneli
        </h1>

        {/* Sub-Navigation Pills */}
        <div className="grid grid-cols-4 bg-[#181210] p-1 rounded-full border border-[#2B211E]">
          {(['MV', 'Konsept', 'Tanıtım', 'Üyeler'] as AdminTab[]).map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  active
                    ? 'bg-[#2A201D] text-white shadow'
                    : 'text-[#9C8E8A] hover:text-white'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* TAB 1: MV UPLOAD */}
        {activeTab === 'MV' && (
          <form
            onSubmit={handlePublishMV}
            className="bg-[#181210] border border-[#2B211E] rounded-3xl p-5 sm:p-6 space-y-5"
          >
            <div>
              <label className="block text-xs font-medium text-[#B8AAA6] mb-2">
                Tür
              </label>
              <div className="grid grid-cols-3 gap-2">
                {MV_TYPES.map((t) => {
                  const active = mvCategory === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setMvCategory(t)}
                      className={`py-2.5 px-2 rounded-full text-xs font-semibold border transition-all ${
                        active
                          ? 'bg-[#F25C4D]/15 border-[#F25C4D] text-[#F25C4D]'
                          : 'bg-[#120D0C] border-[#2D221F] text-[#9C8E8A] hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#B8AAA6] mb-1.5">
                Başlık
              </label>
              <input
                type="text"
                value={mvTitle}
                onChange={(e) => setMvTitle(e.target.value)}
                placeholder="Örn: CARENFEST - TRALALA MV"
                className="w-full bg-[#120D0C] border border-[#2D221F] focus:border-[#F25C4D] rounded-xl px-4 py-3 text-sm text-white placeholder-[#685D5A] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#B8AAA6] mb-1.5">
                Video dosyası
              </label>
              <label className="flex items-center gap-3 w-full bg-[#120D0C] border border-[#2D221F] hover:border-[#F25C4D]/60 rounded-xl px-4 py-3 text-sm cursor-pointer transition-colors">
                <span className="px-3 py-1 rounded-lg bg-white/10 text-white text-xs font-semibold shrink-0">
                  Dosya Seç
                </span>
                <span className="text-[#9C8E8A] truncate">
                  {mvVideoFile ? mvVideoFile.name : 'Dosya seçilmedi'}
                </span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setMvVideoFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#B8AAA6] mb-1.5">
                Kapak resmi
              </label>
              <label className="flex items-center gap-3 w-full bg-[#120D0C] border border-[#2D221F] hover:border-[#F25C4D]/60 rounded-xl px-4 py-3 text-sm cursor-pointer transition-colors">
                <span className="px-3 py-1 rounded-lg bg-white/10 text-white text-xs font-semibold shrink-0">
                  Dosya Seç
                </span>
                <span className="text-[#9C8E8A] truncate">
                  {mvCoverFile ? mvCoverFile.name : 'Dosya seçilmedi'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setMvCoverFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#B8AAA6] mb-1.5">
                Yayınlanma zamanı
              </label>
              <input
                type="datetime-local"
                value={mvPublishAt}
                onChange={(e) => setMvPublishAt(e.target.value)}
                className="w-full bg-[#120D0C] border border-[#2D221F] focus:border-[#F25C4D] rounded-xl px-4 py-3 text-sm text-white outline-none"
              />
              <p className="text-[11px] text-[#7A6E6A] mt-1">
                İleri bir tarih seçerseniz o saat gelene kadar yalnızca Admin görebilir.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#B8AAA6] mb-1.5">
                Gerçek şarkı (opsiyonel)
              </label>
              <input
                type="text"
                value={mvOriginalSong}
                onChange={(e) => setMvOriginalSong(e.target.value)}
                placeholder="Şarkı adı veya link"
                className="w-full bg-[#120D0C] border border-[#2D221F] focus:border-[#F25C4D] rounded-xl px-4 py-3 text-sm text-white placeholder-[#685D5A] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={mvUploading}
              className="w-full py-3.5 rounded-full bg-[#F25C4D] hover:bg-[#E04B3C] disabled:opacity-50 text-white text-sm font-extrabold tracking-wide uppercase flex items-center justify-center gap-2 shadow-lg shadow-[#F25C4D]/25 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>{mvUploading ? 'YÜKLENİYOR...' : 'YAYINLA'}</span>
            </button>
          </form>
        )}

        {/* TAB 2: CONCEPT UPLOAD */}
        {activeTab === 'Konsept' && (
          <form
            onSubmit={handlePublishConcept}
            className="bg-[#181210] border border-[#2B211E] rounded-3xl p-5 sm:p-6 space-y-5"
          >
            <div>
              <label className="block text-xs font-medium text-[#B8AAA6] mb-1.5">
                Başlık
              </label>
              <input
                type="text"
                value={conceptTitle}
                onChange={(e) => setConceptTitle(e.target.value)}
                placeholder="Örn: TRALALA with Eren"
                className="w-full bg-[#120D0C] border border-[#2D221F] focus:border-[#F25C4D] rounded-xl px-4 py-3 text-sm text-white placeholder-[#685D5A] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#B8AAA6] mb-1.5">
                Konsept fotoğraf veya videoları
              </label>
              <label className="flex items-center gap-3 w-full bg-[#120D0C] border border-[#2D221F] hover:border-[#F25C4D]/60 rounded-xl px-4 py-3 text-sm cursor-pointer transition-colors">
                <span className="px-3 py-1 rounded-lg bg-white/10 text-white text-xs font-semibold shrink-0">
                  Dosyaları Seç
                </span>
                <span className="text-[#9C8E8A] truncate">
                  {conceptFiles.length > 0
                    ? `${conceptFiles.length} dosya seçildi`
                    : 'Dosya seçilmedi'}
                </span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) =>
                    setConceptFiles(e.target.files ? Array.from(e.target.files) : [])
                  }
                  className="hidden"
                />
              </label>
              {conceptFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {conceptFiles.map((f, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 text-[#B8AAA6] truncate max-w-[180px]"
                    >
                      {f.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#B8AAA6] mb-2">
                Üye
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Eren', 'Can', 'Diğer'].map((m) => {
                  const active = conceptMember === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setConceptMember(m)}
                      className={`py-2.5 rounded-full text-xs font-semibold border transition-all ${
                        active
                          ? 'bg-[#F25C4D]/15 border-[#F25C4D] text-[#F25C4D]'
                          : 'bg-[#120D0C] border-[#2D221F] text-[#9C8E8A] hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
              {conceptMember === 'Diğer' && (
                <input
                  type="text"
                  value={customMember}
                  onChange={(e) => setCustomMember(e.target.value)}
                  placeholder="Üye adını yazın..."
                  className="mt-2.5 w-full bg-[#120D0C] border border-[#2D221F] focus:border-[#F25C4D] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#685D5A] outline-none"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#B8AAA6] mb-1.5">
                Cover
              </label>
              <select
                value={conceptCoverId}
                onChange={(e) => setConceptCoverId(e.target.value)}
                className="w-full bg-[#120D0C] border border-[#2D221F] focus:border-[#F25C4D] rounded-xl px-4 py-3 text-sm text-white outline-none"
              >
                <option value="">Yüklenen bir cover seç</option>
                {mvs.map((mv) => (
                  <option key={mv.id} value={mv.id}>
                    {mv.title} ({mv.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#B8AAA6] mb-1.5">
                Not
              </label>
              <textarea
                rows={3}
                value={conceptNote}
                onChange={(e) => setConceptNote(e.target.value)}
                placeholder="Konsept hakkında bir not yaz..."
                className="w-full bg-[#120D0C] border border-[#2D221F] focus:border-[#F25C4D] rounded-xl px-4 py-3 text-sm text-white placeholder-[#685D5A] outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={conceptUploading}
              className="w-full py-3.5 rounded-full bg-[#F25C4D] hover:bg-[#E04B3C] disabled:opacity-50 text-white text-sm font-extrabold tracking-wide uppercase flex items-center justify-center gap-2 shadow-lg shadow-[#F25C4D]/25 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>{conceptUploading ? 'YÜKLENİYOR...' : 'YAYINLA'}</span>
            </button>
          </form>
        )}

        {/* TAB 3: PROMO PHOTOS */}
        {activeTab === 'Tanıtım' && (
          <div className="bg-[#181210] border border-[#2B211E] rounded-3xl p-5 sm:p-6 space-y-5">
            <div>
              <h2 className="text-lg font-extrabold text-white">
                Tanıtım fotoğrafları
              </h2>
              <p className="text-xs sm:text-sm text-[#9C8E8A] mt-1">
                Ana sayfada ve giriş ekranında arka planda bu fotoğraflar sırayla
                gösterilir.
              </p>
            </div>

            <label className="flex flex-col items-center justify-center gap-2 h-32 rounded-2xl border border-dashed border-[#3B2E2A] hover:border-[#F25C4D] bg-[#120D0C]/70 cursor-pointer transition-colors">
              <ImagePlus className="w-6 h-6 text-[#9C8E8A]" />
              <span className="text-sm font-medium text-[#B8AAA6]">
                {promoUploading ? 'Yükleniyor...' : 'Fotoğraf ekle'}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePromoFiles}
                className="hidden"
              />
            </label>

            {promos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {promos.map((p) => (
                  <PromoThumbCard
                    key={p.id}
                    photo={p}
                    onDelete={async () => {
                      await deletePromoPhoto(p.id);
                      onNotify('Tanıtım fotoğrafı silindi.');
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REGISTERED USERS */}
        {activeTab === 'Üyeler' && (
          <div className="bg-[#181210] border border-[#2B211E] rounded-3xl p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-lg font-extrabold text-white">Kayıtlı üyeler</h2>
              <p className="text-xs sm:text-sm text-[#9C8E8A] mt-1">
                {users.length} kayıt. Şifreler gizli saklanır; buradan yeni şifre
                belirleyebilirsin.
              </p>
            </div>

            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="bg-[#120D0C] border border-[#2B211E] rounded-2xl p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-extrabold text-white truncate">
                        @{u.username}
                      </span>
                      {u.isAdmin && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F25C4D]/15 text-[#F25C4D] border border-[#F25C4D]/30">
                          <ShieldCheck className="w-3 h-3" />
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#8E807C]">
                      Kayıt: {formatDateTimeTR(u.createdAt)}
                    </p>
                    <p className="text-xs text-[#8E807C]">
                      Son giriş: {formatDateTimeTR(u.lastLoginAt)}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                    {true && (
                      <button
                        type="button"
                        onClick={async () => {
                          await toggleUserAdmin(u.id);
                          onNotify(
                            u.isAdmin
                              ? `@${u.username} admin yetkisi kaldırıldı.`
                              : `@${u.username} artık Admin.`
                          );
                        }}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 text-[#B8AAA6] border border-white/10 transition-colors"
                      >
                        {u.isAdmin ? 'Yetki Al' : 'Admin Yap'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setEditingUser(u);
                        setNewPasswordInput('');
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#1E1715] hover:bg-[#2A201D] text-white border border-white/10 transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-[#9C8E8A]" />
                      <span>Şifre</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Password Update Modal */}
      {editingUser && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setEditingUser(null)}
        >
          <form
            onSubmit={handleSavePassword}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#181210] border border-[#2B211E] rounded-3xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                @{editingUser.username} için yeni şifre
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 text-[#9C8E8A] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              value={newPasswordInput}
              onChange={(e) => setNewPasswordInput(e.target.value)}
              placeholder="Yeni şifreyi yaz..."
              autoFocus
              className="w-full bg-[#120D0C] border border-[#2D221F] focus:border-[#F25C4D] rounded-xl px-4 py-3 text-sm text-white outline-none"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#9C8E8A] hover:text-white"
              >
                İptal
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F25C4D] hover:bg-[#E04B3C] text-white text-xs font-bold"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Kaydet</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
