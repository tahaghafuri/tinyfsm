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
  readonly state: S;
  send(event: E): boolean;
  on(listener: Listener<S>): () => void;
  can(event: E): boolean;
  is(state: S): boolean;
};

export declare function createMachine<S extends string, E extends string>(
  options: FSMOptions<S, E>
): FSM<S, E>;
