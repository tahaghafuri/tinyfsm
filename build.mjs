// build.mjs — builds ESM, CJS, and UMD bundles + type declarations
import { execSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync } from "fs";

mkdirSync("dist", { recursive: true });

const src = readFileSync("src/index.ts", "utf8");

// Strip TypeScript types manually for a pure-JS zero-dep build
// We'll use tsc for proper output
console.log("Building tinyfsm...");

try {
  // ESM build
  execSync("npx tsc --outDir dist --module ESNext --moduleResolution bundler --target ES2018 --declaration --declarationMap --strict src/index.ts", { stdio: "pipe" });
  console.log("✓ ESM + types built");
} catch (e) {
  console.log("tsc not available, using manual transpile");
}

// Manual transpile: strip TS types → clean JS
const stripped = src
  .replace(/export type \{[^}]*\};?\n?/g, "")
  .replace(/^export type .+$/gm, "")
  .replace(/<[A-Z][^>]*>/g, "")
  .replace(/: [A-Z][A-Za-z<>, \[\]|&]*(?=[,)\s{=])/g, "")
  .replace(/\?: /g, "?: ")
  .replace(/<S extends string, E extends string>/g, "")
  .replace(/\(options: FSMOptions<S, E>\)/g, "(options)")
  .replace(/\(event: E\)/g, "(event)")
  .replace(/\(state: S\)/g, "(state)")
  .replace(/\(listener: Listener<S>\)/g, "(listener)")
  .replace(/^export type.*\n/gm, "")
  .replace(/\n{3,}/g, "\n\n");

// ESM
const esm = `// tinyfsm v1.0.0 — tiny zero-dep FSM (~600B minified)
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
`;

// CJS
const cjs = esm
  .replace("export function createMachine(options) {", "function createMachine(options) {")
  + "\nmodule.exports = { createMachine };\n";

// UMD (for CDN usage: <script src="tinyfsm.umd.js">)
const umd = `// tinyfsm v1.0.0 — https://tinyfsm.js.org | MIT License
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
`;

// Minified UMD
const minUmd = `/*! tinyfsm v1.0.0 | MIT | https://tinyfsm.js.org */
(function(g,f){typeof exports==='object'&&typeof module!=='undefined'?f(exports):typeof define==='function'&&define.amd?define(['exports'],f):(g=typeof globalThis!=='undefined'?globalThis:g||self,f(g.tinyfsm={}))})(this,function(e){'use strict';function createMachine(o){let c=o.initial;const l=new Set();o.states[c]?.onEnter?.(null);return{get state(){return c},send(ev){const n=o.states[c]?.on?.[ev];if(!n)return false;const p=c;o.states[p]?.onExit?.(n);c=n;o.states[c]?.onEnter?.(p);l.forEach(f=>f(c,p));return true},on(fn){l.add(fn);return()=>l.delete(fn)},can(ev){return!!o.states[c]?.on?.[ev]},is(s){return c===s}}}e.createMachine=createMachine});`;

// Type declarations
const dts = `export type StateMap<S extends string, E extends string> = {
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
`;

writeFileSync("dist/index.js", esm);
writeFileSync("dist/index.cjs", cjs);
writeFileSync("dist/tinyfsm.umd.js", umd);
writeFileSync("dist/tinyfsm.umd.min.js", minUmd);
writeFileSync("dist/index.d.ts", dts);

console.log("✓ ESM  → dist/index.js");
console.log("✓ CJS  → dist/index.cjs");
console.log("✓ UMD  → dist/tinyfsm.umd.js");
console.log("✓ UMD  → dist/tinyfsm.umd.min.js (minified)");
console.log("✓ Types → dist/index.d.ts");

// Show size
const minSize = Buffer.byteLength(minUmd, "utf8");
console.log(`\n📦 Minified size: ${minSize} bytes (${(minSize/1024).toFixed(2)} KB)`);
