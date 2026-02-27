const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { setup } = require('./db/setup');
const { JWT_SECRET } = require('./middleware/auth');

// Initialize database and seed on startup
setup();

const app = express();
const server = http.createServer(app);

const isProduction = process.env.NODE_ENV === 'production';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const corsOrigin = isProduction ? true : CLIENT_URL;
const PORT = process.env.PORT || 5000;

// ─── Socket.io setup ────────────────────────────────────────────────────────

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Expose io instance to route handlers via app.locals
app.locals.io = io;

// Authenticate socket connections using the JWT from handshake.auth.token
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('No token — connection refused'));
  }
  try {
    socket.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    next(new Error('Invalid token — connection refused'));
  }
});

io.on('connection', (socket) => {
  const { market, role, name } = socket.user;
  console.log(`[Socket] Connected: ${name} (${role})`);

  // Auto-join the market room so they receive real-time lead events
  if (market) {
    socket.join(market);
    console.log(`[Socket] ${name} joined room: "${market}"`);
  }

  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${name}`);
  });
});

// ─── Express middleware ──────────────────────────────────────────────────────

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

// ─── Routes ─────────────────────────────────────────────────────────────────

app.use('/api/auth', require('./routes/auth'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/webhook', require('./routes/webhook'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Serve React client in production ───────────────────────────────────────

if (isProduction) {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ─── Start server ────────────────────────────────────────────────────────────

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  ██╗     ███████╗ ██████╗ ███████╗███╗   ██╗██╗  ██╗`);
  console.log(`  ██║     ██╔════╝██╔════╝ ██╔════╝████╗  ██║██║  ██║`);
  console.log(`  ██║     █████╗  ██║  ███╗█████╗  ██╔██╗ ██║███████║`);
  console.log(`  ██║     ██╔══╝  ██║   ██║██╔══╝  ██║╚██╗██║██╔══██║`);
  console.log(`  ███████╗███████╗╚██████╔╝███████╗██║ ╚████║██║  ██║`);
  console.log(`  ╚══════╝╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝`);
  console.log(`\n  Server running at http://localhost:${PORT}`);
  console.log(`  Socket.io ready — accepting connections\n`);
});
