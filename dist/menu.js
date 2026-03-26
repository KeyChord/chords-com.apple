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
function buildMenuHandler(_meta) {
  return function menu(menuIndex) {
    return (0, import_jxa_run_compat.run)((menuIndex2) => {
      const log = (...args) => {
        console.log("[JXA]", ...args);
      };
      const assertExists = (obj, label) => {
        if (!obj) throw new Error(`Failed at: ${label}`);
        log("OK:", label);
        return obj;
      };
      if (!Number.isInteger(menuIndex2) || menuIndex2 < 0) {
        throw new Error(`Expected menuIndex to be a non-negative integer, got: ${menuIndex2}`);
      }
      const se = Application("System Events");
      const proc = assertExists(
        se.processes.whose({ frontmost: true })[0],
        "frontmost process"
      );
      log("Frontmost process:", proc.name());
      const menuBar = assertExists(proc.menuBars[0], "menuBars[0]");
      const items = menuBar.menuBarItems();
      if (menuIndex2 >= items.length) {
        throw new Error(
          `menuIndex ${menuIndex2} out of range; found ${items.length} menu bar items (valid range: 0-${items.length - 1})`
        );
      }
      const item = assertExists(items[menuIndex2], `menuBarItems[${menuIndex2}]`);
      if (menuIndex2 === 0) {
        log("Clicking Apple menu");
      } else {
        try {
          log(`Clicking menu ${menuIndex2}: "${item.name()}"`);
        } catch {
          log(`Clicking menu ${menuIndex2}`);
        }
      }
      item.click();
      log("Done");
    }, menuIndex);
  };
}
export {
  buildMenuHandler as default
};
