"use client";

import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { TextField } from "@/components/ui/text-field";
import {
  getApiErrorMessage,
  listThreads,
  readThread,
  sendMessage,
  type ChatMessage,
  type MessageThread,
} from "@/lib/api/visit-client";

export function MessageDesk({
  emptyHint,
  initialUserId,
}: {
  emptyHint: string;
  initialUserId?: number;
}) {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [activeId, setActiveId] = useState<number | null>(initialUserId ?? null);
  const [activeName, setActiveName] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listThreads()
      .then((response) => {
        if (cancelled) return;
        setThreads(response.data);
        setActiveId((current) => current ?? response.data[0]?.user_id ?? null);
      })
      .catch((cause) => {
        if (!cancelled) setError(getApiErrorMessage(cause));
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeId === null) return;
    let cancelled = false;
    readThread(activeId)
      .then((response) => {
        if (cancelled) return;
        setMessages(response.data.messages);
        setActiveName(response.data.user.name);
      })
      .catch((cause) => {
        if (!cancelled) setError(getApiErrorMessage(cause));
      });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  async function submit() {
    if (activeId === null || !draft.trim()) return;
    setPending(true);
    setError(null);
    try {
      const response = await sendMessage(activeId, draft.trim());
      setMessages((current) => [...current, response.data]);
      setDraft("");
      const refreshed = await listThreads();
      setThreads(refreshed.data);
    } catch (cause) {
      setError(getApiErrorMessage(cause));
    } finally {
      setPending(false);
    }
  }

  const active = threads.find((thread) => thread.user_id === activeId);
  const heading = active?.name ?? activeName ?? "Conversation";

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="type-h1 text-foreground">Messages</h1>
        <p className="mt-2 type-body text-muted-foreground">{emptyHint}</p>
      </div>
      {error ? <Callout tone="danger">{error}</Callout> : null}
      {ready && threads.length === 0 && activeId === null ? (
        <p className="rounded-2xl bg-accent px-5 py-10 text-center type-body text-muted-foreground">
          No messages yet. A conversation opens after you share a visit.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <ul className="flex flex-col gap-2">
            {threads.map((thread) => {
              const selected = thread.user_id === activeId;
              return (
                <li key={thread.user_id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    className={`w-full rounded-2xl px-4 py-3 text-left ${selected ? "bg-accent text-primary" : "bg-card shadow-soft"}`}
                    onClick={() => setActiveId(thread.user_id)}
                  >
                    <span className="block type-label text-foreground">{thread.name}</span>
                    <span className="mt-1 block truncate type-helper text-muted-foreground">
                      {thread.preview}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {activeId !== null ? (
            <div className="flex min-h-80 flex-col rounded-2xl bg-card p-4 shadow-soft">
              <h2 className="type-h3 text-foreground">{heading}</h2>
              <ul className="mt-4 flex flex-1 flex-col gap-2">
                {messages.map((message) => (
                  <li
                    key={message.id}
                    className={`max-w-[80%] rounded-2xl px-3 py-2 type-body ${message.mine ? "self-end bg-primary text-primary-foreground" : "self-start bg-accent text-foreground"}`}
                  >
                    {message.body}
                  </li>
                ))}
              </ul>
              <form
                className="mt-4 flex items-end gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submit();
                }}
              >
                <div className="min-w-0 flex-1">
                  <TextField
                    id="message-draft"
                    label="Message"
                    value={draft}
                    onChange={setDraft}
                    maxLength={2000}
                  />
                </div>
                <Button type="submit" disabled={pending || !draft.trim()} aria-label="Send message">
                  <Send aria-hidden="true" />
                  Send
                </Button>
              </form>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
