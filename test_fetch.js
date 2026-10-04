const originalFetch = fetch;
global.fetch = async (input, init) => {
  let url = '';
  if (typeof input === 'string') url = input;
  else if (input instanceof URL) url = input.toString();
  else if (input instanceof Request) url = input.url;

  if (url.startsWith('/api/')) {
    const defaultBackend = "https://example.com";
    if (typeof input === 'string') input = defaultBackend + url;
    else if (input instanceof URL) input = new URL(defaultBackend + url);
    else if (input instanceof Request) input = new Request(defaultBackend + url, input);
  }
  return input;
};

fetch('/api/test').then(req => console.log(typeof req === 'string' ? req : req.url));
fetch(new Request('/api/test2', {method: 'POST'})).then(req => console.log(req.url, req.method));
