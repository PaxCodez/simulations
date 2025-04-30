class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.px = x;
    this.py = y;
    this.vx = 0;
    this.vy = 0;
    this.pinned = false;
  }

  update(delta) {
    if (this.pinned) return;

    const vx = (this.x - this.px) * 0.98;
    const vy = (this.y - this.py) * 0.98;

    this.px = this.x;
    this.py = this.y;

    this.x += vx;
    this.y += vy;
    this.y += 9.81 * delta;
  }
}

class Stick {
  constructor(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
    this.length = Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }

  update() {
    const dx = this.p2.x - this.p1.x;
    const dy = this.p2.y - this.p1.y;
    const distance = Math.hypot(dx, dy);
    const difference = this.length - distance;
    const percent = (difference / distance) / 2;
    const offsetX = dx * percent;
    const offsetY = dy * percent;

    if (!this.p1.pinned) {
      this.p1.x -= offsetX;
      this.p1.y -= offsetY;
    }
    if (!this.p2.pinned) {
      this.p2.x += offsetX;
      this.p2.y += offsetY;
    }
  }
}

class Cloth {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.points = [];
    this.sticks = [];
    this.mouse = { x: 0, y: 0, down: false, grabbed: null };
    this.lastTime = 0;
    this.init();
    this.bindEvents();
    this.animate();
  }

  init() {
    const width = 15;
    const height = 15;
    const spacing = 20;

    // Create points
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const p = new Point(
          200 + x * spacing,
          50 + y * spacing
        );
        if (y === 0) {
          p.pinned = true;
        }
        this.points.push(p);
      }
    }

    // Create sticks
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (x < width - 1) {
          this.sticks.push(new Stick(
            this.points[y * width + x],
            this.points[y * width + x + 1]
          ));
        }
        if (y < height - 1) {
          this.sticks.push(new Stick(
            this.points[y * width + x],
            this.points[(y + 1) * width + x]
          ));
        }
      }
    }
  }

  bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
      
      if (this.mouse.grabbed) {
        this.mouse.grabbed.x = this.mouse.x;
        this.mouse.grabbed.y = this.mouse.y;
      }
    });

    this.canvas.addEventListener('mousedown', () => {
      const grabRadius = 20;
      for (const point of this.points) {
        const dx = point.x - this.mouse.x;
        const dy = point.y - this.mouse.y;
        if (Math.hypot(dx, dy) < grabRadius && !point.pinned) {
          this.mouse.grabbed = point;
          break;
        }
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      this.mouse.grabbed = null;
    });

    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  update(delta) {
    const iterations = 8;
    const dt = delta / iterations;

    for (let i = 0; i < iterations; i++) {
      for (const point of this.points) {
        point.update(dt);
        point.x = Math.max(0, Math.min(this.canvas.width, point.x));
        point.y = Math.max(0, Math.min(this.canvas.height, point.y));
      }

      for (let j = 0; j < 2; j++) {
        for (const stick of this.sticks) {
          stick.update();
        }
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.strokeStyle = '#4fa4ff';
    this.ctx.lineWidth = 2;
    
    for (const stick of this.sticks) {
      this.ctx.beginPath();
      this.ctx.moveTo(stick.p1.x, stick.p1.y);
      this.ctx.lineTo(stick.p2.x, stick.p2.y);
      this.ctx.stroke();
    }

    for (const point of this.points) {
      this.ctx.fillStyle = point.pinned ? '#ff0000' : '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
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
new Cloth(canvas);