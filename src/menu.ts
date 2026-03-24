import "@jxa/global-type";
import { run } from "jxa-run-compat";

export default function buildMenuHandler(_meta: ImportMeta, processName: string) {
  return function menu(...menuItems: string[]) {
    return run(
      (processName: string, menuItemsArg: string[]) => {
        const [menuBarItem, ...menuItems] = menuItemsArg;
        const log = (...args: any[]) => {
          console.log("[JXA]", ...args);
        };

        const normalize = (s: string) =>
          s.replace(/[\u200B-\u200F\uFEFF\u202A-\u202E]/g, "").trim();

        const findByName = (collection: any, target: string, label: string) => {
          const normTarget = normalize(target);
          const items = collection();

          for (let i = 0; i < items.length; i++) {
            try {
              const raw = items[i].name();
              const norm = normalize(raw);

              if (norm === normTarget) {
                log(`Matched ${label}:`, `"${raw}"`);
                return items[i];
              }
            } catch {}
          }

          log(`❌ Available ${label}s:`);
          for (let i = 0; i < items.length; i++) {
            try {
              log("-", `"${items[i].name()}"`);
            } catch {}
          }

          throw new Error(`Missing: ${label} "${target}"`);
        };

        const assertExists = (obj: any, label: string) => {
          if (!obj) throw new Error(`❌ Failed at: ${label}`);
          log("OK:", label);
          return obj;
        };

        if (!Array.isArray(menuItems)) {
          throw new Error(`Expected menuItems to be an array, got: ${typeof menuItems}`);
        }

        console.log(menuItems);
        const se = Application("System Events");
        const app = Application(processName);

        log("Activating app:", processName);
        app.activate();
        delay(0.1);

        const proc = assertExists(se.processes.whose({ frontmost: true })[0], "frontmost process");

        log("Frontmost process:", proc.name());

        const menuBar = assertExists(proc.menuBars[0], "menuBars[0]");

        const menuBarItemRef = findByName(menuBar.menuBarItems, menuBarItem!, "menuBarItem");

        let current = menuBarItemRef;

        for (let i = 0; i < menuItems.length; i++) {
          const name = menuItems[i]!;
          log(`Traversing -> "${name}"`);

          const menu = assertExists(current.menus[0], `menus[0] for "${name}"`);
          const next = findByName(menu.menuItems, name, "menuItem");

          if (i === menuItems.length - 1) {
            log(`Clicking "${name}"`);
            next.click();
          } else {
            current = next;
          }
        }

        log("Done");
      },
      processName,
      menuItems,
    );
  };
}
