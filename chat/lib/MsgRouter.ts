import { useAgentStore } from "@/store/agentStore";
import { ToolCallState } from "@/types/store.types";
import { ManagerEvent } from "@/types/types";
import { getWebSocketManager } from "./ws/WebSockerManager";


interface BatchData {
  count: number;
  text: string;
  startTime: number;
  lastSeq: number;
}

const batches = new Map<string, BatchData>();
const batchTimer = new Map<string, ReturnType<typeof setTimeout>>();

let _eid = 0;
function eid(): string { return `e${++_eid}`};

function flushBatch(streamId: string) {
  const batch = batches.get(streamId);
  if (!batch) return;
  batches.delete(streamId);
  batchTimer.delete(streamId);

  // TODO:
}

function flushBatchSync(streamId: string) {
  const timer = batchTimer.get(streamId);
  if (timer !== undefined) {
    clearTimeout(timer);
    batchTimer.delete(streamId);
  }

  flushBatch(streamId);
}

function scheduleBatchFlush(streamId: string) {
  const existing = batchTimer.get(streamId);
  if (existing !== undefined) clearTimeout(existing);

  batchTimer.set(
    streamId,
    setTimeout(() => { flushBatch(streamId) }, 200)
  );
}

function handleEvent(event: ManagerEvent) {
  const store = useAgentStore.getState();

  switch(event.type) {
    
    case 'connection_change': 
      store.setConnectionStatus(event.status);
      break;

    case 'token':
      store.ensureStream(event.streamId, event.timestamp);
      store.appendToken(event.streamId, event.text);

      const prev = batches.get(event.streamId);
      batches.set(event.streamId, {
        count: (prev?.count ?? 0) + 1,
        text: (prev?.text ?? '') + event.text,
        startTime: prev?.startTime ?? event.timestamp,
        lastSeq: event.seq,
      });
      scheduleBatchFlush(event.streamId);
      break;

    case 'tool_call':
      flushBatchSync(event.streamId);

      const toolCall: ToolCallState = {
        callId: event.callId,
        args: event.args,
        toolName: event.toolName,
        result: null,
        status: 'pending',
        seq: event.seq,
        timestamp: event.timestamp,
      }
      store.addToolCall(event.streamId, toolCall);

      //TODO:
      break;

    case 'tool_result':
      store.resolveToolCall(event.callId, event.result);
      //TODO:
      break;

    case 'context_snapshot':
      break; //TODO:

    case 'ping_received':
      break;

    case 'pong_sent':
      break;

    case 'stream_end':
      flushBatchSync(event.streamId);
      store.endStream(event.streamId);
      //TODO:

      break;

    case 'error':
      break;
  }
}

let connect: (() => void) | null = null

export function initRouter(wsUrl: string) {
  const manager = getWebSocketManager();
  connect = manager.subscribe(handleEvent);
  manager.connect(wsUrl);
}

export function cleanRouter() {
  connect?.();
  connect = null
  getWebSocketManager().disconnect();
}

export function sendUserMessage(content: string) {
  useAgentStore.getState().addUserMessage(content);
  getWebSocketManager().sendUserMessage(content);
}
