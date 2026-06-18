// tinyfsm v1.0.0 — tiny zero-dep FSM (~600B minified)
// https://tinyfsm.js.org | MIT License

export function createMachine(options) {
  let current = options.initial;
  const listeners = new Set();

  options.states[current]?.onEnter?.(null);

  return {
    get state() { return current; },

    send(event) {
      const next = options.states[current]?.on?.[event];
      if (!next) return false;
      const prev = current;
      options.states[prev]?.onExit?.(next);
      current = next;
      options.states[current]?.onEnter?.(prev);
      listeners.forEach((fn) => fn(current, prev));
      return true;
    },

    on(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    can(event) {
      return !!options.states[current]?.on?.[event];
    },

    is(state) {
      return current === state;
    },
  };
}
