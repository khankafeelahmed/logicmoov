"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bot,
  Headset,
  Loader2,
  MessageCircle,
  Send,
  User,
  X,
} from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import {
  api,
  ApiError,
  type ChatMessage,
  type Conversation,
  type ConversationStatus,
} from "@/lib/api";
import { getSocket } from "@/lib/realtime";
import { localAssistantReply } from "@/lib/assistant";

const STORAGE_KEY = "txigold_chat";

export default function ChatWidget({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const t = dict.chat;
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [status, setStatus] = useState<ConversationStatus>("BOT");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localMode, setLocalMode] = useState(false);
  const localSeq = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  function localMessage(
    sender: ChatMessage["sender"],
    body: string,
  ): ChatMessage {
    localSeq.current += 1;
    return {
      id: `local-${Date.now()}-${localSeq.current}`,
      conversationId: "local",
      sender,
      body,
      createdAt: new Date().toISOString(),
    };
  }

  // Answer locally when the backend is unreachable so customers always get help.
  function answerLocally(text: string) {
    setLocalMode(true);
    const { reply } = localAssistantReply(locale, text);
    setMessages((prev) => [
      ...prev,
      localMessage("CUSTOMER", text),
      localMessage("BOT", reply),
    ]);
  }

  const applyConversation = useCallback((c: Conversation) => {
    setConversationId(c.id);
    setStatus(c.status);
    setMessages(c.messages);
    localStorage.setItem(STORAGE_KEY, c.id);
  }, []);

  // Restore an existing conversation on first open.
  useEffect(() => {
    if (!open || conversationId) return;
    const saved =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) {
      api
        .getConversation(saved)
        .then((r) => applyConversation(r.conversation))
        .catch(() => localStorage.removeItem(STORAGE_KEY));
    }
  }, [open, conversationId, applyConversation]);

  // Subscribe to realtime updates for the active conversation.
  useEffect(() => {
    if (!conversationId) return;
    const socket = getSocket();
    socket.emit("conversation:join", conversationId);

    const onMessage = (msg: ChatMessage) => {
      if (msg.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
      );
    };
    const onConversation = (payload: { status: ConversationStatus }) => {
      setStatus(payload.status);
    };

    socket.on("message", onMessage);
    socket.on("conversation", onConversation);
    return () => {
      socket.emit("conversation:leave", conversationId);
      socket.off("message", onMessage);
      socket.off("conversation", onConversation);
    };
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    setInput("");

    // Already running offline: answer with the local assistant.
    if (localMode) {
      answerLocally(text);
      setSending(false);
      return;
    }

    try {
      if (!conversationId) {
        const { conversation } = await api.startConversation({ text, locale });
        applyConversation(conversation);
      } else {
        const { conversation } = await api.sendCustomerMessage(
          conversationId,
          text,
        );
        applyConversation(conversation);
      }
    } catch (err) {
      // A real HTTP error from the API (e.g. resolved conversation): surface it.
      // A network/connection failure means the backend is down — fall back to
      // the built-in assistant so the customer still gets an answer.
      if (err instanceof ApiError) {
        setError(t.startError);
        setInput(text);
      } else {
        answerLocally(text);
      }
    } finally {
      setSending(false);
    }
  }

  async function handleHandoff() {
    if (localMode || !conversationId) {
      // Live agents require the backend; guide the customer to reach us.
      setMessages((prev) => [
        ...prev,
        localMessage("SYSTEM", t.agentsOffline),
      ]);
      return;
    }
    try {
      const { conversation } = await api.requestHandoff(conversationId);
      applyConversation(conversation);
    } catch {
      setMessages((prev) => [...prev, localMessage("SYSTEM", t.agentsOffline)]);
    }
  }

  function newChat() {
    localStorage.removeItem(STORAGE_KEY);
    setConversationId(null);
    setStatus("BOT");
    setMessages([]);
    setError(null);
    setLocalMode(false);
  }

  const subtitle =
    status === "WITH_AGENT"
      ? t.subtitleAgent
      : status === "WAITING_AGENT"
        ? t.subtitleWaiting
        : status === "RESOLVED"
          ? t.subtitleResolved
          : t.subtitleBot;

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t.launcher}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-ink-900 shadow-lg shadow-ink-900/20 transition hover:bg-brand-400"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[32rem] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 bg-ink-950 px-4 py-3 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-ink-900">
              <Headset className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold">{t.title}</p>
              <p className="text-xs text-ink-300">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={newChat}
              className="text-xs text-ink-300 hover:text-white"
            >
              {t.newChat}
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-ink-50 p-4">
            <MessageBubble
              message={{
                id: "greeting",
                conversationId: "",
                sender: "BOT",
                body: t.greeting,
                createdAt: "",
              }}
              dict={dict}
            />
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} dict={dict} />
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-xs text-ink-400">
                <Loader2 className="h-3 w-3 animate-spin" /> …
              </div>
            )}
          </div>

          {/* Handoff / status bar */}
          {status === "BOT" && (conversationId || localMode) && (
            <button
              type="button"
              onClick={handleHandoff}
              className="flex items-center justify-center gap-2 border-t border-ink-100 bg-white py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50"
            >
              <Headset className="h-3.5 w-3.5" />
              {t.talkToHuman}
            </button>
          )}

          {error && (
            <p className="bg-red-50 px-4 py-2 text-xs text-red-600">{error}</p>
          )}

          {/* Composer */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-ink-100 bg-white p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              disabled={status === "RESOLVED"}
              className="flex-1 rounded-full border border-ink-200 px-4 py-2 text-sm outline-none focus:border-brand-500 disabled:bg-ink-50"
            />
            <button
              type="submit"
              disabled={sending || !input.trim() || status === "RESOLVED"}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-ink-900 transition hover:bg-brand-400 disabled:opacity-50"
              aria-label={t.send}
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="bg-white pb-2 text-center text-[10px] text-ink-400">
            {t.poweredBy}
          </p>
        </div>
      )}
    </>
  );
}

function MessageBubble({
  message,
  dict,
}: {
  message: ChatMessage;
  dict: Dictionary;
}) {
  const t = dict.chat;

  if (message.sender === "SYSTEM") {
    return (
      <p className="text-center text-xs italic text-ink-400">{message.body}</p>
    );
  }

  const isCustomer = message.sender === "CUSTOMER";
  const label =
    message.sender === "CUSTOMER"
      ? t.you
      : message.sender === "AGENT"
        ? message.senderName || t.agent
        : t.bot;

  const Icon = message.sender === "AGENT" ? Headset : message.sender === "BOT" ? Bot : User;

  return (
    <div className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] ${isCustomer ? "items-end" : "items-start"}`}>
        <div className="mb-0.5 flex items-center gap-1 text-[10px] text-ink-400">
          {!isCustomer && <Icon className="h-3 w-3" />}
          {label}
        </div>
        <div
          className={`rounded-2xl px-3 py-2 text-sm ${
            isCustomer
              ? "rounded-br-sm bg-ink-900 text-white"
              : message.sender === "AGENT"
                ? "rounded-bl-sm bg-brand-500 text-ink-900"
                : "rounded-bl-sm border border-ink-100 bg-white text-ink-800"
          }`}
        >
          {message.body}
        </div>
      </div>
    </div>
  );
}
