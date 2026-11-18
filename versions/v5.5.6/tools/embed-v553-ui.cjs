// Keep catalogue HTML exports self-contained while retaining editable UI sources.
// Usage: node devtools/embed-v553-ui.cjs [release-directory]
const fs = require('node:fs');
const path = require('node:path');
const dir = path.resolve(process.argv[2] || path.join(__dirname, '../versions/v5.5.3'));
const terminal = path.join(dir, 'terminal.html');
let html = fs.readFileSync(terminal, 'utf8');
const css = fs.readFileSync(path.join(dir, 'terminal-ui.css'), 'utf8');
const js = fs.readFileSync(path.join(dir, 'terminal-ui.js'), 'utf8');
if (/<\/script/i.test(js) || /<\/style/i.test(css)) throw new Error('Unexpected HTML closing tag in UI source');
const style = '<style id="forge-ui-553">\n' + css.trim() + '\n</style>';
const script = '<script id="forge-ui-553-script">\n' + js.trim() + '\n</script>';
const styleAnchor = /<style id="forge-ui-553">[\s\S]*?<\/style>|<link rel="stylesheet" href="terminal-ui\.css\?v=553">/;
const scriptAnchor = /<script id="forge-ui-553-script">[\s\S]*?<\/script>|<script src="terminal-ui\.js\?v=553"><\/script>/;
if (!styleAnchor.test(html) || !scriptAnchor.test(html)) throw new Error('Terminal UI anchors missing');
html = html.replace(styleAnchor, () => style).replace(scriptAnchor, () => script);
fs.writeFileSync(terminal, html);
console.log('Embedded FORGE-OS 5.5.3 UI sources');
