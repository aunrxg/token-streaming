'use client';

import { diffObjs } from "@/lib/diffObjs";
import { useAgentStore } from "@/store/agentStore";
import { useMemo, useState, useTransition } from "react";
import { JsonTree } from "./JsonTree";

export function Context() {
  const contextSnapshots = useAgentStore(s => s.contextSnapshots);
  const activeContextId = useAgentStore(s => s.activeContextId);

  const contextIds = Object.keys(contextSnapshots);

  const [selectedCntxId, setSelectCntxId] = useState<string | null>(null);
  const ctxId = selectedCntxId ?? activeContextId;

  const snapshots = ctxId ? (contextSnapshots[ctxId] ?? []) : [];

  const [snapshotIdx, setSnapshotIdx] = useState<number | null>(null);

  const latestIdx = snapshots.length > 0 ? snapshots.length - 1 : null;
  const activeIdx = snapshotIdx ?? latestIdx;

  const snapshot = activeIdx !== null ? snapshots[activeIdx] : null;
  const prevSnapshot = activeIdx !== null && activeIdx > 0 ? snapshots[activeIdx - 1] : null;

  const [, startTransition] = useTransition();
  const [showDiff, setShowDiff] = useState(false);

  const diff = useMemo(() => {
    if (!showDiff || !snapshot || !prevSnapshot) return undefined;

    return diffObjs(prevSnapshot.data, snapshot.data);
  }, [showDiff, snapshot, prevSnapshot]);

  if (contextIds.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-xs">
        No context snapshots received yet.
      </div>
    );
  }


  return (
    <div className="flex flex-col h-full">

      {/* Toolbar */}
      <div className="shrink-0 border-b border-border bg-surface px-3 py-2 space-y-2">

        {/* Context selector (when multiple contexts exist) */}
        {contextIds.length > 1 && (
          <select
            value={ctxId ?? ''}
            onChange={e => {
              setSelectCntxId(e.target.value)
              setSnapshotIdx(null)
            }}
            className="w-full bg-raised border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-accent/60"
          >
            {contextIds.map(id => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        )}

        {/* History scrubber */}
        {snapshots.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              disabled={activeIdx === 0}
              onClick={() => setSnapshotIdx(i => Math.max(0, (i ?? latestIdx ?? 0) - 1))}
              className="px-2 py-0.5 rounded border border-border text-[10px] text-text-secondary hover:border-accent/50 disabled:opacity-30"
            >
              ← prev
            </button>

            <span className="flex-1 text-center text-[10px] text-text-muted font-mono">
              snapshot {(activeIdx ?? 0) + 1} / {snapshots.length}
              {snapshot && ` · seq ${snapshot.seq}`}
            </span>

            <button
              disabled={activeIdx === snapshots.length - 1}
              onClick={() => setSnapshotIdx(i => Math.min(snapshots.length - 1, (i ?? 0) + 1))}
              className="px-2 py-0.5 rounded border border-border text-[10px] text-text-secondary hover:border-accent/50 disabled:opacity-30"
            >
              next →
            </button>
          </div>
        )}

        {/* Diff toggle */}
        {prevSnapshot && (
          <label className="flex items-center gap-2 text-[10px] text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={showDiff}
              onChange={e => startTransition(() => setShowDiff(e.target.checked))}
              className="accent-accent"
            />
            Show diff vs previous snapshot
          </label>
        )}
      </div>

      {/* Tree */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
        {snapshot ? (
          <JsonTree
            data={snapshot.data}
            diff={diff}
            startCollapsed={true}
          />
        ) : (
          <div className="text-text-muted text-xs">No snapshot selected.</div>
        )}
      </div>
    </div>
  );
}