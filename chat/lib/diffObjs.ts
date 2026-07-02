export type DiffKind = "unchanged" | "added" | "removed" | "changed" | "nested";

export interface DiffLeaf {
  kind: Exclude<DiffKind, "nested">;
  value?: unknown;
  oldValue?: unknown;
  newValue?: unknown;
}

export interface DiffNode {
  kind: "nested";
  children: DiffTree;
}

export type DiffEntry = DiffLeaf | DiffNode;
export type DiffTree = Record<string, DiffEntry>;

export function diffObjs(
  prev: Record<string, unknown>,
  next: Record<string, unknown>,
): DiffTree {
  const result: DiffTree = {};
  const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);

  for (const key of allKeys) {
    const inPrev = Object.prototype.hasOwnProperty.call(prev, key);
    const inNext = Object.prototype.hasOwnProperty.call(next, key);

    if (!inPrev) {
      result[key] = { kind: "added", value: next[key] };
      continue;
    }

    if (!inNext) {
      result[key] = { kind: "removed", value: prev[key] };
      continue;
    }

    const pv = prev[key];
    const nv = next[key];

    if (isPlainObject(pv) && isPlainObject(nv)) {
      result[key] = {
        kind: "nested",
        children: diffObjs(pv, nv),
      };
      continue;
    }

    if (deepEqual(pv, nv)) {
      result[key] = { kind: "unchanged", value: pv };
    } else {
      result[key] = { kind: "changed", oldValue: pv, newValue: nv };
    }
  }
  return result;
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

function deepEqual(a: unknown, b: unknown) {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}
