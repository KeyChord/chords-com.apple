import { tap } from "chord";
//#region src/dock.ts
function buildDockHandler() {
	return function dock(index) {
		tap("ctrl+f3");
	};
}
//#endregion
export { buildDockHandler as default };
