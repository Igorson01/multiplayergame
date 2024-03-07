  const canvas = document.querySelector('canvas')
  const c = canvas.getContext('2d')

  const socket = io()

  const scoreEl = document.querySelector('#scoreEl')
  const devicePixelRatio = window.devicePixelRatio || 4

  canvas.width = 1024 * devicePixelRatio
  canvas.height = 576 * devicePixelRatio

  c.scale(devicePixelRatio, devicePixelRatio)

  const x = canvas.width / 2
  const y = canvas.height / 2

  const frontEndPlayers = {}
  const frontEndProjectiles =[]

  

  socket.on('updateProjectiles', (backEndProjectiles)=> { 
    for (const id in backEndProjectiles){
      const backEndProjectile = backEndProjectiles[id]

      if(!frontEndProjectiles[id]){
        frontEndProjectiles[id] = new Projectile({
        x:backEndProjectile.x,
        y:backEndProjectile.y,
        radius:5, 
        color:frontEndPlayers[backEndProjectile.playerId]?.color, 
        velocity: backEndProjectile.velocity
        })
      } else {
        frontEndProjectiles[id].x += backEndProjectiles[id].velocity.x
        frontEndProjectiles[id].y += backEndProjectiles[id].velocity.y
      }
    }
    for (const frontEndProjectileId in frontEndProjectiles) {
      if (!backEndProjectiles[frontEndProjectileId]) {
        delete frontEndProjectiles[frontEndProjectileId]
      }
    }
  })

  socket.on('updatePlayers', (backEndPlayers) => {
    for (const id in backEndPlayers) {
        const backEndPlayer = backEndPlayers[id];
        if (!frontEndPlayers[id]) {
            frontEndPlayers[id] = new Player({
                x: backEndPlayer.x,
                y: backEndPlayer.y,
                radius: 10,
                color: backEndPlayer.color,
                username: backEndPlayer.username
            });
            document.querySelector('#playerLabels').innerHTML += `<div data-id="${id}" data-score="${backEndPlayer.score}">${backEndPlayer.username}:${backEndPlayer.score}</div>`;
        } else {
            document.querySelector(`div[data-id="${id}"]`).innerHTML = `${backEndPlayer.username}:${backEndPlayer.score}`;
            document.querySelector(`div[data-id="${id}"]`).setAttribute('data-score', backEndPlayer.score);

            frontEndPlayers[id].x = backEndPlayer.x;
            frontEndPlayers[id].y = backEndPlayer.y;
        }

       
    }

    for (const id in frontEndPlayers) {
        if (!backEndPlayers[id]) {
            const divToDelete = document.querySelector(`div[data-id="${id}"]`);
            divToDelete.parentNode.removeChild(divToDelete);
            if (id === socket.id) {
                document.querySelector('#usernameForm').style.display = 'block';
            }
            delete frontEndPlayers[id];
        }
    }
});

  let animationId

  function animate() {
    animationId = requestAnimationFrame(animate)
    //c.fillStyle = 'rgba(0, 0, 0, 0.1)'
    c.clearRect(0, 0, canvas.width, canvas.height)

    for (const id in frontEndPlayers) {
      const frontEndPlayer = frontEndPlayers[id]
      if(frontEndPlayer.target) {
        frontEndPlayers[id].x += (frontEndPlayers[id].x - frontEndPlayers[id].x) * 0.5
        frontEndPlayers[id].y += (frontEndPlayers[id].y - frontEndPlayers[id].y) * 0.5
      }
      frontEndPlayer.draw()
    }

    for (const id in frontEndProjectiles) {
      const frontEndProjectile = frontEndProjectiles[id]
      frontEndProjectile.draw()
    }

    //for(let i=frontEndProjectiles.length -1; i >= 0; i--) {
    //  const frontEndProjectile = frontEndProjectiles[i]

    //  frontEndProjectile.update()
    //}
  }

  animate()

  const keys= {
    w:{ 
      pressed:false
    },
    a:{ 
      pressed:false
    },
    s:{ 
      pressed:false
    },
    d:{ 
      pressed:false
    }
  }
  const speed = 10
  const playerInputs = []
  let sequenceNumber = 0
  setInterval(()=>{
    if (keys.w.pressed) {
      sequenceNumber++;
      if (frontEndPlayers[socket.id].y - speed >= 8) { // Sprawdzanie górnej krawędzi
          playerInputs.push({ sequenceNumber, dx: 0, dy: -speed });
          frontEndPlayers[socket.id].y -= speed;
          socket.emit('keydown', { keycode: 'KeyW', sequenceNumber });
      }
  }
  if (keys.a.pressed) {
      sequenceNumber++;
      if (frontEndPlayers[socket.id].x - speed >= 8) { // Sprawdzanie lewej krawędzi
          playerInputs.push({ sequenceNumber, dx: -speed, dy: 0 });
          frontEndPlayers[socket.id].x -= speed;
          socket.emit('keydown', { keycode: 'KeyA', sequenceNumber });
      }
  }
  if (keys.s.pressed) {
      sequenceNumber++;
      if (frontEndPlayers[socket.id].y + speed <= 590 - frontEndPlayers[socket.id].radius * 2) { // Sprawdzanie dolnej krawędzi
          playerInputs.push({ sequenceNumber, dx: 0, dy: speed });
          frontEndPlayers[socket.id].y += speed;
          socket.emit('keydown', { keycode: 'KeyS', sequenceNumber });
      }
  }
  if (keys.d.pressed) {
      sequenceNumber++;
      if (frontEndPlayers[socket.id].x + speed <= 1035 - frontEndPlayers[socket.id].radius * 2) { // Sprawdzanie prawej krawędzi
          playerInputs.push({ sequenceNumber, dx: speed, dy: 0 });
          frontEndPlayers[socket.id].x += speed;
          socket.emit('keydown', { keycode: 'KeyD', sequenceNumber });
      }
  }
  },15)
  window.addEventListener('keydown', (event)=>{

    if (!frontEndPlayers[socket.id]) return
    switch(event.code) {
      case'KeyW':
      keys.w.pressed = true
      break

      case'KeyA':
      keys.a.pressed = true
      break
      
      case'KeyS':
      keys.s.pressed = true
      break
      
      case'KeyD':
      keys.d.pressed = true
      break
    }
  })
  window.addEventListener('keyup', (event)=>{

    if (!frontEndPlayers[socket.id]) return
    switch(event.code) { 
      case'KeyW':
      keys.w.pressed = false
      break

      case'KeyA':
      keys.a.pressed = false
      break
      
      case'KeyS':
      keys.s.pressed = false
      break
      
      case'KeyD':
      keys.d.pressed = false
      break
    }
  })

  document.querySelector('#usernameForm').addEventListener('submit', (event) =>{
    event.preventDefault()
    document.querySelector('#usernameForm').style.display ='none'
    socket.emit('initGame', {
      width:canvas.width,height:canvas.height, devicePixelRatio,
      username:document.querySelector('#usernameInput').value})
  })

