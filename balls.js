class Ball {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 10;
    this.vy = (Math.random() - 0.5) * 10;
    this.radius = Math.random() * 20 + 10;
    this.color = `hsl(${Math.random() * 360}, 70%, 50%)`;
  }

  update(delta, canvas, balls) {
    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Apply gravity (increased)
    this.vy += 20 * delta;

    // Wall collisions with less friction
    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx *= -0.98;
    }
    if (this.x + this.radius > canvas.width) {
      this.x = canvas.width - this.radius;
      this.vx *= -0.98;
    }
    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.vy *= -0.98;
    }
    if (this.y + this.radius > canvas.height) {
      this.y = canvas.height - this.radius;
      this.vy *= -0.98;
    }

    // Ball collisions with less friction
    for (const other of balls) {
      if (other === this) continue;

      const dx = other.x - this.x;
      const dy = other.y - this.y;
      const distance = Math.hypot(dx, dy);
      const minDist = this.radius + other.radius;

      if (distance < minDist) {
        const angle = Math.atan2(dy, dx);
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);

        const vx1 = this.vx * cos + this.vy * sin;
        const vy1 = this.vy * cos - this.vx * sin;
        const vx2 = other.vx * cos + other.vy * sin;
        const vy2 = other.vy * cos - other.vx * sin;

        this.vx = vx2 * cos - vy1 * sin;
        this.vy = vy1 * cos + vx2 * sin;
        other.vx = vx1 * cos - vy2 * sin;
        other.vy = vy2 * cos + vx1 * sin;

        // Apply less friction
        this.vx *= 0.98;
        this.vy *= 0.98;
        other.vx *= 0.98;
        other.vy *= 0.98;

        const overlap = (minDist - distance) / 2;
        const moveX = cos * overlap;
        const moveY = sin * overlap;
        this.x -= moveX;
        this.y -= moveY;
        other.x += moveX;
        other.y += moveY;
      }
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

class BallsSimulation {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.balls = [];
    this.lastTime = 0;
    this.placingBall = false;
    this.bindEvents();
    this.animate();
  }

  bindEvents() {
    document.getElementById('addBall').addEventListener('click', () => {
      this.placingBall = true;
      this.canvas.style.cursor = 'crosshair';
    });

    this.canvas.addEventListener('click', (e) => {
      if (this.placingBall) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.balls.push(new Ball(x, y));
        this.placingBall = false;
        this.canvas.style.cursor = 'default';
      }
    });

    document.getElementById('removeBall').addEventListener('click', () => {
      this.balls.pop();
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
      ball.update(delta, this.canvas, this.balls);
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
new BallsSimulation(canvas);