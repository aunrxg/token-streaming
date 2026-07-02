# DECISIONS.md

## 1. How to track seq ordering without blocking the UI?

**Data structure: min-heap (`SeqReorder`)**

A min-heap gives O(log n) insert and O(log n) extract-min. When a message arrives:

1. If `msg.seq <= lastProcessedSeq` → it's a replay duplicate, ignore it.
2. If `msg.seq === lastProcessedSeq + 1` → process it immediately, then call `drain()` to pop any consecutive buffered messages.
3. Otherwise → insert into the heap and wait.

`drain()` pops a contiguous run (1, 2, 3…) in a single tight loop with no async hops. Because all messages share a single numerical key, the heap never needs a comparator function — just integer comparison. At 30 events/sec with gaps in chaos mode, the buffer rarely exceeds ~50 entries; the heap stays small.

**Why not a sorted array or Map?**  
A sorted array has O(n) insertion in the worst case. A Map keyed by seq gives O(1) lookup but requires scanning for the minimum. The heap gives the best insert + min-extract tradeoff for this access pattern.

---

## 2. How to prevent layout shift when a TOOL_CALL arrives mid-stream?

The stream's accumulated text lives in `streams[streamId].text` in Zustand.  
The `StreamMessage` component renders:

```tsx
<p>{stream.text}</p>          {/* never unmounted */}
{stream.toolCalls.map(tc =>   {/* cards append below */}
  <ToolCallCard key={tc.callId} toolCall={tc} />
)}
```

When `TOOL_CALL` arrives:
- `stream.status` → `'tool_call_pending'`
- `stream.text` is **not touched** — the `<p>` node keeps exactly the same DOM content and dimensions.
- A new `ToolCallCard` is appended via React's reconciler as a sibling, never inserted into the text node.

Because the text node is stable, the browser never re-calculates its layout. The card slides in below without pushing text upward. Token appending resumes into the same `<p>` once `TOOL_RESULT` arrives.

---

## 3. How to distinguish "DOM-rendered" from "socket-received" seq?

**`lastProcessedSeq`** (in `WebSocketManager`) is incremented only inside `commit()`, which is called immediately before the corresponding `ManagerEvent` is emitted.  
**The store** updates synchronously inside the Zustand `set()` call, which React will flush in the next microtask.

The gap is negligible (< 1 ms) and is acceptable for RESUME purposes. If sub-millisecond precision were required (e.g., the server differentiates between "received" and "rendered" ACKs), we would track a second counter — `lastRenderedSeq` — incremented inside a React `useEffect` after the component confirmed rendering via an intersection observer or a commit effect. For this assignment, `lastProcessedSeq` = "committed to application state" which is the intent.

**TOOL_ACK race condition:** TOOL_ACK is tracked by `call_id` (not `seq`) in `WebSocketManager.ackedToolCalls`. This survives reconnects: if a TOOL_CALL is replayed after a drop, the manager re-sends TOOL_ACK if and only if `call_id` is not already in the set.

---

## 4. What breaks at 50 concurrent streams / 100× longer responses?

### 50 concurrent streams

**Token batching:** Each stream has its own debounce timer (`MsgRouter.ts`, `batchTimers` Map). 50 simultaneous 200 ms timers is negligible.

**React re-renders:** Each token appends to `streams[streamId].text`. The Zustand `set()` triggers only components subscribed to that stream. With `subscribeWithSelector`, 50 `StreamMessage` components each subscribe to their own `streams[streamId]` slice — an unrelated stream's token does not re-render the others.

**Bottleneck:** The `ChatPanel` subscribes to `messages.length` to drive auto-scroll. This is O(messages), but only triggers on new stream creation, not on every token. Safe.

### 100× longer responses (e.g., 500 KB streamed token text)

**Memory:** One stream with 500 KB of text is fine. 50 streams × 500 KB = 25 MB in Zustand state. Acceptable.

**Token text rendering:** The `<p>` node receives progressively longer `children`. React's reconciler replaces a single text node; the browser does not re-layout the whole page. This scales linearly with character count but is bounded by the viewport — lines outside the scroll viewport are not painted.

**Context snapshots (500 KB JSON):** `JSON.parse` of 500 KB takes ~50 ms and blocks the main thread. The diff algorithm has the same issue. Production fix: move both into a **Web Worker** and post the parsed result back. The `ContextInspector` would show a `pending` state while the worker runs. 

**Timeline:** Capped at 500 events (configurable constant `MAX_TIMELINE`). Virtual scroll renders only ~15 rows at a time regardless of total event count.
