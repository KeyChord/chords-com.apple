# Creating a Chord Package

A chord package is simply a folder that consists of a top-level `chords/` directory.

## `chords/`

All chord definition files (written in TOML) are expected to be nested inside a top-level `chords/` folder.

The path to the chord definition file should correspond to the bundle identifier of the app it targets (often in reverse DNS format, e.g. `com.apple.finder`), or live at the root for global commands.

The name of the TOML file should be either `macos.toml`, `windows.toml`, or `linux.toml` depending on the platform it's targeting.

> Currently, only `macos.toml` is supported.

## JavaScript Modules

Although you could write all your JavaScript code inline in the `config.js.module` property in your chord TOML files, it's recommended to extract logic outside into dedicated `.js` files for a better editor experience.

These JavaScript files are allowed to be anywhere in the `chords/` package (since they're imported directly via `import` statements), but it's recommended to put them inside a root-level `src/` folder.

For best results, it's recommended to use a build script that bundles all dependencies into a single file (conventionally into a `dist/` folder) using a tool like  `esbuild` so your chord scripts will work without `node_modules`.

### Recommended Setup

We recommend using [pnpm] as your JavaScript package manager because it supports specifying a GitHub repo's subdirectory as a dependency, which is necessary since `LLRT` doesn't yet provide an npm package for its types:

```jsonc
// package.json
{
  "devDependencies": {
    "llrt-types": "github:awslabs/llrt#path:/types",
    // ...
  },
}
```

For the best editor experience, we recommend creating a `tsconfig.json` with the `types` property set to `llrt-types` (even if you're writing your scripts in pure JavaScript):

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "types": ["llrt-types"],
    // ...
  },
}
```

### The `chord` module

The built-in `chord` module also exposes:

```ts
export function setAppNeedsRelaunch(bundleId: string, needsRelaunch: boolean): void;
```

This marks or clears an app in the settings UI and gives the user a one-click relaunch button.

### Recommended Third-Party Packages

Unfortunately, the LLRT runtime isn't 100% Node.js compatible, so some common npm packages won't work out of the box. Here are some curated ones that are known to work well:

- [nano-spawn-compat](https://github.com/leonsilicon/nano-spawn-compat) - A more ergonomic `child_process.spawn` that works in LLRT (whose `child_process` module only provides `spawn`).
- [bplist-lossless](https://github.com/leonsilicon/bplist-lossless) - A binary plist parser specifically tailored for edits by avoiding loss of precision during parsing and re-serialization.
- [doctor-json](https://github.com/privatenumber/doctor-json) - A JSON editor that preserves all existing formatting/comments
- [keycode-ts2](https://github.com/leonsilicon/keycode-ts2) - A TypeScript port of the [Rust `keycode` crate](https://crates.io/crates/keycode) which uses the Chromium keycode names as the source of truth (_Chord_ uses these keycode names as the source of truth).
