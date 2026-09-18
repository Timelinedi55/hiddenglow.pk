'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import toast from 'react-hot-toast';
import { HiOutlineTrash, HiOutlineUpload, HiOutlineClipboardCopy, HiOutlineFilter, HiOutlineSearch, HiOutlineViewGrid, HiOutlineViewList } from 'react-icons/hi';

interface MediaFile {
  url: string;
  filename: string;
  folder: string;
  size: number;
  modified: string;
}

export default function AdminMedia() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'modified' | 'name' | 'size'>('modified');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [dragging, setDragging] = useState(false);
  const [uploadFolder, setUploadFolder] = useState<'products' | 'categories' | 'settings'>('products');
  const dropRef = useRef<HTMLDivElement>(null);

  const loadFiles = useCallback(async () => {
    try {
      const data = await api.get('/upload/list');
      setFiles(data);
    } catch { toast.error('Failed to load media'); }
    setLoading(false);
  }, []);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const uploadFiles = async (fileList: FileList | File[]) => {
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        await api.upload(file, uploadFolder);
      }
      toast.success(`${fileList.length} file(s) uploaded`);
      loadFiles();
    } catch { toast.error('Upload failed'); }
    setUploading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    await uploadFiles(fileList);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  };

  const handleDelete = async (file: MediaFile) => {
    if (!confirm(`Delete ${file.filename}?`)) return;
    try {
      await api.delete(`/upload/${file.folder}/${file.filename}`);
      toast.success('Deleted');
      setFiles((prev) => prev.filter((f) => f.url !== file.url));
      setSelected((prev) => { const n = new Set(prev); n.delete(file.url); return n; });
    } catch { toast.error('Failed to delete'); }
  };

  const handleBulkDelete = async () => {
    if (!selected.size) return;
    if (!confirm(`Delete ${selected.size} file(s)?`)) return;
    const toDelete = files.filter((f) => selected.has(f.url));
    let ok = 0;
    for (const file of toDelete) {
      try { await api.delete(`/upload/${file.folder}/${file.filename}`); ok++; } catch {}
    }
    toast.success(`${ok} file(s) deleted`);
    setSelected(new Set());
    loadFiles();
  };

  const copyUrl = (url: string) => { navigator.clipboard.writeText(url); toast.success('URL copied'); };

  const toggleSelect = (url: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(url)) n.delete(url); else n.add(url);
      return n;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((f) => f.url)));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  let filtered = filter === 'all' ? files : files.filter((f) => f.folder === filter);
  if (search) filtered = filtered.filter((f) => f.filename.toLowerCase().includes(search.toLowerCase()));
  filtered.sort((a, b) => {
    if (sortBy === 'name') return a.filename.localeCompare(b.filename);
    if (sortBy === 'size') return b.size - a.size;
    return new Date(b.modified).getTime() - new Date(a.modified).getTime();
  });

  const folders = Array.from(new Set(files.map((f) => f.folder)));
  const totalSize = filtered.reduce((s, f) => s + f.size, 0);

  return (
    <div ref={dropRef}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`relative ${dragging ? 'ring-2 ring-brand-primary ring-dashed rounded-xl' : ''}`}>

      {dragging && (
        <div className="absolute inset-0 bg-brand-primary/10 z-30 flex items-center justify-center rounded-xl pointer-events-none">
          <p className="text-brand-primary font-semibold text-lg">Drop files to upload</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Media Gallery</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} files &middot; {formatSize(totalSize)}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={uploadFolder} onChange={(e) => setUploadFolder(e.target.value as 'products' | 'categories' | 'settings')}
            className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none">
            <option value="products">Products</option>
            <option value="categories">Categories</option>
            <option value="settings">Settings</option>
          </select>
          <label className="btn-primary cursor-pointer flex items-center gap-2 text-sm">
            <HiOutlineUpload size={16} />
            {uploading ? 'Uploading...' : 'Upload'}
            <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files..."
            className="w-full border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
        </div>
        <div className="flex items-center gap-1">
          <HiOutlineFilter className="text-gray-400" size={14} />
          <button onClick={() => setFilter('all')} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${filter === 'all' ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-600'}`}>All</button>
          {folders.map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize ${filter === f ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-600'}`}>{f}</button>
          ))}
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
          className="border rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none">
          <option value="modified">Newest</option>
          <option value="name">Name</option>
          <option value="size">Size</option>
        </select>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}><HiOutlineViewGrid size={14} /></button>
          <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}><HiOutlineViewList size={14} /></button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 bg-brand-bg border border-brand-secondary/30 rounded-lg px-4 py-2.5">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <button onClick={handleBulkDelete} className="text-red-600 text-sm hover:underline">Delete Selected</button>
          <button onClick={() => setSelected(new Set())} className="text-gray-500 text-sm hover:underline ml-auto">Clear</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[...Array(12)].map((_, i) => <div key={i} className="skeleton aspect-square rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border">
          <p className="text-gray-400 text-lg mb-1">No media files found</p>
          <p className="text-gray-300 text-sm">Upload images or drag & drop files here</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map((file) => (
            <div key={file.url}
              className={`group relative aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                selected.has(file.url) ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-transparent hover:border-gray-300'
              }`} onClick={() => toggleSelect(file.url)}>
              <img src={getImageUrl(file.url)} alt={file.filename} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute top-2 left-2">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center text-[10px] font-bold transition-colors ${
                  selected.has(file.url) ? 'bg-brand-primary border-brand-primary text-white' : 'bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100'
                }`}>{selected.has(file.url) ? '✓' : ''}</div>
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                <button onClick={(e) => { e.stopPropagation(); copyUrl(file.url); }}
                  className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-100" title="Copy URL">
                  <HiOutlineClipboardCopy size={12} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
                  className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600" title="Delete">
                  <HiOutlineTrash size={12} />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-[9px] truncate">{file.filename}</p>
                <p className="text-white/70 text-[8px]">{formatSize(file.size)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="w-8 px-3 py-2"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={selectAll} /></th>
                <th className="text-left px-3 py-2 font-medium">Preview</th>
                <th className="text-left px-3 py-2 font-medium">Filename</th>
                <th className="text-left px-3 py-2 font-medium">Folder</th>
                <th className="text-left px-3 py-2 font-medium">Size</th>
                <th className="text-left px-3 py-2 font-medium">Date</th>
                <th className="text-left px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((file) => (
                <tr key={file.url} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2"><input type="checkbox" checked={selected.has(file.url)} onChange={() => toggleSelect(file.url)} /></td>
                  <td className="px-3 py-2"><img src={getImageUrl(file.url)} alt="" className="w-8 h-8 rounded object-cover" /></td>
                  <td className="px-3 py-2 font-medium truncate max-w-[200px]">{file.filename}</td>
                  <td className="px-3 py-2 text-gray-500 capitalize">{file.folder}</td>
                  <td className="px-3 py-2 text-gray-500">{formatSize(file.size)}</td>
                  <td className="px-3 py-2 text-gray-500">{new Date(file.modified).toLocaleDateString()}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button onClick={() => copyUrl(file.url)} className="text-blue-600 hover:underline text-xs">Copy</button>
                      <button onClick={() => handleDelete(file)} className="text-red-500 hover:underline text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
