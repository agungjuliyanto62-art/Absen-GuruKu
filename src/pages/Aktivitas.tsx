import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { 
  ChevronLeft, 
  Image as ImageIcon, 
  Send, 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  Camera, 
  X,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

import { Post, PostReply, User } from '../types';

export default function Aktivitas() {
  const navigate = useNavigate();
  const { user, posts, addPost, deletePost, toggleLikePost, updatePost, addReply } = useApp();
  
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 600;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.5);
            setImage(compressedDataUrl);
          } else {
            setImage(reader.result as string);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!content.trim() && !image) return;
    
    if (editingId) {
      updatePost(editingId, content, image || undefined);
      setEditingId(null);
    } else {
      addPost(content, image || undefined);
    }
    
    setContent('');
    setImage(null);
    setShowCreate(false);
  };

  const startEdit = (post: Post) => {
    setEditingId(post.id);
    setContent(post.content);
    setImage(post.image || null);
    setShowCreate(true);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Premium Header */}
      <div className="bg-primary p-6 pt-10 text-white relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 bg-white/20 rounded-xl backdrop-blur-md"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex flex-col">
              <h2 className="text-xl font-black italic tracking-tight">Kabar Guru</h2>
              <p className="text-[10px] uppercase font-black tracking-widest text-white/50">Postingan & Aktivitas</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowCreate(true)}
            className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-primary shadow-lg active:scale-90 transition-all font-black"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <AnimatePresence>
          {posts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-gray-400"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ImageIcon size={32} />
              </div>
              <p className="font-bold">Belum ada postingan</p>
              <p className="text-xs">Jadilah yang pertama membagikan aktivitas!</p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {posts.map((post: Post, idx: number) => (
                <PostItem 
                  key={post.id} 
                  post={post} 
                  idx={idx} 
                  user={user}
                  onDelete={deletePost}
                  onEdit={startEdit}
                  onLike={toggleLikePost}
                  onReply={addReply}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowCreate(false);
                setEditingId(null);
                setContent('');
                setImage(null);
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" 
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-8 z-[101] shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-800 italic">
                  {editingId ? 'Ubah Postingan' : 'Postingan Baru'}
                </h3>
                <button 
                  onClick={() => {
                    setShowCreate(false);
                    setEditingId(null);
                    setContent('');
                    setImage(null);
                  }} 
                  className="p-2 text-gray-400"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Apa yang Anda pikirkan hari ini, Pak/Bu Guru?"
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium italic resize-none"
                />

                {image && (
                  <div className="relative group">
                    <img src={image} className="w-full h-32 object-cover rounded-2xl" alt="Preview" />
                    <button 
                      onClick={() => setImage(null)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div className="flex gap-4">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-50 text-primary font-black rounded-2xl border border-blue-100 italic"
                  >
                    <Camera size={20} />
                    Foto / Galeri
                  </button>
                  <input 
                    type="file" 
                    accept="image/*" 
                    hidden 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                  />
                  
                  <button 
                    onClick={handleSubmit}
                    disabled={!content.trim() && !image}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 disabled:opacity-50 italic"
                  >
                    <Send size={20} />
                    {editingId ? 'Simpan' : 'Posting'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

interface PostItemProps {
  post: Post;
  idx: number;
  user: User | null;
  onDelete: (id: string) => void;
  onEdit: (post: Post) => void;
  onLike: (id: string) => void;
  onReply: (postId: string, content: string) => void;
}

function PostItem({ post, idx, user, onDelete, onEdit, onLike, onReply }: any) {
  const [showReplies, setShowReplies] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleShare = async () => {
    const shareData = {
      title: 'Kabar Guru SMP Negeri 1 Banjar Margo',
      text: `${post.userName}: "${post.content}"`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareData.text} \n\nDibagikan dari SMP Negeri 1 Banjar Margo Apps`);
        alert('Teks postingan berhasil disalin ke clipboard!');
      } catch (err) {
        console.error('Fallback sharing failed:', err);
      }
    }
  };

  const submitReply = () => {
    if (!replyContent.trim()) return;
    onReply(post.id, replyContent);
    setReplyContent('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden"
    >
      {/* Post Header */}
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-primary font-black shadow-inner border border-blue-100">
            {post.userAvatar ? (
              <img src={post.userAvatar} className="w-full h-full object-cover rounded-2xl" alt="" />
            ) : (
              post.userName.charAt(0)
            )}
          </div>
          <div>
            <h4 className="text-sm font-black text-gray-800">{post.userName}</h4>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true, locale: id })}
            </p>
          </div>
        </div>
        
        {(post.userId === user?.id || user?.role === 'admin') && (
          <div className="flex gap-1">
            {post.userId === user?.id && (
              <button 
                onClick={() => onEdit(post)}
                className="p-2 text-gray-300 hover:text-blue-500 transition-colors"
                id={`edit-post-${post.id}`}
              >
                <Edit2 size={16} />
              </button>
            )}
            <button 
              onClick={() => onDelete(post.id)}
              className="p-2 text-gray-300 hover:text-red-500 transition-colors"
              id={`delete-post-${post.id}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-5 pb-2 text-[13px] font-medium text-gray-700 leading-relaxed italic">
        "{post.content}"
      </div>

      {/* Image */}
      {post.image && (
        <div className="mt-2 px-2 pb-2">
           <img 
            src={post.image} 
            className="w-full h-auto rounded-[2rem] object-cover max-h-[300px]" 
            alt="Post content" 
          />
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-4 flex items-center gap-6 border-t border-gray-50 mt-2">
        <button 
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 transition-all active:scale-125 ${post.isLiked ? 'text-rose-500' : 'text-gray-400 font-bold'}`}
          id={`like-post-${post.id}`}
        >
          <Heart size={20} fill={post.isLiked ? 'currentColor' : 'none'} />
          <span className="text-xs font-black">{post.likes}</span>
        </button>
        <button 
          onClick={() => setShowReplies(!showReplies)}
          className={`flex items-center gap-1.5 transition-all ${showReplies ? 'text-blue-600' : 'text-gray-400 font-bold'}`}
          id={`reply-toggle-${post.id}`}
        >
          <MessageCircle size={20} />
          <span className="text-xs font-black">
            {post.replies?.length > 0 ? `${post.replies.length} Balasan` : 'Balas'}
          </span>
        </button>
        <button 
          onClick={handleShare}
          className="flex items-center gap-1.5 text-gray-400 font-bold ml-auto hover:text-primary transition-colors"
          id={`share-post-${post.id}`}
        >
          <Share2 size={20} />
        </button>
      </div>

      {/* Replies Section */}
      <AnimatePresence>
        {showReplies && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-slate-50/50 border-t border-slate-50"
          >
            <div className="p-4 space-y-4">
               {/* Existing Replies */}
               <div className="space-y-4 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                  {post.replies?.map((reply: any) => (
                    <div key={reply.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm overflow-hidden text-[10px] font-black text-primary">
                        {reply.userAvatar ? <img src={reply.userAvatar} className="w-full h-full object-cover" /> : reply.userName.charAt(0)}
                      </div>
                      <div className="flex-1 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                          <h5 className="text-[10px] font-black text-slate-800">{reply.userName}</h5>
                          <span className="text-[8px] font-bold text-slate-400">
                             {formatDistanceToNow(new Date(reply.timestamp), { addSuffix: true, locale: id })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium">{reply.content}</p>
                      </div>
                    </div>
                  ))}
               </div>

               {/* Add Reply Input */}
               <div className="flex gap-2">
                 <input 
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Tulis balasan..."
                  className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                 />
                 <button 
                  onClick={submitReply}
                  disabled={!replyContent.trim()}
                  className="p-2 bg-primary text-white rounded-xl shadow-md disabled:opacity-50"
                 >
                   <Send size={16} />
                 </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
