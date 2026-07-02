'use client';

import { useAgentStore } from "@/store/agentStore";


export function SeqCounter() {
  const seq = useAgentStore(s => s.lastProcessedSeq);
  const status = useAgentStore(s => s.connectionStatus);

  // const isStalled = status === "connected" && seq === 0;

  return (
    <div className="flex items-center gap-1.5 font-mono text-[11px] text-text-muted">
      <span className="text-text-muted">seq</span>
      <span
        className={[
          'tabular-nums transition-colors',
          seq === 0     ? 'text-text-muted'
          : status === 'reconnecting' ? 'text-warning'
          : 'text-ev-token',
        ].join(' ')}
      >
        {seq === 0 ? '—' : seq}
      </span>
    </div>
  );
}