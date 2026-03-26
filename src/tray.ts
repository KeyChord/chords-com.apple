import "@jxa/global-type";
import { run } from "jxa-run-compat";

export default function buildTrayHandler(_meta: ImportMeta) {
  return function tray(trayIndex: number) {
    return run((trayIndexArg: number) => {
      const normalize = (s: string) =>
        String(s)
          .replace(/[\u200B-\u200F\uFEFF\u202A-\u202E]/g, "")
          .trim();

      const normKey = (s: string) =>
        normalize(s).toLowerCase().replace(/[^a-z0-9]+/g, "");

      const getLabel = (item: any) => {
        try {
          const desc = item.description();
          if (desc) return normalize(desc);
        } catch {}

        try {
          const title = item.title();
          if (title) return normalize(title);
        } catch {}

        try {
          const name = item.name();
          if (name) return normalize(name);
        } catch {}

        return "status menu";
      };

      const getPosition = (item: any) => {
        try {
          const p = item.position();
          if (p && p.length >= 2) {
            return { x: Number(p[0]), y: Number(p[1]) };
          }
        } catch {}

        try {
          const p = item.attributes.byName("AXPosition").value();
          if (p && p.length >= 2) {
            return { x: Number(p[0]), y: Number(p[1]) };
          }
        } catch {}

        return { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY };
      };

      const genericMenuLabels = new Set([
        "apple",
        "file",
        "edit",
        "view",
        "window",
        "help",
        "format",
      ]);

      if (!Number.isInteger(trayIndexArg) || trayIndexArg < 1) {
        throw new Error(
          `Expected trayIndex to be a positive integer, got: ${trayIndexArg}`,
        );
      }

      const se = Application("System Events");
      const rows: Array<{
        ref: any;
        owner: string;
        barIndex: number;
        itemIndex: number;
        label: string;
        x: number;
        y: number;
      }> = [];
      const seen: Record<string, true> = Object.create(null);

      const addFromBar = (
        proc: any,
        procName: string,
        barIndex: number,
        include: (label: string) => boolean,
      ) => {
        let items: any[];

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
            normKey(label),
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
            y: pos.y,
          });
        }
      };

      // Fast path: real app-owned tray icons are usually on menu bar 2.
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

      // Built-in system extras often sit on menu bar 1 of special hosts.
      const specialHosts = ["Control Center", "ControlCenter", "SystemUIServer"];
      for (let i = 0; i < specialHosts.length; i++) {
        const name = specialHosts[i];

        let proc: any;
        try {
          proc = se.processes.byName(name);
          proc.name(); // force resolution
        } catch {
          continue;
        }

        addFromBar(proc, name, 1, (label: string) => {
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

      // Visual order when AXPosition is available.
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
        const available = rows
          .map((row, i) => `${i + 1}: ${row.label} [${row.owner}]`)
          .join("\n");

        throw new Error(
          `trayIndex ${trayIndexArg} out of range; found ${rows.length} tray item(s)\n${available}`,
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
            `Failed to click tray item ${trayIndexArg} (${target.label} [${target.owner}]): ${String(err)}`,
          );
        }
      }

      return `${trayIndexArg}: ${target.label} [${target.owner}]`;
    }, trayIndex);
  };
}