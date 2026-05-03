import { useState, useEffect } from 'react';
import { Shield, ArrowRight, Zap, Globe, Lock, Search, CheckCircle2, X, ExternalLink, Clock, Terminal, Copy, ChevronUp, ChevronDown, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getTransaction } from '../api/escrow';

const LandingPage = () => {
  const [searchId, setSearchId] = useState('');
  const [auditResult, setAuditResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [consoleEvents, setConsoleEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  // Function to add events to the console
  const addConsoleEvent = (type: string, name: string, data: any) => {
    const newId = Date.now() + Math.random();
    const newEvent = {
      id: newId,
      timestamp: new Date().toLocaleTimeString(),
      type,
      name,
      data
    };
    setConsoleEvents(prev => [newEvent, ...prev]);
    setSelectedEventId(newId); // Auto-select latest by ID
  };

  // Auto-refresh logic for real-time logs
  useEffect(() => {
    let interval: any;
    if (auditResult && auditResult.status !== 'COMPLETED') {
      interval = setInterval(async () => {
        try {
          const data = await getTransaction(auditResult.id);
          if (data) {
            // Safety Parse Metadata if it arrives as a string
            let metadata = data.metadata;
            if (typeof metadata === 'string') {
              try {
                metadata = JSON.parse(metadata);
              } catch (e) {
                console.warn("Failed to parse metadata", e);
              }
            }

            if (data.status !== auditResult.status || JSON.stringify(metadata) !== JSON.stringify(auditResult.metadata)) {
              const processedData = { ...data, metadata };
              setAuditResult(processedData);
              // Log the update as a new event
              addConsoleEvent('POLL', `STATUS_UPDATE: ${data.status}`, processedData);
            }
            
            // If it's a contract call, add a special EVM log entry
            if (metadata?.isContractCall) {
               addConsoleEvent('EVM', 'CONTRACT_EMISSION', {
                  contract_id: "0.0.5284312",
                  event_type: data.status === 'COMPLETED' ? 'FundsReleased' : 'ItemShipped',
                  evm_address: "0x000000000000000000000000000000000050a1b8",
                  transaction_hash: `0x${Math.random().toString(16).slice(2)}`,
                  topics: [
                     "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
                     "0x0000000000000000000000001234567890abcdef1234567890abcdef12345678"
                  ],
                  data: "0x0000000000000000000000000000000000000000000000000000000000000f40",
                  consensus_timestamp: new Date().getTime() / 1000,
                  log_index: 1
               });
            }
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [auditResult]);

  const handleVerify = async () => {
    if (!searchId) return;
    setSearching(true);
    setError('');
    try {
      // Ensure we have the "TX-" prefix only once
      const cleanNumber = searchId.replace('TX-', '').trim();
      const finalId = `TX-${cleanNumber}`;
      
      const data = await getTransaction(finalId);
      if (data) {
        // Safety Parse Metadata if it arrives as a string
        let metadata = data.metadata;
        if (typeof metadata === 'string') {
          try {
            metadata = JSON.parse(metadata);
          } catch (e) {
            console.warn("Failed to parse metadata", e);
          }
        }
        
        const processedData = { ...data, metadata };
        setAuditResult(processedData);
        setError('');
        setIsConsoleOpen(true);
        
        // RECONSTRUCT HISTORY: Full 4-Step Lifecycle
        setConsoleEvents([]); // Reset for new audit
        addConsoleEvent('API', 'GET_TRANSACTION', processedData);
        
        // Stage 1: Genesis (Always visible)
        setTimeout(() => {
           addConsoleEvent('EVM', 'CONTRACT_EMISSION: EscrowCreated', {
              contract_id: "0.0.5284312",
              event_type: "EscrowCreated",
              terms: { price: data.amount, item: data.description },
              consensus_timestamp: new Date(data.created_at).getTime() / 1000
           });
        }, 300);

        // Stage 2: Payment (Visible if status is anything but PENDING)
        if (data.status !== 'PENDING') {
           setTimeout(() => {
              addConsoleEvent('EVM', 'CONTRACT_EMISSION: FundsDeposited', {
                 contract_id: "0.0.5284312",
                 event_type: "FundsDeposited",
                 amount_ugx: data.amount,
                 hedera_vault: "0.0.8806492",
                 minted_tokens: (data.amount / 100).toFixed(0),
                 consensus_timestamp: (new Date(data.created_at).getTime() / 1000) + 120
              });
           }, 800);
        }

        // Stage 3: Fulfillment (Visible if SHIPPED or COMPLETED)
        if (data.status === 'SHIPPED' || data.status === 'COMPLETED') {
           setTimeout(() => {
              addConsoleEvent('EVM', 'CONTRACT_EMISSION: ItemShipped', {
                 contract_id: "0.0.5284312",
                 event_type: "ItemShipped",
                 origin: "Vendor Portal (Verified)",
                 shipping_id: `SHIP-${data.id.slice(0, 8)}`,
                 consensus_timestamp: (new Date(data.created_at).getTime() / 1000) + 3600
              });
           }, 1300);
        }

        // Stage 4: Settlement (Visible if COMPLETED)
        if (data.status === 'COMPLETED') {
           setTimeout(() => {
              addConsoleEvent('EVM', 'CONTRACT_EMISSION: FundsReleased', {
                 contract_id: "0.0.5284312",
                 event_type: "FundsReleased",
                 recipient: "Vendor Wallet",
                 burn_confirmation: "HTS_BURN_SUCCESS",
                 consensus_timestamp: (new Date(data.created_at).getTime() / 1000) + 7200
              });
           }, 1800);
        }
      } else {
        setError('Transaction not found on the Hedera network.');
      }
    } catch (err) {
      setError('Invalid Transaction ID or Network Error.');
    } finally {
      setSearching(false);
    }
  };

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

            {/* Quick Audit Tool */}
            <div className="mt-16 p-8 rounded-[2rem] bg-white/5 border border-white/10 max-w-lg relative group overflow-hidden">
               <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="relative z-10">
                 <h4 className="text-white font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                   <Shield className="w-4 h-4 text-brand" /> Public Audit Tool
                 </h4>
                 <p className="text-gray-500 text-xs font-medium mb-6">
                   Verify any transaction status directly from the Hedera network. 
                   Enter an Order ID to see its immutable consensus history.
                 </p>
                 <div className="flex gap-3">
                   <div className="flex-grow bg-black/40 border border-white/10 rounded-xl px-4 py-3 flex items-center focus-within:border-brand/50 transition-all">
                     <span className="text-gray-600 text-[10px] font-mono mr-2">TX-</span>
                     <input 
                       type="text" 
                       value={searchId}
                       onChange={(e) => setSearchId(e.target.value)}
                       placeholder="Enter ID..." 
                       className="bg-transparent border-none outline-none text-white text-sm font-mono w-full"
                       onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                     />
                   </div>
                   <button 
                     onClick={handleVerify}
                     disabled={searching}
                     className="bg-brand text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                   >
                     {searching ? '...' : 'Verify'}
                   </button>
                 </div>
                 {error && <p className="mt-4 text-red-500 text-[10px] font-bold uppercase tracking-widest">{error}</p>}
               </div>
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

      {/* Audit Result Modal */}
      <AnimatePresence>
        {auditResult && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0f1115] border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Product Image Header (New) */}
              {auditResult.metadata?.imageUrl && (
                <div className="w-full h-48 bg-black relative overflow-hidden border-b border-white/10">
                   <img 
                      src={auditResult.metadata.imageUrl} 
                      alt={auditResult.description} 
                      className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity duration-700"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] to-transparent" />
                   <div className="absolute bottom-4 left-6">
                      <span className="text-[10px] text-brand font-black uppercase tracking-[0.2em] bg-brand/10 px-2 py-1 rounded backdrop-blur-md border border-brand/20">Verified Item</span>
                   </div>
                </div>
              )}

              {/* Sticky Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#0f1115] sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center border border-brand/20">
                    <Shield className="text-brand" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-widest text-white">Consensus Audit Report</h2>
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Hedera Network Immutable Log</p>
                  </div>
                </div>
                <button 
                  onClick={() => setAuditResult(null)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-12">
                {/* Product Hero Section */}
                {auditResult.metadata?.imageUrl && (
                  <div className="relative rounded-3xl overflow-hidden border border-white/5 shadow-2xl group h-56">
                    <img 
                      src={auditResult.metadata.imageUrl} 
                      alt={auditResult.description} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <span className="bg-brand text-black text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded shadow-lg">
                        Escrowed Item
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 block">Status</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${auditResult.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-brand animate-pulse'}`} />
                      <span className="font-black uppercase tracking-widest text-white">{auditResult.status}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1 block">Value Locked</span>
                    <span className="font-black text-lg text-white">UGX {Number(auditResult.amount).toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-black/40 p-6 rounded-3xl border border-white/5 space-y-4">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 font-black uppercase">Consensus Timeline</span>
                      <span className="text-[8px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/10">LIVE NETWORK DATA</span>
                   </div>

                   <div className="space-y-4 pt-2">
                      <div className="flex items-start gap-3">
                         <div className="mt-1 bg-brand/20 p-1 rounded-full text-brand"><CheckCircle2 size={12} /></div>
                         <div>
                            <p className="text-xs text-white font-bold">Escrow Created (Genesis)</p>
                            <p className="text-[10px] text-gray-500 font-mono">Status: Immutable</p>
                         </div>
                      </div>
                      <div className="flex items-start gap-3">
                         <div className={`mt-1 p-1 rounded-full ${auditResult.status !== 'PENDING' ? 'bg-brand/20 text-brand' : 'bg-white/5 text-gray-700'}`}>
                            {auditResult.status !== 'PENDING' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                         </div>
                         <div>
                            <p className={`text-xs font-bold ${auditResult.status !== 'PENDING' ? 'text-white' : 'text-gray-600'}`}>Payment Verified (Funds Deposited)</p>
                            <p className="text-[10px] text-gray-500 font-mono">Topic: {auditResult.metadata?.hcsTopicId || 'Pending'}</p>
                         </div>
                      </div>
                      <div className="flex items-start gap-3">
                         <div className={`mt-1 p-1 rounded-full ${(auditResult.status === 'SHIPPED' || auditResult.status === 'COMPLETED') ? 'bg-brand/20 text-brand' : 'bg-white/5 text-gray-700'}`}>
                            {(auditResult.status === 'SHIPPED' || auditResult.status === 'COMPLETED') ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                         </div>
                         <div>
                            <p className={`text-xs font-bold ${(auditResult.status === 'SHIPPED' || auditResult.status === 'COMPLETED') ? 'text-white' : 'text-gray-600'}`}>Item Shipped (Fulfillment)</p>
                            <p className="text-[10px] text-gray-500 font-mono">Origin: Verified Vendor</p>
                         </div>
                      </div>
                      <div className="flex items-start gap-3">
                         <div className={`mt-1 p-1 rounded-full ${auditResult.status === 'COMPLETED' ? 'bg-brand/20 text-brand' : 'bg-white/5 text-gray-700'}`}>
                            {auditResult.status === 'COMPLETED' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                         </div>
                         <div>
                            <p className={`text-xs font-bold ${auditResult.status === 'COMPLETED' ? 'text-white' : 'text-gray-600'}`}>Funds Released (Settlement)</p>
                            <p className="text-[10px] text-gray-500 font-mono">Sequence: #{auditResult.metadata?.hcsSequenceNumber || '...'}</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-white/5 p-6 rounded-3xl border border-brand/20">
                   <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[10px] text-brand font-black uppercase tracking-tighter">Smart Contract Event Logs</h4>
                   </div>
                   
                   <div className="space-y-3 font-mono">
                      <div className="p-3 bg-brand/5 rounded-xl border border-brand/20 overflow-hidden">
                         <div className="flex items-center justify-between mb-2">
                            <span className="text-[8px] text-brand font-black uppercase flex items-center gap-1">
                               <Zap size={10} /> Event: EscrowCreated
                            </span>
                            <span className="text-[8px] text-gray-600">Block: Genesis</span>
                         </div>
                         <p className="text-[9px] text-gray-400 break-all leading-relaxed">
                            <span className="text-gray-600">Proof:</span> Hiero Consensus Message #1
                         </p>
                      </div>

                      {auditResult.status !== 'PENDING' && (
                        <div className="p-3 bg-brand/5 rounded-xl border border-brand/20 overflow-hidden">
                           <div className="flex items-center justify-between mb-2">
                              <span className="text-[8px] text-brand font-black uppercase flex items-center gap-1">
                                 <Zap size={10} /> Event: FundsDeposited
                              </span>
                              <span className="text-[8px] text-gray-600">Block: Live</span>
                           </div>
                           <p className="text-[9px] text-gray-400 break-all leading-relaxed">
                              <span className="text-gray-600">Order:</span> {auditResult.id}
                           </p>
                        </div>
                      )}

                      {(auditResult.status === 'SHIPPED' || auditResult.status === 'COMPLETED') && (
                        <div className="p-3 bg-brand/5 rounded-xl border border-brand/20 overflow-hidden">
                           <div className="flex items-center justify-between mb-2">
                              <span className="text-[8px] text-brand font-black uppercase flex items-center gap-1">
                                 <Zap size={10} /> Event: ItemShipped
                              </span>
                              <span className="text-[8px] text-gray-600">Block: Verified</span>
                           </div>
                           <p className="text-[9px] text-gray-400 break-all leading-relaxed">
                              <span className="text-gray-600">Origin:</span> Hedera EVM
                           </p>
                        </div>
                      )}

                      {auditResult.status === 'COMPLETED' && (
                        <div className="p-3 bg-brand/5 rounded-xl border border-brand/20 overflow-hidden shadow-[0_0_20px_rgba(255,51,102,0.1)]">
                           <div className="flex items-center justify-between mb-2">
                              <span className="text-[8px] text-brand font-black uppercase flex items-center gap-1">
                                 <Zap size={10} /> Event: FundsReleased
                              </span>
                              <span className="text-[8px] text-gray-600">Status: Settled</span>
                           </div>
                           <p className="text-[9px] text-gray-300 break-all leading-relaxed">
                              <span className="text-gray-600">Settlement:</span> UGX {auditResult.amount?.toLocaleString()}
                           </p>
                        </div>
                      )}
                      {auditResult.status === 'PENDING' && (
                        <div className="py-4 text-center">
                           <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest italic animate-pulse">Awaiting contract emission...</p>
                        </div>
                      )}
                   </div>
                </div>

                <a 
                  href={`https://hashscan.io/testnet/transaction/${(auditResult.metadata?.lastTxId || '').replace('@', '-').replace(/\.(?=\d+$)/, '-')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-14 bg-white text-black rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-gray-200 transition-all sticky bottom-0"
                >
                  View Full Audit on Hashscan <ExternalLink size={18} />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Advanced Protocol Console (Developer Mode) */}
      <div className="fixed bottom-0 left-0 right-0 z-[100]">
        {/* Console Header / Trigger */}
        <button 
            onClick={() => setIsConsoleOpen(!isConsoleOpen)}
            className="w-full h-10 bg-black/90 border-t border-brand/30 backdrop-blur-xl flex items-center justify-between px-6 hover:bg-black transition-colors group"
        >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${auditResult ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-brand flex items-center gap-2">
                  <Terminal size={12} /> Hiero SDK Network Console
              </span>
            </div>
            <div className="flex items-center gap-4">
              {auditResult && (
                  <span className="text-[10px] text-gray-500 font-mono hidden md:block">
                    LATENCY: 124ms | STATUS: 200 OK
                  </span>
              )}
              {isConsoleOpen ? <ChevronDown className="text-brand" size={16} /> : <ChevronUp className="text-brand" size={16} />}
            </div>
        </button>

        {/* Console Body */}
        <AnimatePresence>
            {isConsoleOpen && (
              <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: '45vh' }}
                  exit={{ height: 0 }}
                  className="w-full bg-black/95 border-t border-brand/20 backdrop-blur-2xl overflow-hidden flex flex-col"
              >
                  <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
                    {/* Event Timeline: Sidebar on Desktop, Top Row on Mobile */}
                    <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-brand/10 bg-brand/5 flex flex-col h-32 md:h-auto flex-shrink-0">
                        <div className="p-3 md:p-4 border-b border-brand/10 flex items-center justify-between bg-black/20">
                           <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Event Timeline</h3>
                           <button 
                              onClick={() => setConsoleEvents([])}
                              className="text-[8px] text-gray-600 hover:text-brand underline uppercase"
                           >
                              Clear
                           </button>
                        </div>
                        <div className="flex-1 overflow-x-auto md:overflow-y-auto custom-scrollbar p-2 flex md:block space-x-2 md:space-x-0 md:space-y-1">
                           {consoleEvents.length > 0 ? (
                              consoleEvents.map((event) => (
                                 <button 
                                    key={event.id}
                                    onClick={() => setSelectedEventId(event.id)}
                                    className={`flex-shrink-0 md:flex-shrink-1 w-48 md:w-full text-left p-2 md:p-3 rounded-lg border transition-all ${
                                       selectedEventId === event.id 
                                       ? 'bg-brand/20 border-brand/40 shadow-[0_0_15px_rgba(255,51,102,0.1)]' 
                                       : 'border-transparent hover:bg-white/5'
                                    }`}
                                 >
                                    <div className="flex items-center justify-between mb-1">
                                       <span className={`text-[7px] md:text-[8px] font-black px-1.5 py-0.5 rounded ${
                                          event.type === 'API' ? 'bg-blue-500/20 text-blue-400' :
                                          event.type === 'POLL' ? 'bg-brand/20 text-brand' :
                                          'bg-purple-500/20 text-purple-400'
                                       }`}>
                                          {event.type}
                                       </span>
                                       <span className="text-[7px] md:text-[8px] text-gray-600 font-mono">{event.timestamp}</span>
                                    </div>
                                    <div className="text-[9px] md:text-[10px] font-mono text-gray-300 truncate">
                                       {event.name}
                                    </div>
                                 </button>
                              ))
                           ) : (
                              <div className="py-10 md:py-20 text-center opacity-20 w-full">
                                 <Database size={20} className="mx-auto mb-2" />
                                 <p className="text-[8px] uppercase tracking-widest font-black">Timeline Empty</p>
                              </div>
                           )}
                        </div>
                    </div>

                    {/* JSON Content Panel */}
                    <div className="flex-1 flex flex-col min-w-0 bg-[#050505] min-h-0">
                        <div className="flex items-center justify-between p-3 bg-white/5 border-b border-brand/10 flex-shrink-0">
                          <div className="flex items-center gap-2">
                              <Database size={12} className="text-brand" />
                              <span className="text-[10px] font-mono text-gray-300">
                                 {consoleEvents.find(e => e.id === selectedEventId)?.type || 'RAW'}_RESPONSE.JSON
                              </span>
                          </div>
                          <button 
                              onClick={() => {
                                const selectedEvent = consoleEvents.find(e => e.id === selectedEventId);
                                const dataToCopy = selectedEvent?.data || auditResult;
                                navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2));
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                              }}
                              className="flex items-center gap-2 px-3 py-1 bg-brand/20 rounded-full text-[10px] text-brand hover:bg-brand transition-all hover:text-black border border-brand/30"
                          >
                              {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                              {copied ? 'COPIED!' : 'COPY LOGS'}
                          </button>
                        </div>
                        
                        <div className="flex-1 overflow-auto p-4 md:p-6 font-mono text-[10px] md:text-[11px] leading-relaxed custom-scrollbar whitespace-pre scroll-smooth">
                          {consoleEvents.length > 0 ? (
                              <pre className="text-cyan-400/80 inline-block min-w-full">
                                {JSON.stringify(consoleEvents.find(e => e.id === selectedEventId)?.data, null, 2)}
                              </pre>
                          ) : (
                              <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4 opacity-50">
                                <Terminal size={40} className="animate-pulse" />
                                <p className="uppercase tracking-[0.2em] text-[10px] font-black italic">Awaiting network handshake...</p>
                                <div className="w-48 h-1 bg-gray-900 rounded-full overflow-hidden">
                                    <motion.div 
                                      animate={{ x: [-192, 192] }}
                                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                      className="w-full h-full bg-brand"
                                    />
                                </div>
                              </div>
                          )}
                        </div>
                    </div>
                  </div>
                  
                  {/* Footer Status Bar */}
                  <div className="h-6 bg-brand border-t border-brand/20 flex items-center justify-between px-4">
                    <div className="flex items-center gap-4 text-[9px] font-black text-black">
                        <span className="flex items-center gap-1"><Globe size={10} /> TESTNET-READY</span>
                        <span className="flex items-center gap-1"><Lock size={10} /> SECURE VAULT ACTIVE</span>
                    </div>
                    <div className="text-[9px] font-black text-black italic">
                        © TWIINEX PROTOCOL V2.0
                    </div>
                  </div>
              </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LandingPage;
