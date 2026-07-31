import React, { useState, useEffect, useRef } from 'react';
import { fetchChatHistory, sendChatMessage } from '../services/api';
import { Bot, User, Send, Loader2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function AIChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const history = await fetchChatHistory();
      if (history.length === 0) {
        setMessages([{
          id: 'welcome',
          role: 'ai',
          content: "Hello! I am your KiranaPulse AI Business Assistant. I can help you analyze your sales, find low stock items, or provide business recommendations based on your real-time inventory. What can I help you with today?"
        }]);
      } else {
        setMessages(history);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the AI Assistant service.");
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput('');
    
    // Optimistic UI update
    const tempId = Date.now().toString();
    setMessages(prev => [...prev, { id: tempId, role: 'user', content: userMessage }]);
    setSending(true);

    try {
      const aiResponse = await sendChatMessage(userMessage);
      setMessages(prev => [...prev, aiResponse]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: tempId + '_err',
        role: 'ai',
        content: "⚠️ **Connection Error**: Failed to reach the AI server. Please try again."
      }]);
    } finally {
      setSending(false);
    }
  };

  const clearChat = async () => {
      // For this MVP, we aren't creating a clear chat endpoint, 
      // but in a production app we'd call `DELETE /chat/history` here.
      alert("Chat history persistence is managed securely by the backend.");
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
        <p>Connecting to AI Engine...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 p-4 sm:p-6 lg:p-8 flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col glass-panel rounded-2xl border border-purple-900/30 overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.1)]">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-900/80 border-b border-purple-900/30 flex items-center justify-between backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-kirana-600 flex items-center justify-center shadow-lg shadow-purple-900/50">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">KiranaPulse AI</h1>
              <p className="text-xs text-purple-400 font-medium">Powered by Gemini • Real-time Store Context</p>
            </div>
          </div>
          <button 
            onClick={loadHistory}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Refresh Connection"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth bg-slate-950/50">
          {error && (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-900 text-red-400 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" /> {error}
            </div>
          )}

          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id || idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${isUser ? 'bg-slate-800' : 'bg-purple-600'}`}>
                    {isUser ? <User className="w-4 h-4 text-slate-300" /> : <Bot className="w-4 h-4 text-white" />}
                  </div>

                  <div className={`p-4 rounded-2xl ${isUser ? 'bg-slate-800 text-slate-100 rounded-tr-sm' : 'bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-sm'}`}>
                    {isUser ? (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                    {msg.timestamp && (
                      <span className={`text-[10px] block mt-2 ${isUser ? 'text-slate-500 text-right' : 'text-slate-600'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
          
          {sending && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[75%]">
                <div className="shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 rounded-tl-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about inventory, sales, or get recommendations..."
              disabled={sending}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-14 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="absolute right-2 p-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 disabled:hover:bg-purple-600 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex flex-wrap gap-2 mt-3">
            {["Which products should I reorder?", "What is today's revenue?", "Are any products expiring soon?"].map(suggestion => (
              <button 
                key={suggestion}
                type="button"
                onClick={() => setInput(suggestion)}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
