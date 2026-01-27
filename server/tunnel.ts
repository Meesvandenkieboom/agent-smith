/**
 * Agentic - Tunnel for remote access
 * Exposes local server to the internet via localtunnel
 */

import localtunnel from 'localtunnel';

const PORT = 3001;

async function startTunnel() {
  console.log('\n');
  console.log('  🌐 Starting tunnel...\n');

  try {
    const tunnel = await localtunnel({
      port: PORT,
      local_host: 'localhost',
    });

    console.log('  ═══════════════════════════════════════════════════════════════════════════════');
    console.log('\n');
    console.log('  📱 REMOTE ACCESS ENABLED');
    console.log('\n');
    console.log(`  🔗 Public URL: ${tunnel.url}`);
    console.log('\n');
    console.log('  Open this URL on your phone to access Agentic!');
    console.log('\n');
    console.log('  ═══════════════════════════════════════════════════════════════════════════════');
    console.log('\n');
    console.log('  ⚠️  Note: First visit may show a localtunnel reminder page.');
    console.log('       Just click "Click to Continue" to access your app.');
    console.log('\n');
    console.log('  Press Ctrl+C to stop the tunnel.');
    console.log('\n');

    tunnel.on('close', () => {
      console.log('\n  🔌 Tunnel closed.\n');
      process.exit(0);
    });

    tunnel.on('error', (err: Error) => {
      console.error('\n  ❌ Tunnel error:', err.message);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n  Shutting down tunnel...');
      tunnel.close();
    });

    process.on('SIGTERM', () => {
      tunnel.close();
    });

  } catch (error) {
    console.error('  ❌ Failed to start tunnel:', error);
    process.exit(1);
  }
}

startTunnel();
