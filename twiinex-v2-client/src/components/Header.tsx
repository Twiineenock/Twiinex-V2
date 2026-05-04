import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, LogOut } from 'lucide-react';
import TwiinexLogo from './TwiinexLogo';


const Header = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const storedUser = localStorage.getItem('twiinex_user');
    if (storedUser) setUser(JSON.parse(storedUser));
    
    // Listen for storage changes (for login/logout across tabs)
    const handleStorage = () => {
      const u = localStorage.getItem('twiinex_user');
      setUser(u ? JSON.parse(u) : null);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    localStorage.removeItem('twiinex_user');
    setUser(null);
    window.location.href = '/';
  };



  return (
    <header className="h-[80px] border-b border-border-color bg-primary-bg sticky top-0 z-50 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
          <TwiinexLogo theme={theme as 'dark' | 'light'} className="h-10 md:h-12 w-auto" />
        </Link>
        
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="text-text-secondary hover:text-brand">Home</Link>
          {user && <Link to="/dashboard" className="text-text-secondary hover:text-brand">Dashboard</Link>}
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
        
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold leading-none mb-1">{user.name}</p>
              <p className="text-[10px] text-text-muted leading-none font-mono">{user.phone}</p>
            </div>
            <Link to="/dashboard" className="w-8 h-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center group hover:bg-brand/20 transition-all">
              <span className="text-brand text-xs font-bold uppercase">{user.name?.charAt(0)}</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="p-2 text-text-muted hover:text-brand transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn-primary text-sm px-4">
            Vendor Login
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
