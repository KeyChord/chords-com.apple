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

// src/tray.ts
var import_jxa_run_compat = __toESM(require_run(), 1);
function buildTrayHandler(_meta) {
  return function tray(trayIndex) {
    return (0, import_jxa_run_compat.run)((trayIndexArg) => {
      const normalize = (s) => String(s).replace(/[\u200B-\u200F\uFEFF\u202A-\u202E]/g, "").trim();
      const normKey = (s) => normalize(s).toLowerCase().replace(/[^a-z0-9]+/g, "");
      const getLabel = (item) => {
        try {
          const desc = item.description();
          if (desc) return normalize(desc);
        } catch {
        }
        try {
          const title = item.title();
          if (title) return normalize(title);
        } catch {
        }
        try {
          const name = item.name();
          if (name) return normalize(name);
        } catch {
        }
        return "status menu";
      };
      const getPosition = (item) => {
        try {
          const p = item.position();
          if (p && p.length >= 2) {
            return { x: Number(p[0]), y: Number(p[1]) };
          }
        } catch {
        }
        try {
          const p = item.attributes.byName("AXPosition").value();
          if (p && p.length >= 2) {
            return { x: Number(p[0]), y: Number(p[1]) };
          }
        } catch {
        }
        return { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY };
      };
      const genericMenuLabels = /* @__PURE__ */ new Set([
        "apple",
        "file",
        "edit",
        "view",
        "window",
        "help",
        "format"
      ]);
      if (!Number.isInteger(trayIndexArg) || trayIndexArg < 1) {
        throw new Error(
          `Expected trayIndex to be a positive integer, got: ${trayIndexArg}`
        );
      }
      const se = Application("System Events");
      const rows = [];
      const seen = /* @__PURE__ */ Object.create(null);
      const addFromBar = (proc, procName, barIndex, include) => {
        let items;
        try {
          items = proc.menuBars[barIndex - 1].menuBarItems();
        } catch {
          return;
        }
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const label = getLabel(item);
          if (!include(label)) continue;
          const pos = getPosition(item);
          const key = [
            normKey(procName),
            barIndex,
            i + 1,
            normKey(label)
          ].join("|");
          if (seen[key]) continue;
          seen[key] = true;
          rows.push({
            ref: item,
            owner: procName,
            barIndex,
            itemIndex: i + 1,
            label,
            x: pos.x,
            y: pos.y
          });
        }
      };
      const procs = se.processes();
      for (let i = 0; i < procs.length; i++) {
        let procName = "";
        try {
          procName = String(procs[i].name());
        } catch {
          continue;
        }
        if (!procName) continue;
        addFromBar(procs[i], procName, 2, () => true);
      }
      const specialHosts = ["Control Center", "ControlCenter", "SystemUIServer"];
      for (let i = 0; i < specialHosts.length; i++) {
        const name = specialHosts[i];
        let proc;
        try {
          proc = se.processes.byName(name);
          proc.name();
        } catch {
          continue;
        }
        addFromBar(proc, name, 1, (label) => {
          const key = normKey(label);
          if (!key) return false;
          if (genericMenuLabels.has(key)) return false;
          if (key === normKey(name)) return false;
          return true;
        });
      }
      if (rows.length === 0) {
        throw new Error("No tray items were exposed via Accessibility");
      }
      rows.sort((a, b) => {
        const ax = Number.isFinite(a.x) ? a.x : Number.MAX_SAFE_INTEGER;
        const bx = Number.isFinite(b.x) ? b.x : Number.MAX_SAFE_INTEGER;
        if (ax !== bx) return ax - bx;
        if (a.y !== b.y) return a.y - b.y;
        if (a.owner !== b.owner) return a.owner < b.owner ? -1 : 1;
        if (a.barIndex !== b.barIndex) return a.barIndex - b.barIndex;
        return a.itemIndex - b.itemIndex;
      });
      if (trayIndexArg > rows.length) {
        const available = rows.map((row, i) => `${i + 1}: ${row.label} [${row.owner}]`).join("\n");
        throw new Error(
          `trayIndex ${trayIndexArg} out of range; found ${rows.length} tray item(s)
${available}`
        );
      }
      const target = rows[trayIndexArg - 1];
      try {
        target.ref.click();
      } catch {
        try {
          target.ref.actions.byName("AXPress").perform();
        } catch (err) {
          throw new Error(
            `Failed to click tray item ${trayIndexArg} (${target.label} [${target.owner}]): ${String(err)}`
          );
        }
      }
      return `${trayIndexArg}: ${target.label} [${target.owner}]`;
    }, trayIndex);
  };
}
export {
  buildTrayHandler as default
};
