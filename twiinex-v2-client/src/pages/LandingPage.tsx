
import { Shield, ArrowRight, Zap, Globe, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#050505] overflow-hidden">
      {/* Background Orbs */}
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between p-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/20">
            <Shield className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white">TWIINEX <span className="text-brand">V2</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <a href="#" className="hover:text-white transition-colors">How it Works</a>
          <a href="#" className="hover:text-white transition-colors">Pricing</a>
          <a href="#" className="hover:text-white transition-colors">Developers</a>
          <Link to="/login" className="bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-xl border border-white/10 transition-all">
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-bold uppercase tracking-widest mb-6">
              <Zap className="w-3 h-3" /> Powered by Hiero Enterprise
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] mb-8 tracking-tighter">
              SECURE <br />
              <span className="text-brand">SOCIAL</span> <br />
              COMMERCE.
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-lg leading-relaxed">
              The first decentralized escrow platform for East Africa. 
              Protected by Smart Contracts. Verified on Hedera.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup" className="btn-primary flex items-center justify-center gap-2">
                Start Selling Now <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                View Demo
              </button>
            </div>
            
            <div className="mt-12 flex items-center gap-8">
              <div className="flex -space-x-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-[#050505] bg-gray-800" />
                ))}
              </div>
              <p className="text-sm text-gray-500 font-medium">
                Joined by <span className="text-white">1,200+</span> vendors in Uganda
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="glass-card relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand to-transparent opacity-50" />
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-[10px] text-brand font-black uppercase tracking-widest mb-1">Vault Status</p>
                  <h3 className="text-2xl font-bold text-white">Escrow Active</h3>
                </div>
                <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center">
                  <Lock className="text-brand w-6 h-6" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                  <p className="text-sm font-mono text-gray-300">HTS-TX-7729-XM</p>
                </div>
                
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Amount Locked</p>
                    <p className="text-4xl font-black text-white font-mono">UGX 150,000</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">Network Fee</p>
                    <p className="text-lg font-bold text-gray-300 font-mono">1.5%</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-gray-500 uppercase">Audit Trail</span>
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-400">Hiero Consensus Service</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-brand" />
                      <p className="text-xs text-gray-400">Payment Verified <span className="text-gray-600 font-mono">#316250</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                      <p className="text-xs text-gray-400">Awaiting Shipment...</p>
                    </div>
                  </div>
                </div>

                <Link to="/pay/demo" className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 group">
                  Confirm Receipt <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-6 -right-6 w-32 h-32 glass rounded-3xl p-4 flex flex-col justify-between hidden md:flex animate-bounce-slow">
               <Globe className="text-brand w-6 h-6" />
               <div>
                 <p className="text-[8px] text-gray-500 font-bold uppercase">Uptime</p>
                 <p className="text-lg font-black text-white">99.9%</p>
               </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
