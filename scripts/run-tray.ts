import buildTrayHandler from "../src/tray.js";

const tray = buildTrayHandler(import.meta);
tray(1)