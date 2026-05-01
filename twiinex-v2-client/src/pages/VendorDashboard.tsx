import { useState, useEffect } from 'react';
import { Plus, Copy, Clock, ShieldCheck, TrendingUp, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createEscrow, getTransactions, updateTransactionStatus } from '../api/escrow';

const VendorDashboard = () => {
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [links, setLinks] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
      // 1. Create the escrow
      await createEscrow(user.phone, parseFloat(amount), itemName);
      
      // 2. Clear inputs and close modal immediately for better UX
      setItemName('');
      setAmount('');
      setShowCreateModal(false);
      
      // 3. Refresh the list in the background
      await fetchData(user.phone);
    } catch (error) {
      console.error('Failed to create escrow:', error);
      // Optional: Add user feedback here if it fails
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-md border-brand/20 shadow-brand/10"
            >
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VendorDashboard;
