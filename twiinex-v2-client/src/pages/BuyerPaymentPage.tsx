import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, Lock, CreditCard, ChevronRight, CheckCircle2, MessageSquare, Truck, Info, ExternalLink, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTransaction, verifyTransaction, updateTransactionStatus, updateTransactionMetadata } from '../api/escrow';

declare global {
  interface Window {
    FlutterwaveCheckout: any;
  }
}

const LoadingOverlay = ({ message }: { message: string }) => (
  <div className="fixed inset-0 bg-primary-bg/80 flex flex-col items-center justify-center z-[100] backdrop-blur-sm">
    <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-primary font-bold text-sm">{message}</p>
  </div>
);

const BuyerPaymentPage = () => {
  const { id } = useParams<{ id: string }>();
  const [step, setStep] = useState(1);
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  
  const fetchTx = async () => {
    if (!id) return;
    try {
      const data = await getTransaction(id);
      setTransaction(data);
      
      if (data.status === 'PENDING') setStep(1);
      else if (data.status === 'FUNDED') setStep(2);
      else if (data.status === 'SHIPPED') setStep(3);
      else if (data.status === 'COMPLETED') setStep(4);
    } catch (error) {
      console.error('Error fetching transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTx();
    if (id) updateTransactionMetadata(id, 'view').catch(e => console.warn(e));
    const interval = setInterval(fetchTx, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const handlePay = async () => {
    const publicKey = import.meta.env.VITE_FLW_PUBLIC_KEY;
    if (!window.FlutterwaveCheckout || !publicKey || !transaction) return;

    window.FlutterwaveCheckout({
      public_key: publicKey,
      tx_ref: `TX-${id}-${Date.now()}`,
      amount: transaction.amount,
      currency: "UGX",
      customer: {
        email: "buyer@twiinex.com",
        phone_number: "0770000000",
        name: "Twiine Buyer",
      },
      callback: async (paymentResponse: any) => {
         if (paymentResponse.status === "successful") {
           setVerifying(true);
           await verifyTransaction(id!, paymentResponse.transaction_id);
           fetchTx();
           setVerifying(false);
         }
      },
      customizations: {
        title: "Twiinex Secure Vault",
        description: `Payment for ${transaction.description}`,
      },
    });
  };

  const handleConfirmReceipt = async () => {
    if (!id) return;
    setVerifying(true);
    try {
      await updateTransactionStatus(id, 'COMPLETED');
      fetchTx();
    } catch (error) {
      console.error(error);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-primary-bg">
      <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!transaction) return (
    <div className="max-w-md mx-auto px-6 py-20 text-center">
      <h2 className="text-2xl font-bold mb-2">Link Not Found</h2>
      <p className="text-text-secondary mb-8">This trust link might have expired or been removed.</p>
      <Link to="/" className="btn-primary">Return Home</Link>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-12 bg-primary-bg">
      {verifying && <LoadingOverlay message="Updating Blockchain Record..." />}

      <Link to="/" className="inline-flex items-center gap-2 text-text-muted hover:text-brand mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">Back to Home</span>
      </Link>

      <div className="section-card mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl mb-1">Secure Transaction</h1>
            <div className="flex items-center gap-2 text-success font-bold text-xs uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" />
              Twiinex Escrow Active
            </div>
          </div>
          <div className="text-right">
            <span className="label-text block mb-1">Status</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              transaction.status === 'COMPLETED' ? 'bg-success text-white' : 'bg-brand text-white'
            }`}>
              {transaction.status}
            </span>
          </div>
        </div>

        {/* Progress Bar - Tidy Style */}
        <div className="relative flex justify-between mb-10">
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-tertiary-bg -z-10" />
          {[
            { step: 1, label: 'Pay', icon: CreditCard },
            { step: 2, label: 'Hold', icon: Lock },
            { step: 3, label: 'Ship', icon: Truck },
            { step: 4, label: 'Verify', icon: CheckCircle2 },
          ].map((s) => (
            <div key={s.step} className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                step >= s.step ? 'bg-brand border-brand text-white' : 'bg-primary-bg border-tertiary text-text-muted'
              }`}>
                <s.icon className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-bold uppercase ${step >= s.step ? 'text-brand' : 'text-text-muted'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Main Content Card */}
        <div className="bg-secondary-bg border border-border-color rounded-lg overflow-hidden">
          {transaction.metadata?.imageUrl && (
            <img src={transaction.metadata.imageUrl} className="w-full h-48 object-cover border-b border-border-color" alt="Product" />
          )}
          <div className="p-6">
            <div className="data-row">
              <span className="label-text">Product</span>
              <span className="font-bold">{transaction.description}</span>
            </div>
            <div className="data-row">
              <span className="label-text">Amount</span>
              <span className="font-mono font-bold text-lg">UGX {transaction.amount.toLocaleString()}</span>
            </div>
            <div className="data-row">
              <span className="label-text">Seller</span>
              <span className="font-semibold">{transaction.sellers?.name || 'Verified Vendor'}</span>
            </div>
            <div className="data-row">
              <span className="label-text">Transaction ID</span>
              <span className="value-text">{transaction.id}</span>
            </div>
          </div>
        </div>

        {/* Step-specific Instructions & Buttons */}
        <div className="mt-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-brand/5 border border-brand/20 rounded">
                <Info className="w-5 h-5 text-brand shrink-0" />
                <p className="text-sm">
                  <strong>How it works:</strong> Click the button below to pay into the secure Twiinex vault. The seller will be notified to ship your item, but they won't get the money until you confirm receipt.
                </p>
              </div>
              <button onClick={handlePay} className="w-full btn-primary py-4 text-base font-bold flex items-center justify-center gap-3">
                <CreditCard className="w-5 h-5" /> Pay with Mobile Money
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-success" />
              </div>
              <h3 className="mb-2">Funds Secured</h3>
              <p className="text-sm text-text-secondary mb-8">
                Your money is safe in the vault. The seller is preparing your order.
              </p>
              <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Hi, I've funded the vault for ${transaction.description}. Link ID: ${transaction.id}`)}`, '_blank')} className="btn-outline w-full flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#25D366]" /> Chat with Seller
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-4 text-brand">
                  <Truck className="w-8 h-8" />
                </div>
                <h3 className="mb-2">Order Shipped</h3>
                <p className="text-sm text-text-secondary">
                  Please confirm receipt ONLY after you have inspected the item.
                </p>
              </div>
              <button onClick={handleConfirmReceipt} className="w-full btn-primary py-4 flex items-center justify-center gap-3 bg-success hover:brightness-110">
                <CheckCircle2 className="w-5 h-5" /> Confirm Receipt & Release Funds
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h3 className="mb-2">Transaction Completed</h3>
              <p className="text-sm text-text-secondary mb-8">
                The vault funds have been released to the seller. Thank you for using Twiinex!
              </p>
              <button onClick={() => window.location.href = '/'} className="btn-outline w-full">Return Home</button>
            </div>
          )}
        </div>
      </div>

      {/* Hashscan-style Audit Section */}
      <div className="mt-12 border-t border-border-color pt-8">
        <button 
          onClick={() => setShowAudit(!showAudit)}
          className="flex items-center justify-between w-full text-text-muted hover:text-primary transition-colors mb-4"
        >
          <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" /> Immutable Audit Trail (Hedera HCS)
          </span>
          <ChevronRight className={`w-4 h-4 transition-transform ${showAudit ? 'rotate-90' : ''}`} />
        </button>

        <AnimatePresence>
          {showAudit && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-secondary-bg border border-border-color rounded p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="label-text block mb-1">Network</span>
                    <span className="text-xs font-mono">Hedera Testnet</span>
                  </div>
                  <div>
                    <span className="label-text block mb-1">Consensus Type</span>
                    <span className="text-xs font-mono">HCS (Topic 0.0.X)</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-border-color">
                  <span className="label-text block mb-2">Live Proof of Transaction</span>
                  <div className="flex flex-col gap-2">
                    <a 
                      href={`https://hashscan.io/testnet/transaction/${(transaction.metadata?.lastTxId || '').replace('@', '-').replace(/\.(?=\d+$)/, '-')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand hover:underline flex items-center gap-1"
                    >
                      View Consensus Log on Hashscan <ExternalLink className="w-3 h-3" />
                    </a>
                    <p className="text-[10px] text-text-muted leading-relaxed italic">
                      This transaction is mathematically proven and immutable. Twiinex uses Hedera HCS to ensure every step of the escrow lifecycle is recorded on a public ledger that neither the buyer nor seller can alter.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BuyerPaymentPage;
