import { ChatMessage, ContextSnapshot, StreamState, TimeLineEvent, ToolCallState } from "@/types/store.types";
import { ConnectionStatus } from "@/types/types";
import { create } from "zustand";

const MAX_TIMELINE = 500

let _mid = 0;
function mid(): string { return `m${++_mid}`}

let _ceid = 0;
function ceid(): string { return `ce${++_ceid}`}

interface AgentStore {
  // connection state
  connectionStatus: ConnectionStatus;

  // chat state
  messages: ChatMessage[];
  streams: Record<string, StreamState>;

  timelineEvents: TimeLineEvent[];
  activeEventId: string | null;

  contextSnapshots: Record<string, ContextSnapshot[]>;
  activeContextId: string | null;

  // actions
  setConnectionStatus: (status: ConnectionStatus) => void;
  addUserMessage: (content: string) => void;
  ensureStream: (streamId: string, timestamp: number) => void;
  appendToken: (streamId: string, text: string) => void;
  addToolCall: (streamId: string, toolCall: ToolCallState) => void;
  resolveToolCall: (callId: string, result: Record<string, unknown>) => void;
  endStream: (streamId: string) => void;

  addContextSnapshot: (contextId: string, seq: number, data: Record<string, unknown>) => void;
  addTimelineEvents: (event: TimeLineEvent) => void;
  setActiveTime: (id: string | null) => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({

  connectionStatus: 'disconnected',
  messages: [],
  streams: {},
  timelineEvents: [],
  activeEventId: null,
  contextSnapshots: {},
  activeContextId: null,

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

  addContextSnapshot: (contextId, seq, data) => {
    set((state) => {
      const history = state.contextSnapshots[contextId] ?? [];
      const snapshot: ContextSnapshot = {
        contextId,
        index: history.length,
        seq,
        data,
        timestamp: Date.now(),
      }
      return {
        contextSnapshot: {
          ...state.contextSnapshots,
          [contextId]: [...history, snapshot],
        },
        activeContextId: contextId,
      }
    });

    get().addTimelineEvents({
      kind: 'CONTEXT_SNAPSHOT',
      id: ceid(),
      seq,
      contextId: contextId,
      timestamp: Date.now(),
    })
  },

  addTimelineEvents: (event) => {
    set((state) => {
      const next = [...state.timelineEvents, event];
      return {
        timelineEvents: next.length > MAX_TIMELINE ? next.slice(next.length - MAX_TIMELINE) : next,
      }
    });
  },
  setActiveTime(id) {
    set({ activeEventId: id })
  },
}));
