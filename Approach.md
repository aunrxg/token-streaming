# Scribling and though process

> Need to build a next app (client) which connects to agent-server/ via websocket connection, **renders streaming responses with mid-stream tool call interuptions** (basically a claude/gemini/gpt like interface not necessarily being chat interface but functionality), **displaying a live agent trace limits and chaos mode.**

## The `agent-server/`

The backend is badly written, atleast at first glance it seems so. anyways its a context-aware agent that streams response (life made easy), can call tools, retrieve context somehow, most importantly in chaos mode: it drops connections, reorder msgs, inject latency, send uneven heartbeats. (hehe i am gonna steal this). Challenge is to handle this gracefully on frontend. **childs play.** **Looks doesn't matter to then is a plus for me hehe**

## their vision

basically frontend is the last milestone between their agent and their clients. They hate jittering on user facing side. They just want a client polished product which they can sell and build trust. **good user experience is their NEED.**

## task 1

A chat interface, token streaming and mid convo tool call with all edge cases handled. 

1. tokens stream as they come, no batching no waiting.
2. TOOL_CALL mid stream happens, in-progress text must stop, no flicker, no reflow, no layout shift, tool call card appear below text (tool name and arguments). (Sample claude interface)
3. client -> server a tool ack in under 2 sec
4. too_result comes -> card update to show result -> token resume 
5. make this sequencial multiple took calls mid convo (stacked on each other)

---

## my research 

if we were using api of any stablished model say anthropic's api or gemini api or openai api, there is a fixed and proven way of handling token streaming :

1. SSE & Async Generators

Instead of waiting for an entire response to process and dumping a wall of text, models use SSE over HTTP/2.

- streaming protocol:  The server keeps the connection open and pushes deltas (tiny, incremental token fragments) to the client immediately as they are generated. 

- async node generator: yield token sequencially preventing blocking and ensuring continuous flow.

[taken from this paper from 2024](https://arxiv.org/html/2401.12961v2)

2. Fine grained tool streaming

Older tool-calling methods forced the UI to wait while the model generated and validated large JSON strings before responding. Modern models use Fine-Grained Tool Streaming.

- steaming inputs: Parameters for tools are streamed directly into the tool definition field.

- partial parsing: Rather than validating a block of JSON at the end, the frontend interface receives a continuous stream of data points and dynamically updates the UI tool-call state (e.g., smoothly rendering function_call(arg1: "search_term") as it is being typed).

[from claude api docs](http://platform.claude.com/docs/en/build-with-claude/streaming)

3. state decoupling 

decoupling backend streaming from frontend rendering (very trivial) 

- token buffering : buffer for few milli seconds for smooth output (but we don't want buffering, explicitly mentioned in the task) (unsmooth text generation would work)

- can use transition and animation to render text but i hate this. Text generation should snappy. from the looks of it the company want to compete with giants like anthropics and openai 

- separate thinking and reasoning like claude. but the backend do not provide that. its a simple if else code

4. Backpressure and token control

if generation is too rapid, it may cause jitter

- token rate changing: we can limit the generation rate or rendering rate to avoid overloading the transmission pipeline

---

> All this above can be applied if were using api, but the backend provided by them is a if-else code. the content is fixed it there is not api. everything comes to frontend skills. (YOUR BACKEND F'd MY RESEARCH imma cry now)

--- 

### The immediate bruteforce solution i can think of is directly tracking the seq number on frontend. maybe using a map or heap. then we can crudely check if the next seq is smaller or equal to previous seq received. A chicky solution but works in this make shift environment. 

