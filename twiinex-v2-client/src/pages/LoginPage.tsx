import React, { useState } from 'react';
import { Shield, Lock, Mail, Phone, User, ArrowRight, AlertCircle, LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signup, signin } from '../api/escrow';

const LoginPage = () => {
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
    <div className="max-w-md mx-auto px-6 py-20 min-h-[80vh] flex flex-col justify-center">
      <div className="section-card shadow-lg">
        <div className="text-center mb-8">
          <div className="bg-brand w-12 h-12 rounded flex items-center justify-center mx-auto mb-4">
            <Shield className="text-white w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {mode === 'login' ? 'Vendor Sign In' : 'Vendor Registration'}
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            Access your secure social commerce dashboard.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-danger/10 border border-danger/20 rounded text-danger text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="label-text mb-1.5 block">Business / Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input 
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-secondary-bg border border-border-color rounded py-2.5 pl-10 pr-4 focus:border-brand focus:outline-none text-sm"
                    placeholder="Enter name"
                  />
                </div>
              </div>
              <div>
                <label className="label-text mb-1.5 block">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input 
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-secondary-bg border border-border-color rounded py-2.5 pl-10 pr-4 focus:border-brand focus:outline-none text-sm"
                    placeholder="e.g. 0770000000"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="label-text mb-1.5 block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input 
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-secondary-bg border border-border-color rounded py-2.5 pl-10 pr-4 focus:border-brand focus:outline-none text-sm"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div>
            <label className="label-text mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input 
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-secondary-bg border border-border-color rounded py-2.5 pl-10 pr-4 focus:border-brand focus:outline-none text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 group mt-6"
          >
            {loading ? 'Processing...' : (mode === 'login' ? <><LogIn className="w-4 h-4" /> Sign In</> : <><UserPlus className="w-4 h-4" /> Create Account</>)}
          </button>

          <div className="text-center pt-4 border-t border-border-color mt-6">
            <button 
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
              className="text-xs font-bold text-text-muted hover:text-brand flex items-center justify-center gap-1 mx-auto transition-colors"
            >
              {mode === 'login' ? "New vendor? Join Twiinex" : "Already registered? Sign In"}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </form>
      </div>
      
      <p className="text-center text-[10px] text-text-muted uppercase tracking-widest font-bold mt-8">
        Secured by Hedera DLT & Hiero Enterprise
      </p>
    </div>
  );
};

export default LoginPage;
