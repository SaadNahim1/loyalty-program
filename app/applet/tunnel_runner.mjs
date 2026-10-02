import { spawn } from 'child_process';
import fs from 'fs';

console.log('Starting cloudflared tunnel from /app/applet...');

const tunnel = spawn('/tmp/cloudflared', [
  'tunnel',
  '--url',
  'http://127.0.0.1:3000',
  '--http-host-header',
  'localhost',
]);

tunnel.stderr.on('data', (data) => {
  const text = data.toString();
  const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match) {
    console.log('TUNNEL_URL_FOUND=' + match[0]);
    fs.writeFileSync('/app/applet/public/tunnel_url.txt', match[0]);
    fs.writeFileSync('/tmp/active_tunnel_url.txt', match[0]);
  }
});

tunnel.stdout.on('data', (data) => {
  console.log('STDOUT:', data.toString());
});

tunnel.on('close', (code) => {
  console.log('Tunnel exited with code', code);
});
