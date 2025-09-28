const io = require('socket.io-client');

// Color and styling utilities
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

// Log type configurations
const logTypes = {
  log: {
    color: colors.cyan,
    label: 'CONSOLE LOG',
    border: '-'
  },
  error: {
    color: colors.red,
    label: 'CONSOLE ERROR',
    border: '-'
  },
  warn: {
    color: colors.yellow,
    label: 'CONSOLE WARN',
    border: '-'
  }
};

function formatLogHeader(type, timestamp) {
  const config = logTypes[type] || logTypes.log;
  const friendly = timestamp.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });
  
  const header = `[${config.label}] [${friendly}]`;
  const separator = config.border.repeat(50);
  
  return `\n${config.color}${colors.bright}${header}${colors.reset}\n${config.color}${separator}${colors.reset}`;
}

function printLogContent(payload, logType) {
  if (payload && typeof payload === 'object') {
    // Handle message content
    if ('message' in payload) {
      if (logType === 'error') {
        console.log(`${colors.red}${payload.message}${colors.reset}`);
      } else if (logType === 'warn') {
        console.log(`${colors.yellow}${payload.message}${colors.reset}`);
      } else {
        console.log(`${colors.cyan}${payload.message}${colors.reset}`);
      }
    }
    
    // Handle single object
    if ('object' in payload) {
      console.dir(payload.object, { 
        depth: null, 
        colors: true,
        compact: false
      });
    }
    
    // Handle multiple objects
    if ('objects' in payload && Array.isArray(payload.objects)) {
      payload.objects.forEach((obj, i) => {
        if (payload.objects.length > 1) {
          console.log(`${colors.gray}[Object ${i + 1}]${colors.reset}`);
        }
        console.dir(obj, { 
          depth: null, 
          colors: true,
          compact: false
        });
      });
    }
    
    // Handle unknown payload structure
    if (!('message' in payload) && !('object' in payload) && !('objects' in payload)) {
      try {
        const pretty = JSON.stringify(payload, null, 2);
        console.log(pretty);
      } catch {
        console.dir(payload, { depth: null, colors: true });
      }
    }
    return;
  }
  
  // Fallback for non-object payloads
  try {
    const pretty = JSON.stringify(payload, null, 2);
    console.log(pretty);
  } catch {
    console.dir(payload, { depth: null, colors: true });
  }
}

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

  socket.on('connect', () => {
    console.log(`[SOCKET] Connected to ${originUrl}`);
    console.log(`[SOCKET] Listening for log events on channel: ${channel}`);
    if (typeof onConnect === 'function') onConnect();
  });

  // Handle log events with intelligent type detection based on logLevel
  socket.on('log', (payload) => {
    const timestamp = new Date();
    
    // Determine log type based on logLevel field or default to 'log'
    let logType = 'log';
    if (payload && payload.logLevel) {
      switch (payload.logLevel) {
        case 'error':
          logType = 'error';
          break;
        case 'warning':
          logType = 'warn';
          break;
        default:
          logType = 'log';
      }
    }
    
    console.log(formatLogHeader(logType, timestamp));
    printLogContent(payload, logType);
  });

  // Keep these as backup in case server sends direct event types
  socket.on('error', (payload) => {
    const timestamp = new Date();
    console.log(formatLogHeader('error', timestamp));
    printLogContent(payload, 'error');
  });

  socket.on('warning', (payload) => {
    const timestamp = new Date();
    console.log(formatLogHeader('warn', timestamp));
    printLogContent(payload, 'warn');
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
  });
}

module.exports = { listenScriptLog };
