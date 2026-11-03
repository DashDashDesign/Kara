# What's new in Kara

Each version, newest first. The section of a version is also the text of its release on GitHub. Versions before 1.4.0: see the [releases](https://github.com/DashDashDesign/Kara/releases).

## v1.4.0 (3 November 2026)

### New
- The menu column can be resized: drag the handle between the menus and the image (double-click it to go back to the usual width, or use the arrow keys). Its round button moves the menus to the right of the image, or back to the left. Both choices are remembered. Thanks to Anurag Dubey for this first contribution (#20).
- About lists the people who contributed to Kara: a small avatar each, their name on hover, their GitHub page on click.
- In the models window, only the list of models scrolls, on a slightly darker ground: the search, providers and filters stay on top and the description line at the bottom.

### Fixed
- The green title of a menu panel ("// Model") stays at the top when the panel scrolls.
- Tooltips now show inside windows such as About and Keys.
- In the bottom bar, a menu that opened a colour picker stays open, and no other menu opens on hover meanwhile.
- In About, "Send feedback" has the same size as the buttons beside it.
- The empty image window says on which side the menus are.

### Under the hood
- The choices saved in the browser are renamed from `cd-` (Character Designer, the old name) to `kara-`. They are moved once when the page opens: nobody loses their settings. Session files exported before still import.
