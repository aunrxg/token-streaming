'use client';

import { TimelineEventKind } from "@/types/store.types";
import { memo } from "react";

const ALL_KINDS: TimelineEventKind[] = [
  'TOKEN_BATCH', 'TOOL_CALL', 'TOOL_RESULT',
  'CONTEXT_SNAPSHOT', 'CONNECTION', 'ERROR',
  'PING', 'PONG', 'STREAM_END'
];

const KIND_LABELS: Record<TimelineEventKind, string> = {
  TOKEN_BATCH:      'Token',
  TOOL_CALL:        'Call',
  TOOL_RESULT:      'Result',
  CONTEXT_SNAPSHOT: 'Context',
  PING:             'Ping',
  PONG:             'Pong',
  STREAM_END:       'End',
  ERROR:            'Error',
  CONNECTION:       'Conn',
};

const KIND_COLOURS: Record<TimelineEventKind, string> = {
  TOKEN_BATCH:      'text-ev-token border-ev-token',
  TOOL_CALL:        'text-ev-tool border-ev-tool',
  TOOL_RESULT:      'text-ev-tool border-ev-tool',
  CONTEXT_SNAPSHOT: 'text-ev-context border-ev-context',
  PING:             'text-ev-ping border-ev-ping',
  PONG:             'text-ev-ping border-ev-ping',
  STREAM_END:       'text-text-muted border-border',
  ERROR:            'text-ev-error border-ev-error',
  CONNECTION:       'text-ev-conn border-ev-conn',
}

interface Props {
  activeKinds: Set<TimelineEventKind>;
  search: string;
  onToggleKind: (kind: TimelineEventKind) => void;
  onSearchChange: (q: string) => void;
}

export const FilterBar = memo(function filterBar({
  activeKinds,onSearchChange, onToggleKind, search
}: Props) {
  return (
    <div className="shrink-0 border-b border-border bg-surface px-2 py-2 space-y-2">
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        placeholder="Search events…"
        className="w-full bg-raised border border-border rounded px-2 py-1 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60"
      />

      {/* Kind toggles */}
      <div className="flex flex-wrap gap-1">
        {ALL_KINDS.map(kind => {
          const active = activeKinds.has(kind)
          const colours = KIND_COLOURS[kind]
          return (
            <button
              key={kind}
              onClick={() => onToggleKind(kind)}
              className={[
                'px-1.5 py-0.5 rounded border text-[10px] font-mono transition-colors',
                active
                  ? `${colours} bg-current/10`
                  : 'text-text-muted border-border/50 opacity-40 hover:opacity-70',
              ].join(' ')}
            >
              {KIND_LABELS[kind]}
            </button>
          )
        })}
      </div>
    </div>
  )
});