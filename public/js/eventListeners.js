addEventListener('click', (event) => {
  const canvas = document.querySelector('canvas');
  const { top, left } = canvas.getBoundingClientRect();
  const playerPosition = {
    x: frontEndPlayers[socket.id].x,
    y: frontEndPlayers[socket.id].y
  };

  console.log('Player position:', playerPosition);

  // Log kliknięcia myszy
  console.log('Clicked position:', { x: event.clientX, y: event.clientY });

  const angle = Math.atan2(
    event.clientY - top - playerPosition.y,
    event.clientX - left - playerPosition.x
  );

  console.log('Angle:', angle);

  socket.emit('shoot', {
    x: playerPosition.x,
    y: playerPosition.y,
    angle
  });
});