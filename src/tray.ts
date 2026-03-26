import "@jxa/global-type";
import { run } from "jxa-run-compat";

export default function buildTrayHandler(_meta: ImportMeta) {
  return function tray(trayIndex: number) {
    return run((trayIndexArg: number) => {
      const log = (...args: any[]) => {
        console.log("[JXA]", ...args);
      };

      const assertExists = (obj: any, label: string) => {
        if (!obj) throw new Error(`Failed at: ${label}`);
        log("OK:", label);
        return obj;
      };

      const getItems = (menuBar: any) => {
        if (!menuBar) return [];
        try {
          return menuBar.menuBarItems();
        } catch {
          return [];
        }
      };

      const getLabel = (item: any) => {
        try {
          const name = item.name();
          if (name) return name;
        } catch {}

        try {
          const desc = item.description();
          if (desc) return desc;
        } catch {}

        return "<unnamed>";
      };

      if (!Number.isInteger(trayIndexArg) || trayIndexArg < 1) {
        throw new Error(`Expected trayIndex to be a positive integer, got: ${trayIndexArg}`);
      }

      const se = Application("System Events");
      const proc = assertExists(se.processes.byName("SystemUIServer"), 'process "SystemUIServer"');

      // Some setups expose tray items on one menu bar, some on another.
      // Try menu bar 1 first, then fall back to menu bar 2.
      const candidateBars = [proc.menuBars[0], proc.menuBars[1]];
      let menuBar: any = null;
      let items: any[] = [];

      for (let i = 0; i < candidateBars.length; i++) {
        const currentItems = getItems(candidateBars[i]);
        if (currentItems.length > 0) {
          menuBar = candidateBars[i];
          items = currentItems;
          log(`Using SystemUIServer menu bar ${i + 1} with ${items.length} tray items`);
          break;
        }
      }

      assertExists(menuBar, "tray menu bar");

      log("Available tray items:");
      for (let i = 0; i < items.length; i++) {
        log(`${i + 1}: ${getLabel(items[i])}`);
      }

      if (trayIndexArg > items.length) {
        throw new Error(
          `trayIndex ${trayIndexArg} out of range; found ${items.length} tray items`
        );
      }

      const item = assertExists(items[trayIndexArg - 1], `tray item ${trayIndexArg}`);

      log(`Clicking tray item ${trayIndexArg}: ${getLabel(item)}`);
      item.click();
      log("Done");
    }, trayIndex);
  };
}