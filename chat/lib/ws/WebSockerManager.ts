import { ClientMessage, ConnectionStatus, ManagerEvent, PingMessage, ServerMessage } from "@/types/types";
import { ReorderBuffer } from "./SeqReorder";

const BACKOFF = [500, 1000, 2000, 4000, 8000, 10000] as const
type ManagerListener = (event: ManagerEvent) => void;

type ServerMessageRecord = ServerMessage & Record<string, unknown>;

function normalizeServerMessage(msg: Record<string, unknown>): ServerMessageRecord {
  const normalized = { ...msg } as Record<string, unknown>;

  if (typeof normalized.streamId === 'undefined' && typeof normalized.stream_id !== 'undefined') {
    normalized.streamId = normalized.stream_id;
  }

  if (typeof normalized.contextId === 'undefined' && typeof normalized.context_id !== 'undefined') {
    normalized.contextId = normalized.context_id;
  }

  if (typeof normalized.callId === 'undefined' && typeof normalized.call_id !== 'undefined') {
    normalized.callId = normalized.call_id;
  }

  if (typeof normalized.toolName === 'undefined' && typeof normalized.tool_name !== 'undefined') {
    normalized.toolName = normalized.tool_name;
  }

  return normalized as ServerMessageRecord;
}

class WebSocketManager {
  private ws: WebSocket | null = null;
  private url = ''
  private status: ConnectionStatus = 'disconnected';

  // token seq
  private lastProcessedSeq = 0;
  private buffer = new ReorderBuffer();

  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private ackedToolCalls = new Set<string>();
  private listeners = new Set<ManagerListener>();


  connect(url: string): void {
    this.url = url;
    this.OpenSocket();
  }

  disconnect() {
    this.clearTimer();
    this.closeSocket();
    this.setStatus('disconnected');
  }

  sendUserMessage(content: string) {
    this.send({ type: 'USER_MESSAGE', content });
  }

  subscribe(listeners: ManagerListener) {
    this.listeners.add(listeners);
    return () => {
      this.listeners.delete(listeners);
    }
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  getLastProcessedSeq(): number {
    return this.lastProcessedSeq;
  }

  // socket stuff
  private OpenSocket(): void {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.close();
      this.ws = null;
    }

    this.buffer.clear();

    this.setStatus('connecting');


    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => { this.onOpen() }
    this.ws.onclose = () => { this.onClose() }
    this.ws.onerror = () => {};
    this.ws.onmessage = (evt: MessageEvent<string>) => { this.onMessage(evt.data) }
  }

  private closeSocket() {
    if (!this.ws) return;
    this.ws.onopen = null;
    this.ws.onclose = null;
    this.ws.onerror = null;
    this.ws.onmessage = null;
    this.ws.close();
    this.ws = null;
  }

  private onOpen(): void {
    this.reconnectAttempts = 0;
    this.setStatus('connected');

    if (this.lastProcessedSeq > 0) {
      this.send({ type: "RESUME", lastSeq: this.lastProcessedSeq });
    }
  }

  private onClose(): void {
    if (this.status === 'disconnected') return;
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    this.setStatus('reconnecting');
    const delay = BACKOFF[Math.min(this.reconnectAttempts, BACKOFF.length - 1)] ?? 10000
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => { this.OpenSocket() }, delay);
  }

  // msg incoming

  private onMessage(raw: string): void {
    let msg: ServerMessageRecord;

    try {
      msg = normalizeServerMessage(JSON.parse(raw) as Record<string, unknown>);
    } catch {
      // wrong json
      return; // silent return
    }

    // PING: close connection after 3 miss PONG response
    if (msg.type === "PING") {
      this.handlePingNow(msg as PingMessage);
    }

    this.processOrBuffer(msg);
  }

  private processOrBuffer(msg: ServerMessage) {
    // ignore already processed
    if (msg.seq <= this.lastProcessedSeq) return;

    // ignore if in buffer
    if (this.buffer.has(msg.seq)) return;

    const nextExpected = this.lastProcessedSeq + 1;
    
    if(msg.seq === nextExpected) {
      this.commit(msg);
      this.drainBuffer();
    } else {
      this.buffer.insert(msg);
    }
  }

  private drainBuffer() {
    let batch: ServerMessage[];

    while((batch = this.buffer.drain(this.lastProcessedSeq + 1)).length > 0) {
      for(const m of batch) {
        this.commit(m);
      }
    }
  }

  private commit(msg: ServerMessage) {
    const timestamp = Date.now();

    this.lastProcessedSeq = msg.seq;

    switch(msg.type) {
      case 'TOKEN':
        this.emit({
          type: 'token',
          seq: msg.seq,
          streamId: msg.streamId,
          text: msg.text,
          timestamp,
        });
        break;

      case 'TOOL_CALL':
        const tc = msg;
        if (!this.ackedToolCalls.has(tc.callId)) {
          this.send({ type: 'TOOL_ACK', callId: tc.callId });
          this.ackedToolCalls.add(tc.callId);
        }

        this.emit({
          type: 'tool_call',
          seq: msg.seq,
          streamId: msg.streamId,
          callId: msg.callId,
          toolName: tc.toolName,
          args: tc.args,
          timestamp,
        });
        break;

      case 'TOOL_RESULT':
        this.emit({
          type: 'tool_result',
          seq: msg.seq,
          streamId: msg.streamId,
          callId: msg.callId,
          result: msg.result,
          timestamp,
        });
        break;

      case 'CONTEXT_SNAPSHOT':
        this.emit({
          type: 'context_snapshot',
          seq: msg.seq,
          contextId: msg.contextId,
          data: msg.data,
          timestamp,
        });
        break;

      case 'PING':
        // already handled in onMessage also here for timeline tracking in seq order
        this.emit({
          type: 'ping_received',
          seq: msg.seq,
          challenge: msg.challenge ?? '',
          timestamp,
        });
        break;

      case 'STREAM_END':
        this.emit({
          type: 'stream_end',
          seq: msg.seq,
          streamId: msg.streamId,
          timestamp,
        });
        break;

      case 'ERROR':
        this.emit({
          type: 'error',
          seq: msg.seq,
          code: msg.code,
          message: msg.message,
          timestamp,
        });
        break;
    }
  }


  // handle ping
  private handlePingNow(msg: PingMessage) {
    const echo = typeof msg.challenge === 'string' ? msg.challenge : ''; //TODO:
    this.send({ type: "PONG", echo });
    this.emit({ type: "pong_sent", challenge: echo, timestamp: Date.now() });
  }

  // functions
  private send(msg: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private emit(event: ManagerEvent): void {
    this.listeners.forEach(l => l(event));
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.emit({ type: 'connection_change', status });
  }

  private clearTimer() {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}


// singleton ws instance
let instance: WebSocketManager | null = null

export function getWebSocketManager(): WebSocketManager {
  if (!instance) {
    instance = new WebSocketManager();
  }

  return instance;
}
