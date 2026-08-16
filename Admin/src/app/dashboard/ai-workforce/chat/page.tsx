"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Bot, Brain, Send, ChevronDown, Wrench, Clock, User,
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';

/* ── types ─────────────────────────────────────── */
type AgentOption = {
  id: string;
  name: string;
  model?: string;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'tool_call';
  content?: string;
  toolName?: string;
  toolResult?: string;
  timestamp?: string;
  agentName?: string;
};

/* ── page ──────────────────────────────────────── */
export default function AIChatPage() {
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch('/api/admin/ai-workforce/agents?list=true', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const list: AgentOption[] = data.agents ?? [];
          setAgents(list);
          if (list.length > 0) setSelectedAgent(list[0].id);
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await adminFetch('/api/admin/ai-workforce/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgent, message: userMsg.content }),
      });
      const data = await res.json();
      if (res.ok && data.messages) {
        setMessages((prev) => [...prev, ...data.messages]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.error || 'An error occurred',
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Network error. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const currentAgent = agents.find((a) => a.id === selectedAgent);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Brain className="w-7 h-7 text-amber-400" />
          <h1 className="text-3xl font-black text-white tracking-tight">AI Chat</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">Interact with any AI agent directly</p>
      </div>

      {/* Agent Selector */
      <div className="relative mb-4 shrink-0" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-2.5 text-sm text-slate-200 hover:border-amber-400/40 transition w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-amber-400" />
            <span>{loading ? 'Loading agents...' : currentAgent ? `${currentAgent.name} (${currentAgent.model || '—'})` : 'Select an agent'}</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute z-20 mt-1 w-full rounded-xl border border-slate-800 bg-[#0f141c] shadow-xl max-h-64 overflow-y-auto"
          >
            {agents.map((a) => (
              <button
                key={a.id}
                onClick={() => { setSelectedAgent(a.id); setShowDropdown(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-amber-400/10 transition flex items-center justify-between ${
                  a.id === selectedAgent ? 'text-amber-400 bg-amber-400/5' : 'text-slate-300'
                }`}
              >
                <span>{a.name}</span>
                <span className="text-xs text-slate-500">{a.model || '—'}</span>
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Messages Area */
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600">
            <Bot className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">Start a conversation with {currentAgent?.name || 'an agent'}</p>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role !== 'user' && (
                <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0 mt-0.5">
                  {msg.role === 'tool_call' ? <Wrench className="w-4 h-4 text-amber-400" /> : <Bot className="w-4 h-4 text-amber-400" />}
                </div>
              )}
              <div className={`max-w-[70%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                    msg.role === 'user'
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                      : msg.role === 'tool_call'
                        ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                        : 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                  }`}>
                    {msg.role === 'user' ? 'You' : msg.role === 'tool_call' ? `Tool: ${msg.toolName || 'call'}` : 'Assistant'}
                  </span>
                  {msg.timestamp && (
                    <span className="text-[10px] text-slate-600 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <div className={`rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-amber-500/15 border border-amber-500/30 text-slate-100'
                    : msg.role === 'tool_call'
                      ? 'bg-violet-500/10 border border-violet-500/20 text-slate-200'
                      : 'bg-slate-800/80 border border-slate-700/50 text-slate-200'
                }`}>
                  {msg.content || msg.toolResult || '...'}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-sky-400" />
                </div>
              )}
            </motion.div>
          ))
        )}
        {sending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
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

      {/* Input Bar */}
      <div className="mt-4 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={`Message ${currentAgent?.name || 'agent'}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            disabled={sending}
            className="flex-1 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/40 transition disabled:opacity-50"
          />
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 px-4 py-3 hover:bg-amber-500/25 transition disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
