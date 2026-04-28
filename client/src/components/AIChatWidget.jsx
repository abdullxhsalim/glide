import React, { useMemo, useState } from 'react';
import { Bot, Send, Sparkles, MessageCircle, X, Loader2 } from 'lucide-react';

const AIChatWidget = ({
  endpoint,
  token,
  title,
  subtitle,
  placeholder,
  mode,
  accent = 'emerald'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: subtitle || 'Ask anything and I will help.'
    }
  ]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const accentClasses = useMemo(() => {
    if (accent === 'amber') {
      return {
        button: 'bg-gradient-to-r from-[#F59E0B] to-[#EA580C] hover:from-[#D97706] hover:to-[#C2410C]',
        ring: 'ring-[#F59E0B]/40',
        border: 'border-[#F59E0B]/40',
        badge: 'text-[#FCD34D] bg-[#F59E0B]/10 border-[#F59E0B]/30'
      };
    }

    return {
      button: 'bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857]',
      ring: 'ring-[#10B981]/40',
      border: 'border-[#10B981]/40',
      badge: 'text-[#6EE7B7] bg-[#10B981]/10 border-[#10B981]/30'
    };
  }, [accent]);

  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || !token || sending) {
      return;
    }

    setError('');
    const nextMessages = [...messages, { role: 'user', content: trimmedInput }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: trimmedInput,
          mode,
          history: nextMessages.slice(-8)
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to chat with AI assistant');
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply || 'No response from assistant.'
        }
      ]);
    } catch (err) {
      setError(err.message || 'Failed to chat with AI assistant');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[70] flex flex-col items-end">
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl text-white font-semibold transition-all ${accentClasses.button} ring-1 ${accentClasses.ring} hover:-translate-y-1`}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="hidden sm:inline">AI Assistant</span>
        </button>
      )}

      {isOpen && (
        <div className={`w-[calc(100vw-2rem)] sm:w-[400px] flex flex-col rounded-[2rem] border ${accentClasses.border} bg-[#020617]/90 backdrop-blur-xl shadow-[0_30px_100px_-15px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300 ring-1 ring-white/5 max-h-[calc(100vh-6rem)] sm:max-h-[600px]`}>
          <div className={`p-5 flex items-start justify-between gap-3 bg-gradient-to-b from-white/10 to-transparent border-b shrink-0 ${accentClasses.border}/30`}>
            <div>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${accentClasses.badge} shadow-inner`}>
                <Sparkles className="w-3 h-3" />
                Powered by Llama 3
              </div>
              <h3 className="text-white font-bold text-xl mt-3 tracking-tight flex items-center gap-2">
                <div className={`p-1.5 rounded-xl bg-gradient-to-br from-white/20 to-transparent ring-1 ${accentClasses.ring}`}>
                  <Bot className="w-5 h-5 text-white" />
                </div>
                {title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 custom-scrollbar min-h-[300px] sm:min-h-[400px]">
            {messages.map((message, idx) => (
              <div
                key={`${message.role}-${idx}`}
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed shadow-sm ${
                  message.role === 'assistant'
                    ? 'bg-[#1E293B]/80 text-[#F8FAFC] border border-[#334155]/50 rounded-tl-sm backdrop-blur-sm'
                    : `ml-auto ${accentClasses.button} text-white border-0 rounded-tr-sm`
                }`}
              >
                {message.content}
              </div>
            ))}

            {sending && (
              <div className="inline-flex items-center gap-2 text-xs text-[#93C5FD]">
                <Loader2 className="w-3 h-3 animate-spin" /> Thinking...
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {error}
              </div>
            )}
          </div>

          <div className={`p-4 bg-[#0F172A]/70 backdrop-blur-md border-t shrink-0 ${accentClasses.border}/30`}>
            <div className="flex flex-col gap-2 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={placeholder || 'Chat with pouchAI...'}
                className="w-full pl-5 pr-14 py-3.5 rounded-2xl bg-[#1E293B]/60 border border-[#334155] shadow-inner text-white placeholder:text-[#64748B] focus:outline-none focus:ring-1 focus:border-transparent transition-all placeholder:text-[14px]"
                style={{
                  '--tw-ring-color': accent === 'amber' ? 'rgba(245,158,11,0.5)' : 'rgba(16,185,129,0.5)'
                }}
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={sending || !token || !input.trim()}
                className={`absolute right-1.5 top-1.5 bottom-1.5 aspect-square rounded-xl flex items-center justify-center transition-all ${accentClasses.button} disabled:opacity-50 disabled:grayscale`}
              >
                <Send className="w-4 h-4 text-white ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatWidget;
