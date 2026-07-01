
export type ChatMessage =
  | { kind: 'user'; id: string; content: string; timestamp: number }
  | { kind: 'agent'; id: string; streamId: string; timestamp: number }

export type StreamStatus = 'streaming' | 'tool_call_pending' | 'ended'

export interface ToolCallState {
  callId: string;
  toolName: string;
  args: Record<string, unknown>;
  result: Record<string, unknown> | null;
  status: 'pending' | 'resolved';
  seq: number;
  timestamp: number;
}

export interface StreamState {
  streamId: string;
  status: StreamStatus;
  text: string;
  toolCalls: ToolCallState[];
  startedAt: number;
  endedAt: number | null;
}

// FOR TIMELINE IN SIDE BAR

export interface TokenBatchEvent {
  kind: 'TOKEN_BATCH';
  id: string;
  streamId: string;
  count: number; 
  text: string;
  seq: number;
  durationMs: number; 
  timestamp: number;
}

export interface ToolCallEvent {
  kind: 'TOOL_CALL';
  id: string;
  callId: string;
  toolName: string; 
  args: Record<string, unknown>;
  seq: number; 
  timestamp: number;
}

export interface ToolResultEvent {
  kind: 'TOOL_RESULT';
  id: string;
  callId: string;
  result: Record<string, unknown>;
  seq: number; 
  timestamp: number;
}

export interface ContextSnapshotEvent {
  kind: 'CONTEXT_SNAPSHOT';
  id: string;
  contextId: string;
  seq: number; 
  timestamp: number;
}

export interface PingEvent {
  kind: 'PING';
  id: string;
  challenge: string;
  seq: number; 
  timestamp: number;
}

export interface PongEvent {
  kind: 'PONG';
  id: string;
  challenge: string
  timestamp: number;
}

export interface StreamEndEvent {
  kind: 'STREAM_END';
  id: string;
  streamId: string;
  seq: number; 
  timestamp: number;
}

export interface ErrorEvent {
  kind: 'ERROR';
  id: string;
  code: string;
  message: string;
  seq: number; 
  timestamp: number;
}

export interface ConnectionEvent {
  kind: 'CONNECTION';
  id: string;
  event: 'connected' | 'disconnected' | 'reconnecting';
  timestamp: number;
}
export type TimeLineEvent = 
  | TokenBatchEvent | ToolCallEvent | ToolResultEvent
  | ContextSnapshotEvent | PingEvent | PongEvent 
  | StreamEndEvent | ErrorEvent | ConnectionEvent

// for context

export interface ContextSnapshot {
  contextId: string;
  index: number;
  seq: number;
  data: Record<string, unknown>;
  timestamp: number;
}

