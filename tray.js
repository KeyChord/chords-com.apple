ObjC.import('ApplicationServices');
ObjC.import('CoreGraphics');

// ── Helpers ──────────────────────────────────────────────────────────────────
function getAttrRaw(el, attr) {
  // @ts-expect-error: ObjC global
  const ref = Ref();
  const err = $.AXUIElementCopyAttributeValue(el, $(attr), ref);
  if (err !== 0) return null;
  return ref[0];
}

function cfToString(ref) {
  if (!ref) return null;
  try {
    const obj = ObjC.castRefToObject(ref);
    if (obj.isKindOfClass($.NSString)) return obj.js;
    return obj.description.js;
  } catch (e) {
    return null;
  }
}

// Safely extract structs by parsing their CoreFoundation string description
// This bypasses standard JXA memory crashes associated with $.AXValueGetValue
function getAXSize(el) {
  const valRef = getAttrRaw(el, 'AXSize');
  if (!valRef) return null;
  const desc = cfToString($.CFCopyDescription(valRef));
  if (!desc) return null;

  const match = desc.match(/w[:=]\s*([\d.-]+).*?h[:=]\s*([\d.-]+)/);
  if (match) return { w: parseFloat(match[1]), h: parseFloat(match[2]) };
  return null;
}

function getAXPosition(el) {
  const valRef = getAttrRaw(el, 'AXPosition');
  if (!valRef) return null;
  const desc = cfToString($.CFCopyDescription(valRef));
  if (!desc) return null;

  const match = desc.match(/x[:=]\s*([\d.-]+).*?y[:=]\s*([\d.-]+)/);
  if (match) return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
  return null;
}

// ── Configuration ────────────────────────────────────────────────────────────
const TARGET_INDEX = 2; // Hardcoded index to click (0 is rightmost)

const systemWide = $.AXUIElementCreateSystemWide();
const bounds = $.CGDisplayBounds($.CGMainDisplayID());
const screenWidth = bounds.size.width;
const y = 12; // Safe Y-coordinate for the menu bar

let currentX = screenWidth - 2;
let foundCount = -1;
let lastEl = null;

// ── Leapfrog Scan & Click ────────────────────────────────────────────────────
console.log(`Starting exact-boundary scan right-to-left...`);

while (currentX > screenWidth * 0.3) {
  // @ts-expect-error: ObjC global
  const elemRef = Ref();

  if ($.AXUIElementCopyElementAtPosition(systemWide, currentX, y, elemRef) === 0 && elemRef[0]) {
    const el = elemRef[0];

    // If we hit the same element, retrieve its left boundary and step past it
    if (lastEl && $.CFEqual(lastEl, el)) {
      const pos = getAXPosition(el);
      currentX = pos ? pos.x - 1 : currentX - 4;
      continue;
    }

    // New element detected! Check its role.
    // @ts-expect-error: ObjC global
    const roleRef = Ref();
    if ($.AXUIElementCopyAttributeValue(el, $('AXRole'), roleRef) === 0 && roleRef[0]) {
      const role = ObjC.castRefToObject(roleRef[0]).js;

      if (role === 'AXMenuBarItem' || role === 'AXMenuExtra' || role === 'AXStatusItem' || role === 'AXButton') {
        foundCount++;
        lastEl = el;

        const pos = getAXPosition(el);
        const size = getAXSize(el);

        if (!pos || !size) {
            console.log(`Warning: Found icon [${foundCount}] but couldn't parse bounds. Sweeping. `);
            currentX -= 4;
            continue;
        }

        // SHORT CIRCUIT: Target hit
        if (foundCount === TARGET_INDEX) {
          // Calculate the exact center of the icon to ensure a reliable click
          const clickX = pos.x + (size.w / 2);
          const clickY = pos.y + (size.h / 2);
          const loc = $.CGPointMake(clickX, clickY);

          const mouseDown = $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseDown, loc, $.kCGMouseButtonLeft);
          const mouseUp   = $.CGEventCreateMouseEvent(null, $.kCGEventLeftMouseUp,   loc, $.kCGMouseButtonLeft);

          $.CGEventPost($.kCGHIDEventTap, mouseDown);
          $.CGEventPost($.kCGHIDEventTap, mouseUp);

          console.log(`Success: Clicked icon [${TARGET_INDEX}] precisely at center (${clickX}, ${clickY})`);
          $.exit(0);
        }

        // EXACT LEAPFROG:
        // AXPosition.x is the absolute left boundary of the current icon.
        // We move exactly 1 pixel past its left edge to guarantee we land on the next icon.
        currentX = pos.x - 1;
        continue;
      }
    }
  }

  // Fallback: If we hit a blank space between groups, creep left until we hit an icon
  currentX -= 4;
}

console.log(`Failed: Requested index ${TARGET_INDEX}, but only found ${foundCount + 1} icons.`);
$.exit(1);