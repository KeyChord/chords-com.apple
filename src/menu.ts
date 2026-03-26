import "@jxa/global-type";
import { run } from "jxa-run-compat";

export default function buildMenuHandler(_meta: ImportMeta) {
  return function menu(menuIndex: number) {
    return run((menuIndex: number) => {
      const log = (...args: any[]) => {
        console.log("[JXA]", ...args);
      };

      const assertExists = (obj: any, label: string) => {
        if (!obj) throw new Error(`Failed at: ${label}`);
        log("OK:", label);
        return obj;
      };

      if (!Number.isInteger(menuIndex) || menuIndex < 0) {
        throw new Error(`Expected menuIndex to be a non-negative integer, got: ${menuIndex}`);
      }

      const se = Application("System Events");
      const proc = assertExists(
        se.processes.whose({ frontmost: true })[0],
        "frontmost process",
      );

      log("Frontmost process:", proc.name());

      const menuBar = assertExists(proc.menuBars[0], "menuBars[0]");
      const items = menuBar.menuBarItems();

      // menuIndex is:
      // 0 = Apple menu
      // 1 = first regular app menu
      // 2 = second regular app menu
      // ...
      //
      // In System Events, this usually maps directly to menuBarItems()[index].
      if (menuIndex >= items.length) {
        throw new Error(
          `menuIndex ${menuIndex} out of range; found ${items.length} menu bar items (valid range: 0-${items.length - 1})`,
        );
      }

      const item = assertExists(items[menuIndex], `menuBarItems[${menuIndex}]`);

      if (menuIndex === 0) {
        log("Clicking Apple menu");
      } else {
        try {
          log(`Clicking menu ${menuIndex}: "${item.name()}"`);
        } catch {
          log(`Clicking menu ${menuIndex}`);
        }
      }

      item.click();
      log("Done");
    }, menuIndex);
  };
}
