import { run } from 'jxa-run-compat';
type MenuHandler = {
    /**
     * 1-based, to match the chord rule:
     * 1 => first menu, 2 => second menu, etc.
     */
    menuByIndex(menuIndex: number): ReturnType<typeof run>;
    /**
     * Lowercase-only query language:
     *
     * Top-level menus:
     * - "h"   => 1st menu starting with "h"
     * - "hh"  => 2nd menu starting with "h"
     * - "hhh" => 3rd menu starting with "h"
     *
     * Expanded menu items:
     * - "z"     => 1st expanded menu item starting with "z"
     * - "zo"    => 1st expanded menu item starting with "zo"
     * - "z2"    => 2nd expanded menu item starting with "z"
     * - "z-o"   => 1st expanded menu item matching word-prefixes "z" + "o"
     * - "z-o2"  => 2nd expanded menu item matching word-prefixes "z" + "o"
     */
    menuByLetters(query: string): ReturnType<typeof run>;
};
export default function buildMenuHandler(): MenuHandler;
export {};
