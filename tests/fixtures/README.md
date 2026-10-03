# Page fixtures

`pages/ops.html` retains the available-operations heading, layout styles, and
operation cards from the supplied `/ops.php` capture for the quest-set shortcut.
Scripts, surrounding account content, and player progress have been removed.

`pages/property-edit.html` is a sanitized UTF-8 fixture extracted from a real
`objectedit.php` capture. It keeps the description, money-management, and shop
special-settings forms used by the extension.

`pages/storage.html` retains the private-house heading and complete resource
withdrawal table from the supplied `object.php` capture. Owner details and
extension controls are removed, and the object id is replaced with a placeholder.

The capture was sanitized by removing scripts, unrelated page sections,
extension-generated controls, identifying object data, and volatile lock
tokens. Form actions were normalized to the path returned by the live DOM.

When refreshing a fixture, review the HTML diff before replacing it, update
`capturedAt` in `pages.json`, and run `npm test`. Never commit authentication
tokens, cookies, private messages, or other player-specific content.
