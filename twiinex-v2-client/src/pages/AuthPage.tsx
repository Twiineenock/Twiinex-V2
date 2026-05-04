import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Mail, Phone, User, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { signup, signin } from '../api/escrow';

const AuthPage = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = mode === 'login' 
        ? await signin({ email: formData.email, password: formData.password })
        : await signup(formData);

      if (result.success) {
        localStorage.setItem('twiinex_user', JSON.stringify(result.user));
        navigate('/dashboard');
      } else {
        setError(result.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex overflow-hidden">
      {/* Left Side: Branding & Info */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center p-12 overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-transparent opacity-50" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.1),transparent)]" />
        
        <div className="relative z-10 max-w-xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(139,92,246,0.4)]">
              <Shield className="text-white w-8 h-8" />
            </div>
            <h1 className="text-6xl font-black text-white tracking-tighter mb-6 leading-none">
              SECURE YOUR <span className="text-brand">FUTURE</span> TRANSACTIONS.
            </h1>
            <p className="text-xl text-gray-400 font-medium mb-12 leading-relaxed">
              Twiinex provides institutional-grade escrow services powered by Hiero Enterprise Java and Hedera DLT.
            </p>

            <div className="space-y-6">
              {[
                { title: 'On-Chain Proof', desc: 'Every transaction is immutable and verifiable.' },
                { title: 'Smart Contracts', desc: 'Funds are locked in secure, audited code.' },
                { title: 'Real-time Stats', desc: 'Track your growth with our advanced dashboard.' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1 w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center">
                    <CheckCircle2 className="text-brand w-3 h-3" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm uppercase tracking-widest">{item.title}</h4>
                    <p className="text-gray-500 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-24 relative">
        <div className="max-w-md w-full">
          <div className="mb-12">
            <h2 className="text-4xl font-black text-white tracking-tight mb-2 uppercase">
              {mode === 'login' ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p className="text-gray-400 font-medium">
              {mode === 'login' ? 'Enter your credentials to access your vault.' : 'Create your vendor account in seconds.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold"
                >
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {mode === 'register' && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input 
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 focus:border-brand focus:outline-none transition-all text-white font-medium"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Phone Number / Account ID</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input 
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 focus:border-brand focus:outline-none transition-all text-white font-medium"
                      placeholder="0.0.12345"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 focus:border-brand focus:outline-none transition-all text-white font-medium"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Password</label>
                {mode === 'login' && <Link to="#" className="text-[10px] font-black uppercase tracking-widest text-brand hover:underline">Forgot?</Link>}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 focus:border-brand focus:outline-none transition-all text-white font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary py-5 flex items-center justify-center gap-2 group text-base"
            >
              {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>

            <div className="text-center pt-6">
              <button 
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-sm font-medium text-gray-500"
              >
                {mode === 'login' ? "Don't have an account?" : "Already have an account?"} <span className="text-brand font-black uppercase tracking-widest ml-1">{mode === 'login' ? 'Sign Up' : 'Log In'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <div className="absolute bottom-12 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
          Powered by Hiero Enterprise & Hedera Hashgraph
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
