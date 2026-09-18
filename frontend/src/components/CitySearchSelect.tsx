'use client';

import { useState, useRef, useEffect } from 'react';

interface CitySearchSelectProps {
  value: string;
  onChange: (city: string) => void;
  cities: string[];
}

export default function CitySearchSelect({ value, onChange, cities }: CitySearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = search
    ? cities.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
    : cities;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (city: string) => {
    onChange(city);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className={`w-full border rounded-lg px-4 py-3 cursor-pointer flex items-center justify-between transition-all duration-200 ${
          open ? 'border-brand-primary ring-2 ring-brand-primary' : 'border-brand-secondary/40 hover:border-brand-secondary'
        }`}
      >
        <span className={value ? 'text-brand-dark' : 'text-gray-400'}>{value || 'Search or select city...'}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
          <div className="p-2 border-b">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type city name..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-brand-primary"
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400">No city found</p>
            ) : (
              filtered.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleSelect(city)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-brand-bg transition-colors ${
                    city === value ? 'bg-brand-primary/10 text-brand-primary font-medium' : 'text-brand-dark'
                  }`}
                >
                  {city}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
