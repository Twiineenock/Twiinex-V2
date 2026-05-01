import { useState, useEffect, Fragment } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, Lock, CreditCard, ChevronRight, CheckCircle2, MessageSquare, Package, Truck, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTransaction, verifyTransaction, updateTransactionStatus, updateTransactionMetadata } from '../api/escrow';

declare global {
  interface Window {
    FlutterwaveCheckout: any;
  }
}

// Simple overlay spinner component
const LoadingOverlay = ({ message }: { message: string }) => (
  <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-[100] backdrop-blur-sm">
    <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-white font-black tracking-widest text-xs uppercase">{message}</p>
  </div>
);

// Confirmation modal component
const ConfirmModal = ({ isOpen, onConfirm, onCancel, title, message }: any) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="glass-card w-full max-w-sm border-brand/20"
        >
          <h3 className="text-xl font-black text-white mb-2 uppercase">{title}</h3>
          <p className="text-gray-400 text-sm mb-8 font-medium">{message}</p>
          <div className="flex gap-4">
            <button 
              onClick={onCancel}
              className="flex-1 py-4 rounded-2xl bg-white/5 font-bold hover:bg-white/10 transition-all text-gray-400"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 btn-primary"
            >
              Confirm
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const BuyerPaymentPage = () => {
  const { id } = useParams<{ id: string }>();
  const [step, setStep] = useState(1); // 1: Pay, 2: Funded, 3: Shipped, 4: Delivered
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const fetchTx = async () => {
    if (!id) return;
    try {
      const data = await getTransaction(id);
      setTransaction(data);
      
      // Map backend status to UI steps
      if (data.status === 'PENDING') setStep(1);
      if (data.status === 'FUNDED') setStep(2);
      if (data.status === 'SHIPPED') setStep(3);
      if (data.status === 'COMPLETED') setStep(4);
    } catch (error) {
      console.error('Error fetching transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTx();
    // Track View
    if (id) updateTransactionMetadata(id, 'view').catch(e => console.warn(e));

    // Polling for real-time updates every 3 seconds
    const interval = setInterval(fetchTx, 3000);
    return () => clearInterval(interval);
  }, [id]);

  // Handle Redirection Fallback (for mobile money test mode)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const statusParam = urlParams.get('status');
    const txIdParam = urlParams.get('transaction_id');
    
    if (statusParam === 'completed' && txIdParam && transaction?.status === 'PENDING') {
       handleVerify(txIdParam);
    }
  }, [transaction]);

  const handleVerify = async (flwTransactionId: string) => {
    if (!id) return;
    setVerifying(true);
    try {
      const data = await verifyTransaction(id, flwTransactionId);
      setTransaction(data.transaction);
      setStep(2);
    } catch (err) {
      console.error("❌ Verification failed:", err);
      // In a real app we'd show an error state in UI
    } finally {
      setVerifying(false);
    }
  };

  const handlePay = async () => {
    if (!window.FlutterwaveCheckout) return;
    if (!id || !transaction) return;

    try {
      updateTransactionMetadata(id, 'paymentAttempt').catch(e => console.warn("Metadata track failed", e));

      window.FlutterwaveCheckout({
        public_key: import.meta.env.VITE_FLW_PUBLIC_KEY,
        tx_ref: `TX-${id}-${Date.now()}`,
        amount: transaction.amount,
        currency: "UGX",
        payment_options: "mobilemoneyuganda,card",
        customer: {
          email: "buyer@twiinex.com",
          phone_number: "0770000000",
          name: "Twiine Buyer",
        },
        callback: async (paymentResponse: any) => {
           if (paymentResponse.status === "successful") {
             handleVerify(paymentResponse.transaction_id);
           }
        },
        onclose: () => {
          console.log("Payment modal closed");
        },
        customizations: {
          title: "Twiinex Secure Vault",
          description: `Payment for ${transaction.description}`,
        },
        redirect_url: `${window.location.origin}/pay/${id}?status=completed`,
      });
    } catch (error: any) {
      console.error(error);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!id) return;
    setShowConfirmModal(false);
    setVerifying(true);
    try {
      const data = await updateTransactionStatus(id, 'COMPLETED');
      setTransaction(data.transaction);
      setStep(4);
    } catch (error) {
      console.error(error);
    } finally {
      setVerifying(false);
    }
  };

  const handleNotifySeller = () => {
    const sellerName = transaction.sellers?.name || 'Seller';
    const message = `Hi ${sellerName}! I've just funded the vault for "${transaction.description}". Order ID: ${transaction.id}. Please ship it out! 🚀`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="text-brand font-black animate-pulse text-2xl tracking-tighter uppercase">Initializing Vault...</div>
    </div>
  );

  if (!transaction) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-2xl font-black text-brand mb-2 uppercase">Link Expired</h2>
      <p className="text-gray-500 mb-6 font-medium">This transaction link is no longer valid.</p>
      <a href="/" className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold">Return Home</a>
    </div>
  );

  return (
    <div className="max-w-md mx-auto px-6 py-10 min-h-[90vh] flex flex-col bg-[#050505]">
      {verifying && <LoadingOverlay message={step === 1 ? "Verifying Payment..." : "Processing Release..."} />}
      
      <ConfirmModal 
        isOpen={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmReceipt}
        title="Release Funds?"
        message="Are you sure you have received the item? This action will release the vault funds to the vendor and cannot be undone."
      />

      {/* Trust Badge */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/10 shadow-sm">
          <Shield size={14} />
          Secured by Twiinex Escrow
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="px-4 mb-2">
        <div className="flex justify-between items-center mb-4">
          {[1, 2, 3, 4].map((i) => (
            <Fragment key={i}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black transition-all duration-500 ${
                step >= i ? 'bg-brand text-white shadow-lg shadow-brand/30 rotate-3' : 'bg-white/5 text-gray-500 border border-white/10'
              }`}>
                {step > i ? <CheckCircle2 size={18} /> : i}
              </div>
              {i < 4 && (
                <div className={`flex-grow h-1 mx-2 rounded-full transition-all duration-500 ${
                  step > i ? 'bg-brand' : 'bg-white/5'
                }`} />
              )}
            </Fragment>
          ))}
        </div>
        <div className="flex justify-between text-[8px] uppercase tracking-[0.2em] font-black text-gray-400">
          <span>Fund</span>
          <span>Hold</span>
          <span>Ship</span>
          <span>Verify</span>
        </div>
      </div>

      <motion.div
        layout
        className="glass-card flex-grow mt-8 relative overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-8 mt-4">
                <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2 block tracking-[0.2em]">Paying to {transaction.sellers?.name || 'Verified Vendor'}</span>
                <h2 className="text-5xl font-black text-white tracking-tighter">
                   <span className="text-xl text-gray-500 align-top mr-1">UGX</span>
                   {Number(transaction.amount).toLocaleString()}
                </h2>
              </div>

              {transaction.imageUrl && (
                <div className="mb-8 rounded-3xl overflow-hidden border border-white/5 shadow-inner">
                  <img src={transaction.imageUrl} alt={transaction.description} className="w-full h-48 object-cover" />
                </div>
              )}

              <div className="space-y-4 mb-8 bg-white/5 p-6 rounded-3xl border border-white/5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs font-bold">Product</span>
                  <span className="font-black text-white text-sm">{transaction.description}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs font-bold">Transaction ID</span>
                  <span className="font-mono text-[10px] bg-black/50 px-2 py-1 rounded-lg border border-white/5 text-gray-300">{transaction.id}</span>
                </div>
                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-brand font-black text-[10px] uppercase tracking-widest flex items-center gap-1">
                    <Shield size={12} /> Escrow Protected
                  </span>
                  <span className="text-gray-400 text-[10px] font-bold">Fee: 5% Included</span>
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 text-white p-5 rounded-2xl flex items-start gap-4 mb-8">
                <div className="bg-emerald-500/20 p-2 rounded-lg text-emerald-500 shrink-0">
                  <Lock size={18} />
                </div>
                <p className="text-[11px] leading-relaxed font-medium text-emerald-100/80">
                  Your funds are held in a <span className="text-emerald-500 font-bold">secure vault</span>. 
                  Money is ONLY released to the vendor after you confirm you've received the order.
                </p>
              </div>

              <button
                onClick={handlePay}
                className="w-full btn-primary flex items-center justify-center gap-3 py-5"
              >
                <CreditCard size={18} />
                Pay via Mobile Money
                <ChevronRight size={18} className="ml-auto opacity-50" />
              </button>
            </motion.div>
          ) : step === 2 ? (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center py-6"
            >
              <div className="bg-emerald-500/20 border border-emerald-500/30 w-20 h-20 rounded-[2rem] flex items-center justify-center text-emerald-500 mx-auto mb-6 shadow-xl shadow-emerald-500/20 rotate-6">
                <Lock size={40} />
              </div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">Vault Funded</h2>
              <p className="text-gray-400 mb-10 text-sm font-medium leading-relaxed px-4">
                Your UGX {Number(transaction.amount).toLocaleString()} is safely locked. The vendor has been notified to ship your <span className="font-bold text-white">{transaction.description}</span>.
              </p>

              <button
                onClick={handleNotifySeller}
                className="w-full bg-[#25D366] text-black py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all mb-4 shadow-lg shadow-[#25D366]/20"
              >
                <MessageSquare size={18} />
                Notify Seller on WhatsApp
              </button>
            </motion.div>
          ) : step === 3 ? (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center py-6"
            >
              <div className="bg-brand/20 border border-brand/30 w-20 h-20 rounded-[2rem] flex items-center justify-center text-brand mx-auto mb-6 shadow-xl shadow-brand/20 -rotate-3">
                <Truck size={40} />
              </div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">Item Shipped</h2>
              <p className="text-gray-400 mb-10 text-sm font-medium leading-relaxed px-4">
                The vendor has dispatched your order. Once you receive and verify it, click below to release the funds.
              </p>

              <button
                onClick={() => setShowConfirmModal(true)}
                className="w-full bg-emerald-500 text-black py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all mb-4 shadow-lg shadow-emerald-500/20"
              >
                <Package size={18} />
                Confirm Receipt & Release Funds
              </button>
              
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-6">
                Don't click until you have the item!
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10"
            >
              <div className="relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-emerald-500/20 border border-emerald-500/30 w-24 h-24 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-8 shadow-2xl shadow-emerald-500/40"
                >
                  <Coins size={48} />
                </motion.div>
              </div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">Success!</h2>
              <p className="text-gray-400 mb-8 text-sm font-medium leading-relaxed">
                Transaction complete. Funds have been released to <span className="font-bold text-white">{transaction.sellers?.name || 'the vendor'}</span>.
              </p>
              
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 mb-8">
                 <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-4">Hedera Audit Log</p>
                 <div className="space-y-2 text-left">
                    <div className="flex justify-between text-[9px] font-mono">
                       <span className="text-gray-500">HCS Topic:</span>
                       <a 
                         href={`https://hashscan.io/testnet/topic/${transaction.metadata?.hcsTopicId || '0.0.0'}`}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="text-brand hover:underline"
                       >
                         {transaction.metadata?.hcsTopicId || 'Pending...'}
                       </a>
                    </div>
                    <div className="flex justify-between text-[9px] font-mono">
                       <span className="text-gray-500">Sequence:</span>
                       <span className="text-brand">
                         #{transaction.metadata?.hcsSequenceNumber || '...'}
                       </span>
                    </div>
                 </div>
              </div>

              <a 
                href="/"
                className="block w-full btn-primary py-5 text-center font-black uppercase tracking-widest text-xs"
              >
                Done
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <p className="text-center text-[9px] text-gray-600 mt-10 uppercase tracking-[0.3em] font-black">
        Verified by Hedera HCS • Secure Escrow
      </p>
    </div>
  );
};

export default BuyerPaymentPage;
