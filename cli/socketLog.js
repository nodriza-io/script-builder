const io = require('socket.io-client');
const { formatCookie } = require('./cookieUtil');

function listenScriptLog(domain, scriptName, env, apiKey, onConnect) {
  const scriptCode = `${scriptName}-${env}`;
  const channel = `private-scriptLog-${scriptCode}`;
  const originUrl = domain.startsWith('http') ? domain : `https://${domain}`;
  console.log(`[SOCKET] Attempting to connect to: ${originUrl}`);
  console.log(`[SOCKET] Using channel: ${channel}`);
  const socket = io(originUrl, {
    transports: ['websocket'],
    auth: {
      apiKey,
      channels: [`scriptLog-${scriptCode}`],
    },
  });

  // Debug: print all incoming events
  // socket.onAny((event, ...args) => {
  //   if (event !== channel) {
  //     console.log(`[SOCKET][DEBUG] Event: ${event}`);
  //     if (args.length) console.dir(args, { depth: null, colors: true });
  //   }
  // });

  socket.on('connect', () => {
    console.log(`[SOCKET] Connected to ${originUrl}`);
    console.log(`[SOCKET] Listening for log events on channel: ${channel}`);
    if (typeof onConnect === 'function') onConnect();
  });

  // Listen for log events and print the message field directly if present
  socket.on('log', (payload) => {
  // Only print log header, do not clear console here
  const yellow = (str) => `\x1b[33m${str}\x1b[0m`;
  const now = new Date();
  const friendly = now.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });
  console.log(`\n${yellow(`[LOG] [${friendly}] ` + '-'.repeat(40))}\n`);
    if (payload && typeof payload === 'object') {
      if ('message' in payload) {
        console.log(payload.message);
      }
      if ('object' in payload) {
        // console.log('Object:');
        console.dir(payload.object, { depth: null, colors: true });
      }
      if ('objects' in payload && Array.isArray(payload.objects)) {
        payload.objects.forEach((obj, i) => {
          // console.log(`Object[${i}]:`);
          console.dir(obj, { depth: null, colors: true });
        });
      }
      if (!('message' in payload) && !('object' in payload) && !('objects' in payload)) {
        try {
          const pretty = JSON.stringify(payload, null, 2);
          console.log(pretty);
        } catch {
          console.dir(payload, { depth: null, colors: true });
        }
      }
      // console.log('\n');
      // console.log('='.repeat(60));
      return;
    }
    // Fallback for other payloads
    try {
      const pretty = JSON.stringify(payload, null, 2);
      console.log(pretty);
    } catch {
      console.dir(payload, { depth: null, colors: true });
    }
    // console.log('\n');
    // console.log('='.repeat(60));
  });

  socket.on('disconnect', () => {
    console.log('[SOCKET] Disconnected');
  });

  socket.on('connect_error', (err) => {
    console.error('[SOCKET] Connection error:', err.message);
    console.error('[SOCKET] Details:');
    console.error(`  Domain: ${originUrl}`);
    console.error(`  Channel: ${channel}`);
    if (err && err.stack) {
      console.error('[SOCKET] Stack trace:', err.stack);
    }
    console.error('[SOCKET] Troubleshooting tips:');
    console.error('  - Is the domain URL correct and reachable?');
    console.error('  - Is the Socket.IO server running and accessible?');
    console.error('  - Does the server require authentication or custom headers/cookies?');
    console.error('  - Is the server using the default /socket.io path and websocket transport?');
    console.error('  - Try connecting with a simple Socket.IO client for further debugging.');
  });
}

module.exports = { listenScriptLog };
