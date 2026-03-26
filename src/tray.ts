import "@jxa/global-type";
import { run } from "jxa-run-compat";

declare global {
  // ObjC global
  const Ref: any
}

/**
 * macOS doesn't expose an API for listing out the tray icons directly. Instead, we use the Accessibility API to "scan" through the tray icons.
 */
export default function buildTrayHandler() {
  return function tray(trayIndex: number) {
    return run((trayIndex: number) => {
      if (!Number.isInteger(trayIndex) || trayIndex < 1) {
        throw new Error("trayIndex must be an integer >= 1");
      }

      function clickAt(x, y) {
        const point = $.CGPointMake(x, y);

        const mouseDown = $.CGEventCreateMouseEvent(
          null,
          $.kCGEventLeftMouseDown,
          point,
          $.kCGMouseButtonLeft
        );

        const mouseUp = $.CGEventCreateMouseEvent(
          null,
          $.kCGEventLeftMouseUp,
          point,
          $.kCGMouseButtonLeft
        );

        $.CGEventPost($.kCGHIDEventTap, mouseDown);
        $.CGEventPost($.kCGHIDEventTap, mouseUp);
      }

      function getElementAtCoordinate(x, y) {
        const systemWide = $.AXUIElementCreateSystemWide();
        const elemRef = Ref();
        const err = $.AXUIElementCopyElementAtPosition(systemWide, x, y, elemRef);

        console.log(`AXUIElementCopyElementAtPosition error: ${err}`);
        if (err !== 0 || !elemRef[0]) return null;
        return elemRef[0];
      }

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
        return cfTypeDescription(copyAttrRaw(el, attr));
      }

      function getSize(el) {
        const raw = copyAttrRaw(el, "AXSize");
        if (!raw) return null;

        const s = cfTypeDescription(raw);
        if (!s) return null;

        let m =
          s.match(/w:\s*([-0-9.]+)\s*h:\s*([-0-9.]+)/i) ||
          s.match(/\{\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*\}/) ||
          s.match(/\{\s*\{\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*\}\s*\}/);

        if (!m) {
          return { width: null, height: null, raw: s };
        }

        return {
          width: Number(m[1]),
          height: Number(m[2]),
          raw: s,
        };
      }

      // ── find the trayIndex-th element from the right ───────────────────────────────
      const display = $.CGMainDisplayID();
      const bounds = $.CGDisplayBounds(display);

      // start slightly inside the top-right corner
      let x = bounds.origin.x + bounds.size.width - 6;
      const y = bounds.origin.y + 12; // comfortably inside the menu bar

      let el = null;
      let size = null;

      for (let i = 1; i <= trayIndex; i++) {
        el = getElementAtCoordinate(x, y);
        if (!el) {
          throw new Error(`No accessibility element found at (${x}, ${y}) while looking for tray index ${trayIndex}`);
        }

        size = getSize(el);
        if (!size || !size.width) {
          throw new Error(`Could not determine width for tray element at step ${i}`);
        }

        console.log(
          `step ${i}: x=${x}, role=${getAttr(el, "AXRole")}, desc=${getAttr(el, "AXDescription")}, width=${size.width}`
        );

        if (i < trayIndex) {
          // move left by this element's width, plus a tiny padding
          x -= Math.ceil(size.width) + 2;
        }
      }

      // ── click final element ────────────────────────────────────────────────────────
      clickAt(x, y);
      console.log(`Clicked trayIndex ${trayIndex} at ${x}, ${y}`);

      // ── dump result ────────────────────────────────────────────────────────────────
      const result = {
        role:     getAttr(el, "AXRole"),
        subrole:  getAttr(el, "AXSubrole"),
        title:    getAttr(el, "AXTitle"),
        desc:     getAttr(el, "AXDescription"),
        value:    getAttr(el, "AXValue"),
        label:    getAttr(el, "AXLabel"),
        help:     getAttr(el, "AXHelp"),
        width:    size ? size.width : null,
        height:   size ? size.height : null,
        axSize:   size ? size.raw : null,
      };

      console.log(JSON.stringify(result, null, 2));
    }, trayIndex);
  };
}