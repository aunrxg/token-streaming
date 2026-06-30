import { ServerMessage } from "@/types/types";

// this will help to track and reorder the seq when in chaos mode.
export class ReorderBuffer {
  // smallest seq always at 0th position in the array log(n) insertion and deletion
  private heap: ServerMessage[] = [];
  // track the seq currently in buffer to avoid duplicates O(1) lookup
  private seqSet = new Set<number> ();

  // size of heap
  get size(): number {
    return this.heap.length;
  }
  // buffer seq lookup in the set (checking duplicates)
  has(seq: number): boolean {
    return this.seqSet.has(seq);
  }

  insert(msg: ServerMessage): void {
    if (this.has(msg.seq)) return; // found duplicate do nothing
    this.seqSet.add(msg.seq);
    this.heap.push(msg);
    this.shiftUp(this.size - 1);
  }

  peek(): ServerMessage | null {
    return this.heap[0] ?? null;
  }

  pop(): ServerMessage | null {
    if (this.size === 0) return null;
    const top = this.heap[0];
    this.seqSet.delete(top.seq);
    
    const last = this.heap.pop();
    if (last !== undefined && this.size > 0) {
      this.heap[0] = last;
      this.shiftDown(0);
    } 

    return top;
  }

  drain(nextExpected: number): ServerMessage[] {
    const result: ServerMessage[] = [];
    while(this.heap.length > 0 && this.heap[0].seq === nextExpected) {
      result.push(this.pop()!);
      nextExpected++;
    } 
    return result;
  }

  clear(): void {
    this.heap = [];
    this.seqSet.clear();
  }


  // heap logic

  private shiftUp(i: number): void {
    while(i > 0) {
      const parent = (i-1) >> 1; // Math.floor((i-1) / 2)
      if (this.heap[parent].seq <= this.heap[i].seq) break;
      this.swap(parent, i);
      i = parent;
    }
  }

  private shiftDown(i: number): void {
    const n = this.size;
    while(true) {
      let smallest = i;
      const l = (i << 1) + 1;
      const r = (i << 1) + 2;
      if (l < n && this.heap[l].seq < this.heap[smallest].seq) smallest = l;
      if (r < n && this.heap[r].seq < this.heap[smallest].seq) smallest = r;
      if (smallest === i) break;
      this.swap(i, smallest);
      i = smallest;
    }
  }

  private swap(a: number, b: number) {
    const temp = this.heap[a];
    this.heap[a] = this.heap[b];
    this.heap[b] = temp;
  }
}