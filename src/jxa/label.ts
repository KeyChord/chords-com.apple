
export function cfDescription(v) {
  try {
    const s = $.CFCopyDescription(v);
    return s ? ObjC.unwrap(s) : String(v);
  } catch (_) {
    try {
      return String(v);
    } catch (_) {
      return '<unprintable>';
    }
  }
}

export function copyAttrRaw(el, attr) {
  const out = Ref();
  const err = $.AXUIElementCopyAttributeValue(el, $(attr), out);
  if (err !== 0 || !out[0]) return null;
  return out[0];
}

export function copyAttrNames(el) {
  const out = Ref();
  const err = $.AXUIElementCopyAttributeNames(el, out);
  if (err !== 0 || !out[0]) return [];
  return normalizeCF(out[0]);
}

export function normalizeCF(v) {
  if (v == null) return null;

  let typeId;
  try {
    typeId = $.CFGetTypeID(v);
  } catch (_) {
    try {
      return ObjC.unwrap(v);
    } catch (_) {
      return cfDescription(v);
    }
  }

  // Keep AXUIElementRef opaque/raw. Do not unwrap it.
  if (typeId === $.AXUIElementGetTypeID()) {
    return v;
  }

  // Walk CFArray manually so AX children stay as raw AXUIElementRefs.
  if (typeId === $.CFArrayGetTypeID()) {
    const n = $.CFArrayGetCount(v);
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push(normalizeCF($.CFArrayGetValueAtIndex(v, i)));
    }
    return arr;
  }

  // AXValueRef, CGPoint/CGSize/etc. — easiest safe fallback is description.
  if (typeId === $.AXValueGetTypeID()) {
    return cfDescription(v);
  }

  // Strings, numbers, booleans, dictionaries, etc.
  try {
    return ObjC.unwrap(v);
  } catch (_) {
    try {
      return ObjC.unwrap(ObjC.castRefToObject(v));
    } catch (_) {
      return cfDescription(v);
    }
  }
}

export function getAttr(el, attr) {
  return normalizeCF(copyAttrRaw(el, attr));
}

export function oneLine(x) {
  return String(x).replace(/\s+/g, ' ').trim();
}

export function summarizeElement(el, isRoot = false) {
  const role = getAttr(el, 'AXRole');
  const subrole = getAttr(el, 'AXSubrole');
  const title = getAttr(el, 'AXTitle');
  const desc = getAttr(el, 'AXDescription');
  const value = getAttr(el, 'AXValue');

  const parts = [];
  parts.push(isRoot ? 'AXSystemWide' : (role || 'AXUIElement'));

  if (subrole) parts.push(`subrole=${JSON.stringify(oneLine(subrole))}`);
  if (title) parts.push(`title=${JSON.stringify(oneLine(title))}`);
  if (desc && desc !== title) parts.push(`desc=${JSON.stringify(oneLine(desc))}`);

  if (
    value != null &&
    typeof value !== 'object' &&
    String(value) !== String(title)
  ) {
    parts.push(`value=${JSON.stringify(oneLine(value))}`);
  }

  return parts.join(' ');
}

export function dump(el, depth = 0, maxDepth = 3) {
  if (!el || depth > maxDepth) return;

  const indent = '  '.repeat(depth);
  console.log(indent + summarizeElement(el, depth === 0));

  const children = getAttr(el, 'AXChildren');
  if (!Array.isArray(children) || children.length === 0) return;

  for (const child of children) {
    dump(child, depth + 1, maxDepth);
  }
}

export function dumpWithAttrs(el, depth = 0, maxDepth = 2) {
  if (!el || depth > maxDepth) return;

  const indent = '  '.repeat(depth);
  const attrs = copyAttrNames(el);
  console.log(indent + summarizeElement(el, depth === 0));
  console.log(indent + 'attrs=' + JSON.stringify(attrs));

  const children = getAttr(el, 'AXChildren');
  if (!Array.isArray(children) || children.length === 0) return;

  for (const child of children) {
    dumpWithAttrs(child, depth + 1, maxDepth);
  }
}