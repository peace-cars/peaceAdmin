import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Car,
  User,
  CheckCircle,
  Phone,
  ChevronRight,
  ChevronLeft,
  Inbox,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { apiFetch } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Badge } from '../components/ui/Badge';

// ── Same glass pill constant as TopNav ───────────────────────────────────────
const GLASS =
  'bg-white/40 backdrop-blur-2xl border border-white/30 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.25)] dark:border-white/10 dark:bg-white/[0.08] dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.55)]';

interface OptimisticMessage {
  _optimistic?: boolean;
  _failed?: boolean;
  id: string;
  text: string;
  created_at: string;
  sender_id: string;
  profiles?: { full_name?: string };
}

export default function SupportInbox() {
  const { session } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<OptimisticMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchConversations();
    const channel = supabase
      .channel('conversations_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () =>
        fetchConversations(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (selectedConvId) {
      fetchMessages(selectedConvId);
      const channel = supabase
        .channel(`messages_${selectedConvId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConvId}` },
          (payload) => {
            // If the new message is from someone else (not us), append it
            const newMsg = payload.new as OptimisticMessage;
            if (newMsg.sender_id !== session?.user?.id) {
              setMessages((prev) => [...prev, newMsg]);
            }
          },
        )
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedConvId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input when conversation selected
  useEffect(() => {
    if (selectedConvId) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [selectedConvId]);

  const fetchConversations = async () => {
    try {
      const result = await apiFetch<any[]>('/messages/conversations', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      setConversations(Array.isArray(result) ? result : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const result = await apiFetch<any[]>(`/messages/${convId}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      setMessages(Array.isArray(result) ? result : []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !selectedConvId || isSending) return;

    // ── Optimistic update ─────────────────────────────────────────────────────
    const tempId = `optimistic_${Date.now()}`;
    const optimisticMsg: OptimisticMessage = {
      _optimistic: true,
      id: tempId,
      text,
      created_at: new Date().toISOString(),
      sender_id: session?.user?.id || '',
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');
    setIsSending(true);

    try {
      const newMessage = await apiFetch<any>('/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ conversationId: selectedConvId, text }),
      });
      // Replace optimistic message with the real one
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...newMessage, _optimistic: false } : m)),
      );
      fetchConversations();
    } catch (e) {
      console.error(e);
      // Mark as failed so user can see it didn't send
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, _failed: true, _optimistic: false } : m)),
      );
      setInputText(text); // restore text
    } finally {
      setIsSending(false);
    }
  };

  const selectedConv = conversations.find((c) => c.id === selectedConvId);
  const filteredConvs = conversations.filter((c) => {
    if (!searchQuery) return true;
    const name = c.profiles?.full_name || '';
    const vehicle = c.vehicles ? `${c.vehicles.year} ${c.vehicles.make} ${c.vehicles.model}` : '';
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    // Full-page fixed: sits below topnav, above bottom nav
    <div
      className="fixed inset-x-0 z-[50] flex gap-0 md:gap-4 md:px-8 md:pb-8 bg-bg-base"
      style={{
        top: 'calc(3.75rem + env(safe-area-inset-top, 0px))',
        bottom: 0,
      }}
    >
      <div className="flex-1 flex overflow-hidden rounded-none md:rounded-2xl border-0 md:border md:border-border-subtle/30 md:shadow-sm bg-surface-card relative min-h-0 w-full">

        {/* ── Conversation List ───────────────────────────────────────────── */}
        <div
          className={cn(
            'w-full md:w-[320px] border-r border-border-subtle/20 flex-col shrink-0 absolute md:relative inset-0 md:inset-auto z-10',
            selectedConvId ? 'hidden md:flex' : 'flex',
          )}
        >
          {/* List header */}
          <div className={cn('mx-3 mt-3 mb-2 shrink-0 px-4 py-3 rounded-2xl flex items-center gap-2.5', GLASS)}>
            <Inbox size={16} className="text-text-secondary shrink-0" />
            <span className="text-[13px] font-bold text-text-main tracking-tight flex-1">Support Inbox</span>
            {conversations.filter(c => c.status === 'UNCLAIMED').length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-error text-white">
                {conversations.filter(c => c.status === 'UNCLAIMED').length}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {loading ? (
              <div className="p-8 text-center flex flex-col items-center gap-3">
                <Loader2 size={20} className="text-text-muted/40 animate-spin" />
                <p className="text-[12px] font-medium text-text-muted">Loading conversations…</p>
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center gap-3">
                <MessageSquare size={24} className="text-text-muted/20" />
                <p className="text-[13px] font-medium text-text-muted">No conversations found</p>
              </div>
            ) : (
              filteredConvs.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={cn(
                    'w-full text-left px-4 py-3.5 border-b border-border-subtle/20 hover:bg-bg-secondary/50 transition-all flex gap-3',
                    selectedConvId === conv.id && 'bg-primary-main/8',
                  )}
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold border',
                      selectedConvId === conv.id
                        ? 'bg-primary-main text-white border-primary-main'
                        : 'bg-bg-secondary text-text-muted/60 border-border-subtle/30',
                    )}
                  >
                    {conv.profiles?.full_name?.charAt(0) || <User size={14} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-bold text-text-main text-[12px] truncate flex items-center gap-1.5">
                        {conv.profiles?.full_name || 'Customer'}
                        {conv.status === 'UNCLAIMED' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-error shrink-0" />
                        )}
                        {conv.status === 'RESOLVED' && (
                          <CheckCircle size={11} className="text-green-500 shrink-0" />
                        )}
                      </span>
                      <span className="text-[10px] text-text-muted shrink-0">{getTimeAgo(conv.updated_at)}</span>
                    </div>
                    {conv.vehicles && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Car size={9} className="text-primary-main shrink-0" />
                        <span className="text-[11px] font-semibold text-primary-main truncate">
                          {conv.vehicles.year} {conv.vehicles.make} {conv.vehicles.model}
                        </span>
                      </div>
                    )}
                    <p className="text-[12px] text-text-muted truncate mt-0.5 leading-snug">
                      {conv.last_message || 'No messages yet'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Chat Area ──────────────────────────────────────────────────── */}
        <div
          className={cn(
            'flex-grow flex flex-col bg-bg-secondary/20 min-h-0',
            !selectedConvId
              ? 'hidden md:flex'
              : 'flex max-md:fixed max-md:inset-0 max-md:z-[200] max-md:bg-bg-base',
          )}
        >
          {/* Hide top nav + bottom nav on mobile when chatting */}
          {selectedConvId && (
            <style>{`
              @media (max-width: 1023px) {
                #admin-top-nav, #admin-bottom-nav { display: none !important; }
              }
            `}</style>
          )}
          {selectedConv ? (
            <>
              {/* ── Floating glass header ────────────────────────────────── */}
              <div className="px-3 pt-3 pb-2 shrink-0 max-md:pt-[calc(0.75rem+env(safe-area-inset-top,16px))]">
                <div className={cn('flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl', GLASS)}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      className="md:hidden p-1.5 -ml-1 text-text-muted hover:text-text-main rounded-lg active:bg-bg-secondary transition-colors shrink-0"
                      onClick={() => setSelectedConvId(null)}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="w-8 h-8 rounded-xl bg-primary-main/20 text-primary-main flex items-center justify-center font-bold text-sm border border-primary-main/20 shrink-0">
                      {selectedConv.profiles?.full_name?.charAt(0) || <User size={14} />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[13px] font-bold text-text-main leading-tight truncate">
                        {selectedConv.profiles?.full_name || 'Customer'}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {selectedConv.vehicles && (
                          <span className="text-[11px] font-semibold text-text-muted flex items-center gap-1">
                            <Car size={9} className="text-primary-main" />
                            {selectedConv.vehicles.year} {selectedConv.vehicles.make} {selectedConv.vehicles.model}
                          </span>
                        )}
                        {selectedConv.profiles?.phone_number && (
                          <a
                            href={`tel:${selectedConv.profiles.phone_number}`}
                            className="text-[11px] font-semibold text-text-muted flex items-center gap-1 hover:text-primary-main transition-colors"
                          >
                            <Phone size={9} /> {selectedConv.profiles.phone_number}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {selectedConv.status === 'UNCLAIMED' && (
                      <button
                        onClick={async () => {
                          await apiFetch(`/messages/${selectedConv.id}/claim`, {
                            method: 'PATCH',
                            headers: { Authorization: `Bearer ${session?.access_token}` },
                          });
                          fetchConversations();
                        }}
                        className="px-2.5 py-1 bg-primary-main text-white text-[10px] font-bold rounded-lg hover:bg-primary-main/90 transition-all flex items-center gap-1 active:scale-95"
                      >
                        Claim <ChevronRight size={12} />
                      </button>
                    )}
                    {selectedConv.status === 'CLAIMED' &&
                      selectedConv.assigned_staff_id === session?.user?.id && (
                        <button
                          onClick={async () => {
                            await apiFetch(`/messages/${selectedConv.id}/resolve`, {
                              method: 'PATCH',
                              headers: { Authorization: `Bearer ${session?.access_token}` },
                            });
                            fetchConversations();
                          }}
                          className="px-2.5 py-1 bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] font-bold rounded-lg hover:bg-green-500/20 transition-all flex items-center gap-1 active:scale-95"
                        >
                          <CheckCircle size={12} /> Resolve
                        </button>
                      )}
                    <Badge
                      variant={
                        selectedConv.status === 'RESOLVED'
                          ? 'success'
                          : selectedConv.status === 'CLAIMED'
                            ? 'warning'
                            : 'error'
                      }
                      className="text-[10px]"
                    >
                      {selectedConv.status || 'ACTIVE'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* ── Messages area ─────────────────────────────────────────── */}
              <div className="flex-1 overflow-y-auto px-4 md:px-6 py-3 space-y-4 no-scrollbar min-h-0">
                {/* Vehicle card */}
                {selectedConv.vehicles && (
                  <div className="bg-bg-secondary border border-border-subtle/30 rounded-2xl p-3 flex gap-3 items-center shadow-sm max-w-xs mx-auto mb-2">
                    <div className="w-10 h-9 bg-bg-secondary rounded-xl flex items-center justify-center shrink-0 border border-border-subtle/30">
                      <Car className="text-text-muted/40" size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-text-main truncate">
                        {selectedConv.vehicles.year} {selectedConv.vehicles.make} {selectedConv.vehicles.model}
                      </p>
                      <p className="text-[10px] font-medium text-text-muted">Vehicle Inquiry Thread</p>
                    </div>
                  </div>
                )}

                {messages.length === 0 ? (
                  <div className="h-40 flex items-center justify-center">
                    <p className="text-[13px] font-medium text-text-muted/60">Start the conversation…</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isStaff = msg.sender_id === session?.user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[72%] flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}>
                          <span className="text-[11px] font-semibold text-text-muted mb-1 px-2">
                            {isStaff ? 'You' : msg.profiles?.full_name || 'Customer'}
                          </span>
                          <div
                            className={cn(
                              'px-4 py-2.5 text-[13px] font-medium shadow-sm leading-relaxed transition-opacity',
                              isStaff
                                ? 'bg-primary-main text-white rounded-2xl rounded-tr-md'
                                : 'bg-surface-card border border-border-subtle/30 text-text-main rounded-2xl rounded-tl-md',
                              msg._optimistic && 'opacity-60',
                              msg._failed && 'opacity-60 border-error border',
                            )}
                          >
                            {msg.text}
                            {msg._optimistic && (
                              <Loader2 size={10} className="inline ml-1.5 animate-spin opacity-60" />
                            )}
                            {msg._failed && (
                              <span className="inline-flex items-center gap-1 ml-1.5 text-error text-[10px]">
                                <AlertCircle size={10} /> Failed
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-text-muted px-2 mt-1 font-medium">
                            {msg._optimistic
                              ? 'Sending…'
                              : new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={scrollRef} />
              </div>

              {/* ── Floating glass input bar ───────────────────────────────── */}
              <div className="px-3 shrink-0" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
                <form
                  onSubmit={handleSendMessage}
                  className={cn('flex items-center gap-2.5 px-3 py-2 rounded-[26px]', GLASS)}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type your reply…"
                    disabled={isSending}
                    className="flex-1 bg-transparent text-[13px] font-medium text-text-main placeholder:text-text-muted/40 focus:outline-none disabled:opacity-60 min-w-0"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e as any);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className={cn(
                      'shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90',
                      'bg-primary-main text-white shadow-md shadow-primary-main/25',
                      'disabled:opacity-40 disabled:cursor-not-allowed',
                    )}
                  >
                    {isSending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={15} />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-bg-secondary border border-border-subtle/30 flex items-center justify-center">
                <MessageSquare size={28} className="text-text-muted/20" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-text-main tracking-tight">Select a conversation</p>
                <p className="text-[13px] font-medium text-text-muted">Choose from the list to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
