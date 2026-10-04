const fs = require('fs');

let content = fs.readFileSync('src/components/AssetLogo.tsx', 'utf8');

const regex = /\n\s*\/\/\s*Casino \(CAS\)\n\s*if\s*\(s === 'CAS' \|\| n\.includes\('casino'\)\)\s*\{\n\s*return \(\n\s*<PremiumBadge size=\{size\} className=\{className\} gradientFrom="#F59E0B" gradientTo="#B45309">\n\s*<span className="text-\[13px\]">🎰<\/span>\n\s*<\/PremiumBadge>\n\s*\);\n\s*\}/;

content = content.replace(regex, '');

fs.writeFileSync('src/components/AssetLogo.tsx', content);
console.log("Casino logo removed!");
