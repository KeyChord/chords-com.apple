import "@jxa/global-type";
import { run } from "jxa-run-compat";

/**
 * Clicks a menu item either by index or by name.
 */
export default function buildMenuHandler(processName?: string) {
  function menu(menuIndex: number): ReturnType<typeof run>;
  function menu(menuBarItem: string, ...menuItems: string[]): ReturnType<typeof run>;
  function menu(first: number | string, ...rest: string[]) {
    return run(
      (processNameArg: string | undefined, firstArg: number | string, restArgs: string[]) => {
        const log = (...args: any[]) => {
          console.log("[JXA]", ...args);
        };

        const normalize = (s: string) =>
          s.replace(/[\u200B-\u200F\uFEFF\u202A-\u202E]/g, "").trim();

        const assertExists = (obj: any, label: string) => {
          if (!obj) throw new Error(`Failed at: ${label}`);
          log("OK:", label);
          return obj;
        };

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

          log(`Available ${label}s:`);
          for (let i = 0; i < items.length; i++) {
            try {
              log("-", `"${items[i].name()}"`);
            } catch {}
          }

          throw new Error(`Missing: ${label} "${target}"`);
        };

        const se = Application("System Events");

        if (processNameArg) {
          const app = Application(processNameArg);
          log("Activating app:", processNameArg);
          app.activate();
          delay(0.1);
        }

        const proc = assertExists(
          se.processes.whose({ frontmost: true })[0],
          "frontmost process",
        );

        log("Frontmost process:", proc.name());

        const menuBar = assertExists(proc.menuBars[0], "menuBars[0]");
        const items = menuBar.menuBarItems();

        if (typeof firstArg === "number") {
          const menuIndex = firstArg;

          if (!Number.isInteger(menuIndex) || menuIndex < 0) {
            throw new Error(
              `Expected menuIndex to be a non-negative integer, got: ${menuIndex}`,
            );
          }

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
          return;
        }

        const menuItemsArg = [firstArg, ...restArgs];

        if (menuItemsArg.length === 0) {
          throw new Error("Expected at least one menu item name");
        }

        const [menuBarItem, ...menuItems] = menuItemsArg;

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

        // If only the top-level menu name was passed, click/open it directly.
        if (menuItems.length === 0) {
          log(`Clicking top-level menu "${menuBarItem}"`);
          menuBarItemRef.click();
        }

        log("Done");
      },
      processName,
      first,
      rest,
    );
  }

  return menu;
}
