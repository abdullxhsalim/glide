import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, X, Send, Bot } from 'lucide-react';

const AIChatWidget = ({ isAdmin = false }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: isAdmin 
        ? "Hi Admin! I'm pouchAI. I have access to your database stats. How can I help you analyze the metrics today?" 
        : "Hi there! I'm pouchAI. I've fetched your Glide stats. How can I help you plan your travels or optimize your experience?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !user?.token || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const endpoint = isAdmin ? '/api/ai/admin-chat' : '/api/ai/user-chat';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to communicate with pouchAI');

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Oops! ' + err.message }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl hover:scale-105 transition-transform z-50 flex items-center justify-center ${
          isAdmin ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-[#F59E0B] hover:bg-[#D97706] text-white'
        } ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 w-[350px] shadow-2xl rounded-2xl flex flex-col overflow-hidden transition-all duration-300 z-50 origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        } ${
          isAdmin ? 'bg-[#0F172A] border border-[#334155]' : 'bg-white border text-gray-800'
        }`}
        style={{ height: '500px', maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className={`p-4 flex items-center justify-between ${isAdmin ? 'bg-[#1E293B] border-b border-[#334155]' : 'bg-[#F59E0B] text-white'}`}>
          <div className="flex items-center gap-2">
            <Bot className={`w-5 h-5 ${isAdmin ? 'text-indigo-400' : 'text-white'}`} />
            <div>
              <h3 className={`font-bold ${isAdmin ? 'text-white' : 'text-white'}`}>pouchAI</h3>
              <p className={`text-xs ${isAdmin ? 'text-indigo-400' : 'text-amber-100'}`}>
                {isAdmin ? 'Admin Analyst' : 'Glide Assistant'}
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className={`p-1 rounded-lg ${isAdmin ? 'hover:bg-[#334155] text-slate-400' : 'hover:bg-amber-600 text-white'} transition-colors`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className={`flex-1 p-4 overflow-y-auto space-y-4 ${isAdmin ? 'bg-[#0B1220]' : 'bg-gray-50'}`}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                msg.role === 'user'
                  ? (isAdmin ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-[#F59E0B] text-white rounded-tr-none')
                  : (isAdmin ? 'bg-[#1E293B] text-slate-300 border border-[#334155] rounded-tl-none' : 'bg-white text-gray-700 border rounded-tl-none shadow-sm')
              }`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isAdmin ? 'bg-[#1E293B] border border-[#334155]' : 'bg-white border shadow-sm'} rounded-tl-none`}>
                <div className="flex gap-1">
                  <div className={`w-2 h-2 rounded-full animate-bounce ${isAdmin ? 'bg-indigo-400' : 'bg-amber-400'} [animation-delay:-0.3s]`}></div>
                  <div className={`w-2 h-2 rounded-full animate-bounce ${isAdmin ? 'bg-indigo-400' : 'bg-amber-400'} [animation-delay:-0.15s]`}></div>
                  <div className={`w-2 h-2 rounded-full animate-bounce ${isAdmin ? 'bg-indigo-400' : 'bg-amber-400'}`}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`p-4 border-t ${isAdmin ? 'bg-[#0F172A] border-[#334155]' : 'bg-white border-gray-200'}`}>
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask pouchAI..."
              className={`flex-1 rounded-xl px-4 py-2 text-sm focus:outline-none transition-all ${
                isAdmin 
                  ? 'bg-[#1E293B] text-white border border-[#334155] focus:border-indigo-500 placeholder-slate-500' 
                  : 'bg-gray-100 text-gray-800 border border-transparent focus:border-[#F59E0B] focus:bg-white placeholder-gray-500'
              }`}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`p-2 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isAdmin ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-[#F59E0B] hover:bg-[#D97706] text-white'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AIChatWidget;
