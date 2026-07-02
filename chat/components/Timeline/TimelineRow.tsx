"use client";

import { memo } from "react";
import { useAgentStore } from "@/store/agentStore";
import { TimeLineEvent } from "@/types/store.types";

interface Props {
  event: TimeLineEvent;
  style?: React.CSSProperties;
}

const KIND_BADGE: Record<TimeLineEvent["kind"], string> = {
  TOKEN_BATCH: "bg-ev-token/15 text-ev-token",
  TOOL_CALL: "bg-ev-tool/15 text-ev-tool",
  TOOL_RESULT: "bg-ev-tool/15 text-ev-tool",
  CONTEXT_SNAPSHOT: "bg-ev-context/15 text-ev-context",
  PING: "bg-ev-ping/15 text-ev-ping",
  PONG: "bg-ev-ping/15 text-ev-ping",
  STREAM_END: "bg-border/30 text-text-muted",
  ERROR: "bg-ev-error/15 text-ev-error",
  CONNECTION: "bg-border/30 text-text-muted",
};

function formatTime(ts: number): string {
  return new Date(ts).toISOString().slice(11, 23);
}

function buildSummary(event: TimeLineEvent): string {
  switch (event.kind) {
    case "TOKEN_BATCH":
      return `${event.count} tokens · ${event.durationMs}ms · "${event.text.slice(0, 40)}${event.text.length > 40 ? "…" : ""}"`;
    case "TOOL_CALL":
      return `${event.toolName} (${(event.callId || "?").slice(-6)})`;
    case "TOOL_RESULT":
      return `result for ${(event.callId || "?").slice(-6)}`;
    case "CONTEXT_SNAPSHOT":
      return `ctx ${(event.contextId || "?").slice(-8)} · seq ${event.seq}`;
    case "PING":
      return `challenge "${(event.challenge || "" || "?").slice(0, 16)}${(event.challenge || "").length > 16 ? "…" : ""}"`;
    case "PONG":
      return `echo "${(event.challenge || "" || "?").slice(0, 16)}"`;
    case "STREAM_END":
      return `stream ${(event.streamId || "?").slice(-8)}`;
    case "ERROR":
      return `[${event.code || "?"}] ${event.message || "Unknown error"}`;
    case "CONNECTION":
      return event.event || "Connection event";
  }
}

/** The shared key used to cross-link tool calls between timeline + chat */
function highlightKey(event: TimeLineEvent): string | null {
  if (event.kind === "TOOL_CALL" || event.kind === "TOOL_RESULT") {
    return event.callId;
  }
  return event.id;
}

export const TimelineRow = memo(function TimelineRow({ event, style }: Props) {
  const activeEventId = useAgentStore((s) => s.activeEventId);
  const setActiveEventId = useAgentStore((s) => s.setActiveEventId);

  const key = highlightKey(event);
  const isActive = key !== null && activeEventId === key;

  const handleClick = () => {
    setActiveEventId(isActive ? null : key);
  };

  const badge = KIND_BADGE[event.kind];

  return (
    <div
      onClick={handleClick}
      style={style}
      className={[
        "flex items-center gap-2 px-3 border-b border-border/50 cursor-pointer",
        "hover:bg-raised/60 transition-colors text-xs font-mono",
        isActive ? "bg-accent/10 border-l-2 border-l-accent" : "",
      ].join(" ")}
    >
      {/* Time */}
      <span className="text-text-muted text-[10px] w-22 shrink-0">
        {formatTime("timestamp" in event ? event.timestamp : Date.now())}
      </span>

      {/* Kind badge */}
      <span
        className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${badge}`}
      >
        {event.kind.replace("_", " ")}
      </span>

      {/* Summary */}
      <span className="text-text-secondary truncate flex-1">
        {buildSummary(event)}
      </span>

      {/* Seq (where applicable) */}
      {"seq" in event && (
        <span className="text-text-muted text-[10px] shrink-0">
          #{event.seq}
        </span>
      )}
    </div>
  );
});
