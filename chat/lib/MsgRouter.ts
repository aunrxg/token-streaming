import { useAgentStore } from "@/store/agentStore";
import { TimeLineEvent, ToolCallState } from "@/types/store.types";
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

  const event: TimeLineEvent = {
    kind: 'TOKEN_BATCH',
    id: eid(),
    count: batch.count,
    text: batch.text,
    durationMs: Date.now() - batch.startTime,
    streamId,
    timestamp: batch.startTime,
    seq: batch.lastSeq,
  }
  useAgentStore.getState().addTimelineEvents(event);
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

  if ('seq' in event) {
    const current = store.lastProcessedSeq;
    if (event.seq > current) {
      store.setLastProcessedSeq(event.seq);
    }
  }

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

      store.addTimelineEvents({
        kind: 'TOOL_CALL',
        args: event.args,
        callId: event.callId,
        toolName: event.toolName,
        seq: event.seq,
        timestamp: event.timestamp,
        id: eid(),
      });
      break;

    case 'tool_result':
      store.resolveToolCall(event.callId, event.result);
      store.addTimelineEvents({
        kind: 'TOOL_RESULT',
        callId: event.callId,
        result: event.result,
        seq: event.seq,
        timestamp: event.timestamp,
        id: eid(),
      });
      break;

    case 'context_snapshot':
      store.addContextSnapshot(event.contextId, event.seq, event.data);
      break;

    case 'ping_received':
      store.addTimelineEvents({
        kind: 'PING',
        id: eid(),
        challenge: event.challenge,
        seq: event.seq,
        timestamp: event.timestamp,
      });
      break;

    case 'pong_sent':
      store.addTimelineEvents({
        kind: 'PONG',
        challenge: event.challenge,
        id: eid(),
        timestamp: event.timestamp,
      });
      break;

    case 'stream_end':
      flushBatchSync(event.streamId);
      store.endStream(event.streamId);
      store.addTimelineEvents({
        kind: 'STREAM_END',
        id: eid(),
        seq: event.seq,
        streamId: event.streamId,
        timestamp: event.timestamp,
      });
      break;

    case 'error':
      store.addTimelineEvents({
        kind: 'ERROR',
        id: eid(),
        code: event.code,
        message: event.message,
        seq: event.seq,
        timestamp: event.timestamp,
      });
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
