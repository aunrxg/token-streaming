"use client";
import { ChatPanel } from "@/components/ChatPannel/Index";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { Context } from "@/components/contextTree/Index";
import { SeqCounter } from "@/components/SeqCounter";
import { TraceTimeline } from "@/components/Timeline/Index";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useState } from "react";

type RightTab = "timeline" | "context";

export default function Home() {
  useWebSocket();

  const [rightTab, setRightTab] = useState<RightTab>("timeline");

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-11 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-2">
          {/* Minimal logo mark */}
          <span className="text-accent font-mono font-medium tracking-tight">
            ◈ agent console
          </span>
        </div>
        <SeqCounter />
        <ConnectionStatus />
      </header>

      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Left — chat */}
        <div className="flex flex-col flex-1 min-w-0 border-r border-border">
          <ChatPanel />
        </div>

        {/* Right — tabbed sidebar */}
        <div className="flex flex-col w-120 shrink-0 min-h-0">
          {/* Tab bar */}
          <div className="flex border-b border-border bg-surface shrink-0">
            {(["timeline", "context"] as RightTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={[
                  "px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors",
                  rightTab === tab
                    ? "text-accent border-b-2 border-accent -mb-px"
                    : "text-text-muted hover:text-text-secondary",
                ].join(" ")}
              >
                {tab === "timeline" ? "Trace" : "Context"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {rightTab === "timeline" ? <TraceTimeline /> : <Context />}
          </div>
        </div>
      </div>
    </div>
  );
}
