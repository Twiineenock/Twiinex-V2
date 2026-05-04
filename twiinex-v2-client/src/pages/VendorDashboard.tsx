import { useState, useEffect, useRef } from 'react';
import { Plus, Copy, Clock, ShieldCheck, DollarSign, CheckCircle2, X, Camera, Image as ImageIcon, MessageSquare, LogOut, ChevronRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createEscrow, getTransactions } from '../api/escrow';

const VendorDashboard = () => {
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [links, setLinks] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [createdLinkId, setCreatedLinkId] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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
      const interval = setInterval(() => fetchData(parsedUser.phone), 5000);
      return () => clearInterval(interval);
    } else {
      window.location.href = '/login';
    }
  }, []);

  // Camera Logic
  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Please allow camera access to take photos.");
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      setImageUrl(canvas.toDataURL('image/jpeg', 0.6));
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const handleCreateLink = async () => {
    if (!itemName || !amount || loading) return;
    setLoading(true);
    try {
      const response = await createEscrow(user.phone, parseFloat(amount), itemName, imageUrl);
      if (response?.id) {
        setCreatedLinkId(response.id);
        // Clear inputs immediately
        setItemName('');
        setAmount('');
        setImageUrl('');
      }
      await fetchData(user.phone);
    } catch (error: any) {
      console.error('Failed to create escrow:', error);
      alert("Failed to create link. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-close modal after success
  useEffect(() => {
    if (createdLinkId) {
      const timer = setTimeout(() => {
        setCreatedLinkId(null);
        setShowCreateModal(false);
      }, 2000); // 2 seconds to see the success state
      return () => clearTimeout(timer);
    }
  }, [createdLinkId]);

  const shareOnWhatsApp = (id: string, item: string) => {
    const text = `Hey! Use this secure Trust Link to pay for ${item}: ${window.location.origin}/pay/${id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-primary-bg">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 text-brand mb-1">
              <User className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Vendor Dashboard</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.name || 'Partner'}</h1>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => {
                localStorage.removeItem('twiinex_user');
                window.location.href = '/login';
              }}
              className="btn-outline text-xs px-4 flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
            <button 
              onClick={() => {
                setCreatedLinkId(null);
                setShowCreateModal(true);
              }}
              className="btn-primary text-xs px-6 flex items-center gap-2 font-bold"
            >
              <Plus className="w-4 h-4" /> Create New Link
            </button>
          </div>
        </div>

        {/* Stats Grid - Tidy Hashscan Style */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Escrow Volume', value: 'UGX 4.2M', icon: DollarSign, trend: '+12%' },
            { label: 'Active Links', value: links.filter(l => l.status === 'PENDING').length, icon: Clock, trend: 'Stable' },
            { label: 'Completed', value: links.filter(l => l.status === 'COMPLETED').length, icon: CheckCircle2, trend: '+4 today' },
            { label: 'Trust Score', value: '9.8 / 10', icon: ShieldCheck, trend: 'Top Rated' },
          ].map((stat, i) => (
            <div key={i} className="section-card">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-4 h-4 text-text-muted" />
                <span className="text-[10px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded">{stat.trend}</span>
              </div>
              <p className="label-text mb-1">{stat.label}</p>
              <p className="text-xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Transactions Table - Clean Explorer Style */}
        <div className="section-card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-border-color bg-secondary-bg flex justify-between items-center">
            <h3 className="text-sm font-bold uppercase tracking-wider">Recent Transactions</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-[10px] font-bold text-text-muted">Live Sync Active</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-tertiary-bg/50">
                  <th className="px-6 py-3 label-text border-b border-border-color">Details</th>
                  <th className="px-6 py-3 label-text border-b border-border-color">ID</th>
                  <th className="px-6 py-3 label-text border-b border-border-color">Amount</th>
                  <th className="px-6 py-3 label-text border-b border-border-color">Status</th>
                  <th className="px-6 py-3 label-text border-b border-border-color">Date</th>
                  <th className="px-6 py-3 label-text border-b border-border-color text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color">
                {links.map((link, i) => (
                  <tr key={i} className="hover:bg-secondary-bg/50 transition-colors group">
                    <td className="px-6 py-4 font-semibold">{link.item}</td>
                    <td className="px-6 py-4"><span className="value-text text-text-muted">{link.id}</span></td>
                    <td className="px-6 py-4 font-mono font-bold text-brand">UGX {link.amount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        link.status === 'COMPLETED' ? 'bg-success/10 text-success' :
                        link.status === 'FUNDED' ? 'bg-brand/10 text-brand' : 
                        link.status === 'SHIPPED' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-tertiary-bg text-text-muted'
                      }`}>
                        {link.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-text-muted">{link.date}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => shareOnWhatsApp(link.id, link.item)}
                          className="p-1.5 hover:bg-brand/10 text-text-muted hover:text-brand rounded"
                          title="Share on WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/pay/${link.id}`);
                            alert("Link copied!");
                          }}
                          className="p-1.5 hover:bg-brand/10 text-text-muted hover:text-brand rounded"
                          title="Copy Link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-text-muted" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Simplified Modal - Hashscan Style */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-primary-bg border border-border-color rounded-lg w-full max-w-md shadow-2xl overflow-hidden"
            >
               {!createdLinkId ? (
                  <div className="p-6">
                     <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold">New Trust Link</h2>
                        <button onClick={() => setShowCreateModal(false)} className="text-text-muted hover:text-primary"><X className="w-5 h-5" /></button>
                     </div>
                     
                     <div className="space-y-4">
                        <div>
                           <label className="label-text mb-1.5 block">Item Name / Description</label>
                           <input 
                              type="text" 
                              value={itemName}
                              onChange={(e) => setItemName(e.target.value)}
                              placeholder="e.g. JBL Speaker XL"
                              className="w-full bg-secondary-bg border border-border-color rounded px-4 py-2.5 focus:border-brand focus:outline-none"
                           />
                        </div>
                        <div>
                           <label className="label-text mb-1.5 block">Amount (UGX)</label>
                           <input 
                              type="number" 
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder="0"
                              className="w-full bg-secondary-bg border border-border-color rounded px-4 py-2.5 focus:border-brand focus:outline-none font-mono"
                           />
                        </div>
                        <div>
                           <label className="label-text mb-1.5 block">Product Evidence</label>
                           {!imageUrl && !isCameraOpen ? (
                              <div className="flex gap-2">
                                <button 
                                  onClick={startCamera}
                                  className="flex-1 flex flex-col items-center justify-center gap-2 py-6 border border-dashed border-border-color rounded hover:bg-secondary-bg transition-colors group"
                                >
                                  <Camera className="w-6 h-6 text-text-muted group-hover:text-brand" />
                                  <span className="text-[10px] font-bold uppercase">Take Photo</span>
                                </button>
                                <label className="flex-1 flex flex-col items-center justify-center gap-2 py-6 border border-dashed border-border-color rounded cursor-pointer hover:bg-secondary-bg transition-colors group">
                                  <ImageIcon className="w-6 h-6 text-text-muted group-hover:text-brand" />
                                  <span className="text-[10px] font-bold uppercase">Upload File</span>
                                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const r = new FileReader();
                                      r.onload = (ev) => setImageUrl(ev.target?.result as string);
                                      r.readAsDataURL(file);
                                    }
                                  }} />
                                </label>
                              </div>
                           ) : isCameraOpen ? (
                              <div className="relative rounded overflow-hidden bg-black">
                                <video ref={videoRef} autoPlay playsInline className="w-full aspect-square object-cover" />
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                                  <button onClick={capturePhoto} className="btn-primary rounded-full p-3"><Camera className="w-5 h-5" /></button>
                                  <button onClick={stopCamera} className="btn-outline bg-black/50 text-white border-white/20 rounded-full p-3"><X className="w-5 h-5" /></button>
                                </div>
                              </div>
                           ) : (
                              <div className="relative aspect-video rounded overflow-hidden border border-brand">
                                 <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                 <button 
                                    onClick={() => setImageUrl('')}
                                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-brand"
                                 >
                                    <X size={14} />
                                 </button>
                              </div>
                           )}
                        </div>
                        <button 
                           onClick={handleCreateLink}
                           disabled={loading || !itemName || !amount}
                           className="w-full btn-primary py-3 mt-4 disabled:opacity-50 disabled:cursor-wait"
                        >
                           {loading ? 'Confirming on Hedera...' : 'Generate Secure Link'}
                        </button>
                     </div>
                  </div>
               ) : (
                  <div className="p-8 text-center">
                     <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={32} className="text-success" />
                     </div>
                     <h2 className="text-xl font-bold mb-1">Trust Link Active</h2>
                     <p className="text-text-secondary text-sm mb-6">Secured on Hedera HCS. Ready for payment.</p>

                     <div className="space-y-3">
                        <div className="p-3 bg-secondary-bg border border-border-color rounded flex items-center justify-between">
                           <span className="text-[10px] font-mono text-text-muted truncate">
                              {window.location.origin.replace('http://', '').replace('https://', '')}/pay/{createdLinkId}
                           </span>
                           <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/pay/${createdLinkId}`)} className="text-brand hover:brightness-110"><Copy size={16} /></button>
                        </div>
                        <button 
                           onClick={() => shareOnWhatsApp(createdLinkId!, itemName)}
                           className="w-full btn-primary bg-[#25D366] hover:bg-[#22c35e] flex items-center justify-center gap-2 py-3"
                        >
                           <MessageSquare className="w-4 h-4" /> Share to WhatsApp
                        </button>
                        <button 
                           onClick={() => {
                             setCreatedLinkId(null); 
                             setShowCreateModal(false);
                           }}
                           className="w-full btn-outline py-3 font-bold"
                        >
                           View in Dashboard
                        </button>
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
