import { motion, AnimatePresence } from "motion/react";
import { X, Cpu, Zap, Activity, Send } from "lucide-react";
import { ReactNode, useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

interface AiInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: string;
  tasks: any[];
}

export function AiInsightsModal({ isOpen, onClose, mode, tasks }: AiInsightsModalProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const accentColor = mode === 'titan' ? 'text-purple-neon' : 'text-cyan-neon';
  const accentBorder = mode === 'titan' ? 'border-purple-neon/50' : 'border-cyan-neon/50';
  const accentBg = mode === 'titan' ? 'bg-purple-neon/10' : 'bg-cyan-neon/10';

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Fetch initial insights when modal opens
      fetchInsights();
    } else if (!isOpen) {
      // Optional: reset on close? Let's not reset, keeps context
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const fetchInsights = async (history = messages) => {
    setIsLoading(true);
    try {
      const { generateInsights } = await import('../services/geminiService');
      const insights = await generateInsights(tasks, mode, history);
      setMessages([...history, { role: 'ai', content: insights }]);
    } catch (e: any) {
      setMessages([...history, { role: 'ai', content: `Error: ${e.message || 'Failed to establish neural link.'}` }]);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const newMsg = { role: 'user' as const, content: inputValue.trim() };
    const newHistory = [...messages, newMsg];
    setMessages(newHistory);
    setInputValue("");
    await fetchInsights(newHistory);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[95vw] max-w-lg bg-obsidian border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] h-[600px]"
          >
            {/* Header */}
            <div className={`p-4 md:p-6 border-b border-white/5 flex items-center justify-between ${accentBg} shrink-0`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-obsidian border ${accentBorder} shadow-[0_0_15px_rgba(0,243,255,0.15)]`}>
                  <Cpu className={`w-5 h-5 ${accentColor}`} />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-heading uppercase tracking-widest text-white/90">
                    Aether Core Intelligence
                  </h2>
                  <p className="text-[10px] text-white/50 font-mono tracking-widest uppercase">
                    Neural task optimization & Chat
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                title="Close Interface"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
              {messages.length === 0 && isLoading ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-70">
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className={`p-3 rounded-full border-2 border-dashed ${accentBorder} text-white/30`}
                  >
                    <Activity size={24} className={accentColor} />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-xs font-mono font-bold tracking-widest uppercase text-white/70">Connecting to Cortex</p>
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">Analyzing schedule vectors...</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-white/10 text-white rounded-tr-sm' : `${accentBg} border ${accentBorder} rounded-tl-sm`}`}>
                      {msg.role === 'ai' ? (
                        <div className="markdown-body">
                          <ReactMarkdown
                            components={{
                              h1: ({node, ...props}) => <h1 className="text-sm font-bold text-white mb-2 uppercase tracking-widest font-heading" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-xs font-bold text-white mb-2 uppercase tracking-widest font-heading" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-xs font-bold text-white/80 mb-2 uppercase tracking-widest font-heading" {...props} />,
                              ul: ({node, ...props}) => <ul className="space-y-2 mb-2" {...props} />,
                              li: ({node, ...props}) => (
                                <li className="flex items-start gap-2 text-xs text-white/80 leading-relaxed font-sans pb-1" {...props}>
                                  <span className={`mt-0.5 bg-white/10 p-0.5 rounded-full shrink-0`}><Zap size={8} className={accentColor} /></span>
                                  <span className="flex-1">{props.children}</span>
                                </li>
                              ),
                              p: ({node, ...props}) => <p className="text-xs text-white/80 mb-2 leading-relaxed font-sans last:mb-0" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-bold text-white/90" {...props} />
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-xs text-white font-sans whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
              {isLoading && messages.length > 0 && (
                <div className="flex justify-start">
                  <div className={`${accentBg} border ${accentBorder} rounded-2xl rounded-tl-sm p-4 flex gap-2 items-center text-white/50 text-xs font-mono uppercase`}>
                    <Activity size={14} className={`animate-spin ${accentColor}`} />
                    Processing...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-4 border-t border-white/5 bg-black/40 shrink-0">
               <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex gap-2 relative group"
               >
                 <input
                   type="text"
                   value={inputValue}
                   onChange={(e) => setInputValue(e.target.value)}
                   disabled={isLoading}
                   placeholder="ASK THE AETHER CORE..."
                   className={`flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-${mode === 'titan' ? 'purple' : 'cyan'}-neon/50 transition-colors disabled:opacity-50`}
                 />
                 <button
                   type="submit"
                   disabled={isLoading || !inputValue.trim()}
                   className={`p-3 rounded-xl ${mode === 'titan' ? 'bg-purple-neon text-obsidian' : 'bg-cyan-neon text-obsidian'} disabled:opacity-50 transition-opacity hover:opacity-80 flex items-center justify-center shrink-0`}
                 >
                   <Send size={16} />
                 </button>
               </form>
            </div>
            
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
