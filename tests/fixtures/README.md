# Page fixtures

`pages/property-edit.html` is a sanitized UTF-8 fixture extracted from a real
`objectedit.php` capture. It keeps the description, money-management, and shop
special-settings forms used by the extension.

The capture was sanitized by removing scripts, unrelated page sections,
extension-generated controls, identifying object data, and volatile lock
tokens. Form actions were normalized to the path returned by the live DOM.

When refreshing a fixture, review the HTML diff before replacing it, update
`capturedAt` in `pages.json`, and run `npm test`. Never commit authentication
tokens, cookies, private messages, or other player-specific content.
