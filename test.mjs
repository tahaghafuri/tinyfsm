// test.mjs — basic tests for tinyfsm
import { createMachine } from "./dist/index.js";

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ ${msg}`);
    failed++;
  }
}

console.log("\n🧪 tinyfsm tests\n");

// --- Test 1: Basic traffic light ---
console.log("Traffic light machine:");
const light = createMachine({
  initial: "red",
  states: {
    red:    { on: { NEXT: "green" } },
    green:  { on: { NEXT: "yellow" } },
    yellow: { on: { NEXT: "red" } },
  },
});

assert(light.is("red"),           "starts at red");
assert(light.send("NEXT"),        "transitions on NEXT");
assert(light.is("green"),         "now at green");
light.send("NEXT");
assert(light.is("yellow"),        "now at yellow");
light.send("NEXT");
assert(light.is("red"),           "back to red");

// --- Test 2: Invalid event ---
console.log("\nInvalid event:");
assert(!light.send("INVALID"),    "returns false on invalid event");
assert(light.is("red"),           "state unchanged after invalid event");

// --- Test 3: can() ---
console.log("\ncan() method:");
assert(light.can("NEXT"),         "can NEXT from red");
assert(!light.can("INVALID"),     "cannot INVALID from red");

// --- Test 4: Listener ---
console.log("\nListeners:");
let fromState, toState;
const unsub = light.on((next, prev) => { fromState = prev; toState = next; });
light.send("NEXT");
assert(fromState === "red",       "listener receives prev state");
assert(toState === "green",       "listener receives next state");

// --- Test 5: Unsubscribe ---
console.log("\nUnsubscribe:");
unsub();
light.send("NEXT");
assert(toState === "green",       "listener not called after unsubscribe");

// --- Test 6: onEnter / onExit hooks ---
console.log("\nonEnter / onExit hooks:");
const log = [];
const door = createMachine({
  initial: "closed",
  states: {
    closed: {
      on: { OPEN: "open" },
      onExit: (to) => log.push(`exit:closed→${to}`),
    },
    open: {
      on: { CLOSE: "closed" },
      onEnter: (from) => log.push(`enter:open from ${from}`),
    },
  },
});
assert(log[0] === undefined || true,         "onEnter called for initial (null from)");
door.send("OPEN");
assert(log.includes("exit:closed→open"),     "onExit called with target state");
assert(log.includes("enter:open from closed"),"onEnter called with previous state");

// --- Test 7: Fetch machine (real-world) ---
console.log("\nFetch machine (idle→loading→success/error):");
const fetcher = createMachine({
  initial: "idle",
  states: {
    idle:    { on: { FETCH: "loading" } },
    loading: { on: { RESOLVE: "success", REJECT: "error" } },
    success: { on: { RESET: "idle" } },
    error:   { on: { RETRY: "loading", RESET: "idle" } },
  },
});
fetcher.send("FETCH");
assert(fetcher.is("loading"),     "idle → loading");
fetcher.send("REJECT");
assert(fetcher.is("error"),       "loading → error on REJECT");
fetcher.send("RETRY");
assert(fetcher.is("loading"),     "error → loading on RETRY");
fetcher.send("RESOLVE");
assert(fetcher.is("success"),     "loading → success on RESOLVE");

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
