import { ChatMessage, StreamState, ToolCallState } from "@/types/store.types";
import { ConnectionStatus } from "@/types/types";
import { create } from "zustand";

interface AgentStore {
  // connection state
  connectionStatus: ConnectionStatus;

  // chat state
  messages: ChatMessage[];
  streams: Record<string, StreamState>;

  // actions
  setConnectionStatus: (status: ConnectionStatus) => void;
  addUserMessage: (content: string) => void;
  ensureStream: (streamId: string, timestamp: number) => void;
  appendToken: (streamId: string, text: string) => void;
  addToolCall: (streamId: string, toolCall: ToolCallState) => void;
  resolveToolCall: (callId: string, result: Record<string, unknown>) => void;
  endStream: (streamId: string) => void;
}



let _mid = 0;
function mid(): string { return `m${++_mid}`}



export const useAgentStore = create<AgentStore>((set) => ({

  connectionStatus: 'disconnected',
  messages: [],
  streams: {},


  setConnectionStatus: (status) => {
    set(() => ({ connectionStatus: status }));
  },

  addUserMessage: (content) => {
    set((state) => ({
      messages: [...state.messages, { kind: 'user', id: mid(), content: content, timestamp: Date.now() }],
    }));
  },

  ensureStream: (streamId, timestamp) => {
    set((state) => {
      if(state.streams[streamId]) return {};

      const stream: StreamState = {
        streamId,
        status: 'streaming',
        text: '',
        toolCalls: [],
        startedAt: timestamp,
        endedAt: null
      }

      return {
        messages: [...state.messages, { kind: 'agent', id: mid(), streamId, timestamp }],
        streams: {...state.streams, [streamId]: stream },
      }
    });
  },

  appendToken: (streamId, text) => {
    set((state) => {
      const stream = state.streams[streamId];

      if (!stream) return {}

      return {
        streams: { ...state.streams, [streamId]: { ...stream, text: stream.text + text } },
      }
    });
  },

  addToolCall: (streamId, toolCall) => {
    set((state) => {
      const stream = state.streams[streamId];
      if (!stream) {};

      return {
        streams: {
          ...state.streams,
          [streamId]: {
            ...stream,
            status: 'tool_call_pending',
            toolCalls: [...stream.toolCalls, toolCall],
          },
        },
      };
    });
  },

  resolveToolCall: (callId, result) => {
    set((state) => {
      const updatedStreams = { ...state.streams };
      for(const sid of Object.keys(updatedStreams)) {
        const stream = updatedStreams[sid];
        const idx = stream.toolCalls.findIndex(tc => tc.callId === callId)
        if (idx === -1) continue;

        const updatedCalls = [...stream.toolCalls];
        updatedCalls[idx] = {...updatedCalls[idx], result, status: 'resolved' };

        updatedStreams[sid] = { ...stream, status: 'streaming', toolCalls: updatedCalls };
        break;
      }

      return { streams: updatedStreams };
    })
  },
  endStream: (streamId) => {
    set((state) => {
      const stream = state.streams;
      if (!stream) return {};

      return {
        ...state.streams,
        [streamId]: { ...stream, status: 'ended', endedAt: Date.now() },
      }
    });
  },
}));
