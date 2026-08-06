"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries";

export default function ContactForm({ dict }: { dict: Dictionary }) {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
        <p className="font-semibold text-ink-900">{dict.contact.formSuccess}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-ink-700">
          {dict.contact.formName}
        </span>
        <input
          required
          className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-500"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-ink-700">
          {dict.contact.formEmail}
        </span>
        <input
          type="email"
          required
          className="w-full rounded-xl border border-ink-200 px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-500"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-ink-700">
          {dict.contact.formMessage}
        </span>
        <textarea
          required
          rows={5}
          className="w-full resize-none rounded-xl border border-ink-200 px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-500"
        />
      </label>
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-full bg-ink-900 py-3 text-sm font-bold text-white transition hover:bg-ink-800"
      >
        <Send className="h-4 w-4" />
        {dict.contact.formSubmit}
      </button>
    </form>
  );
}
