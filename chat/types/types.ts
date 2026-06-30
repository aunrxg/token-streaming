
// server -> client

export interface TokenMessage {
  type: 'TOKEN';
  seq: number;
  streamId: string;
  text: string;
}

export interface ToolCallMessage {
  type: 'TOOL_CALL';
  seq: number;
  streamId: string;
  callId: string;
  toolName: string;
  args: Record<string, unknown>;
}

export interface ToolResultMessage {
  type: 'TOOL_RESULT';
  seq: number;
  streamId: string;
  callId: string;
  result: Record<string, unknown>;
}

export interface ContextSnapshotMessage {
  type: 'CONTEXT_SNAPSHOT';
  seq: number;
  contextId: string;
  data: Record<string, unknown>;
}

export interface PingMessage {
  type: 'PING';
  seq: number;
  challenge: string;
}

export interface StreamEndMessage {
  type: 'STREAM_END';
  seq: number;
  streamId: string;
}

export interface ErrorMessage {
  type: 'ERROR';
  seq: number;
  code: string;
  message: string;
}

export type ServerMessage =
  | TokenMessage
  | ToolCallMessage
  | ToolResultMessage
  | ContextSnapshotMessage
  | PingMessage
  | StreamEndMessage
  | ErrorMessage


// client -> server

export interface UserMessagePayload {
  type: 'USER_MESSAGE';
  content: string;
}

export interface PongMessage {
  type: 'PONG';
  echo: string;
}

export interface ResumeMessage {
  type: 'RESUME';
  lastSeq: number;
}

export interface ToolAckMessage {
  type: 'TOOL_ACK';
  callId: string;
}

export type ClientMessage =
  | UserMessagePayload
  | PongMessage
  | ResumeMessage
  | ToolAckMessage


export type ConnectionStatus = 'disconnected' | 'connected' | 'connecting' | 'reconnecting';

export type ManagerEvent =
  | { type: 'connection_change'; status: ConnectionStatus }
  | {
      type: 'token'
      seq: number
      streamId: string
      text: string
      timestamp: number
    }
  | {
      type: 'tool_call'
      seq: number
      streamId: string
      callId: string
      toolName: string
      args: Record<string, unknown>
      timestamp: number
    }
  | {
      type: 'tool_result'
      seq: number
      streamId: string
      callId: string
      result: Record<string, unknown>
      timestamp: number
    }
  | {
      type: 'context_snapshot'
      seq: number
      contextId: string
      data: Record<string, unknown>
      timestamp: number
    }
  | { type: 'ping_received'; seq: number; challenge: string; timestamp: number }
  | { type: 'pong_sent'; challenge: string; timestamp: number }
  | { type: 'stream_end'; seq: number; streamId: string; timestamp: number }
  | { type: 'error'; seq: number; code: string; message: string; timestamp: number }
