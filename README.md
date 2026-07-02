# Agent Console

Real-time AI agent trace console — Next.js 14, TypeScript strict, Zustand.

## Please Check-out Approach.md file to check my way of approaching this. What I did and why? 

## Quick start

```bash
# 1. Boot the agent server (provided separately)
cd agent-server &&

# 2. Install deps
cd chat/ && npm install

# 3. Run dev
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws npm run dev
```

## Architecture

**Its a 3 tier designed system**

```
WebSocketManager (singleton)
  │  connect / disconnect / reconnect (exponential backoff)
  │  seq-ordered processing via SeqReorder (min-heap)
  │  PING → PONG immediately (before seq ordering)
  │  TOOL_ACK per call_id
  │  RESUME as first message on reconnect
  ▼
MsgRouter (module-level)
  │  subscribes to ManagerEvents
  │  token batching (debounced 200 ms per stream)
  │  dispatches Zustand store actions
  ▼
Zustand store (agentStore)
  │  connectionStatus, messages[], streams{}, timelineEvents[], contextSnapshots{}
  ▼
React components
  ├── ChatPanel          streaming text + ToolCallCards (bidirectional highlight)
  ├── TraceTimeline      virtualized fixed-height list, filter bar, auto-scroll
  └── ContextInspector   JSON tree (lazy expand), snapshot scrubber, diff view
```

## Seq processing pipeline

**See Decision Md file**
