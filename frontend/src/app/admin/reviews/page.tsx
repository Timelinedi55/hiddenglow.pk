'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Review } from '@/lib/types';
import { getImageUrl } from '@/lib/utils';
import { HiStar, HiOutlineSearch, HiOutlineCheckCircle, HiOutlinePhotograph, HiOutlinePlus } from 'react-icons/hi';
import toast from 'react-hot-toast';

interface ReviewStats {
  total: number;
  approved: number;
  pending: number;
  avgRating: number;
}

interface SimpleProduct {
  id: number;
  name: string;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [viewImages, setViewImages] = useState<string[] | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchReviews = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('search', search);
    api.get(`/reviews/admin/list?${params}`).then((data) => {
      setReviews(Array.isArray(data) ? data : data.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [statusFilter, search]);

  const fetchStats = useCallback(() => {
    api.get('/reviews/admin/stats').then(setStats).catch(() => {});
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleApprove = async (id: number) => {
    try { await api.put(`/reviews/${id}/approve`); toast.success('Approved'); fetchReviews(); fetchStats(); }
    catch { toast.error('Failed'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this review?')) return;
    try { await api.delete(`/reviews/${id}`); toast.success('Deleted'); fetchReviews(); fetchStats(); }
    catch { toast.error('Failed'); }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' +
      date.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-dark">Reviews</h1>
        <button onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-primary/90">
          <HiOutlinePlus className="w-4 h-4" /> Add Review
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border p-4">
            <p className="text-2xl font-bold text-brand-dark">{stats.total}</p>
            <p className="text-xs text-gray-500">Total Reviews</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            <p className="text-xs text-gray-500">Approved</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-1">
              <p className="text-2xl font-bold text-brand-dark">{Number(stats.avgRating || 0).toFixed(1)}</p>
              <HiStar className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-xs text-gray-500">Avg Rating</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <form onSubmit={(e) => { e.preventDefault(); fetchReviews(); }} className="relative flex-1 min-w-[180px]">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or comment..."
            className="w-full border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
        </form>
        <div className="flex gap-1">
          {[{ value: 'all', label: 'All' }, { value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }].map((f) => (
            <button key={f.value} onClick={() => { setStatusFilter(f.value); }}
              className={`px-3 py-2 rounded-lg text-xs font-medium ${statusFilter === f.value ? 'bg-brand-primary text-white' : 'bg-white border text-gray-600'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {loading ? [...Array(3)].map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />) :
        reviews.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-500">No reviews found</div>
        ) : reviews.map((review) => (
          <div key={review.id} className={`bg-white rounded-xl border p-5 ${!review.isApproved ? 'border-l-4 border-l-yellow-400' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{review.name}</span>
                      {review.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                          <HiOutlineCheckCircle size={10} /> Verified
                        </span>
                      )}
                    </div>
                    {review.email && <p className="text-xs text-gray-400">{review.email}</p>}
                  </div>
                </div>
                {/* Product */}
                {review.product && (
                  <div className="flex items-center gap-2 mb-2 bg-gray-50 rounded-lg px-3 py-1.5 w-fit">
                    {review.product.images?.[0] && (
                      <img src={getImageUrl(review.product.images[0].url)} alt="" className="w-6 h-6 rounded object-cover" />
                    )}
                    <span className="text-xs text-gray-600 font-medium">{review.product.name}</span>
                  </div>
                )}
                {/* Rating */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <HiStar key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                </div>
                {/* Comment */}
                <p className="text-sm text-gray-600">{review.comment}</p>
                {/* Review Images */}
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {review.images.map((img, i) => (
                      <button key={i} onClick={() => setViewImages(review.images!)}
                        className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 hover:ring-2 hover:ring-brand-primary transition-all">
                        <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Actions */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${review.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {review.isApproved ? 'Approved' : 'Pending'}
                </span>
                <div className="flex gap-2">
                  {!review.isApproved && <button onClick={() => handleApprove(review.id)} className="text-green-600 hover:underline text-xs font-medium">Approve</button>}
                  <button onClick={() => handleDelete(review.id)} className="text-red-500 hover:underline text-xs">Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Image Lightbox */}
      {viewImages && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setViewImages(null)}>
          <div className="flex gap-3 max-w-3xl overflow-x-auto" onClick={(e) => e.stopPropagation()}>
            {viewImages.map((img, i) => (
              <img key={i} src={getImageUrl(img)} alt="" className="max-h-[70vh] rounded-xl object-contain" />
            ))}
          </div>
        </div>
      )}

      {/* Create Review Modal */}
      {showCreateModal && (
        <CreateReviewModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { fetchReviews(); fetchStats(); setShowCreateModal(false); }}
        />
      )}
    </div>
  );
}

// ─── Create Review Modal ────────────────────────────────────────────────────
function CreateReviewModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [productId, setProductId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/products?limit=100').then((data) => {
      const items = data.items || data;
      setProducts(Array.isArray(items) ? items.map((p: any) => ({ id: p.id, name: p.name })) : []);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !name || !comment) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/reviews/admin', {
        productId: parseInt(productId),
        name,
        email: email || undefined,
        rating,
        comment,
        isVerifiedPurchase: isVerified,
      });
      toast.success('Review created');
      onCreated();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create review');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-brand-dark mb-4">Add Review</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
            <select value={productId} onChange={(e) => setProductId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary">
              <option value="">Select a product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="Customer name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="Optional" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating *</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setRating(star)}>
                  <HiStar className={`w-7 h-7 ${star <= rating ? 'text-yellow-400' : 'text-gray-200'} hover:text-yellow-300 transition-colors`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comment *</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" placeholder="Review comment..." />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isVerified} onChange={(e) => setIsVerified(e.target.checked)}
              className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
            <span className="text-sm text-gray-700">Mark as Verified Purchase</span>
          </label>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={submitting}
              className="flex-1 bg-brand-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create Review'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
