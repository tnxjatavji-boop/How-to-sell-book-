const fs = require('fs');
let code = fs.readFileSync('src/main.tsx', 'utf8');

const override = `
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  let url = '';
  if (typeof input === 'string') url = input;
  else if (input instanceof URL) url = input.toString();
  else if (input instanceof Request) url = input.url;

  if (url.startsWith('/api/')) {
    const defaultBackend = "https://ais-pre-3xyvj7flkzhpm4jtclhmm6-28634364797.asia-southeast1.run.app";
    const hostname = window.location.hostname;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
    const isCloudRun = hostname.endsWith("run.app");
    if (!isLocalhost && !isCloudRun) {
      if (typeof input === 'string') input = defaultBackend + url;
      else if (input instanceof URL) input = new URL(defaultBackend + url);
      else if (input instanceof Request) input = new Request(defaultBackend + url, input);
    }
  }
  return originalFetch(input, init);
};
`;

if (!code.includes('originalFetch')) {
  const lines = code.split('\n');
  const importIndex = lines.findIndex(l => !l.startsWith('import '));
  lines.splice(importIndex, 0, override);
  fs.writeFileSync('src/main.tsx', lines.join('\n'));
}
