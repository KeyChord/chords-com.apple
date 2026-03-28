# Creating a Chord Package

A chord package is simply a folder that consists of a top-level `chords/` directory.

## `chords/`

All chord definition files (written in TOML) are expected to be nested inside a top-level `chords/` folder.

The path to the chord definition file should correspond to the bundle identifier of the app it targets (often in reverse DNS format, e.g. `com.apple.finder`), or live at the root for global commands.

The name of the TOML file should be either `macos.toml`, `windows.toml`, or `linux.toml` depending on the platform it's targeting.

> Currently, only `macos.toml` is supported.

### The `chord` module

The built-in `chord` module also exposes:

```ts
export function setAppNeedsRelaunch(bundleId: string, needsRelaunch: boolean): void;
```

This marks or clears an app in the settings UI and gives the user a one-click relaunch button.
