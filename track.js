class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 10;
  }

  update(delta, lines) {
    // Apply increased gravity
    this.vy += 20 * delta;

    // Update position
    this.x += this.vx * delta;
    this.y += this.vy * delta;

    // Check line collisions
    for (const line of lines) {
      const collision = this.checkLineCollision(line);
      if (collision) {
        const [nx, ny] = collision;
        const dot = this.vx * nx + this.vy * ny;
        this.vx = this.vx - 2 * dot * nx;
        this.vy = this.vy - 2 * dot * ny;
        
        // Less friction
        this.vx *= 0.98;
        this.vy *= 0.98;
      }
    }
  }

  checkLineCollision(line) {
    const [x1, y1, x2, y2, thickness] = line;
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    
    const nx = -dy / len;
    const ny = dx / len;
    
    const bx = this.x - x1;
    const by = this.y - y1;
    
    const distance = bx * nx + by * ny;
    
    if (Math.abs(distance) <= this.radius + thickness/2) {
      const t = (bx * dx + by * dy) / (dx * dx + dy * dy);
      if (t >= 0 && t <= 1) {
        return [nx, ny];
      }
    }
    
    return null;
  }

  draw(ctx) {
    ctx.fillStyle = '#4fa4ff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

class TrackSimulation {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.lines = [];
    this.balls = [];
    this.drawing = false;
    this.lastPoint = null;
    this.lastTime = 0;
    this.lineThickness = 5;
    this.placingBall = false;
    this.bindEvents();
    this.animate();
  }

  bindEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
      if (this.placingBall) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.balls.push(new Ball(x, y));
        this.placingBall = false;
        this.canvas.style.cursor = 'default';
      } else {
        const rect = this.canvas.getBoundingClientRect();
        this.lastPoint = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
        this.drawing = true;
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.drawing) return;
      
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      this.lines.push([
        this.lastPoint.x,
        this.lastPoint.y,
        x,
        y,
        this.lineThickness
      ]);
      
      this.lastPoint = { x, y };
    });

    this.canvas.addEventListener('mouseup', () => {
      this.drawing = false;
    });

    document.getElementById('clear').addEventListener('click', () => {
      this.lines = [];
    });

    document.getElementById('addBall').addEventListener('click', () => {
      this.placingBall = true;
      this.canvas.style.cursor = 'crosshair';
    });

    document.getElementById('removeBall').addEventListener('click', () => {
      this.balls.pop();
    });

    document.getElementById('thickness').addEventListener('input', (e) => {
      this.lineThickness = parseFloat(e.target.value);
    });

    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  update(delta) {
    for (const ball of this.balls) {
      ball.update(delta, this.lines);
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw track
    this.ctx.strokeStyle = '#ffffff';
    for (const [x1, y1, x2, y2, thickness] of this.lines) {
      this.ctx.lineWidth = thickness;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }

    // Draw balls
    for (const ball of this.balls) {
      ball.draw(this.ctx);
    }
  }

  animate(time = 0) {
    const delta = Math.min((time - this.lastTime) / 1000, 0.016);
    this.lastTime = time;

    this.update(delta);
    this.draw();
    requestAnimationFrame((t) => this.animate(t));
  }
}

const canvas = document.getElementById('canvas');
new TrackSimulation(canvas);