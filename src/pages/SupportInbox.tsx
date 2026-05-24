import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { 
  MessageSquare, Send, Clock, Car, User, Search, 
  CheckCircle, AlertCircle, Phone, ChevronRight, ChevronLeft, Inbox
} from 'lucide-react';
import { cn } from '../lib/utils';
import { unwrapApiResponse } from '../lib/api';
import { supabase } from '../lib/supabase';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';

export default function SupportInbox() {
  const { session } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    const channel = supabase.channel('conversations_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => fetchConversations())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (selectedConvId) {
      fetchMessages(selectedConvId);
      const channel = supabase.channel(`messages_${selectedConvId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConvId}` }, () => fetchMessages(selectedConvId))
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedConvId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/messages/conversations`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (res.ok) {
        const result = unwrapApiResponse(await res.json());
        setConversations(Array.isArray(result) ? result : []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/messages/${convId}`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (res.ok) {
        const result = unwrapApiResponse(await res.json());
        setMessages(Array.isArray(result) ? result : []);
      }
    } catch (e) { console.error(e); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConvId) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ conversationId: selectedConvId, text: inputText })
      });
      if (res.ok) {
        const newMessage = unwrapApiResponse(await res.json());
        setMessages([...messages, newMessage]);
        setInputText('');
        fetchConversations();
      }
    } catch (e) { console.error(e); }
  };

  const selectedConv = conversations.find(c => c.id === selectedConvId);
  const filteredConvs = conversations.filter(c => {
    if (!searchQuery) return true;
    const name = c.profiles?.full_name || '';
    const vehicle = c.vehicles ? `${c.vehicles.year} ${c.vehicles.make} ${c.vehicles.model}` : '';
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || vehicle.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-6">
      <div className="sticky top-0 z-40 -mx-4 md:-mx-8 -mt-5 md:-mt-8 px-4 md:px-8 py-4 bg-bg-base/95 backdrop-blur-md border-b border-border-subtle/30 shadow-sm shrink-0 overflow-x-hidden">
        <PageHeader 
          title="Support Inbox" 
          subtitle="Manage customer conversations and vehicle inquiries."
          icon={<Inbox size={18} className="text-primary-main" />}
          actions={
            <Badge variant="primary" className="text-[12px] h-7 px-3">{conversations.length} Active Chats</Badge>
          }
          className="pb-0"
        />
      </div>

      <div className="flex-1 bg-surface-card border border-border-subtle/30 rounded-2xl overflow-hidden flex shadow-sm min-h-0 relative">
        {/* Conversation List */}
        <div className={cn("w-full md:w-[340px] border-r border-border-subtle/30 flex-col bg-surface-card shrink-0 absolute md:relative z-10 inset-0 md:inset-auto", selectedConvId ? "hidden md:flex" : "flex")}>
          <div className="p-4 border-b border-border-subtle/30">
             <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted/30" size={14} />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-bg-secondary border border-border-subtle/30 rounded-xl text-[11px] font-bold text-text-main placeholder:text-text-muted/30 focus:outline-none focus:border-primary-main/30 transition-all"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-3 border-primary-main/20 border-t-primary-main rounded-full animate-spin mx-auto mb-3" />
                <p className="text-[12px] font-bold text-text-muted font-medium">Loading conversations...</p>
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center gap-3">
                <MessageSquare size={24} className="text-text-muted/20" />
                <p className="text-[13px] font-bold text-text-muted font-medium">No conversations found</p>
              </div>
            ) : (
              filteredConvs.map((conv) => (
                 <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={cn(
                    "w-full text-left p-4 border-b border-border-subtle/30 hover:bg-bg-secondary/50 transition-all flex gap-3 relative group",
                    selectedConvId === conv.id && "bg-primary-main/10 border-l-[3px] border-l-primary-main"
                  )}
                >
                   <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold border",
                    selectedConvId === conv.id ? "bg-primary-main text-white border-primary-main" : "bg-bg-secondary text-text-muted/60 border-border-subtle/30"
                  )}>
                    {conv.profiles?.full_name?.charAt(0) || <User size={16} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-text-main text-[12px] tracking-tight truncate pr-2 flex items-center gap-2">
                        {conv.profiles?.full_name || 'Customer'}
                        {conv.status === 'UNCLAIMED' && <span className="w-2 h-2 rounded-full bg-error" title="Unclaimed"></span>}
                        {conv.status === 'RESOLVED' && <span title="Resolved"><CheckCircle size={12} className="text-green-500" /></span>}
                      </span>
                      <span className="text-[11px] text-text-muted font-medium shrink-0">
                        {getTimeAgo(conv.updated_at)}
                      </span>
                    </div>
                    
                    {conv.vehicles && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Car size={10} className="text-primary-main shrink-0" />
                        <span className="text-[12px] font-bold text-primary-main truncate">
                          {conv.vehicles.year} {conv.vehicles.make} {conv.vehicles.model}
                        </span>
                      </div>
                    )}

                    <p className="text-[13px] text-text-muted truncate mt-1 leading-tight">
                      {conv.last_message || 'No messages yet'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={cn("flex-grow flex flex-col bg-bg-secondary/20 h-full", 
          !selectedConvId 
            ? "hidden md:flex" 
            : "flex max-md:fixed max-md:inset-0 max-md:z-[150] max-md:bg-bg-base"
        )}>
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="px-4 md:px-6 py-4 bg-surface-card border-b border-border-subtle/30 flex items-center justify-between shrink-0 max-md:pt-[calc(1rem+env(safe-area-inset-top))]">
                <div className="flex items-center gap-3 md:gap-4">
                  <button className="md:hidden p-2 -ml-2 text-text-muted hover:text-text-main rounded-lg active:bg-bg-secondary" onClick={() => setSelectedConvId(null)}>
                    <ChevronLeft size={18} />
                  </button>
                  <div className="w-10 h-10 rounded-xl bg-primary-main/20 text-primary-main flex items-center justify-center font-bold text-sm border border-primary-main/20">
                    {selectedConv.profiles?.full_name?.charAt(0) || <User size={18} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-main tracking-tight">{selectedConv.profiles?.full_name || 'Customer'}</h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      {selectedConv.vehicles && (
                        <span className="text-[12px] font-bold text-text-muted font-medium flex items-center gap-1.5">
                          <Car size={10} className="text-primary-main" />
                          {selectedConv.vehicles.year} {selectedConv.vehicles.make} {selectedConv.vehicles.model}
                        </span>
                      )}
                      {selectedConv.profiles?.phone_number && (
                        <a href={`tel:${selectedConv.profiles.phone_number}`} className="text-[12px] font-bold text-text-muted font-medium flex items-center gap-1.5 hover:text-primary-main transition-colors">
                          <Phone size={10} /> {selectedConv.profiles.phone_number}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedConv.status === 'UNCLAIMED' && (
                     <button 
                       onClick={async () => {
                         await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/messages/${selectedConv.id}/claim`, {
                           method: 'PATCH',
                           headers: { 'Authorization': `Bearer ${session?.access_token}` }
                         });
                         fetchConversations();
                       }}
                       className="px-3 py-1.5 bg-primary-main text-white text-[11px] font-bold rounded-lg shadow-sm hover:bg-primary-main/90 transition-all flex items-center gap-1"
                     >
                       Claim <ChevronRight size={14} />
                     </button>
                  )}
                  {selectedConv.status === 'CLAIMED' && selectedConv.assigned_staff_id === session?.user?.id && (
                     <button 
                       onClick={async () => {
                         await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/messages/${selectedConv.id}/resolve`, {
                           method: 'PATCH',
                           headers: { 'Authorization': `Bearer ${session?.access_token}` }
                         });
                         fetchConversations();
                       }}
                       className="px-3 py-1.5 bg-green-500/10 text-green-500 border border-green-500/20 text-[11px] font-bold rounded-lg shadow-sm hover:bg-green-500/20 transition-all flex items-center gap-1"
                     >
                       <CheckCircle size={14} /> Resolve
                     </button>
                  )}
                  <Badge variant={selectedConv.status === 'RESOLVED' ? 'success' : selectedConv.status === 'CLAIMED' ? 'warning' : 'error'} className="text-[11px]">
                    {selectedConv.status || 'ACTIVE'}
                  </Badge>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                {selectedConv.vehicles && (
                  <div className="bg-bg-secondary border border-border-subtle/30 rounded-2xl p-4 flex gap-4 items-center shadow-sm max-w-sm mx-auto mb-4">
                    <div className="w-12 h-10 bg-bg-secondary rounded-xl flex items-center justify-center shrink-0 border border-border-subtle/30">
                      <Car className="text-text-muted/40" size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-main tracking-tight truncate">{selectedConv.vehicles.year} {selectedConv.vehicles.make} {selectedConv.vehicles.model}</p>
                      <p className="text-[11px] font-bold text-text-muted font-medium">Vehicle Inquiry Thread</p>
                    </div>
                  </div>
                )}

                {messages.length === 0 ? (
                   <div className="h-full flex items-center justify-center pt-10">
                     <p className="text-[13px] font-bold text-text-muted font-medium">Start the conversation...</p>
                   </div>
                ) : (
                  messages.map((msg, i) => {
                    const isStaff = msg.sender_id === session?.user?.id;
                    return (
                      <div key={i} className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}>
                          <span className="text-[12px] font-bold text-text-muted font-medium mb-1 px-2">
                            {isStaff ? 'You' : (msg.profiles?.full_name || 'Customer')}
                          </span>
                           <div className={cn(
                            "px-4 py-3 text-[12px] font-medium shadow-sm leading-relaxed",
                            isStaff 
                              ? 'bg-primary-main text-white rounded-2xl rounded-tr-md' 
                              : 'bg-surface-card border border-border-subtle/30 text-text-main rounded-2xl rounded-tl-md'
                          )}>
                            {msg.text}
                          </div>
                          <span className="text-[11px] text-text-muted font-bold px-2 mt-1 font-medium">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={scrollRef} />
              </div>
 
              {/* Input */}
              <div className="p-4 bg-surface-card border-t border-border-subtle/30 shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input 
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 bg-bg-secondary border border-border-subtle/30 rounded-xl px-5 py-3 text-[12px] font-medium text-text-main placeholder:text-text-muted/30 focus:outline-none focus:border-primary-main/30 transition-all"
                  />
                   <button 
                    type="submit"
                    disabled={!inputText.trim()}
                    className="bg-primary-main text-white px-6 py-3 rounded-xl hover:bg-primary-main/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-2 text-[11px] active:scale-95 shadow-md shadow-primary-main/20"
                  >
                    Send <Send size={14} />
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
                <p className="text-[13px] font-bold text-text-muted font-medium">Choose from the list to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
