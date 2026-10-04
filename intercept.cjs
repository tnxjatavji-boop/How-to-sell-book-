const http = require('http');
const https = require('https');

const TARGET_HOST = "ais-pre-3xyvj7flkzhpm4jtclhmm6-28634364797.asia-southeast1.run.app";

const originalHttpsRequest = https.request;
https.request = function (options, callback) {
  let finalOptions = options;
  if (typeof options === 'string') {
    if (options.includes(TARGET_HOST)) {
      finalOptions = options.replace('https://' + TARGET_HOST, 'http://localhost:3000');
      return http.request(finalOptions, callback);
    }
  } else if (options && (options.host === TARGET_HOST || options.hostname === TARGET_HOST)) {
    // Redirect to local HTTP server
    const newOptions = { ...options };
    newOptions.protocol = 'http:';
    newOptions.host = 'localhost';
    newOptions.hostname = 'localhost';
    newOptions.port = 3000;
    if (newOptions.headers) {
      newOptions.headers = { ...newOptions.headers };
      newOptions.headers.host = 'localhost:3000';
    }
    return http.request(newOptions, callback);
  }
  return originalHttpsRequest.call(https, finalOptions, callback);
};

const originalHttpRequest = http.request;
http.request = function (options, callback) {
  let finalOptions = options;
  if (typeof options === 'string') {
    if (options.includes(TARGET_HOST)) {
      finalOptions = options.replace('http://' + TARGET_HOST, 'http://localhost:3000');
    }
  } else if (options && (options.host === TARGET_HOST || options.hostname === TARGET_HOST)) {
    const newOptions = { ...options };
    newOptions.host = 'localhost';
    newOptions.hostname = 'localhost';
    newOptions.port = 3000;
    if (newOptions.headers) {
      newOptions.headers = { ...newOptions.headers };
      newOptions.headers.host = 'localhost:3000';
    }
    finalOptions = newOptions;
  }
  return originalHttpRequest.call(http, finalOptions, callback);
};

console.log('[INTERCEPTOR] Injected HTTP/HTTPS request interceptor for TWA build!');
