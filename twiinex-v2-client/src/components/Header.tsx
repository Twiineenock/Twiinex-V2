import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, ShieldCheck, Github } from 'lucide-react';

const Header = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="h-[64px] border-b border-border-color bg-primary sticky top-0 z-50 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="bg-brand p-1.5 rounded">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Twiinex<span className="text-brand">V2</span></span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="text-text-secondary hover:text-brand">Home</Link>
          <Link to="/dashboard" className="text-text-secondary hover:text-brand">Dashboard</Link>
          <a href="https://hashscan.io/testnet" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-brand flex items-center gap-1">
            Hashscan <Github className="w-3 h-3" />
          </a>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTheme}
          className="btn-outline p-2 rounded-full"
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
        
        <Link to="/login" className="btn-primary text-sm px-4">
          Vendor Login
        </Link>
      </div>
    </header>
  );
};

export default Header;
