import { useState } from 'react';
import { Search, ShieldCheck, ShoppingBag, CheckCircle2, ArrowRight, ExternalLink, HelpCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const LandingPage = () => {
  const [searchId, setSearchId] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/pay/${searchId.trim()}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="mb-4 text-4xl">Secure Social Commerce with <span className="text-brand">Twiinex</span></h1>
        <p className="text-text-secondary max-w-2xl mx-auto text-base">
          Twiinex protects your money during social media transactions. We hold payments in a secure vault and only release them when you receive your items.
        </p>
      </div>

      {/* Search Bar - Hashscan Style */}
      <div className="max-w-2xl mx-auto mb-20">
        <form onSubmit={handleSearch} className="relative group">
          <input
            type="text"
            placeholder="Enter Trust Link ID (e.g. TX-123456789)"
            className="w-full bg-secondary border border-border-color rounded-lg px-5 py-4 pl-12 focus:outline-none focus:border-brand shadow-sm transition-all"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-brand transition-colors" />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary py-2 px-6 text-sm">
            Verify Link
          </button>
        </form>
      </div>

      {/* Simplified "How it Works" */}
      <div className="grid md:grid-cols-3 gap-8 mb-20">
        <div className="section-card">
          <div className="bg-brand/10 w-10 h-10 rounded flex items-center justify-center mb-4 text-brand">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <h3 className="mb-2">1. Find a Vendor</h3>
          <p className="text-sm text-text-secondary">
            Look for sellers using Twiinex Trust Links on WhatsApp or Instagram.
          </p>
        </div>

        <div className="section-card">
          <div className="bg-brand/10 w-10 h-10 rounded flex items-center justify-center mb-4 text-brand">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="mb-2">2. Pay into Vault</h3>
          <p className="text-sm text-text-secondary">
            Pay safely via Mobile Money. Your funds are locked until the item is delivered.
          </p>
        </div>

        <div className="section-card">
          <div className="bg-brand/10 w-10 h-10 rounded flex items-center justify-center mb-4 text-brand">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="mb-2">3. Confirm & Release</h3>
          <p className="text-sm text-text-secondary">
            Once you have the item, confirm receipt to release payment to the vendor.
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="section-card text-center bg-brand/5 border-brand/20 py-12">
        <h2 className="mb-4">Are you a Business?</h2>
        <p className="text-text-secondary mb-8 max-w-xl mx-auto">
          Start building trust with your customers. Create secure payment links in seconds and manage all your orders in one clean dashboard.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/login" className="btn-primary px-10 py-3 flex items-center gap-2">
            Get Started as Vendor <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/how-it-works" className="btn-outline px-10 py-3 flex items-center gap-2">
            Learn More <HelpCircle className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Blockchain Proof Footer */}
      <div className="mt-20 pt-8 border-t border-border-color flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-muted uppercase font-semibold">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          Powered by Hedera HCS & Hiero Java
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-brand flex items-center gap-1">Security Audit <ExternalLink className="w-3 h-3" /></a>
          <a href="#" className="hover:text-brand flex items-center gap-1">Terms of Service</a>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
