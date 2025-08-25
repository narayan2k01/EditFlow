import React, { useState } from 'react';
import { Sun, Moon, Type } from 'lucide-react';
import Navbar from './Components/Navbar';
import TextForm from './Components/TextForm';

function App() {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const toggleMode = () => {
    setMode(prev => {
      const newMode = prev === 'light' ? 'dark' : 'light';
      document.body.style.backgroundColor = newMode === 'dark' ? '#0f172a' : '#f8fafc';
      return newMode;
    });
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  return (
    <div className={`min-h-screen ${mode === 'dark' ? 'dark' : ''}`}>
      <Navbar title="EditFlow" mode={mode} toggleMode={toggleMode} onSearch={handleSearch} />
      <main className="container mx-auto px-4 py-8">
        <TextForm mode={mode} searchTerm={searchTerm} />
      </main>
    </div>
  );
}

export default App;