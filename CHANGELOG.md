# What's new in Kara

Each version, newest first. The section of a version is also the text of its release on GitHub.

## v1.4.2 (4 November 2026)

### New
- The face editor can export its drawing. "Download PNG" saves the drawing as shown (front or profile, anatomy plate or avatar). Thanks to Anurag Dubey for this one (#23, closes #22). A right click on the drawing offers Download and Copy image, like on a generated image.
- "Export pack" in the face editor: a small form asks which drawings to export (avatar, anatomy plate, anatomy plate with guide lines), then one zip is made with a folder for each choice. A folder holds the front and side drawings (blurred, as Kara sends them to the models), three ready prompts (front face, side face, both side by side) that ask for the face only, with the image format written on top, and the same drawings sharp in a sub folder. A README explains it all. This is for using the face outside Kara, in another image tool. Image models follow such a drawing only loosely: the words of the prompt count much more.
- A "Guide lines" check box on the anatomy plate hides the dashed construction lines and the A B C marks.
- Right click on an image, then Download: Chrome and Edge now open a "Save as" window, to choose the folder and rename the file (other browsers keep the plain download).

### Changed
- In the face editor, the side view now looks to the right of the image, like every side view in Kara (its points follow). The A B C marks sit on the left of the lines, in both views.

### Under the hood
- One more automatic check, for the face-only prompts of the export pack.

## v1.4.1 (3 November 2026)

### New
- About has a "Watch the demo" button: the 74-second video plays right there, loaded from YouTube only when you click, so nothing is requested from YouTube just by opening the window. Closing the window stops the video.

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
- With the Tab key, the green focus ring in the menus is no longer cut off on one side, and follows their round corners.

### Under the hood
- The choices saved in the browser are renamed from `cd-` (Character Designer, the old name) to `kara-`. They are moved once when the page opens: nobody loses their settings. Session files exported before still import.

## v1.3.0 (1 November 2026)

### New
- Kara is an MCP server (`mcp.js`, no dependency): Claude can list the menus, set them, see the prompt and generate a character (tools `kara_menus`, `kara_status`, `kara_prompt`, `kara_apply`, `kara_generate`, `kara_result`).
- Claude can drive the open Kara window: it sets the menus and presses Generate, and the image lands in the app's history and gallery.
- Paid generations never start at once from Claude: a quote with the price comes first, then your yes. The real cost is reported for KIE and fal.
- Claude Desktop extension `Kara.mcpb`, attached to every release and offered by the MCP button in the app, with the command and settings to copy.
- Phones and tablets: icons only, one row of tools on iPad, a fixed Generate bar, menus kept inside the screen.
- Balance menu in the top bar: the provider running the model, its balance, and the others on click.
- Every menu panel starts with a green "// Name" title.

## v1.2.0 (1 November 2026)

### New
- Links to top up your credits with each provider.
- A prompt too long for the model is cut at the last full sentence that fits, and the app says so.
- The images of one click form a film strip.
- Right click on an image: download it or copy it.
- Icons for the buttons under the image, the version number in About.
- An image made with other settings than the current menus fades slightly, and Generate glows.

### Fixed
- Undo, Redo and the history of steps.

## v1.1.0 (31 October 2026)

### New
- Models window: one box per model with its price and render time, search, sort by price or time, open weights or API only, the models a provider does not have hidden unless "Show all", dollars or credits.
- New models: Qwen-Image 3 and 3 Pro, FLUX 2 Pro and Max, Krea 2 Turbo, Z-Image Base, HiDream-I1, FLUX.2 dev.
- Your own machine: install a model in one click with its size (MOSS, Qwen-Image 2.1, Z-Image Base, HiDream, FLUX 3 Klein with a Hugging Face token), pause and resume, delete to free disk space.
- Eyebrows: unibrow as a tick box, Length, Height, Spacing and Tail sliders, symmetric points in the face editor, eyebrow colour inside the Eyebrows menu.
- Preview card for shared links, new app icon, guide for contributors (CONTRIBUTING.md), tests run on every pull request.

### Fixed
- Generate glows again after a setting change, app-styled confirmation boxes, height in metres by default, the open menu kept when switching language, the models window no longer closes when a group folds.

## v1.0.0 (30 October 2026)

First public version.
- Design a character sheet from simple menus, without writing a prompt: identity, body, face (with a face editor, front and profile), hair, expression (Plutchik wheel), outfit, accessories, look and background.
- Ten sheet layouts: front, back and face, turnaround, three quarters, profile, face from three angles...
- Start from one or more images of a character, or take inspiration from them; reference images for outfit, accessories and style.
- Generate for free on your own machine with ComfyUI (Z-Image Turbo, with the face drawing as a guide through ControlNet), or with your own API key on Comfy Router, KIE, fal or Magnific.
- History with undo, gallery with favourites, session export as a single HTML file.
- English and French, a step-by-step guide for beginners, installers for Windows and macOS.
