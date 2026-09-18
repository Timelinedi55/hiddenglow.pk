'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { getImageUrl, formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlineAdjustments } from 'react-icons/hi';

interface InventoryVariant {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  productImage: string | null;
  size: string;
  color: string;
  colorCode: string | null;
  sku: string;
  stock: number;
  variantPrice: number | null;
  costPrice: number | null;
  variantImage: string | null;
  isActive: boolean;
  productPrice: number;
  productCostPrice: number | null;
}

interface InventoryStats {
  totalVariants: number;
  outOfStock: number;
  lowStock: number;
  inStock: number;
  totalUnits: number;
  stockValue: number;
}

export default function AdminInventory() {
  const [variants, setVariants] = useState<InventoryVariant[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [sort, setSort] = useState('stock_asc');
  const [loading, setLoading] = useState(true);
  const [editingStock, setEditingStock] = useState<{ id: number; stock: number } | null>(null);

  const fetchInventory = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '30', sort });
    if (search) params.set('search', search);
    if (stockFilter !== 'all') params.set('stock', stockFilter);
    api.get(`/orders/admin/inventory?${params}`).then((data) => {
      setVariants(data.items); setTotal(data.total); setTotalPages(data.totalPages); setLoading(false);
    }).catch(() => setLoading(false));
  }, [page, search, stockFilter, sort]);

  const fetchStats = useCallback(() => {
    api.get('/orders/admin/inventory/stats').then(setStats).catch(() => {});
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleStockUpdate = async () => {
    if (!editingStock) return;
    try {
      await api.put(`/orders/admin/inventory/${editingStock.id}/stock`, { stock: editingStock.stock });
      toast.success('Stock updated');
      setEditingStock(null);
      fetchInventory();
      fetchStats();
    } catch { toast.error('Failed to update'); }
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) return 'bg-red-100 text-red-700';
    if (stock <= 5) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">{total} variants total</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white rounded-xl border p-4">
            <p className="text-2xl font-bold text-brand-dark">{stats.totalUnits}</p>
            <p className="text-xs text-gray-500">Total Units</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-2xl font-bold text-green-600">{stats.inStock}</p>
            <p className="text-xs text-gray-500">In Stock</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
            <p className="text-xs text-gray-500">Low Stock</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
            <p className="text-xs text-gray-500">Out of Stock</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-2xl font-bold text-brand-dark">{stats.totalVariants}</p>
            <p className="text-xs text-gray-500">Variants</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-2xl font-bold text-brand-dark">{formatPrice(stats.stockValue)}</p>
            <p className="text-xs text-gray-500">Stock Value</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); fetchInventory(); }} className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, SKU, color..."
              className="w-full border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
          </div>
          <button type="submit" className="btn-primary px-4 text-sm">Search</button>
        </form>
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'out', label: 'Out of Stock' },
            { value: 'low', label: 'Low (1-5)' },
            { value: 'in', label: 'In Stock' },
          ].map((f) => (
            <button key={f.value} onClick={() => { setStockFilter(f.value); setPage(1); }}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${stockFilter === f.value ? 'bg-brand-primary text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary">
          <option value="stock_asc">Stock: Low → High</option>
          <option value="stock_desc">Stock: High → Low</option>
          <option value="name_asc">Name: A → Z</option>
          <option value="name_desc">Name: Z → A</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Product</th>
                <th className="text-left px-4 py-3 font-medium">Size</th>
                <th className="text-left px-4 py-3 font-medium">Color</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">SKU</th>
                <th className="text-left px-4 py-3 font-medium text-center">Stock</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Price</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Cost</th>
                <th className="text-left px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(8)].map((_, i) => <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="skeleton h-10 w-full" /></td></tr>) :
              variants.length === 0 ? <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No variants found</td></tr> :
              variants.map((v) => (
                <tr key={v.id} className={`border-b ${v.stock === 0 ? 'bg-red-50/50' : 'hover:bg-gray-50'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {(v.variantImage || v.productImage) && <img src={getImageUrl(v.variantImage || v.productImage!)} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <span className="font-medium text-sm truncate max-w-[160px]">{v.productName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{v.size || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {v.colorCode && <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: v.colorCode }} />}
                      <span>{v.color || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-500 font-mono text-xs">{v.sku || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {editingStock?.id === v.id ? (
                      <div className="flex items-center gap-1 justify-center">
                        <input type="number" min="0" value={editingStock.stock}
                          onChange={(e) => setEditingStock({ ...editingStock, stock: parseInt(e.target.value) || 0 })}
                          className="w-16 border rounded px-2 py-1 text-center text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary"
                          autoFocus onKeyDown={(e) => e.key === 'Enter' && handleStockUpdate()} />
                        <button onClick={handleStockUpdate} className="text-green-600 text-xs font-medium">✓</button>
                        <button onClick={() => setEditingStock(null)} className="text-gray-400 text-xs">✕</button>
                      </div>
                    ) : (
                      <button onClick={() => setEditingStock({ id: v.id, stock: v.stock })}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer hover:opacity-80 ${getStockBadge(v.stock)}`}>
                        {v.stock === 0 ? 'OUT' : v.stock}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">{formatPrice(v.variantPrice || v.productPrice)}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-gray-500">{v.costPrice || v.productCostPrice ? formatPrice(v.costPrice || v.productCostPrice!) : '—'}</td>
                  <td className="px-4 py-3">
                    <a href={`/admin/products/${v.productId}`} className="text-brand-primary hover:underline text-xs">Edit</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-2 rounded-lg text-sm bg-white border disabled:opacity-40">←</button>
          <span className="px-3 py-2 text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-2 rounded-lg text-sm bg-white border disabled:opacity-40">→</button>
        </div>
      )}
    </div>
  );
}
