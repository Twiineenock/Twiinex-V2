import { useState, useEffect } from 'react';
import { Search, ShoppingBag, CheckCircle2, ArrowRight, ExternalLink, ShieldCheck, Truck, Lock } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const LandingPage = () => {
  const [searchId, setSearchId] = useState('');
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('twiinex_user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/pay/${searchId.trim()}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        {user ? (
          <div className="animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="mb-4 text-4xl">Welcome back, <span className="text-brand">{user.name}</span></h1>
            <p className="text-text-secondary max-w-2xl mx-auto mb-8">
              Manage your orders and create new trust links from your dashboard.
            </p>
            <Link to="/dashboard" className="btn-primary px-10 py-3 inline-flex items-center gap-2">
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="mb-4 text-4xl font-black tracking-tight">Secure Social Commerce with <span className="text-brand">Twiinex</span></h1>
            <p className="text-text-secondary max-w-2xl mx-auto text-lg">
              The trust layer for WhatsApp & Instagram trade. Secure payments in a blockchain-backed vault.
            </p>
          </div>
        )}
      </div>

      {/* Search Bar - Centralized */}
      <div className="max-w-2xl mx-auto mb-20">
        <div className="text-center mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Verify a Trust Link</span>
        </div>
        <form onSubmit={handleSearch} className="relative group">
          <input
            type="text"
            placeholder="Enter Link ID (e.g. TX-123456789)"
            className="w-full bg-secondary-bg border border-border-color rounded-xl px-6 py-5 pl-14 focus:outline-none focus:border-brand shadow-xl transition-all text-lg font-medium"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-text-muted group-focus-within:text-brand transition-colors" />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 btn-primary py-2.5 px-8 text-sm font-bold rounded-lg">
            Verify
          </button>
        </form>
      </div>

      {/* Brief Directions Section - Only for Logged Out */}
      {!user && (
        <div className="grid md:grid-cols-2 gap-12 mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {/* For Sellers */}
          <div className="bg-secondary-bg/50 border border-border-color p-8 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-brand/10 p-2 rounded-lg text-brand">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold">For Sellers</h3>
            </div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-text-secondary">
                <div className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-brand mt-0.5">1</div>
                <span>Create a secure link in seconds.</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-text-secondary">
                <div className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-brand mt-0.5">2</div>
                <span>Share with your buyer on WhatsApp/IG.</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-text-secondary">
                <div className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-brand mt-0.5">3</div>
                <span>Ship only when funds are secured in the vault.</span>
              </li>
            </ul>
            <Link to="/login" className="mt-8 text-brand font-bold text-sm flex items-center gap-2 hover:gap-3 transition-all">
              Start Selling Securely <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* For Buyers */}
          <div className="bg-secondary-bg/50 border border-border-color p-8 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-success/10 p-2 rounded-lg text-success">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold">For Buyers</h3>
            </div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-text-secondary">
                <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-success mt-0.5">1</div>
                <span>Verify the link ID above.</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-text-secondary">
                <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-success mt-0.5">2</div>
                <span>Pay securely into the Twiinex vault.</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-text-secondary">
                <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-success mt-0.5">3</div>
                <span>Release funds only after inspection.</span>
              </li>
            </ul>
            <p className="mt-8 text-xs text-text-muted font-medium">
              No login required for buyers. Just verify and pay.
            </p>
          </div>
        </div>
      )}

      {/* Trust Badges */}
      <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-brand" />
          <span className="text-[10px] font-black uppercase tracking-widest">Secured by Hedera</span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-brand" />
          <span className="text-[10px] font-black uppercase tracking-widest">Escrow Protection</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-brand" />
          <span className="text-[10px] font-black uppercase tracking-widest">Verified Vendors</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-20 pt-8 border-t border-border-color flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-text-muted uppercase font-bold tracking-widest">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shadow-[0_0_8px_#10b981]" />
          Network Status: Operational
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-brand transition-colors">Privacy</a>
          <a href="#" className="hover:text-brand transition-colors">Terms</a>
          <a href="https://hashscan.io" target="_blank" className="flex items-center gap-1 hover:text-brand transition-colors">
            Explorer <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
