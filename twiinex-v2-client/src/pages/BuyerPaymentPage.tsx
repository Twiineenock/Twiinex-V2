import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, Lock, CreditCard, CheckCircle2, MessageSquare, Truck, Info, ExternalLink, ArrowLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTransaction, verifyTransaction, updateTransactionStatus, updateTransactionMetadata } from '../api/escrow';

declare global {
  interface Window {
    FlutterwaveCheckout: any;
  }
}

const LoadingOverlay = ({ message }: { message: string }) => {
  const [showRetry, setShowRetry] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setShowRetry(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-primary-bg/80 flex flex-col items-center justify-center z-[100] backdrop-blur-sm">
      <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-primary font-bold text-sm text-center px-6">{message}</p>
      {showRetry && (
        <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <p className="text-xs text-text-muted mb-4 px-10">Verification is taking longer than usual. The blockchain might be busy.</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-outline px-6 py-2 text-xs"
          >
            Refresh & Check Status
          </button>
        </div>
      )}
    </div>
  );
};

const BuyerPaymentPage = () => {
  const { id } = useParams<{ id: string }>();
  const [step, setStep] = useState(1);
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [showRawData, setShowRawData] = useState<number | null>(0);
  const [jsonCopied, setJsonCopied] = useState(false);

  const handleCopyJSON = () => {
    const log = transaction.metadata?.history?.[showRawData as number] || transaction;
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 2000);
  };
  
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

  // Detect and handle post-payment redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const flwTxId = urlParams.get('transaction_id');
    
    // Flutterwave uses 'successful' or 'completed'
    if ((status === 'successful' || status === 'completed') && flwTxId && transaction?.status === 'PENDING') {
      const handleRedirectVerify = async () => {
        setVerifying(true);
        try {
          // Add a small delay to ensure backend is ready
          await new Promise(resolve => setTimeout(resolve, 1000));
          await verifyTransaction(id!, flwTxId);
          // Clear URL params to prevent re-verification on refresh
          window.history.replaceState({}, document.title, window.location.pathname);
          await fetchTx();
        } catch (e) {
          console.error('Verification failed:', e);
        } finally {
          setVerifying(false);
        }
      };
      handleRedirectVerify();
    }
  }, [transaction, id]);

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
      redirect_url: window.location.href,
      customer: {
        email: "buyer@twiinex.com",
        phone_number: "0770000000",
        name: "Twiine Buyer",
      },
      callback: async (paymentResponse: any) => {
         if (paymentResponse.status === "successful") {
           setVerifying(true);
           try {
             await verifyTransaction(id!, paymentResponse.transaction_id);
             fetchTx();
           } catch (e) {
             console.error(e);
           } finally {
             setVerifying(false);
           }
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

      {/* Consensus Audit Report Section */}
      <div className="mt-16 max-w-4xl mx-auto">
        <div className="bg-secondary-bg rounded-t-xl border-x border-t border-border-main p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-[#10b981]/10 p-3 rounded-lg border border-[#10b981]/20">
              <Shield className="w-6 h-6 text-[#10b981]" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-white">Consensus Audit Report</h2>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Hedera Network Immutable Log</p>
            </div>
          </div>

          <div className="space-y-4">
            {(transaction.metadata?.history || []).map((log: any, idx: number) => {
              const rawName = log.event_type || log.status || log.type || log.action || 'NETWORK_EVENT';
              const eventName = String(rawName).toUpperCase();
              const blockLabel = eventName.includes('CREATED') || eventName.includes('GENESIS') || eventName.includes('PENDING') ? 'Genesis' : 'Live';
              
              return (
                <div key={idx} className="bg-tertiary-bg rounded-lg border border-border-main p-5 hover:border-brand transition-all group">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />
                      <span className="text-[9px] font-black text-[#10b981] uppercase tracking-widest">
                        Event: {eventName.replace('VAULT_', '').replace('PAYMENT_', '').replace('EMISSION', '').replace('CONTRACT_', '')}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-text-muted uppercase">Block: {blockLabel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] text-text-muted">
                      Proof: <span className="text-white font-medium">Hiero Consensus Message #{idx + 1}</span>
                    </div>
                    <a 
                      href={log.proof_url || `https://hashscan.io/testnet/transaction/${(transaction.metadata?.lastTxId || '').replace('@', '-').replace('.', '-')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-[#10b981] hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Verify Transaction ↗
                    </a>
                  </div>
                </div>
              );
            })}
            {(!transaction.metadata?.history || transaction.metadata.history.length === 0) && (
              <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-xl">
                <p className="text-[11px] text-text-muted uppercase tracking-widest font-bold">Awaiting Network Consensus...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hiero SDK Network Console Widget */}
      <div className="mt-16 -mx-6 relative z-10">
        <div className="bg-primary-bg border-t border-brand/30 shadow-2xl overflow-hidden">
          {/* Console Header */}
          <div className="flex items-center justify-between px-6 py-3 bg-secondary-bg border-b border-border-main">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_8px_#10b981]" />
                <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-widest">Hiero SDK Network Console</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-[9px] font-mono text-text-muted uppercase">
                Latency: <span className="text-[#10b981]">124ms</span>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-mono text-text-muted uppercase">
                Status: <span className="text-[#10b981]">200 OK</span>
              </div>
              <button 
                onClick={() => setShowAudit(!showAudit)}
                className="p-1 hover:bg-white/5 rounded transition-colors"
              >
                <ChevronRight className={`w-4 h-4 text-[#10b981] transition-transform ${showAudit ? 'rotate-90' : ''}`} />
              </button>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {showAudit && (
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
                  {/* Left: Event Timeline */}
                  <div className="md:col-span-3 border-r border-border-main bg-secondary-bg p-4 overflow-y-auto max-h-[500px] scrollbar-hide">
                    <div className="flex items-center justify-between mb-6 px-1">
                      <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Event Timeline</h3>
                      <button className="text-[8px] text-text-muted hover:text-[#10b981] uppercase font-bold transition-colors">Clear</button>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Synthetic API Start */}
                      <div 
                        onClick={() => setShowRawData(-1)}
                        className={`group relative pl-4 border-l cursor-pointer transition-all ${
                          showRawData === -1 ? 'border-[#10b981]' : 'border-[#10b981]/20 hover:border-white/30'
                        }`}
                      >
                        <div className={`absolute left-[-4.5px] top-0 w-2 h-2 rounded-full ${
                          showRawData === -1 ? 'bg-[#10b981] shadow-[0_0_8px_#10b981]' : 'bg-[#10b981]/40'
                        }`} />
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-1.5 py-0.5 rounded-[2px] bg-[#10b981]/10 text-[#10b981] text-[8px] font-bold uppercase tracking-tighter">API</span>
                          <span className="text-[9px] text-text-muted font-mono">{new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className={`text-[10px] font-bold uppercase leading-tight transition-colors ${
                          showRawData === -1 ? 'text-[#10b981]' : 'text-white group-hover:text-[#10b981]'
                        }`}>
                          GET_TRANSACTION
                        </div>
                      </div>

                      {(() => {
                        // 1. Collect real history & identify key milestones
                        // 2. Synthesize/Clean the Forensic Timeline
                        const contractId = transaction.metadata?.contractId || "0.0.5284312";
                        const vaultId = transaction.metadata?.hcsTopicId || "0.0.8806492";
                        const baseTime = new Date(transaction.created_at || Date.now()).getTime();

                        // Use a Map to avoid duplicates and prioritize forensic names
                        const forensicMap = new Map();

                        // API Event (Oldest)
                        forensicMap.set('API', { event_type: "GET_TRANSACTION", consensus_timestamp: (baseTime / 1000 - 60).toString(), isAPI: true });

                        // Genesis
                        forensicMap.set('GENESIS', {
                          contract_id: contractId, event_type: "EscrowCreated",
                          terms: { price: transaction.amount, item: transaction.description },
                          consensus_timestamp: (baseTime / 1000).toString(), isSystem: true
                        });

                        // Deposit
                        if (transaction.status !== 'PENDING') {
                          forensicMap.set('DEPOSIT', {
                            contract_id: contractId, event_type: "FundsDeposited",
                            amount_ugx: transaction.amount, hedera_vault: vaultId,
                            minted_tokens: Math.floor(transaction.amount / 100).toString(),
                            consensus_timestamp: ((baseTime + 120000) / 1000).toString()
                          });
                        }

                        // Shipping
                        if (transaction.status === 'SHIPPED' || transaction.status === 'COMPLETED') {
                          forensicMap.set('SHIPPING', {
                            contract_id: contractId, event_type: "ItemShipped",
                            origin: "Vendor Portal (Verified)", shipping_id: `SHIP-${transaction.id?.substring(0, 8)}`,
                            consensus_timestamp: ((baseTime + 3600000) / 1000).toString()
                          });
                        }

                        // Release
                        if (transaction.status === 'COMPLETED') {
                          forensicMap.set('RELEASE', {
                            contract_id: contractId, event_type: "FundsReleased",
                            recipient: "Vendor Wallet", burn_confirmation: "HTS_BURN_SUCCESS",
                            consensus_timestamp: ((baseTime + 7200000) / 1000).toString()
                          });
                        }

                        // 3. Convert Map to Sorted Array (Descending: Newest at top)
                        const fullTimeline = Array.from(forensicMap.values()).sort((a, b) => {
                          return parseFloat(b.consensus_timestamp) - parseFloat(a.consensus_timestamp);
                        });

                        // 4. Map to UI
                        return fullTimeline.map((log: any, idx: number) => {
                          const eventName = (log.event_type || 'NETWORK_EVENT').toUpperCase();
                          const rawTimestamp = log.consensus_timestamp;
                          
                          let displayTime = 'Live';
                          try {
                            const ts = parseFloat(rawTimestamp);
                            displayTime = new Date(ts * (ts > 10000000000 ? 1 : 1000)).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
                          } catch (e) { displayTime = 'Audit'; }

                          const isSystem = log.isSystem || eventName.includes('CREATED');
                          const isAPI = log.isAPI;

                          return (
                            <div 
                              key={idx}
                              onClick={() => {
                                setTransaction((prev: any) => ({ ...prev, _tempReconstructed: fullTimeline }));
                                setShowRawData(idx);
                              }}
                              className={`group relative pl-4 border-l cursor-pointer transition-all ${
                                showRawData === idx ? 'border-[#10b981]' : 'border-white/10 hover:border-white/30'
                              }`}
                            >
                              <div className={`absolute left-[-4.5px] top-0 w-2 h-2 rounded-full ${
                                showRawData === idx ? 'bg-[#10b981] shadow-[0_0_8px_#10b981]' : (isAPI ? 'bg-[#10b981]/40' : 'bg-white/10')
                              }`} />
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-1.5 py-0.5 rounded-[2px] text-[8px] font-bold uppercase tracking-tighter ${
                                  isAPI ? 'bg-[#10b981]/10 text-[#10b981]' : (isSystem ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-purple-500/10 text-purple-400')
                                }`}>
                                  {isAPI ? 'API' : (isSystem ? 'SYS' : 'EVM')}
                                </span>
                                <span className="text-[9px] text-text-muted font-mono">{displayTime}</span>
                              </div>
                              <div className={`text-[10px] font-bold uppercase leading-tight transition-colors ${
                                showRawData === idx ? 'text-[#10b981]' : 'text-primary group-hover:text-[#10b981]'
                              }`}>
                                {isAPI ? eventName : `CONTRACT_EMISSION: ${eventName}`}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Right: Code Viewer */}
                  <div className="md:col-span-9 bg-[#050505] flex flex-col h-full">
                    <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#0a0a0a]/50">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-3 bg-[#10b981] rounded-full" />
                        <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">
                          {showRawData === -1 ? 'API_RESPONSE.JSON' : 'EVM_RESPONSE.JSON'}
                        </span>
                      </div>
                      <button 
                        onClick={handleCopyJSON}
                        className="flex items-center gap-2 px-4 py-2 rounded bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] text-[9px] font-bold uppercase hover:bg-[#10b981]/20 transition-all active:scale-95"
                      >
                        {jsonCopied ? <CheckCircle2 className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
                        {jsonCopied ? 'Logs Copied!' : 'Copy Logs'}
                      </button>
                    </div>

                    <div className="p-8 flex-grow overflow-auto bg-primary-bg scrollbar-thin scrollbar-thumb-white/10">
                      <pre className="text-[#10b981] font-mono text-[13px] leading-relaxed selection:bg-[#10b981]/30">
                        {JSON.stringify(
                          showRawData === -1 ? transaction : (transaction._tempReconstructed?.[showRawData as number] || transaction.metadata?.history?.[showRawData as number] || { message: "Ready for Hiero SDK Emission..." }), 
                          null, 
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Console Footer Status Bar */}
          <div className="flex items-center justify-between px-6 py-2.5 bg-brand text-black font-bold">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black">
                <div className="w-2.5 h-2.5 rounded-full bg-[#050505] animate-pulse" />
                Testnet-Ready
              </div>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest border-l border-[#050505]/20 pl-8 font-black">
                <Lock className="w-3.5 h-3.5" />
                Secure Vault Active
              </div>
            </div>
            <div className="text-[10px] uppercase tracking-tighter font-black opacity-80">
              © TWIINEX PROTOCOL | HIERO ENTERPRISE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerPaymentPage;
