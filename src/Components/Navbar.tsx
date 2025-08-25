import React, { useState } from 'react';
import { Sun, Moon, Type, Search, X } from 'lucide-react';

interface NavbarProps {
  title: string;
  mode: 'light' | 'dark';
  toggleMode: () => void;
  onSearch: (term: string) => void;
}

export default function Navbar({ title, mode, toggleMode, onSearch }: NavbarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <nav className={`sticky top-0 z-50 border-b ${
      mode === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      <div className="container mx-auto px-4">
        {/* Simplified flex row layout for all screen sizes */}
        <div className="flex items-center justify-between gap-3 h-16">
          
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Type className={`w-6 h-6 ${mode === 'dark' ? 'text-blue-400' : 'text-blue-600'} mr-2`} />
            <a href="/" className={`text-xl font-bold ${
              mode === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              {title}
            </a>
          </div>

          {/* Search and Theme Toggle */}
          <div className="flex items-center gap-2 flex-grow min-w-0">
            <form onSubmit={handleSearch} className="relative flex-grow min-w-0">
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className={`w-full pl-4 pr-10 py-2 rounded-lg outline-none transition-colors text-sm ${
                  mode === 'dark' 
                    ? 'bg-slate-800 text-white placeholder:text-slate-400 focus:bg-slate-700'
                    : 'bg-slate-100 text-slate-900 placeholder:text-slate-500 focus:bg-slate-200'
                }`}
              />
              <div className="absolute right-2 top-2.5 flex items-center gap-2">
                {searchTerm && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className={`p-0.5 rounded-full hover:bg-slate-700 ${
                      mode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className={`p-0.5 ${
                    mode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>

            <button
              onClick={toggleMode}
              className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                mode === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
              }`}
            >
              {mode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}