var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/.pnpm/jxa-run-compat@1.5.0/node_modules/jxa-run-compat/lib/run.js
var require_run = __commonJS({
  "node_modules/.pnpm/jxa-run-compat@1.5.0/node_modules/jxa-run-compat/lib/run.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.run = exports.runJXACode = void 0;
    var child_process_1 = __require("child_process");
    function runJXACode(jxaCode) {
      return executeInOsa(jxaCode, []);
    }
    exports.runJXACode = runJXACode;
    function run2(jxaCodeFunction) {
      var args = [];
      for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
      }
      var code = "\nObjC.import('stdlib');\nvar args = JSON.parse($.getenv('OSA_ARGS'));\nvar fn   = (".concat(jxaCodeFunction.toString(), ");\nvar out  = fn.apply(null, args);\nJSON.stringify({ result: out });\n");
      return executeInOsa(code, args);
    }
    exports.run = run2;
    var DEFAULT_MAX_BUFFER = 1e3 * 1e3 * 100;
    function executeInOsa(code, args) {
      return new Promise(function(resolve, reject) {
        var child = (0, child_process_1.spawn)("/usr/bin/osascript", ["-l", "JavaScript"], {
          env: {
            OSA_ARGS: JSON.stringify(args)
          },
          stdio: ["pipe", "pipe", "pipe"]
        });
        var stdoutBuffers = [];
        var stderrBuffers = [];
        var stdoutLength = 0;
        var stderrLength = 0;
        var done = false;
        function finishError(err) {
          if (done)
            return;
          done = true;
          reject(err);
        }
        function onData(chunk, buffers, currentLength, streamName) {
          var nextLength = currentLength + chunk.length;
          if (nextLength > DEFAULT_MAX_BUFFER) {
            child.kill();
            finishError(new Error("".concat(streamName, " maxBuffer length exceeded")));
            return currentLength;
          }
          buffers.push(chunk);
          return nextLength;
        }
        child.stdout.on("data", function(chunk) {
          stdoutLength = onData(chunk, stdoutBuffers, stdoutLength, "stdout");
        });
        child.stderr.on("data", function(chunk) {
          stderrLength = onData(chunk, stderrBuffers, stderrLength, "stderr");
        });
        child.on("error", function(err) {
          finishError(err);
        });
        child.on("close", function() {
          if (done)
            return;
          var stdout = Buffer.concat(stdoutBuffers);
          var stderr = Buffer.concat(stderrBuffers);
          if (stderr.length) {
            console.error(stderr.toString());
          }
          if (!stdout.length) {
            done = true;
            resolve(void 0);
          }
          try {
            var result = JSON.parse(stdout.toString().trim()).result;
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
  }
});

// src/menu.ts
var import_jxa_run_compat = __toESM(require_run(), 1);
function buildMenuHandler() {
  const runMenuAction = (mode, value) => (0, import_jxa_run_compat.run)(
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
