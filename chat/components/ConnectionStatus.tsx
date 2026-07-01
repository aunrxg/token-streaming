'use client';

import { useAgentStore } from "@/store/agentStore";
import type { ConnectionStatus } from "@/types/types";

const CONFIG: Record<ConnectionStatus, { dot: string, label: string }> = {
  connected: { dot: 'bg-success', label: 'Connected' },
  connecting: { dot: 'bg-warning animation-pulse', label: 'Connecting...'},
  reconnecting: { dot: 'bg-warning animation-pulse', label: 'Reconnecting...'},
  disconnected: { dot: 'bg-danger', label: 'Disconnected'},
}

export function ConnectionStatus() {
  const status = useAgentStore(s => s.connectionStatus);
  const { dot, label } = CONFIG[status];

  return (
    <div className="flex items-center gap-2 text-xs text-text-secondary">
      <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
      <span>{label}</span>
    </div>
  )
}
