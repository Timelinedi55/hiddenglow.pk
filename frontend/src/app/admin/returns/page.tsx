'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { getImageUrl, formatPrice } from '@/lib/utils';
import {
  HiOutlineSearch, HiOutlineRefresh, HiOutlineTruck, HiOutlineCheck,
  HiOutlineX, HiOutlineCurrencyDollar, HiOutlineClipboardCheck, HiOutlineQrcode,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

interface ReturnItem {
  id: number;
  orderItemId: number;
  productId: number;
  variantId: number | null;
  productName: string;
  size: string | null;
  color: string | null;
  quantity: number;
  price: number;
  productImage: string | null;
  condition: string;
}

interface ReturnOrder {
  id: number;
  returnNumber: string;
  orderId: number;
  order?: {
    orderNumber: string;
    customerName: string;
    phone: string;
    city: string;
    total: number;
  };
  status: string;
  reason: string;
  reasonDetail: string | null;
  adminNote: string | null;
  refundAmount: number;
  refundMethod: string | null;
  refundId: number | null;
  items: ReturnItem[];
  createdAt: string;
  updatedAt: string;
}

interface ReturnStats {
  total: number;
  requested: number;
  approved: number;
  received: number;
  refunded: number;
  rejected: number;
  totalRefundedAmount: number;
  byReason: { reason: string; count: string }[];
}

const statusColors: Record<string, string> = {
  requested: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  picked_up: 'bg-indigo-100 text-indigo-700',
  received: 'bg-purple-100 text-purple-700',
  refunded: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const statusFlow = ['requested', 'approved', 'picked_up', 'received', 'refunded'];

const reasonLabels: Record<string, string> = {
  defective: 'Defective Product',
  wrong_size: 'Wrong Size',
  wrong_item: 'Wrong Item Received',
  not_needed: 'No Longer Needed',
  other: 'Other',
};

export default function AdminReturns() {
  const [returns, setReturns] = useState<ReturnOrder[]>([]);
  const [stats, setStats] = useState<ReturnStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedReturn, setSelectedReturn] = useState<ReturnOrder | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [scannerInput, setScannerInput] = useState('');

  const handleScan = async () => {
    if (!scannerInput.trim()) return;
    const query = scannerInput.trim();
    // Search in returns by return number or order number
    try {
      const data = await api.get(`/returns/admin/list?search=${encodeURIComponent(query)}`);
      const items = data.items || [];
      if (items.length > 0) {
        setSelectedReturn(items[0]);
        setScannerInput('');
        toast.success(`Found return: ${items[0].returnNumber}`);
      } else {
        // Try to find the order and open create return modal
        toast.error('No return found. Use "New Return" to create one for this order.');
      }
    } catch {
      toast.error('Search failed');
    }
  };

  const fetchReturns = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('search', search);
    api.get(`/returns/admin/list?${params}`).then((data) => {
      setReturns(data.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [statusFilter, search]);

  const fetchStats = useCallback(() => {
    api.get('/returns/admin/stats').then(setStats).catch(() => {});
  }, []);

  useEffect(() => { fetchReturns(); }, [fetchReturns]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.put(`/returns/admin/${id}/status`, { status });
      toast.success(`Status updated to ${status}`);
      fetchReturns();
      fetchStats();
    } catch { toast.error('Failed to update status'); }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-dark">Returns & Exchanges</h1>
        <button onClick={() => setShowCreateModal(true)}
          className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-primary/90">
          + New Return
        </button>
      </div>

      {/* Scanner Input */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex items-center gap-3">
          <HiOutlineQrcode className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={scannerInput}
            onChange={(e) => setScannerInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleScan(); } }}
            placeholder="Scan barcode or enter return/order number..."
            className="flex-1 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <button onClick={handleScan} className="bg-brand-dark text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-brand-dark/90">
            Lookup
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'text-brand-dark' },
            { label: 'Requested', value: stats.requested, color: 'text-yellow-600' },
            { label: 'Approved', value: stats.approved, color: 'text-blue-600' },
            { label: 'Received', value: stats.received, color: 'text-purple-600' },
            { label: 'Refunded', value: stats.refunded, color: 'text-green-600' },
            { label: 'Rejected', value: stats.rejected, color: 'text-red-600' },
            { label: 'Refund Total', value: formatPrice(stats.totalRefundedAmount), color: 'text-brand-dark' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border p-3">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <form onSubmit={(e) => { e.preventDefault(); fetchReturns(); }} className="relative flex-1 min-w-[180px]">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by return #, order #, customer..."
            className="w-full border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
        </form>
        <div className="flex gap-1 flex-wrap">
          {['all', 'requested', 'approved', 'picked_up', 'received', 'refunded', 'rejected'].map((f) => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-medium capitalize ${statusFilter === f ? 'bg-brand-primary text-white' : 'bg-white border text-gray-600'}`}>
              {f === 'all' ? 'All' : f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Returns List */}
      <div className="space-y-3">
        {loading ? [...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />) :
        returns.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-500">No returns found</div>
        ) : returns.map((ret) => (
          <div key={ret.id} className="bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono font-semibold text-sm text-brand-dark">{ret.returnNumber}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${statusColors[ret.status] || 'bg-gray-100 text-gray-600'}`}>
                    {ret.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(ret.createdAt)}</span>
                </div>
                {ret.order && (
                  <div className="text-xs text-gray-500 mb-2">
                    Order <span className="font-medium text-gray-700">{ret.order.orderNumber}</span> • {ret.order.customerName} • {ret.order.phone} • {ret.order.city}
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{reasonLabels[ret.reason] || ret.reason}</span>
                  <span className="text-sm font-semibold text-brand-dark">{formatPrice(ret.refundAmount)}</span>
                </div>
                {/* Items preview */}
                <div className="flex gap-2 flex-wrap">
                  {ret.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1">
                      {item.productImage && (
                        <img src={getImageUrl(item.productImage)} alt="" className="w-6 h-6 rounded object-cover" />
                      )}
                      <span className="text-[11px] text-gray-600">{item.productName} {item.size && `(${item.size})`} ×{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Actions */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <button onClick={() => setSelectedReturn(ret)} className="text-brand-primary hover:underline text-xs font-medium">
                  View Details
                </button>
                {ret.status !== 'refunded' && ret.status !== 'rejected' && (
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    {ret.status === 'requested' && (
                      <>
                        <button onClick={() => handleStatusChange(ret.id, 'approved')}
                          className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-[11px] font-medium">Approve</button>
                        <button onClick={() => handleStatusChange(ret.id, 'rejected')}
                          className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-[11px] font-medium">Reject</button>
                      </>
                    )}
                    {ret.status === 'approved' && (
                      <button onClick={() => handleStatusChange(ret.id, 'picked_up')}
                        className="text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded text-[11px] font-medium">Mark Picked Up</button>
                    )}
                    {ret.status === 'picked_up' && (
                      <button onClick={() => handleStatusChange(ret.id, 'received')}
                        className="text-purple-600 hover:bg-purple-50 px-2 py-1 rounded text-[11px] font-medium">Mark Received</button>
                    )}
                    {ret.status === 'received' && (
                      <button onClick={() => handleStatusChange(ret.id, 'refunded')}
                        className="text-green-600 hover:bg-green-50 px-2 py-1 rounded text-[11px] font-medium">Process Refund</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedReturn && (
        <ReturnDetailModal
          returnOrder={selectedReturn}
          onClose={() => setSelectedReturn(null)}
          onRefresh={() => { fetchReturns(); fetchStats(); setSelectedReturn(null); }}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateReturnModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { fetchReturns(); fetchStats(); setShowCreateModal(false); }}
        />
      )}
    </div>
  );
}

// ─── Detail Modal ──────────────────────────────────────────────────────────────
function ReturnDetailModal({ returnOrder, onClose, onRefresh }: {
  returnOrder: ReturnOrder;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [adminNote, setAdminNote] = useState(returnOrder.adminNote || '');
  const [refundMethod, setRefundMethod] = useState(returnOrder.refundMethod || '');
  const [saving, setSaving] = useState(false);

  const handleStatusUpdate = async (status: string) => {
    setSaving(true);
    try {
      await api.put(`/returns/admin/${returnOrder.id}/status`, { status, adminNote, refundMethod });
      toast.success(`Return ${status}`);
      onRefresh();
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const handleConditionUpdate = async (itemId: number, condition: string) => {
    try {
      await api.put(`/returns/admin/item/${itemId}/condition`, { condition });
      toast.success('Condition updated');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-brand-dark">{returnOrder.returnNumber}</h2>
            <p className="text-xs text-gray-500">Order: {returnOrder.order?.orderNumber}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[returnOrder.status]}`}>
            {returnOrder.status.replace('_', ' ')}
          </span>
        </div>

        {/* Customer */}
        {returnOrder.order && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
            <p><span className="text-gray-500">Customer:</span> {returnOrder.order.customerName}</p>
            <p><span className="text-gray-500">Phone:</span> {returnOrder.order.phone}</p>
            <p><span className="text-gray-500">Reason:</span> {reasonLabels[returnOrder.reason] || returnOrder.reason}</p>
            {returnOrder.reasonDetail && <p><span className="text-gray-500">Details:</span> {returnOrder.reasonDetail}</p>}
          </div>
        )}

        {/* Items */}
        <h3 className="font-semibold text-sm mb-2">Return Items</h3>
        <div className="space-y-2 mb-4">
          {returnOrder.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
              {item.productImage && (
                <img src={getImageUrl(item.productImage)} alt="" className="w-12 h-12 rounded-lg object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.productName}</p>
                <p className="text-xs text-gray-500">
                  {item.size && `Size: ${item.size}`} {item.color && `• Color: ${item.color}`} • Qty: {item.quantity} • {formatPrice(item.price)}
                </p>
              </div>
              <select
                value={item.condition}
                onChange={(e) => handleConditionUpdate(item.id, e.target.value)}
                className="text-xs border rounded-lg px-2 py-1"
              >
                <option value="pending">Pending</option>
                <option value="good">Good</option>
                <option value="damaged">Damaged</option>
                <option value="missing">Missing</option>
              </select>
            </div>
          ))}
        </div>

        {/* Refund Info */}
        <div className="bg-brand-cream/50 rounded-lg p-3 mb-4">
          <p className="text-sm"><span className="text-gray-500">Refund Amount:</span> <span className="font-bold text-brand-dark">{formatPrice(returnOrder.refundAmount)}</span></p>
          <div className="mt-2">
            <label className="text-xs text-gray-500 block mb-1">Refund Method</label>
            <select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)}
              className="text-sm border rounded-lg px-3 py-1.5 w-full">
              <option value="">Select method...</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="easypaisa">Easypaisa</option>
              <option value="jazzcash">JazzCash</option>
              <option value="store_credit">Store Credit</option>
            </select>
          </div>
        </div>

        {/* Admin Note */}
        <label className="text-xs text-gray-500 block mb-1">Admin Note</label>
        <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm mb-4 min-h-[60px]" placeholder="Internal notes..." />

        {/* Status Actions */}
        {returnOrder.status !== 'refunded' && returnOrder.status !== 'rejected' && (
          <div className="flex gap-2 flex-wrap">
            {returnOrder.status === 'requested' && (
              <>
                <button onClick={() => handleStatusUpdate('approved')} disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  <HiOutlineCheck className="inline mr-1" /> Approve Return
                </button>
                <button onClick={() => handleStatusUpdate('rejected')} disabled={saving}
                  className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 disabled:opacity-50">
                  Reject
                </button>
              </>
            )}
            {returnOrder.status === 'approved' && (
              <button onClick={() => handleStatusUpdate('picked_up')} disabled={saving}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                <HiOutlineTruck className="inline mr-1" /> Mark Picked Up
              </button>
            )}
            {returnOrder.status === 'picked_up' && (
              <button onClick={() => handleStatusUpdate('received')} disabled={saving}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                <HiOutlineClipboardCheck className="inline mr-1" /> Mark Received (Restocks Items)
              </button>
            )}
            {returnOrder.status === 'received' && (
              <button onClick={() => handleStatusUpdate('refunded')} disabled={saving}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                <HiOutlineCurrencyDollar className="inline mr-1" /> Process Refund
              </button>
            )}
          </div>
        )}

        <button onClick={onClose} className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700">Close</button>
      </div>
    </div>
  );
}

// ─── Create Return Modal ───────────────────────────────────────────────────────
function CreateReturnModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [orderId, setOrderId] = useState('');
  const [orderData, setOrderData] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [reasonDetail, setReasonDetail] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [fetchingOrder, setFetchingOrder] = useState(false);

  const fetchOrder = async () => {
    if (!orderId) return;
    setFetchingOrder(true);
    try {
      const data = await api.get(`/returns/admin/order/${orderId}`);
      setOrderData(data);
    } catch { toast.error('Order not found'); }
    setFetchingOrder(false);
  };

  const toggleItem = (itemId: number, maxQty: number) => {
    setSelectedItems((prev) => {
      const copy = { ...prev };
      if (copy[itemId]) { delete copy[itemId]; }
      else { copy[itemId] = Math.min(1, maxQty); }
      return copy;
    });
  };

  const updateQty = (itemId: number, qty: number, maxQty: number) => {
    setSelectedItems((prev) => ({ ...prev, [itemId]: Math.max(1, Math.min(qty, maxQty)) }));
  };

  const handleSubmit = async () => {
    if (!orderData || !reason || Object.keys(selectedItems).length === 0) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/returns/admin', {
        orderId: orderData.id,
        reason,
        reasonDetail: reasonDetail || undefined,
        items: Object.entries(selectedItems).map(([orderItemId, quantity]) => ({
          orderItemId: parseInt(orderItemId),
          quantity,
        })),
      });
      toast.success('Return created');
      onCreated();
    } catch (e: any) { toast.error(e.message || 'Failed'); }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-brand-dark mb-4">Create Return</h2>

        {/* Order Lookup */}
        <div className="flex gap-2 mb-4">
          <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter Order ID" className="flex-1 border rounded-lg px-3 py-2 text-sm" />
          <button onClick={fetchOrder} disabled={fetchingOrder}
            className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
            {fetchingOrder ? '...' : 'Fetch'}
          </button>
        </div>

        {orderData && (
          <>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
              <p className="font-medium">{orderData.orderNumber} — {orderData.customerName}</p>
              <p className="text-xs text-gray-500">{orderData.phone} • {orderData.city} • Status: {orderData.status}</p>
            </div>

            {/* Select Items */}
            <h3 className="text-sm font-semibold mb-2">Select Items to Return</h3>
            <div className="space-y-2 mb-4">
              {orderData.items.map((item: any) => (
                <div key={item.id} className={`flex items-center gap-3 rounded-lg p-3 border cursor-pointer transition-colors ${
                  selectedItems[item.id] ? 'bg-brand-cream/30 border-brand-primary' : 'bg-white hover:bg-gray-50'
                } ${item.returnableQty <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => item.returnableQty > 0 && toggleItem(item.id, item.returnableQty)}>
                  {item.productImage && (
                    <img src={getImageUrl(item.productImage)} alt="" className="w-10 h-10 rounded object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.productName}</p>
                    <p className="text-[11px] text-gray-500">
                      {item.size && `${item.size}`} {item.color && `• ${item.color}`} • Qty: {item.quantity}
                      {item.alreadyReturned > 0 && ` (${item.alreadyReturned} already returned)`}
                    </p>
                  </div>
                  {selectedItems[item.id] && (
                    <input type="number" min={1} max={item.returnableQty}
                      value={selectedItems[item.id]}
                      onChange={(e) => updateQty(item.id, parseInt(e.target.value) || 1, item.returnableQty)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-14 border rounded px-2 py-1 text-sm text-center" />
                  )}
                </div>
              ))}
            </div>

            {/* Reason */}
            <label className="text-xs text-gray-500 block mb-1">Return Reason *</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-3">
              <option value="">Select reason...</option>
              <option value="defective">Defective Product</option>
              <option value="wrong_size">Wrong Size</option>
              <option value="wrong_item">Wrong Item Received</option>
              <option value="not_needed">No Longer Needed</option>
              <option value="other">Other</option>
            </select>

            <label className="text-xs text-gray-500 block mb-1">Additional Details</label>
            <textarea value={reasonDetail} onChange={(e) => setReasonDetail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4 min-h-[60px]" placeholder="Customer's description..." />

            <button onClick={handleSubmit} disabled={submitting}
              className="w-full bg-brand-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-brand-primary/90 disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create Return Request'}
            </button>
          </>
        )}

        <button onClick={onClose} className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
      </div>
    </div>
  );
}
