export type StateMap<S extends string, E extends string> = {
  [state in S]: {
    on?: Partial<{ [event in E]: S }>;
    onEnter?: (from: S | null) => void;
    onExit?: (to: S) => void;
  };
};

export type FSMOptions<S extends string, E extends string> = {
  initial: S;
  states: StateMap<S, E>;
};

export type Listener<S extends string> = (next: S, prev: S) => void;

export type FSM<S extends string, E extends string> = {
  /** Current state */
  readonly state: S;
  /** Send an event, returns true if transition happened */
  send(event: E): boolean;
  /** Subscribe to state changes */
  on(listener: Listener<S>): () => void;
  /** Check if a transition is possible from current state */
  can(event: E): boolean;
  /** Returns true if current state matches */
  is(state: S): boolean;
};

export function createMachine<S extends string, E extends string>(
  options: FSMOptions<S, E>
): FSM<S, E> {
  let current: S = options.initial;
  const listeners = new Set<Listener<S>>();

  // call onEnter for initial state
  options.states[current]?.onEnter?.(null);

  return {
    get state() {
      return current;
    },

    send(event: E): boolean {
      const next = options.states[current]?.on?.[event];
      if (!next) return false;

      const prev = current;
      options.states[prev]?.onExit?.(next);
      current = next;
      options.states[current]?.onEnter?.(prev);

      listeners.forEach((fn) => fn(current, prev));
      return true;
    },

    on(listener: Listener<S>) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    can(event: E): boolean {
      return !!options.states[current]?.on?.[event];
    },

    is(state: S): boolean {
      return current === state;
    },
  };
}
