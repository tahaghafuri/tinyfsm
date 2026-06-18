# tinyfsm

> A tiny (~700B) zero-dependency finite state machine for JavaScript & TypeScript.

[![npm](https://img.shields.io/npm/v/tinyfsm)](https://npmjs.com/package/tinyfsm)
[![size](https://img.shields.io/bundlephobia/minzip/tinyfsm)](https://bundlephobia.com/package/tinyfsm)
[![license](https://img.shields.io/npm/l/tinyfsm)](LICENSE)

No boilerplate. No classes. No runtime overhead. Just states and events.

```js
import { createMachine } from 'tinyfsm';

const fetcher = createMachine({
  initial: 'idle',
  states: {
    idle:    { on: { FETCH:   'loading' } },
    loading: { on: { RESOLVE: 'success', REJECT: 'error' } },
    success: { on: { RESET:   'idle' } },
    error:   { on: { RETRY:   'loading', RESET: 'idle' } },
  },
});

fetcher.send('FETCH');     // → loading
fetcher.send('RESOLVE');   // → success
fetcher.is('success');     // true
```

## Install

```bash
npm install tinyfsm
```

**CDN:**
```html
<script src="https://cdn.jsdelivr.net/npm/tinyfsm/dist/tinyfsm.umd.min.js"></script>
```

## API

| Method | Returns | Description |
|--------|---------|-------------|
| `.state` | `S` | Current state (readonly) |
| `.send(event)` | `boolean` | Send event, returns `true` if transition occurred |
| `.on(listener)` | `() => void` | Subscribe to changes, returns unsubscribe fn |
| `.can(event)` | `boolean` | Check if event triggers transition from current state |
| `.is(state)` | `boolean` | Check if current state matches |

## TypeScript

Fully typed with generics — invalid states and events are caught at compile time.

```ts
type State = 'idle' | 'loading' | 'success' | 'error';
type Event = 'FETCH' | 'RESOLVE' | 'REJECT' | 'RESET';

const machine = createMachine<State, Event>({ ... });
```

## Lifecycle hooks

```js
const door = createMachine({
  initial: 'closed',
  states: {
    closed: {
      on: { OPEN: 'open' },
      onExit: (to) => console.log(`leaving closed → ${to}`),
    },
    open: {
      on: { CLOSE: 'closed' },
      onEnter: (from) => console.log(`entered open from ${from}`),
    },
  },
});
```

## Why not XState?

XState is excellent for complex machines. tinyfsm is for the other 90% — loading states, UI toggles, wizard steps — where you just need something that works in **under 1KB**.

## License

MIT
