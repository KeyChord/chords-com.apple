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
function buildTrayHandler() {
  return function tray(trayIndex, clickType = "left") {
    return (0, import_jxa_run_compat.run)((trayIndex2, clickType2) => {
      ObjC.import("ApplicationServices");
      ObjC.import("CoreGraphics");
      const RE_SIZE_NAMED = /w:\s*([-0-9.]+)\s*h:\s*([-0-9.]+)/i;
      const RE_POINT_NAMED = /x:\s*([-0-9.]+)\s*y:\s*([-0-9.]+)/i;
      const RE_BRACED_PAIR = /\{\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*\}/;
      const RE_DOUBLE_BRACED_PAIR = /\{\s*\{\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*\}\s*\}/;
      function copyAttrRaw(el, attr) {
        const ref = Ref();
        const err = $.AXUIElementCopyAttributeValue(el, $(attr), ref);
        if (err !== 0 || !ref[0]) return null;
        return ref[0];
      }
      function cfTypeDescription(value) {
        if (!value) return null;
        try {
          return ObjC.unwrap(ObjC.castRefToObject(value).description);
        } catch (e) {
          try {
            return String(value);
          } catch (e2) {
            return null;
          }
        }
      }
      function getAttr(el, attr) {
        const raw = copyAttrRaw(el, attr);
        return cfTypeDescription(raw);
      }
      function parsePair(s, namedRegexp) {
        let m = s.match(namedRegexp) || s.match(RE_BRACED_PAIR) || s.match(RE_DOUBLE_BRACED_PAIR);
        if (!m) return null;
        return [Number(m[1]), Number(m[2])];
      }
      function getWidth(el) {
        const raw = copyAttrRaw(el, "AXSize");
        if (!raw) return null;
        const s = cfTypeDescription(raw);
        if (!s) return null;
        const pair = parsePair(s, RE_SIZE_NAMED);
        if (!pair) return null;
        return pair[0];
      }
      function getX(el) {
        const raw = copyAttrRaw(el, "AXPosition");
        if (!raw) return null;
        const s = cfTypeDescription(raw);
        if (!s) return null;
        const pair = parsePair(s, RE_POINT_NAMED);
        if (!pair) return null;
        return pair[0];
      }
      const display = $.CGMainDisplayID();
      const bounds = $.CGDisplayBounds(display);
      function getElementAtCoordinate(x2, y2) {
        const systemWide = $.AXUIElementCreateSystemWide();
        const elemRef = Ref();
        const axErr = $.AXUIElementCopyElementAtPosition(systemWide, x2, y2, elemRef);
        if (axErr !== 0) {
          return null;
        }
        const el = elemRef[0];
        if (!el) {
          return null;
        }
        return el;
      }
      function isMenuBar(el) {
        return el && getAttr(el, "AXRole") === "AXMenuBar";
      }
      const minX = bounds.origin.x;
      const maxX = bounds.origin.x + bounds.size.width;
      const centerX = bounds.origin.x + bounds.size.width / 2;
      const y = bounds.origin.y + 20;
      const INCREMENT = 10;
      const direction = trayIndex2 < 0 ? -1 : 1;
      const steps = trayIndex2 < 0 ? Math.abs(trayIndex2) - 1 : trayIndex2;
      function findStartElementFromLeft() {
        let x2 = centerX;
        for (let b = bounds.size.width / 4; b >= 1; b /= 2) {
          while (isMenuBar(getElementAtCoordinate(x2 + b, y))) x2 += b;
        }
        x2 = x2 + 1;
        const el = getElementAtCoordinate(x2, y);
        if (!el || isMenuBar(el)) return null;
        const elX = getX(el);
        if (elX === null) return null;
        return { el, x: elX };
      }
      function findStartElementFromRight() {
        let x2 = maxX - INCREMENT;
        while (x2 >= minX) {
          const el = getElementAtCoordinate(x2, y);
          if (el !== null && !isMenuBar(el)) {
            const elX = getX(el);
            if (elX !== null) {
              return { el, x: elX };
            }
          }
          x2 -= INCREMENT;
        }
        return null;
      }
      const start = direction === 1 ? findStartElementFromLeft() : findStartElementFromRight();
      if (!start) {
        console.log(`Could not find starting tray item for trayIndex ${trayIndex2}`);
        return;
      }
      let currentEl = start.el;
      let currentElX = start.x;
      let x = currentElX;
      for (let i = 0; i < steps; i++) {
        while (true) {
          x += direction * INCREMENT;
          if (x > maxX || x < minX) {
            console.log(
              `Reached end of menu bar while looking for tray index ${trayIndex2} (tried up to x=${x})`
            );
            return;
          }
          const newEl = getElementAtCoordinate(x, y);
          if (newEl === null || isMenuBar(newEl)) {
            continue;
          }
          const newElX = getX(newEl);
          if (newElX === null) {
            continue;
          }
          if (newElX !== currentElX) {
            currentEl = newEl;
            currentElX = newElX;
            break;
          }
        }
      }
      function clickAt(x2, y2) {
        const point = $.CGPointMake(x2, y2);
        const mouseDown = $.CGEventCreateMouseEvent(
          null,
          $.kCGEventLeftMouseDown,
          point,
          clickType2 === "left" ? $.kCGMouseButtonLeft : $.kCGMouseButtonRight
        );
        const mouseUp = $.CGEventCreateMouseEvent(
          null,
          $.kCGEventLeftMouseUp,
          point,
          clickType2 === "left" ? $.kCGMouseButtonLeft : $.kCGMouseButtonRight
        );
        $.CGEventPost($.kCGHIDEventTap, mouseDown);
        $.CGEventPost($.kCGHIDEventTap, mouseUp);
      }
      const width = getWidth(currentEl);
      if (width === null) {
        console.log(`Could not determine width for tray index ${trayIndex2}`);
        return;
      }
      clickAt(currentElX + width / 2, y);
    }, trayIndex, clickType);
  };
}
export {
  buildTrayHandler as default
};
