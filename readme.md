# Chord's Default Chords

These are the default chords that come bundled with Chord. In addition to system-wide macOS chords, they also contain chords for the following pre-installed macOS apps:

- [Finder](./chords/com/apple/finder/macos.toml) (`com.apple.finder`)
- [Safari](./chords/com/apple/safari/macos.toml) (`com.apple.safari`)
- [Terminal](./chords/com/apple/Terminal/macos.toml) (`com.apple.Terminal`)
- [Activity Monitor](./chords/com/apple/ActivityMonitor/macos.toml) (`com.apple.ActivityMonitor`)

You can re-define these defaults in _Chord_ by simply adding a Chord Package with a new definition for one of these sequences (e.g. if you don't use Safari which is defined as `/b` in these defaults, you can simply a new chord to `/b` and it will be used instead.

You can also use this Chord Package as a template for creating your own chords. See [development.md](./development.md) for detailed instructions. When defining your own chords, it's recommended to follow the conventions below.

## Default Global Keys

In the default chord package, these are the categories assigned to the global chords (which must start with a non-alphanumeric character). If you want to define your own custom global chord which doesn't fit into any of the following categories, it's recommended to use one of the remaining symbols (`` ` ``, `]`, `;`, `'`).

`,` Universal Commands (`,<key>` maps to `cmd+<key>`)\
`\` System Shortcuts\
`/` Global Shortcuts / Applications\
`-` Menu Bar\
`=` Tray\
`.` Dock\
`[` Window Management

## Directions

`l` Left\
`r` Right\
`u` Up\
`d` Down

`n` North / New\
`e` East / End\
`s` South / Start\
`w` West / Forward

> We typically assign the cardinal directions to distinguish between actions with a "move" equivalent. For example, "move pane left" would typically be assigned `pl` (pane left) while "focus pane left" would be assigned `pw` (pane west).

`t` Top\
`m` Middle\
`c` Center\
`b` Bottom

`f` Front\
`k` Back

`[` Previous\
`]` Next

`g` Go to\
`q` Quit (instead of `c` for close, reduces conflicts)\
`,` Settings
