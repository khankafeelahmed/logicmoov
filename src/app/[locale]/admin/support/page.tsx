"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Bot, Headset, Loader2, Send, User } from "lucide-react";
import {
  api,
  type AgentConversation,
  type ChatMessage,
  type Conversation,
  type ConversationStatus,
} from "@/lib/api";
import { getToken, clearSession } from "@/lib/adminAuth";
import { getSocket } from "@/lib/realtime";
import StatusBadge from "@/components/admin/StatusBadge";

const FILTERS: (ConversationStatus | "ALL")[] = [
  "ALL",
  "WAITING_AGENT",
  "WITH_AGENT",
  "BOT",
  "RESOLVED",
];

export default function AdminSupportPage() {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [filter, setFilter] = useState<ConversationStatus | "ALL">("ALL");
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await api.listAgentConversations(
        token,
        filter === "ALL" ? undefined : filter,
      );
      setConversations(res.conversations);
    } catch (err) {
      if ((err as { status?: number }).status === 401) {
        clearSession();
        router.replace(`/${locale}/admin/login`);
        return;
      }
      setError("Could not load conversations. Is the API running?");
    } finally {
      setLoading(false);
    }
  }, [filter, router, locale]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  // Agents room: refresh list on any queue activity.
  useEffect(() => {
    const socket = getSocket();
    socket.emit("agents:join");
    const refresh = () => void loadList();
    socket.on("queue:new", refresh);
    socket.on("queue:waiting", refresh);
    socket.on("queue:update", refresh);
    return () => {
      socket.off("queue:new", refresh);
      socket.off("queue:waiting", refresh);
      socket.off("queue:update", refresh);
    };
  }, [loadList]);

  // Selected conversation room: live message + status updates.
  useEffect(() => {
    if (!selected) return;
    const socket = getSocket();
    socket.emit("conversation:join", selected.id);
    const onMessage = (msg: ChatMessage) => {
      if (msg.conversationId !== selected.id) return;
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      );
    };
    const onConversation = (p: { status: ConversationStatus }) => {
      setSelected((prev) => (prev ? { ...prev, status: p.status } : prev));
    };
    socket.on("message", onMessage);
    socket.on("conversation", onConversation);
    return () => {
      socket.emit("conversation:leave", selected.id);
      socket.off("message", onMessage);
      socket.off("conversation", onConversation);
    };
  }, [selected]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function openConversation(id: string) {
    try {
      const { conversation } = await api.getConversation(id);
      setSelected(conversation);
      setMessages(conversation.messages);
    } catch {
      setError("Could not open conversation.");
    }
  }

  async function claim() {
    const token = getToken();
    if (!token || !selected) return;
    const { conversation } = await api.claimConversation(token, selected.id);
    setSelected(conversation);
    setMessages(conversation.messages);
    void loadList();
  }

  async function resolve() {
    const token = getToken();
    if (!token || !selected) return;
    const { conversation } = await api.resolveConversation(token, selected.id);
    setSelected(conversation);
    setMessages(conversation.messages);
    void loadList();
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    const text = input.trim();
    if (!token || !selected || !text) return;
    setInput("");
    try {
      await api.sendAgentMessage(token, selected.id, text);
      // The new message arrives via socket; no manual append needed.
    } catch {
      setError("Failed to send message.");
      setInput(text);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-ink-900">Support</h1>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        {/* Conversation list */}
        <div className="rounded-2xl border border-ink-100 bg-white">
          <div className="flex flex-wrap gap-1 border-b border-ink-100 p-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  filter === f
                    ? "bg-ink-900 text-white"
                    : "text-ink-500 hover:bg-ink-50"
                }`}
              >
                {f === "ALL" ? "All" : f.replace(/_/g, " ")}
              </button>
            ))}
          </div>
          <div className="max-h-[32rem] overflow-y-auto">
            {loading ? (
              <div className="flex items-center gap-2 p-4 text-sm text-ink-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-sm text-ink-400">No conversations.</p>
            ) : (
              conversations.map((c) => {
                const last = c.messages[0];
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => void openConversation(c.id)}
                    className={`flex w-full flex-col gap-1 border-b border-ink-50 p-3 text-left transition hover:bg-ink-50 ${
                      selected?.id === c.id ? "bg-brand-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-ink-900">
                        {c.guestName || c.guestEmail || "Guest"}
                      </span>
                      <StatusBadge status={c.status} />
                    </div>
                    {last && (
                      <span className="truncate text-xs text-ink-400">
                        {last.body}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Thread */}
        <div className="flex min-h-[36rem] flex-col rounded-2xl border border-ink-100 bg-white">
          {!selected ? (
            <div className="flex flex-1 items-center justify-center text-sm text-ink-400">
              Select a conversation
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-ink-100 p-4">
                <div>
                  <p className="font-bold text-ink-900">
                    {selected.guestName || selected.guestEmail || "Guest"}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <StatusBadge status={selected.status} />
                    {selected.agent && (
                      <span className="text-xs text-ink-400">
                        · {selected.agent.fullName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {selected.status !== "WITH_AGENT" &&
                    selected.status !== "RESOLVED" && (
                      <button
                        type="button"
                        onClick={() => void claim()}
                        className="rounded-full bg-ink-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-ink-800"
                      >
                        Claim
                      </button>
                    )}
                  {selected.status !== "RESOLVED" && (
                    <button
                      type="button"
                      onClick={() => void resolve()}
                      className="rounded-full border border-ink-200 px-4 py-1.5 text-xs font-semibold text-ink-600 hover:bg-ink-50"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-ink-50 p-4">
                {messages.map((m) => (
                  <AgentBubble key={m.id} message={m} />
                ))}
              </div>

              <form
                onSubmit={send}
                className="flex items-center gap-2 border-t border-ink-100 p-3"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a reply…"
                  disabled={selected.status === "RESOLVED"}
                  className="flex-1 rounded-full border border-ink-200 px-4 py-2 text-sm outline-none focus:border-brand-500 disabled:bg-ink-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || selected.status === "RESOLVED"}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-ink-900 hover:bg-brand-400 disabled:opacity-50"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AgentBubble({ message }: { message: ChatMessage }) {
  if (message.sender === "SYSTEM") {
    return <p className="text-center text-xs italic text-ink-400">{message.body}</p>;
  }
  const fromCustomer = message.sender === "CUSTOMER";
  const Icon = message.sender === "BOT" ? Bot : message.sender === "AGENT" ? Headset : User;
  return (
    <div className={`flex ${fromCustomer ? "justify-start" : "justify-end"}`}>
      <div className="max-w-[80%]">
        <div className="mb-0.5 flex items-center gap-1 text-[10px] text-ink-400">
          <Icon className="h-3 w-3" />
          {message.sender === "CUSTOMER"
            ? "Customer"
            : message.sender === "BOT"
              ? "Assistant"
              : message.senderName || "Agent"}
        </div>
        <div
          className={`rounded-2xl px-3 py-2 text-sm ${
            fromCustomer
              ? "rounded-bl-sm border border-ink-100 bg-white text-ink-800"
              : message.sender === "BOT"
                ? "rounded-br-sm bg-ink-100 text-ink-700"
                : "rounded-br-sm bg-brand-500 text-ink-900"
          }`}
        >
          {message.body}
        </div>
      </div>
    </div>
  );
}
