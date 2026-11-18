import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Link2, Send, Trash2 } from 'lucide-react';
import { CommentItem, UserAccount } from '../types';
import { copyTextStrictly, formatRelativeTimeTR } from '../lib/utils';

interface InteractionBarProps {
  likes: string[];
  dislikes: string[];
  comments: CommentItem[];
  currentUser: UserAccount;
  shareUrl: string;
  onVote: (type: 'like' | 'dislike') => void;
  onAddComment: (text: string) => void;
  onDeleteComment: (commentId: string) => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
  extraActions?: React.ReactNode;
}

export const InteractionBar: React.FC<InteractionBarProps> = ({
  likes,
  dislikes,
  comments,
  currentUser,
  shareUrl,
  onVote,
  onAddComment,
  onDeleteComment,
  onNotify,
  extraActions,
}) => {
  const [commentText, setCommentText] = useState('');

  const hasLiked = likes.includes(currentUser.id);
  const hasDisliked = dislikes.includes(currentUser.id);

  const handleCopyShareLink = async () => {
    const copied = await copyTextStrictly(shareUrl);
    if (copied) {
      onNotify('Bağlantı kopyalandı!');
    } else {
      onNotify('Bağlantı kopyalanamadı.', 'error');
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(commentText);
    setCommentText('');
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons: Like, Dislike, Copy Link ONLY */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => onVote('like')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
            hasLiked
              ? 'bg-[#F25C4D] border-[#F25C4D] text-white shadow-lg shadow-[#F25C4D]/20'
              : 'bg-[#1B1412] border-[#2E2320] text-white/90 hover:border-white/25'
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span>{likes.length}</span>
        </button>

        <button
          type="button"
          onClick={() => onVote('dislike')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
            hasDisliked
              ? 'bg-white text-[#0D0A09] border-white'
              : 'bg-[#1B1412] border-[#2E2320] text-white/90 hover:border-white/25'
          }`}
        >
          <ThumbsDown className="w-4 h-4" />
          <span>{dislikes.length}</span>
        </button>

        <button
          type="button"
          onClick={handleCopyShareLink}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-[#1B1412] border border-[#2E2320] text-white/90 hover:border-white/25 transition-all"
        >
          <Link2 className="w-4 h-4 text-[#9C8E8A]" />
          <span>Bağlantıyı kopyala</span>
        </button>

        {extraActions}
      </div>

      {/* Comments Section */}
      <div className="pt-2 space-y-4">
        <h3 className="text-lg font-bold text-white">
          Yorumlar ({comments.length})
        </h3>

        <form onSubmit={handleCommentSubmit} className="flex items-end gap-2.5">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Bir yorum yaz..."
            rows={2}
            className="flex-1 bg-[#181210] border border-[#2D221F] focus:border-[#F25C4D] rounded-2xl px-4 py-3 text-sm text-white placeholder-[#7A6E6A] outline-none resize-none transition-colors"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="w-11 h-11 rounded-full bg-[#F25C4D] hover:bg-[#E04B3C] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center text-white shrink-0 transition-all shadow-lg shadow-[#F25C4D]/25"
            title="Gönder"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {comments.length === 0 ? (
          <p className="text-sm text-[#7A6E6A] py-2">
            Henüz yorum yok. İlk yorumu sen yaz!
          </p>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => {
              const canDelete = currentUser.isAdmin || c.userId === currentUser.id;
              return (
                <div
                  key={c.id}
                  className="bg-[#181210] border border-[#2B211E] rounded-2xl p-4 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap text-xs">
                      <span className="font-bold text-white">@{c.username}</span>
                      <span className="text-[#7A6E6A]">·</span>
                      <span className="text-[#8E807C]">
                        {formatRelativeTimeTR(c.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-white/95 break-words whitespace-pre-wrap">
                      {c.text}
                    </p>
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => onDeleteComment(c.id)}
                      className="p-1.5 rounded-lg text-[#7A6E6A] hover:text-[#F25C4D] hover:bg-white/5 transition-colors shrink-0"
                      title="Yorumu sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
