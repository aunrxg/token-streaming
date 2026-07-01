'use client';

import { sendUserMessage } from "@/lib/MsgRouter";
import { useAgentStore } from "@/store/agentStore";
import { KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { StreamMessage } from "./StreamMessage";

export function ChatPanel() {
  const messages = useAgentStore(s => s.messages);
  const connectionStatus = useAgentStore(s => s.connectionStatus);

  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const isAtButtomRef = useRef(true);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    if (isAtButtomRef.current) scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const streamCount = useAgentStore(s => Object.keys(s.streams).length);
  useEffect(() => {
    if (isAtButtomRef.current) scrollToBottom();
  }, [streamCount, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    isAtButtomRef.current = scrollTop + clientHeight >= scrollHeight - 32;
  }, []);

  const canSend = draft.trim().length > 0 && connectionStatus === 'connected';

  const submit = useCallback(() => {
    const content = draft.trim();
    if (!content || connectionStatus !== 'connected') return
    sendUserMessage(content);
    setDraft('');
  }, [draft, connectionStatus]);


  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }, [submit]);

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div
        ref={listRef}
        onScroll={handleScroll} 
        className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4"
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-text-muted text-sm">
            Send a message to start a session.
          </div>
        )}

        {messages.map(msg => {
          if (msg.kind === 'user') {
            return (
              <div key={msg.id} className="flex gap-3 justify-end">
                <div className="max-w-[70%] bg-accent/15 border border-accent/20 rounded-xl rounded-tr-sm px-3 py-2 text-sm text-text-primary whitespace-pre-wrap">
                  {msg.content}
                </div>
              </div>
            )
          }
          return (
            <div key={msg.id}>
              <StreamMessage streamId={msg.streamId} />
            </div>
          )
        })}
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-border p-3">
        <div className="flex gap-2 items-end">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              connectionStatus === 'connected'
                ? 'Message agent… (Enter to send, Shift+Enter for newline)'
                : 'Waiting for connection…'
            }
            disabled={connectionStatus !== 'connected'}
            rows={1}
            className={[
              'flex-1 resize-none bg-raised border border-border rounded-lg px-3 py-2',
              'text-sm text-text-primary placeholder:text-text-muted',
              'focus:outline-none focus:border-accent/60',
              'transition-colors disabled:opacity-40',
              'max-h-40 overflow-y-auto',
            ].join(' ')}
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />
          <button
            onClick={submit}
            disabled={!canSend}
            className={[
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors shrink-0',
              canSend
                ? 'bg-accent text-canvas hover:bg-accent/90'
                : 'bg-raised text-text-muted cursor-not-allowed',
            ].join(' ')}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )

}