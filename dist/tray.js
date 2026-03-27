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

// src/tray.ts
function buildTrayHandler() {
  return function tray(trayIndex, clickType = "left") {
    return run((trayIndex2, clickType2) => {
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
      function clickAt(x2, y2, clickType3 = "left") {
        const point = $.CGPointMake(x2, y2);
        const isLeft = clickType3 === "left";
        const button = isLeft ? $.kCGMouseButtonLeft : $.kCGMouseButtonRight;
        const downType = isLeft ? $.kCGEventLeftMouseDown : $.kCGEventRightMouseDown;
        const upType = isLeft ? $.kCGEventLeftMouseUp : $.kCGEventRightMouseUp;
        $.CGWarpMouseCursorPosition(point);
        delay(0.02);
        const move = $.CGEventCreateMouseEvent(
          null,
          $.kCGEventMouseMoved,
          point,
          button
        );
        $.CGEventPost($.kCGHIDEventTap, move);
        delay(0.03);
        const down = $.CGEventCreateMouseEvent(
          null,
          downType,
          point,
          button
        );
        const up = $.CGEventCreateMouseEvent(
          null,
          upType,
          point,
          button
        );
        $.CGEventPost($.kCGHIDEventTap, down);
        delay(0.06);
        $.CGEventPost($.kCGHIDEventTap, up);
      }
      function copyActionNames(el) {
        const ref = Ref();
        const err = $.AXUIElementCopyActionNames(el, ref);
        if (err !== 0 || !ref[0]) return [];
        const arr = ref[0];
        const count = $.CFArrayGetCount(arr);
        const out = [];
        for (let i = 0; i < count; i++) {
          const raw = $.CFArrayGetValueAtIndex(arr, i);
          try {
            out.push(ObjC.unwrap(ObjC.castRefToObject(raw)));
          } catch (e) {
            try {
              out.push(String(raw));
            } catch (e2) {
            }
          }
        }
        return out;
      }
      function hasAction(el, actionName) {
        return copyActionNames(el).some((a) => a === actionName);
      }
      function performPress(el) {
        return $.AXUIElementPerformAction(el, $("AXPress"));
      }
      function activateTrayElement(el, elX, y2, clickType3) {
        if (clickType3 === "left" && hasAction(el, "AXPress")) {
          const pressErr = performPress(el);
          console.log("AXPress:", pressErr);
          if (pressErr === 0) {
            return;
          }
          console.log("AXPress failed, falling back to cursor click");
        } else if (clickType3 === "left") {
          console.log("AXPress not available, falling back to cursor click");
        } else {
          console.log("Right click requested, using cursor click");
        }
        const width = getWidth(el);
        if (width === null) {
          console.log(`Could not determine width for fallback click at x=${elX}`);
          return;
        }
        clickAt(elX + width / 2, y2, clickType3);
      }
      activateTrayElement(currentEl, currentElX, y, clickType2);
    }, trayIndex, clickType);
  };
}
export {
  buildTrayHandler as default
};
