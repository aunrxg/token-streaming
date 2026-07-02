'use client';

import { DiffEntry, DiffTree } from "@/lib/diffObjs";
import { memo, useState } from "react";

const MAX_PREVIEW = 50;

interface JsonTreeProps {
  data: Record<string, unknown>;
  diff?: DiffTree;
  startCollapsed?: boolean;
}

export function JsonTree({ data, diff, startCollapsed = true }: JsonTreeProps) {
  return (
    <div className="font-mono text-xs py-2">
      <ObjectNode
        value={data}
        diff={diff}
        depth={0}
        startCollapsed={startCollapsed}
      />
    </div>
  )
}

interface NodeProps {
  label?: string;
  value: unknown;
  diff?: DiffEntry | DiffTree;
  depth: number;
  startCollapsed: boolean;
}

const INDENT = 16;

function ObjectNode({ label, value, diff, depth, startCollapsed }: NodeProps) {
  const [open, setOpen] = useState(!startCollapsed || depth === 0);

  const isObj = isPlainObj(value);
  const isArr = Array.isArray(value);

  if (!isObj && !isArr) {
    return <LeafNode label={label} value={value} diff={diff as DiffEntry | undefined} />
  } 

  const entries = Object.entries(value as Record<string, unknown>);
  const preview = isArr ? `[${(value as unknown[]).length}]` : `{${entries.length}`;
  const diffClass = getDiffClass(diff);

  return (
    <div className={diffClass} style={{ paddingLeft: depth > 0 ? INDENT : 0 }}>
      {/* Collapsible header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 hover:text-text-primary text-text-secondary w-full text-left group"
      >
        <span className="text-text-muted w-3 shrink-0">
          {open ? '▾' : '▸'}
        </span>
        {label && (
          <span className="json-key text-text-primary">{label}</span>
        )}
        {label && <span className="text-text-muted">:</span>}
        {!open && (
          <span className="text-text-muted ml-1">{preview}</span>
        )}
      </button>

      {/* Children */}
      {open && (
        <div>
          <ArrayOrObjectChildren
            entries={entries}
            diff={diff}
            depth={depth}
            startCollapsed={startCollapsed}
            isArr={isArr}
          />
        </div>
      )}
    </div>
  ); 
}

interface ChildrenProps {
  entries: [string, unknown][];
  diff?: DiffEntry | DiffTree;
  depth: number;
  startCollapsed: boolean;
  isArr: boolean;
}

function ArrayOrObjectChildren({ entries, diff, depth, startCollapsed, isArr }: ChildrenProps) {
  const [showAll, setShowAll] = useState(false);
  const diffTree = (diff && 'kind' in diff && diff.kind === 'nested') ? diff.children : (diff as DiffTree | undefined);

  const visible = isArr && !showAll ? entries.slice(0, MAX_PREVIEW) : entries;

  return (
    <>
      {visible.map(([k, v]) => {
        const childDiff = diffTree?.[k]
        return (
          <ObjectNode
            key={k}
            label={isArr ? undefined : k}
            value={v}
            diff={childDiff}
            depth={depth + 1}
            startCollapsed={startCollapsed}
          />
        )
      })}
      {isArr && entries.length > MAX_PREVIEW && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-accent text-[10px] ml-4 hover:underline"
          style={{ paddingLeft: (depth + 1) * INDENT }}
        >
          … {entries.length - MAX_PREVIEW} more items
        </button>
      )}
    </>
  );
}

interface LeafProps {
  label?: string;
  value: unknown;
  diff?: DiffEntry;
}

const LeafNode = memo(function LeafNode({ label, value, diff }: LeafProps) {
  const diffClass = getDiffClass(diff);

  return (
    <div className={`flex gap-1 items-baseline ${diffClass}`} style={{ paddingLeft: INDENT }}>
      {label && (
        <>
          <span className="json-key">{label}</span>
          <span className="text-text-muted">:</span>
        </>
      )}
      <ValueDisplay value={value} diff={diff} />
    </div>
  );
});

function ValueDisplay({ value, diff }: { value: unknown, diff?: DiffEntry }) {
  if (diff?.kind === 'changed') {
    return (
      <span>
        <span className="line-through text-ev-error opacity-70">{renderPrimitive(diff.oldValue)}</span>
        <span className="text-text-muted mx-1">→</span>
        <span className="text-success">{renderPrimitive(diff.newValue)}</span>
      </span>
    )
  }
  return <span>{renderPrimitive(value)}</span>;
}

//  helper functions 

function renderPrimitive(v: unknown): React.ReactNode {
  if (v === null)               return <span className="json-null">null</span>;
  if (typeof v === 'string')    return <span className="json-string">&quot;{v}&quot;</span>;
  if (typeof v === 'number')    return <span className="json-number">&quot;{v}&quot;</span>;
  if (typeof v === 'boolean')   return <span className="json-boolean">&quot;{v}&quot;</span>;
  if (Array.isArray(v))         return <span className="text-text-muted">[…]</span>;
  if (isPlainObj(v))            return <span className="text-text-muted">{'{ }'}</span>
  return <span>{String(v)}</span>;
}

function getDiffClass(diff?: DiffEntry | DiffTree): string {
  if (!diff || !('kind' in diff)) return '';
  switch(diff.kind) {
    case 'added': return 'diff-added';
    case 'removed': return 'diff-removed';
    case 'changed': return 'diff-changed';
    default: return '';
  }
}

function isPlainObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && Array.isArray(v);
}