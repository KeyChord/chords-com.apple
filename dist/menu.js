// node_modules/.pnpm/jxa-run-compat@1.6.0/node_modules/jxa-run-compat/lib/run.js
import { spawn } from "child_process";
function run(jxaCodeFunction, ...args) {
  const code = `
ObjC.import('stdlib');
var args = JSON.parse($.getenv('OSA_ARGS'));
var fn   = (${jxaCodeFunction.toString()});
var out  = fn.apply(null, args);
JSON.stringify({ result: out });
`;
  return executeInOsa(code, args);
}
var DEFAULT_MAX_BUFFER = 1e3 * 1e3 * 100;
function executeInOsa(code, args) {
  return new Promise((resolve, reject) => {
    const child = spawn("/usr/bin/osascript", ["-l", "JavaScript"], {
      env: {
        OSA_ARGS: JSON.stringify(args)
      },
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdoutBuffers = [];
    let stderrBuffers = [];
    let stdoutLength = 0;
    let stderrLength = 0;
    let done = false;
    function finishError(err) {
      if (done)
        return;
      done = true;
      reject(err);
    }
    function onData(chunk, buffers, currentLength, streamName) {
      const nextLength = currentLength + chunk.length;
      if (nextLength > DEFAULT_MAX_BUFFER) {
        child.kill();
        finishError(new Error(`${streamName} maxBuffer length exceeded`));
        return currentLength;
      }
      buffers.push(chunk);
      return nextLength;
    }
    child.stdout.on("data", (chunk) => {
      stdoutLength = onData(chunk, stdoutBuffers, stdoutLength, "stdout");
    });
    child.stderr.on("data", (chunk) => {
      stderrLength = onData(chunk, stderrBuffers, stderrLength, "stderr");
    });
    child.on("error", (err) => {
      finishError(err);
    });
    child.on("close", () => {
      if (done)
        return;
      const stdout = Buffer.concat(stdoutBuffers);
      const stderr = Buffer.concat(stderrBuffers);
      if (stderr.length) {
        console.error(stderr.toString());
      }
      if (!stdout.length) {
        done = true;
        resolve(void 0);
      }
      try {
        const result = JSON.parse(stdout.toString().trim()).result;
        done = true;
        resolve(result);
      } catch (errorOutput) {
        done = true;
        resolve(stdout.toString().trim());
      }
    });
    child.stdin.write(code);
    child.stdin.end();
  });
}

// src/menu.ts
function buildMenuHandler() {
  const runMenuAction = (mode, value) => run(
    (modeArg, valueArg) => {
      const log = (...args) => console.log("[JXA]", ...args);
      const normalize = (s) => String(s).replace(/[\u200B-\u200F\uFEFF\u202A-\u202E]/g, "").trim().toLowerCase();
      const assertExists = (obj, label) => {
        if (!obj) throw new Error(`Failed at: ${label}`);
        return obj;
      };
      const safeCall = (fn, fallback) => {
        try {
          return fn();
        } catch {
          return fallback;
        }
      };
      const getName = (item) => normalize(
        safeCall(() => item.name(), "")
      );
      const getMenuBarItems = (menuBar2) => {
        const items2 = safeCall(() => menuBar2.menuBarItems(), []);
        return Array.from({ length: items2.length }, (_, i) => items2[i]);
      };
      const isRepeatedLettersQuery = (query2) => {
        if (!/^[a-z]+$/.test(query2)) return false;
        const first = query2[0];
        return [...query2].every((ch) => ch === first);
      };
      const parseExpandedItemQuery = (query2) => {
        const m = query2.match(/^([a-z-]+?)(\d+)?$/);
        if (!m) {
          throw new Error(
            `Invalid menu query "${query2}". Expected lowercase letters/hyphens with optional trailing number.`
          );
        }
        const pattern = m[1];
        const ordinal = m[2] ? Number(m[2]) : 1;
        if (!pattern) {
          throw new Error(`Missing pattern in "${query2}"`);
        }
        if (!Number.isInteger(ordinal) || ordinal < 1) {
          throw new Error(`Invalid trailing number in "${query2}"`);
        }
        return {
          pattern,
          occurrence: ordinal
        };
      };
      const matchesWordAbbreviation = (name, pattern) => {
        const words = name.split(/[\s]+/).filter(Boolean);
        const parts = pattern.split("-").filter(Boolean);
        if (parts.length === 0) return false;
        if (parts.length > words.length) return false;
        for (let i = 0; i < parts.length; i++) {
          if (!words[i] || !words[i].startsWith(parts[i])) {
            return false;
          }
        }
        return true;
      };
      const matchesExpandedPattern = (name, pattern) => {
        if (pattern.includes("-")) {
          return matchesWordAbbreviation(name, pattern);
        }
        return name.startsWith(pattern);
      };
      const isMenuItemEnabled = (item) => safeCall(() => item.enabled(), true);
      const isSeparatorLike = (item) => {
        const name = getName(item);
        if (name) return false;
        const roleDesc = normalize(
          safeCall(() => item.roleDescription(), "")
        );
        return roleDesc.includes("separator");
      };
      const collectMenuItemsDepthFirst = (menu) => {
        const out = [];
        const walkMenu = (menuRef) => {
          const items2 = safeCall(() => menuRef.menuItems(), []);
          for (let i = 0; i < items2.length; i++) {
            const item = items2[i];
            if (!item) continue;
            if (!isSeparatorLike(item)) {
              out.push(item);
            }
            const submenus = safeCall(() => item.menus(), []);
            if (submenus.length > 0 && submenus[0]) {
              walkMenu(submenus[0]);
            }
          }
        };
        walkMenu(menu);
        return out;
      };
      const getSelectedTopLevelMenu = (menuBarItems) => {
        for (const item of menuBarItems) {
          const selected = safeCall(() => item.selected(), false);
          if (!selected) continue;
          const menus = safeCall(() => item.menus(), []);
          if (menus.length > 0 && menus[0]) {
            return {
              menuBarItem: item,
              menu: menus[0]
            };
          }
        }
        return null;
      };
      const clickTopLevelMenuByIndex = (items2, oneBasedIndex) => {
        if (!Number.isInteger(oneBasedIndex) || oneBasedIndex < 1) {
          throw new Error(
            `Expected menuIndex to be a positive integer, got: ${oneBasedIndex}`
          );
        }
        const zeroBasedIndex = oneBasedIndex - 1;
        if (zeroBasedIndex >= items2.length) {
          throw new Error(
            `menuIndex ${oneBasedIndex} out of range; found ${items2.length} menu bar items`
          );
        }
        const item = assertExists(
          items2[zeroBasedIndex],
          `menuBarItems[${zeroBasedIndex}]`
        );
        log(`Clicking top-level menu #${oneBasedIndex}:`, safeCall(() => item.name(), "<unknown>"));
        item.click();
      };
      const clickTopLevelMenuByRepeatedLetters = (items2, query2) => {
        const prefix = query2[0];
        const occurrence = query2.length;
        const matches = items2.filter((item2) => getName(item2).startsWith(prefix));
        log(
          `Top-level repeated-letter query "${query2}" -> prefix "${prefix}", occurrence ${occurrence}`
        );
        log(
          "Top-level matches:",
          matches.map((item2) => safeCall(() => item2.name(), "<unknown>"))
        );
        if (matches.length < occurrence) {
          throw new Error(
            `No top-level menu match #${occurrence} for prefix "${prefix}". Found ${matches.length}.`
          );
        }
        const item = matches[occurrence - 1];
        log(`Clicking top-level menu:`, safeCall(() => item.name(), "<unknown>"));
        item.click();
      };
      const clickExpandedMenuItemByQuery = (items2, query2) => {
        const selected = getSelectedTopLevelMenu(items2);
        if (!selected) {
          throw new Error(
            `Query "${query2}" targets expanded menu items, but no top-level menu appears to be expanded.`
          );
        }
        const { pattern, occurrence } = parseExpandedItemQuery(query2);
        const selectedMenuName = safeCall(() => selected.menuBarItem.name(), "<unknown>");
        log(`Expanded menu context: "${selectedMenuName}"`);
        log(`Expanded-item query "${query2}" -> pattern "${pattern}", occurrence ${occurrence}`);
        const allItems = collectMenuItemsDepthFirst(selected.menu);
        const candidates = allItems.filter((item2) => {
          if (!isMenuItemEnabled(item2)) return false;
          const name = getName(item2);
          if (!name) return false;
          return matchesExpandedPattern(name, pattern);
        });
        log(
          "Expanded matches:",
          candidates.map((item2) => safeCall(() => item2.name(), "<unknown>"))
        );
        if (candidates.length < occurrence) {
          throw new Error(
            `No expanded menu item match #${occurrence} for pattern "${pattern}". Found ${candidates.length}.`
          );
        }
        const item = candidates[occurrence - 1];
        log(`Clicking expanded menu item:`, safeCall(() => item.name(), "<unknown>"));
        item.click();
      };
      const se = Application("System Events");
      const proc = assertExists(
        se.processes.whose({ frontmost: true })[0],
        "frontmost process"
      );
      log("Frontmost process:", safeCall(() => proc.name(), "<unknown>"));
      const menuBar = assertExists(proc.menuBars[0], "menuBars[0]");
      const items = getMenuBarItems(menuBar);
      if (modeArg === "index") {
        clickTopLevelMenuByIndex(items, Number(valueArg));
        log("Done");
        return;
      }
      const query = normalize(String(valueArg));
      if (!query) {
        throw new Error("Expected a non-empty lowercase query");
      }
      if (/^\d+$/.test(query)) {
        clickTopLevelMenuByIndex(items, Number(query));
        log("Done");
        return;
      }
      if (isRepeatedLettersQuery(query)) {
        clickTopLevelMenuByRepeatedLetters(items, query);
        log("Done");
        return;
      }
      clickExpandedMenuItemByQuery(items, query);
      log("Done");
    },
    mode,
    value
  );
  return {
    menuByIndex(menuIndex) {
      return runMenuAction("index", menuIndex);
    },
    menuByLetters(query) {
      return runMenuAction("letters", query);
    }
  };
}
export {
  buildMenuHandler as default
};
