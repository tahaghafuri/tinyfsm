// tinyfsm v1.0.0 — https://tinyfsm.js.org | MIT License
(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.tinyfsm = {}));
})(this, function(exports) {
  'use strict';
  function createMachine(options) {
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
      on(listener) { listeners.add(listener); return () => listeners.delete(listener); },
      can(event) { return !!options.states[current]?.on?.[event]; },
      is(state) { return current === state; },
    };
  }
  exports.createMachine = createMachine;
});
