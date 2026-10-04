(function() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '999999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let width = window.innerWidth;
  let height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;

  window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  });

  const cursorImg = new Image();
  cursorImg.src = 'img/cursor-tap.png';
  
  const points = [];
  const particles = [];
  const maxLife = 15; // frames for trail

  let isMouseDown = false;

  function handlePointerDown(x, y) {
    isMouseDown = true;
    // Tap Effect: Spawn particles
    for (let i = 0; i < 8; i++) {
      let angle = (i / 8) * Math.PI * 2 + (Math.random() * 0.5);
      let speed = Math.random() * 3 + 2;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 25,
        maxLife: 25
      });
    }
  }

  // Mouse Events
  window.addEventListener('mousedown', (e) => handlePointerDown(e.clientX, e.clientY));
  window.addEventListener('mouseup', () => isMouseDown = false);
  window.addEventListener('mouseleave', () => isMouseDown = false);
  window.addEventListener('mousemove', (e) => {
    if (isMouseDown) {
      points.push({ x: e.clientX, y: e.clientY, life: maxLife });
    }
  });

  // Touch Events
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
    }
  });
  window.addEventListener('touchend', () => isMouseDown = false);
  window.addEventListener('touchcancel', () => isMouseDown = false);
  window.addEventListener('touchmove', (e) => {
    if (isMouseDown && e.touches.length > 0) {
      points.push({ x: e.touches[0].clientX, y: e.touches[0].clientY, life: maxLife });
    }
  });

  function draw() {
    ctx.clearRect(0, 0, width, height);
    
    // 1. Draw Slice line
    if (points.length > 1) {
      for (let i = 1; i < points.length; i++) {
        ctx.beginPath();
        ctx.moveTo(points[i-1].x, points[i-1].y);
        ctx.lineTo(points[i].x, points[i].y);
        
        let ratio = points[i].life / maxLife;
        ctx.lineWidth = ratio * 8;
        ctx.strokeStyle = `rgba(255, 255, 255, ${ratio})`;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#1caef6'; // Glow neon blue
        ctx.stroke();
      }
    }

    // 2. Draw ghost cursors (Erase effect)
    if (cursorImg.complete) {
        for (let i = 0; i < points.length; i+=2) {
            let p = points[i];
            let ratio = p.life / maxLife;
            ctx.globalAlpha = ratio * 0.4; // fade out
            let size = 48 * (0.7 + 0.3 * ratio); // slightly shrink over time
            // Center the hotspot (10, 4) approx
            ctx.drawImage(cursorImg, p.x - 10, p.y - 4, size, size);
        }
        ctx.globalAlpha = 1.0;
    }

    // 3. Draw Tap Particles
    for (let i = 0; i < particles.length; i++) {
      let p = particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, (p.life / p.maxLife) * 5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(254, 208, 53, ${p.life / p.maxLife})`; // Vàng bùng nổ
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#f37825';
      ctx.fill();
      
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    }

    // Update life and clean up
    for (let i = 0; i < points.length; i++) {
      points[i].life--;
    }
    while(points.length > 0 && points[0].life <= 0) {
      points.shift();
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      if (particles[i].life <= 0) particles.splice(i, 1);
    }

    requestAnimationFrame(draw);
  }
  
  draw();
})();
