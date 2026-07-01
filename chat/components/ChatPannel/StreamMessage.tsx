import { useAgentStore } from "@/store/agentStore";
import { memo } from "react";
import { ToolCallCard } from "./ToolCallCard";

interface Prop {
  streamId: string;
}

export const StreamMessage = memo(function StreamMessage({ streamId }: Prop) {
  const stream = useAgentStore(s => s.streams[streamId]);

  if(!stream) return null;

  const isStreaming = stream.status === "streaming" && stream.endedAt === null;

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-xs shrink-0 mt-0.5">
        ◈&#9672;
      </div>

      <div className="flex-1 min-w-0">
        {/* Accumulated text — never re-mounted, only its content grows */}
        {stream.text !== '' && (
          <p
            className={[
              'font-sans text-sm text-text-primary whitespace-pre-wrap wrap-break-word leading-relaxed',
              isStreaming && stream.toolCalls.length === 0 ? 'streaming-cursor' : '',
            ].join(' ')}
          >
            {stream.text}
          </p>
        )}

        {/* Tool call cards in insertion order */}
        {stream.toolCalls.map(tc => (
          <ToolCallCard key={tc.callId} toolCall={tc} />
        ))}

        {/* Streaming indicator after tool calls resolve and tokens resume */}
        {isStreaming && stream.toolCalls.length > 0 && stream.text === '' && (
          <span className="inline-block w-2 h-4 bg-accent animate-blink rounded-sm ml-0.5" />
        )}
      </div>
    </div>
  );
});
