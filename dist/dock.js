// src/dock.ts
import { tap } from "chord";
function buildDockHandler() {
  return function dock(index) {
    tap("ctrl+f3");
  };
}
export {
  buildDockHandler as default
};
