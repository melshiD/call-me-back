#!/usr/bin/env node

/**
 * Test WebSocket Echo Endpoint
 *
 * This script tests the minimal WebSocket echo endpoint to verify
 * that Cloudflare Workers can receive and respond to WebSocket messages.
 */

import WebSocket from 'ws';

const WS_URL = 'wss://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run/api/debug/ws-echo';

console.log('=================================');
console.log('WebSocket Echo Test');
console.log('=================================');
console.log('Connecting to:', WS_URL);
console.log();

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ WebSocket connected!');
  console.log();

  console.log('Sending test message: "Hello from test client"');
  ws.send('Hello from test client');

  // Send another message after 1 second
  setTimeout(() => {
    console.log('Sending test message 2: "Second test message"');
    ws.send('Second test message');
  }, 1000);

  // Send JSON test
  setTimeout(() => {
    const testJson = JSON.stringify({ event: 'test', data: 'JSON test' });
    console.log('Sending JSON test:', testJson);
    ws.send(testJson);
  }, 2000);

  // Close after 3 seconds
  setTimeout(() => {
    console.log();
    console.log('Closing connection...');
    ws.close();
  }, 3000);
});

ws.on('message', (data) => {
  console.log('📨 Received:', data.toString());
});

ws.on('close', (code, reason) => {
  console.log();
  console.log('❌ WebSocket closed');
  console.log('   Code:', code);
  console.log('   Reason:', reason.toString() || 'No reason provided');
  console.log();
  console.log('=================================');
  console.log('Test Complete');
  console.log('=================================');
});

ws.on('error', (error) => {
  console.error('⚠️  WebSocket error:', error.message);
});

// Timeout in case something hangs
setTimeout(() => {
  if (ws.readyState !== WebSocket.CLOSED) {
    console.error('❌ Test timeout - forcing close');
    ws.close();
    process.exit(1);
  }
}, 10000);
