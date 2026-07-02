import { useAgentStore } from "@/store/agentStore";
import { TimeLineEvent, TimelineEventKind } from "@/types/store.types";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { TimelineRow } from "./TimelineRow";
import { FilterBar } from "./filterBar";


const ROW_HEIGHT = 40;
const OVERSCAN = 8;

const ALL_KIND = new Set<TimelineEventKind>([
  'TOKEN_BATCH', 'TOOL_CALL', 'TOOL_RESULT',
  'CONTEXT_SNAPSHOT', 'PING', 'PONG',
  'STREAM_END', 'ERROR', 'CONNECTION',
]);

function matchSearch(event: TimeLineEvent, q: string): boolean {
  if (!q) return true;
  const lower = q.toLowerCase();
  const str = JSON.stringify(event).toLowerCase();
  return str.includes(lower);
}

export function TraceTimeline() {
  const allEvents = useAgentStore(s => s.timelineEvents);

  const [activeKinds, setActiveKinds] = useState<Set<TimelineEventKind>>(new Set(ALL_KIND));
  const [search, setSearch] = useState('');
  const [scrollTop, setScrollTop] = useState(0);
  const [containerH, setContainerH] = useState(400);

  const containerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const filtered = useMemo(
    () => allEvents.filter(
      e => activeKinds.has(e.kind) && matchSearch(e, search)
    ),
    [allEvents, activeKinds, search]
  );

  const totalHeight = filtered.length * ROW_HEIGHT;

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const obs = new ResizeObserver(([entry]) => {
      if (entry) setContainerH(entry.contentRect.height);
    });
    obs.observe(el);

    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isAtBottomRef.current) return ;
    el.scrollTop = el.scrollHeight;
  }, [filtered.length]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollTop: st, scrollHeight, clientHeight } = el;
    isAtBottomRef.current = st + clientHeight >= scrollHeight - ROW_HEIGHT;
    setScrollTop(st);
  }, []);

  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIdx = Math.min(
    filtered.length - 1,
    Math.ceil((scrollTop + containerH) / ROW_HEIGHT) + OVERSCAN
  );
  const visibleSlice = filtered.slice(startIdx, endIdx + 1);

  const toggleKind = useCallback((kind: TimelineEventKind) => {
    setActiveKinds(prev => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    })
  }, []);

  const isEmpty = filtered.length === 0;

  return (
    <div className="flex flex-col h-full">
      <FilterBar
        activeKinds={activeKinds}
        search={search}
        onToggleKind={toggleKind}
        onSearchChange={setSearch}
      />

      {/* Virtual scroll container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto relative"
      >
        {isEmpty ? (
          <div className="flex items-center justify-center h-full text-text-muted text-xs">
            {allEvents.length === 0
              ? 'No events yet — connect and send a message.'
              : 'No events match the current filter.'}
          </div>
        ) : (
          /* Inner spacer — the full virtual height */
          <div style={{ height: totalHeight, position: 'relative' }}>
            {visibleSlice.map((event, i) => (
              <TimelineRow
                key={event.id}
                event={event}
                style={{
                  position: 'absolute',
                  top:      (startIdx + i) * ROW_HEIGHT,
                  height:   ROW_HEIGHT,
                  width:    '100%',
                  display:  'flex',
                  alignItems: 'center',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer — event count */}
      <div className="shrink-0 border-t border-border px-3 py-1 text-[10px] text-text-muted font-mono">
        {filtered.length} / {allEvents.length} events
      </div>
    </div>
  );
}