const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Backend and Frontend servers...');

// Start Backend Server
const backend = spawn('node', ['server-mongo.js'], {
    cwd: __dirname,
    stdio: 'inherit'
});

// Start Frontend Server
const frontend = spawn('npx', ['http-server', '-p', '8000', '-o'], {
    cwd: __dirname,
    stdio: 'inherit'
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\nShutting down servers...');
    backend.kill();
    frontend.kill();
    process.exit();
});

console.log('Backend: http://127.0.0.1:5000');
console.log('Frontend: http://127.0.0.1:8000');
console.log('Press Ctrl+C to stop both servers');
