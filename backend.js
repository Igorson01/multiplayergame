const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const port = 3000;
const canvasWidth = 1024;
const canvasHeight = 576;
const projectileRadius = 5;

let backendPlayers = {};
let backendProjectiles = {};
let projectileId = 0;

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('a user connected');
    io.emit('updatePlayers', backendPlayers);

    socket.on('shoot', ({ x, y, angle }) => {
        projectileId++;
        const speed = 5;
        const velocity = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
        backendProjectiles[projectileId] = { x, y, velocity, playerId: socket.id };
    });

    socket.on('initGame', ({ username }) => {
        const randomX = Math.random() * canvasWidth;
        const randomY = Math.random() * canvasHeight;
        const randomColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        backendPlayers[socket.id] = { x: randomX, y: randomY, score: 0, username, color: randomColor };
    });

    socket.on('disconnect', () => {
        delete backendPlayers[socket.id];
        io.emit('updatePlayers', backendPlayers);
    });

    socket.on('keydown', ({ keycode }) => {
        const player = backendPlayers[socket.id];
        const speed = 10;
        switch (keycode) {
            case 'KeyW':
                if (player.y - speed >= 0) player.y -= speed;
                break;
            case 'KeyA':
                if (player.x - speed >= 0) player.x -= speed;
                break;
            case 'KeyS':
                if (player.y + speed <= canvasHeight) player.y += speed;
                break;
            case 'KeyD':
                if (player.x + speed <= canvasWidth) player.x += speed;
                break;
        }
    });
});

setInterval(() => {
    // Update projectile position and handle collisions
    for (const id in backendProjectiles) {
        const projectile = backendProjectiles[id];
        projectile.x += projectile.velocity.x;
        projectile.y += projectile.velocity.y;

        // Remove projectile if out of bounds
        if (
            projectile.x - projectileRadius >= canvasWidth ||
            projectile.x + projectileRadius <= 0 ||
            projectile.y - projectileRadius >= canvasHeight ||
            projectile.y + projectileRadius <= 0
        ) {
            delete backendProjectiles[id];
            continue;
        }

        // Check for collisions with players
        for (const playerId in backendPlayers) {
            const player = backendPlayers[playerId];
            const distance = Math.hypot(projectile.x - player.x, projectile.y - player.y);
            if (distance < projectileRadius + 10 && projectile.playerId !== playerId) {
                // Log hit
                console.log('Hit player:', playerId);
                // Increase shooter's score
                if (backendPlayers[projectile.playerId]) backendPlayers[projectile.playerId].score++;
                // Remove projectile and player
                delete backendProjectiles[id];
                delete backendPlayers[playerId];
                break;
            }
        }
    }
    // Emit updates to clients
    io.sockets.emit('updateProjectiles', backendProjectiles);
    io.sockets.emit('updatePlayers', backendPlayers);
}, 15);

http.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});