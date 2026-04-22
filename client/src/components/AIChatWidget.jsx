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
    <div className="fixed bottom-5 right-5 z-[70]">
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl text-white font-semibold transition-all ${accentClasses.button} ring-1 ${accentClasses.ring}`}
        >
          <MessageCircle className="w-4 h-4" />
          AI Assistant
        </button>
      )}

      {isOpen && (
        <div className={`w-[340px] sm:w-[380px] rounded-3xl border ${accentClasses.border} bg-[#0B1220]/95 backdrop-blur-md shadow-[0_20px_60px_rgba(2,6,23,0.7)] overflow-hidden`}>
          <div className="p-4 border-b border-[#334155] flex items-start justify-between gap-2">
            <div>
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${accentClasses.badge}`}>
                <Sparkles className="w-3 h-3" />
                Powered by Llama 3 (Groq)
              </div>
              <h3 className="text-white font-semibold mt-2 flex items-center gap-2">
                <Bot className="w-4 h-4" /> {title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#94A3B8] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="h-80 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((message, idx) => (
              <div
                key={`${message.role}-${idx}`}
                className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  message.role === 'assistant'
                    ? 'bg-[#1E293B] text-[#E2E8F0] border border-[#334155]'
                    : 'ml-auto bg-[#0EA5E9]/20 text-[#E0F2FE] border border-[#0284C7]/40'
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

          <div className="p-3 border-t border-[#334155]">
            <div className="flex items-center gap-2">
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
                placeholder={placeholder || 'Ask your question...'}
                className="flex-1 px-3 py-2 rounded-xl bg-[#1E293B] border border-[#334155] text-white placeholder:text-[#64748B] focus:outline-none focus:border-[#22C55E]"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={sending || !token || !input.trim()}
                className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatWidget;
