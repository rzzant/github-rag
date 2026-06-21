'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User } from 'lucide-react';
import { api } from '@/lib/api';
import { ChatMode, ChatMessage, Citation } from '@/types';
import { MarkdownRenderer, CitationsList } from '@/components/shared/MarkdownRenderer';
import { cn } from '@/lib/utils';

const MODES: { value: ChatMode; label: string; placeholder: string }[] = [
  { value: 'explain', label: 'Explain', placeholder: 'Explain how authentication works...' },
  { value: 'architecture', label: 'Architecture', placeholder: 'Describe the system architecture...' },
  { value: 'function', label: 'Function', placeholder: 'What does the parseFile function do?' },
  { value: 'api', label: 'API', placeholder: 'List all API endpoints and their purposes...' },
  { value: 'onboarding', label: 'Onboarding', placeholder: 'How do I set up this project locally?' },
];

interface ChatInterfaceProps {
  repoId: string;
}

export function ChatInterface({ repoId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>('explain');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>();
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentMode = MODES.find((m) => m.value === mode)!;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessage, createdAt: new Date().toISOString() },
    ]);
    setLoading(true);

    try {
      const response = await api.chat.send(repoId, userMessage, mode, sessionId);
      setSessionId(response.sessionId);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.answer,
          citations: response.citations as Citation[],
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${err instanceof Error ? err.message : 'Failed to get response'}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      {/* Mode selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              mode === m.value
                ? 'bg-brand-600 text-white'
                : 'bg-surface-elevated text-[var(--muted)] hover:text-[var(--foreground)]'
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-surface-border bg-surface-elevated/30 p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Bot className="mb-3 h-12 w-12 text-[var(--muted)]" />
            <p className="text-[var(--muted)]">Ask anything about this repository</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Responses include source citations from the codebase
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'flex gap-3 animate-fade-in',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {msg.role === 'assistant' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600">
                <Bot className="h-4 w-4 text-white" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[80%] rounded-xl px-4 py-3',
                msg.role === 'user'
                  ? 'bg-brand-600 text-white'
                  : 'border border-surface-border bg-surface-elevated'
              )}
            >
              {msg.role === 'user' ? (
                <p className="text-sm">{msg.content}</p>
              ) : (
                <>
                  <MarkdownRenderer content={msg.content} />
                  {msg.citations && <CitationsList citations={msg.citations} />}
                </>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-border">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-elevated px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
              <span className="text-sm text-[var(--muted)]">Analyzing repository...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={currentMode.placeholder}
          className="input flex-1"
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()} className="btn-primary px-4">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
