import "@jxa/global-type";
import { run } from "jxa-run-compat";

declare global {
  // ObjC global
  const Ref: any
}

export default function buildTrayHandler(_meta: ImportMeta) {
  return function tray(trayIndex: number) {
    return run((trayIndexArg: number) => {
      ObjC.import('ApplicationServices');
      ObjC.import('CoreGraphics');

      function getAttrRaw(el, attr) {
        const ref = Ref();
        const err = $.AXUIElementCopyAttributeValue(el, $(attr), ref);
        if (err !== 0) return null;
        return ref[0];
      }

      function cfToString(ref) {
        if (!ref) return null;
        try {
          const obj = ObjC.castRefToObject(ref);
          // NSString
          if (obj.isKindOfClass($.NSString)) return obj.js;
          // NSNumber, NSURL, etc — fall back to description
          return obj.description.js;
        } catch (e) {
          return null;
        }
      }

      function getAttr(el, attr) {
        return cfToString(getAttrRaw(el, attr));
      }

      // ── cursor position ──────────────────────────────────────────────────────────
      const event = $.CGEventCreate(null);
      const loc   = $.CGEventGetLocation(event);
      console.log(`Cursor: ${loc.x}, ${loc.y}`);

      // top-right of the main display
      const display = $.CGMainDisplayID();
      const bounds = $.CGDisplayBounds(display);

      function getElementAtCoordinate(x, y) {
        const systemWide = $.AXUIElementCreateSystemWide();
        const elemRef = Ref();
        const axErr = $.AXUIElementCopyElementAtPosition(systemWide, x, y, elemRef);

        console.log(`AXUIElementCopyElementAtPosition error: ${axErr}`);
        // 0  = success
        // -25211 = kAXErrorAPIDisabled  → need Accessibility permission
        // -25212 = kAXErrorNotImplemented
        // -25200 = kAXErrorInvalidUIElement

        if (axErr !== 0) {
          console.log('No element — check Accessibility + Screen Recording in System Settings > Privacy & Security');
          $.exit(1);
        }

        let el = elemRef[0];
        if (!el) {
          console.log('elemRef[0] is null');
          $.exit(1);
        }

        // ── walk up until we get something with a role ───────────────────────────────
        for (let i = 0; i < 10; i++) {
          const role = getAttr(el, 'AXRole');
          if (role) break;

          const parentRef = Ref();
          const err = $.AXUIElementCopyAttributeValue(el, $('AXParent'), parentRef);
          if (err !== 0 || !parentRef[0]) break;
          el = parentRef[0];
        }

        return el;
      }

      const x = bounds.origin.x + bounds.size.width - 10;
      const y = bounds.origin.y + 10;
      const el = getElementAtCoordinate(x, y);
      // ── click the element ────────────────────────────────────────────────────────
      const mouseDown = $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseDown, loc, $.kCGMouseButtonLeft);
      const mouseUp   = $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseUp,   loc, $.kCGMouseButtonLeft);
      $.CGEventPost($.kCGHIDEventTap, mouseDown);
      $.CGEventPost($.kCGHIDEventTap, mouseUp);
      console.log(`Clicked at ${loc.x}, ${loc.y}`);

      // ── dump result ──────────────────────────────────────────────────────────────
      const result = {
        role:     getAttr(el, 'AXRole'),
        subrole:  getAttr(el, 'AXSubrole'),
        title:    getAttr(el, 'AXTitle'),
        desc:     getAttr(el, 'AXDescription'),
        value:    getAttr(el, 'AXValue'),
        label:    getAttr(el, 'AXLabel'),
        help:     getAttr(el, 'AXHelp'),
      };

      console.log(JSON.stringify(result, null, 2));
    }, trayIndex);
  };
}