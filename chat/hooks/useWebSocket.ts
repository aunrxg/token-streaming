'use client';

import { cleanRouter, initRouter } from "@/lib/MsgRouter";
import { useEffect } from "react";


const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4747/ws';

export function useWebSocket() {
  useEffect(() => {
    initRouter(WS_URL);
    return () => {
      cleanRouter();
    }
  }, []);
}
