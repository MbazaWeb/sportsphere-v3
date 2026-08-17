"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, X, Send, Sparkles, BarChart3, ShieldAlert, FileText } from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';

type Message = { role: 'user' | 'assistant'; content: string };

export default function AiAssistantBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText]);

  // Cleanup on unmount
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const sendStreaming = useCallback(async (userMsg: string) => {
    const msgs = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(msgs);
    setInput('');
    setSending(true);
    setStreaming(true);
    setStreamText('');

    abortRef.current = new AbortController();

    try {
      const res = await adminFetch('/api/admin/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: msgs.map(m => ({ role: m.role, content: m.content })),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error('Stream failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.text) {
                accumulated += parsed.text;
                setStreamText(accumulated);
              }
            } catch { /* skip */ }
          }
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: accumulated }]);
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, an error occurred. Please try again.' }]);
      }
    } finally {
      setSending(false);
      setStreaming(false);
      setStreamText('');
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || sending) return;
    sendStreaming(input.trim());
  };

  const quickActions = [
    { label: 'Summarize platform stats', icon: BarChart3, msg: 'Give me a quick summary of the platform\'s key metrics: total users, posts, active matches, and any notable trends.' },
    { label: 'Moderation issues', icon: ShieldAlert, msg: 'What are the recent content moderation issues that need attention?' },
    { label: 'Help with content', icon: FileText, msg: 'Help me draft an engaging sports news post about recent football transfer news.' },
  ];

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-amber-500/90 hover:bg-amber-400 text-black flex items-center justify-center shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
          title="AI Assistant"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border border-slate-700/50 shadow-2xl shadow-black/40 overflow-hidden"
             style={{ width: 500, height: 600, background: '#0b0e14' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-bold text-white">AI Assistant</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.length === 0 && !streaming && (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
                <Bot className="w-10 h-10 opacity-30" />
                <p className="text-xs">Ask me anything about SportSphere</p>
                <div className="flex flex-col gap-2 w-full mt-2">
                  {quickActions.map((qa) => (
                    <button
                      key={qa.label}
                      onClick={() => sendStreaming(qa.msg)}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg border border-slate-800 hover:border-amber-400/30 hover:bg-amber-400/5 transition text-xs text-slate-400 hover:text-slate-200"
                    >
                      <qa.icon className="w-3.5 h-3.5 text-amber-400/60" />
                      {qa.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-amber-500/15 border border-amber-500/30 text-slate-100'
                    : 'bg-slate-800/80 border border-slate-700/50 text-slate-200'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {streaming && streamText && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm bg-slate-800/80 border border-slate-700/50 text-slate-200">
                  {streamText}
                  <span className="inline-block w-1.5 h-4 bg-amber-400 ml-0.5 animate-pulse rounded-sm" />
                </div>
              </div>
            )}
            {(sending || streaming) && !streamText && (
              <div className="flex justify-start">
                <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2 p-3 border-t border-slate-800 shrink-0">
            <input
              type="text"
              placeholder="Ask anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              disabled={sending}
              className="flex-1 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/40 transition disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 px-3 py-2.5 hover:bg-amber-500/25 transition disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
