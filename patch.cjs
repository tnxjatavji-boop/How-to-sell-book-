const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `app.get("/healthz", (req, res) => {\n  res.status(200).send("OK");\n});`;
const replacement = target + `\n\napp.get("/download-html", (req, res) => {\n  const file = path.join(process.cwd(), "public", "TradeXora_Full_App.html");\n  if (fs.existsSync(file)) {\n    res.download(file, "TradeXora_Full_App.html");\n  } else {\n    res.status(404).send("File not found");\n  }\n});`;

code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
