'use client';

import { useAgentStore } from "@/store/agentStore";
import { ToolCallState } from "@/types/store.types";

interface Props {
  toolCall: ToolCallState;
}


export function ToolCallCard({ toolCall }: Props) {
  const activeEventId = useAgentStore(s => s.activeEventId);
  const setActiveEventId = useAgentStore(s => s.setActiveTime);

  const isHighlighted = activeEventId === toolCall.callId;

  const handleClick = () => {
    setActiveEventId(isHighlighted ? null : toolCall.callId);
  }

  return (
    <div
      onClick={handleClick}
      className={[
        'my-2 rounded-md border text-xs font-mono cursor-pointer transition-all',
        isHighlighted
          ? 'border-accent bg-accent/10'
          : 'border-border bg-raised hover:border-border/80',
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-ev-tool font-medium">⚙ {toolCall.toolName}</span>
          <span className="text-text-muted text-[10px]">{toolCall.callId}</span>
        </div>
        <StatusBadge status={toolCall.status} />
      </div>

      {/* Args */}
      <div className="px-3 py-2">
        <div className="text-text-muted text-[10px] uppercase tracking-wider mb-1">args</div>
        <pre className="text-text-secondary text-[11px] whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
          {JSON.stringify(toolCall.args, null, 2)}
        </pre>
      </div>

      {/* Result */}
      {toolCall.result !== null && (
        <div className="px-3 py-2 border-t border-border">
          <div className="text-text-muted text-[10px] uppercase tracking-wider mb-1">result</div>
          <pre className="text-ev-token text-[11px] whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
            {JSON.stringify(toolCall.result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: ToolCallState['status'] }) {
  if (status === "pending") {
    return (
      <span className="flex items-center gap-1 text-warning text-[10px]">
        <span className="inline-block w-2 h-2 rounded-full bg-warning animate-pulse-slow" />
        waiting
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1 text-success text-[10px]">
      <span>✓</span> resolved
    </span>
  )
}