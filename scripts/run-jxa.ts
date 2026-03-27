#!/usr/bin/env bun
import * as jxa from '../src/jxa/_.ts'
import { runJxaWithUtils } from '../src/utils/jxa.ts'

await runJxaWithUtils(jxa, () => {
  ObjC.import('Cocoa');
  const system = $.AXUIElementCreateSystemWide();
  jxa.dump(system);
})
