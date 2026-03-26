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
      const log = (...args) => {
        console.log("[JXA]", ...args);
      };
      const assertExists = (obj, label) => {
        if (!obj) throw new Error(`Failed at: ${label}`);
        log("OK:", label);
        return obj;
      };
      const getItems = (menuBar2) => {
        if (!menuBar2) return [];
        try {
          return menuBar2.menuBarItems();
        } catch {
          return [];
        }
      };
      const getLabel = (item2) => {
        try {
          const name = item2.name();
          if (name) return name;
        } catch {
        }
        try {
          const desc = item2.description();
          if (desc) return desc;
        } catch {
        }
        return "<unnamed>";
      };
      if (!Number.isInteger(trayIndexArg) || trayIndexArg < 1) {
        throw new Error(`Expected trayIndex to be a positive integer, got: ${trayIndexArg}`);
      }
      const se = Application("System Events");
      const proc = assertExists(se.processes.byName("SystemUIServer"), 'process "SystemUIServer"');
      const candidateBars = [proc.menuBars[0], proc.menuBars[1]];
      let menuBar = null;
      let items = [];
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
export {
  buildTrayHandler as default
};
