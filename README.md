# JSConsole

This is a JavaScript console powered by its own JavaScript interpreter, written in JavaScript.

**It is very experimental and a work in progress.**

## Features

- Autocomplete
- Eager evaluation
- Displaying object metadata
- Top-level await
- Non-isolated execution (transparently works within the browser context, so you can use the DOM and browser APIs)
- Preview window
- Console log can be shared via a link
- Supports TypeScript (strips erasable types without type checking)

## Interpreter

The console is powered by its own JavaScript interpreter. It is non-sandboxed by design.

The rationale consists of two parts:

- To have a console that transparently works within the current browser realm, so we can play with the DOM and browser APIs – the same way we use native DevTools browser consoles
- To provide the best possible UX/DX that closely mirrors native DevTools browser consoles' capabilities, such as autocomplete, eager evaluation, and displaying object metadata

For more details, see [./packages/interpreter/README.md](./packages/interpreter/README.md).
