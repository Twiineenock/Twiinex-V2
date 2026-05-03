import { useState, useEffect } from 'react';
import { Plus, Copy, Clock, ShieldCheck, TrendingUp, DollarSign, CheckCircle2, Share2, Send, X, Upload, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createEscrow, getTransactions, updateTransactionStatus } from '../api/escrow';

const VendorDashboard = () => {
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [links, setLinks] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [createdLinkId, setCreatedLinkId] = useState<string | null>(null);

  const fetchData = async (phone: string) => {
    try {
      const data = await getTransactions(phone);
      setLinks(data.map((tx: any) => ({
        id: tx.id,
        item: tx.description,
        amount: tx.amount.toLocaleString(),
        status: tx.status,
        date: new Date(tx.created_at).toLocaleDateString(),
        contractId: tx.metadata?.contractId
      })));
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('twiinex_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchData(parsedUser.phone);
      
      // Polling for updates every 5 seconds
      const interval = setInterval(() => fetchData(parsedUser.phone), 5000);
      return () => clearInterval(interval);
    } else {
      window.location.href = '/login';
    }
  }, []);

  const handleCreateLink = async () => {
    if (!itemName || !amount || loading) return;
    setLoading(true);
    try {
      // 1. Create a "Safety Timeout" - if network is slow, don't block the user
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 8000)
      );

      // 2. Execute the create escrow call
      const response = await Promise.race([
        createEscrow(user.phone, parseFloat(amount), itemName, imageUrl),
        timeoutPromise
      ]) as any;
      
      if (response && response.id) {
         setCreatedLinkId(response.id);
      } else {
         // Fallback if timeout hit but likely succeeded in background
         setShowCreateModal(false);
         setItemName('');
         setAmount('');
         setImageUrl('');
         fetchData(user.phone);
      }
      
      // 3. Refresh the list in the background
      await fetchData(user.phone);
    } catch (error: any) {
      if (error.message === 'TIMEOUT') {
         // Optimistic success: link is likely created on chain, just show list
         setShowCreateModal(false);
         fetchData(user.phone);
      } else {
         console.error('Failed to create escrow:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkShipped = async (id: string) => {
    setUpdatingId(id);
    try {
      await updateTransactionStatus(id, 'SHIPPED');
      await fetchData(user.phone);
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] p-6 lg:p-12 text-white">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter">DASHBOARD</h1>
            <p className="text-gray-500 font-medium">Welcome back, <span className="text-brand">{user?.name || 'Vendor'}</span></p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => {
                localStorage.removeItem('twiinex_user');
                window.location.href = '/login';
              }}
              className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-bold hover:text-white hover:bg-white/10 transition-all"
            >
              Logout
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus className="w-5 h-5" /> Create Trust Link
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Volume', value: 'UGX 12.4M', icon: DollarSign, color: 'text-brand' },
            { label: 'Active Escrows', value: '8', icon: Clock, color: 'text-blue-400' },
            { label: 'Successful', value: '142', icon: ShieldCheck, color: 'text-emerald-400' },
            { label: 'Trust Score', value: '98%', icon: TrendingUp, color: 'text-purple-400' },
          ].map((stat, i) => (
            <div key={i} className="glass-card flex items-center gap-4 hover:border-brand/30 transition-all cursor-default">
              <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{stat.label}</p>
                <p className="text-xl font-black">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold">Recent Transactions</h3>
            <button className="text-xs font-bold text-brand hover:underline">View All</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  <th className="pb-4 px-4">Transaction ID</th>
                  <th className="pb-4 px-4">Item Details</th>
                  <th className="pb-4 px-4">Amount</th>
                  <th className="pb-4 px-4">Status</th>
                  <th className="pb-4 px-4">Created</th>
                  <th className="pb-4 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {links.map((link, i) => (
                  <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 font-mono text-sm text-gray-400">{link.id}</td>
                    <td className="py-4 px-4 font-bold">{link.item}</td>
                    <td className="py-4 px-4 font-mono text-gray-300">UGX {link.amount}</td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        link.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' :
                        link.status === 'FUNDED' ? 'bg-brand/10 text-brand' : 
                        link.status === 'SHIPPED' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-brand/5 text-gray-500'
                      }`}>
                        {link.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">{link.date}</td>
                    <td className="py-4 px-4 text-right flex items-center justify-end gap-2">
                      {link.status === 'FUNDED' && (
                        <button 
                          onClick={() => handleMarkShipped(link.id)}
                          disabled={updatingId === link.id}
                          className="px-4 py-2 bg-brand text-black text-[10px] font-black uppercase rounded-xl hover:bg-white transition-all transform hover:scale-[1.05] active:scale-[0.95] disabled:opacity-50"
                        >
                          {updatingId === link.id ? 'Updating...' : 'Mark Shipped'}
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          const url = `${window.location.origin}/pay/${link.id}`;
                          navigator.clipboard.writeText(url);
                          // We could add a custom toast here if needed
                        }}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
                        title="Copy Link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-md border-brand/20 shadow-brand/10 p-0 overflow-hidden"
            >
               {!createdLinkId ? (
                  <div className="p-8">
                     <h2 className="text-2xl font-black mb-2 uppercase">Generate Link</h2>
                     <p className="text-gray-400 text-sm mb-8 font-medium">Create a new on-chain escrow transaction.</p>
                     
                     <div className="space-y-6">
                        <div>
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Item Name</label>
                           <input 
                              type="text" 
                              value={itemName}
                              onChange={(e) => setItemName(e.target.value)}
                              placeholder="e.g. Vintage Leather Bag"
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-brand focus:outline-none transition-all"
                           />
                        </div>
                        <div>
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Amount (UGX)</label>
                           <input 
                              type="number" 
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder="0.00"
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-brand focus:outline-none transition-all font-mono"
                           />
                        </div>
                        <div>
                           <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Item Photo</label>
                           {!imageUrl ? (
                              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/5 hover:border-brand/50 transition-all group">
                                 <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 text-gray-500 group-hover:text-brand mb-2 transition-colors" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-300">Click or Drag to Upload</p>
                                 </div>
                                 <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => {
                                       const file = e.target.files?.[0];
                                       if (file) {
                                          const reader = new FileReader();
                                          reader.onload = (event) => {
                                             const img = new Image();
                                             img.onload = () => {
                                                // Create a canvas to resize the image
                                                const canvas = document.createElement('canvas');
                                                const MAX_WIDTH = 800;
                                                const MAX_HEIGHT = 800;
                                                let width = img.width;
                                                let height = img.height;

                                                if (width > height) {
                                                   if (width > MAX_WIDTH) {
                                                      height *= MAX_WIDTH / width;
                                                      width = MAX_WIDTH;
                                                   }
                                                } else {
                                                   if (height > MAX_HEIGHT) {
                                                      width *= MAX_HEIGHT / height;
                                                      height = MAX_HEIGHT;
                                                   }
                                                }

                                                canvas.width = width;
                                                canvas.height = height;
                                                const ctx = canvas.getContext('2d');
                                                ctx?.drawImage(img, 0, 0, width, height);
                                                
                                                // Convert to optimized JPEG (quality 0.6 is plenty for metadata)
                                                const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                                                setImageUrl(dataUrl);
                                             };
                                             img.src = event.target?.result as string;
                                          };
                                          reader.readAsDataURL(file);
                                       }
                                    }}
                                 />
                              </label>
                           ) : (
                              <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-brand/50">
                                 <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                 <button 
                                    onClick={() => setImageUrl('')}
                                    className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-brand transition-all"
                                 >
                                    <X size={14} />
                                 </button>
                              </div>
                           )}
                        </div>
                        <div className="flex gap-4 pt-4">
                           <button 
                              onClick={() => setShowCreateModal(false)}
                              className="flex-1 py-4 rounded-2xl bg-white/5 font-bold hover:bg-white/10 transition-all"
                           >
                              Cancel
                           </button>
                           <button 
                              onClick={handleCreateLink}
                              disabled={loading}
                              className="flex-1 btn-primary"
                           >
                              {loading ? 'Creating...' : 'Generate'}
                           </button>
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className="p-8 text-center bg-gradient-to-b from-brand/10 to-transparent">
                     <div className="w-20 h-20 bg-brand/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand/30 shadow-[0_0_30px_rgba(255,51,102,0.2)]">
                        <CheckCircle2 size={40} className="text-brand" />
                     </div>
                     <h2 className="text-2xl font-black mb-2 uppercase">Link Ready!</h2>
                     <p className="text-gray-400 text-sm mb-8">Your trust link has been secured on the Hedera network.</p>

                     <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-2xl border border-brand/20 flex items-center justify-between group">
                           <span className="text-xs font-mono text-gray-400 truncate mr-4">
                              {window.location.origin}/pay/{createdLinkId}
                           </span>
                           <button 
                              onClick={() => {
                                 navigator.clipboard.writeText(`${window.location.origin}/pay/${createdLinkId}`);
                              }}
                              className="p-2 bg-brand/20 rounded-lg text-brand hover:bg-brand transition-all hover:text-black"
                           >
                              <Copy size={16} />
                           </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <button 
                              onClick={() => {
                                 const text = `Hey! Pay securely using Twiinex Trust Link: ${window.location.origin}/pay/${createdLinkId}`;
                                 window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                              }}
                              className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#25D366]/10 text-[#25D366] font-black uppercase text-[10px] tracking-widest border border-[#25D366]/20 hover:bg-[#25D366] hover:text-white transition-all"
                           >
                              <Send size={14} /> WhatsApp
                           </button>
                           <button 
                              onClick={() => {
                                 setItemName('');
                                 setAmount('');
                                 setImageUrl('');
                                 setCreatedLinkId(null);
                                 setShowCreateModal(false);
                              }}
                              className="py-4 rounded-2xl bg-white text-black font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all"
                           >
                              Done
                           </button>
                        </div>
                     </div>
                  </div>
               )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VendorDashboard;
