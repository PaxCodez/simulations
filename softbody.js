class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.px = x;
    this.py = y;
    this.vx = 0;
    this.vy = 0;
  }

  update(delta) {
    const vx = (this.x - this.px) * 0.99;
    const vy = (this.y - this.py) * 0.99;

    this.px = this.x;
    this.py = this.y;

    this.x += vx;
    this.y += vy;
    this.y += 9.81 * delta;
  }
}

class Spring {
  constructor(p1, p2, stiffness = 0.3) {
    this.p1 = p1;
    this.p2 = p2;
    this.stiffness = stiffness;
    this.length = Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }

  update() {
    const dx = this.p2.x - this.p1.x;
    const dy = this.p2.y - this.p1.y;
    const distance = Math.hypot(dx, dy);
    const difference = this.length - distance;
    const percent = (difference / distance) * this.stiffness;
    const offsetX = dx * percent;
    const offsetY = dy * percent;

    this.p1.x -= offsetX;
    this.p1.y -= offsetY;
    this.p2.x += offsetX;
    this.p2.y += offsetY;
  }
}

class Softbody {
  constructor(x, y, type = 'circle', radius = 50, numPoints = 20) {
    this.points = [];
    this.springs = [];
    this.stiffness = 0.3;
    this.type = type;
    this.init(x, y, radius, numPoints);
  }

  init(x, y, radius, numPoints) {
    if (this.type === 'circle') {
      this.initCircle(x, y, radius, numPoints);
    } else if (this.type === 'square') {
      this.initSquare(x, y, radius);
    } else if (this.type === 'triangle') {
      this.initTriangle(x, y, radius);
    }
  }

  initCircle(x, y, radius, numPoints) {
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      this.points.push(new Point(px, py));
    }

    const centerPoint = new Point(x, y);
    this.points.push(centerPoint);

    for (let i = 0; i < numPoints; i++) {
      this.springs.push(new Spring(
        this.points[i],
        this.points[(i + 1) % numPoints],
        this.stiffness
      ));
      this.springs.push(new Spring(
        this.points[i],
        centerPoint,
        this.stiffness
      ));
    }
  }

  initSquare(x, y, size) {
    const points = [
      new Point(x - size, y - size),
      new Point(x + size, y - size),
      new Point(x + size, y + size),
      new Point(x - size, y + size)
    ];
    const center = new Point(x, y);
    
    this.points = [...points, center];

    // Outer square
    for (let i = 0; i < 4; i++) {
      this.springs.push(new Spring(
        points[i],
        points[(i + 1) % 4],
        this.stiffness
      ));
    }

    // Diagonals
    this.springs.push(new Spring(points[0], points[2], this.stiffness * 0.5));
    this.springs.push(new Spring(points[1], points[3], this.stiffness * 0.5));

    // Connect to center
    for (const point of points) {
      this.springs.push(new Spring(point, center, this.stiffness));
    }
  }

  initTriangle(x, y, size) {
    const points = [];
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      points.push(new Point(
        x + Math.cos(angle) * size,
        y + Math.sin(angle) * size
      ));
    }
    const center = new Point(x, y);
    
    this.points = [...points, center];

    // Outer triangle
    for (let i = 0; i < 3; i++) {
      this.springs.push(new Spring(
        points[i],
        points[(i + 1) % 3],
        this.stiffness
      ));
    }

    // Connect to center
    for (const point of points) {
      this.springs.push(new Spring(point, center, this.stiffness));
    }
  }

  setStiffness(stiffness) {
    this.stiffness = stiffness;
    for (const spring of this.springs) {
      spring.stiffness = stiffness;
    }
  }

  checkCollision(other) {
    for (const p1 of this.points) {
      for (const p2 of other.points) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < 10) {
          const angle = Math.atan2(dy, dx);
          const force = (10 - dist) * 0.5;
          const fx = Math.cos(angle) * force;
          const fy = Math.sin(angle) * force;
          
          p1.x -= fx;
          p1.y -= fy;
          p2.x += fx;
          p2.y += fy;
        }
      }
    }
  }

  update(delta, canvas) {
    for (const point of this.points) {
      point.update(delta);
      point.x = Math.max(0, Math.min(canvas.width, point.x));
      point.y = Math.max(0, Math.min(canvas.height, point.y));
    }

    for (let i = 0; i < 3; i++) {
      for (const spring of this.springs) {
        spring.update();
      }
    }
  }

  draw(ctx) {
    // Draw springs
    ctx.beginPath();
    ctx.strokeStyle = '#4fa4ff';
    ctx.lineWidth = 4;
    
    for (const spring of this.springs) {
      ctx.moveTo(spring.p1.x, spring.p1.y);
      ctx.lineTo(spring.p2.x, spring.p2.y);
    }
    
    ctx.stroke();

    // Draw points
    ctx.fillStyle = '#fff';
    for (const point of this.points) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fill the shape
    if (this.points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length - 1; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(79, 164, 255, 0.2)';
      ctx.fill();
    }
  }
}

class SoftbodySimulation {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.bodies = [];
    this.mouse = { x: 0, y: 0, down: false, grabbed: null };
    this.lastTime = 0;
    this.bindEvents();
    this.animate();
  }

  addBody(type) {
    const x = Math.random() * (this.canvas.width - 100) + 50;
    const y = Math.random() * (this.canvas.height - 100) + 50;
    this.bodies.push(new Softbody(x, y, type));
  }

  bindEvents() {
    document.getElementById('addCircle').addEventListener('click', () => this.addBody('circle'));
    document.getElementById('addSquare').addEventListener('click', () => this.addBody('square'));
    document.getElementById('addTriangle').addEventListener('click', () => this.addBody('triangle'));
    document.getElementById('removeLast').addEventListener('click', () => this.bodies.pop());
    
    document.getElementById('moreStretchy').addEventListener('click', () => {
      for (const body of this.bodies) {
        body.setStiffness(Math.max(0.1, body.stiffness * 0.8));
      }
    });
    
    document.getElementById('moreFirm').addEventListener('click', () => {
      for (const body of this.bodies) {
        body.setStiffness(Math.min(1.0, body.stiffness * 1.2));
      }
    });

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
      for (const body of this.bodies) {
        for (const point of body.points) {
          const dx = point.x - this.mouse.x;
          const dy = point.y - this.mouse.y;
          if (Math.hypot(dx, dy) < grabRadius) {
            this.mouse.grabbed = point;
            break;
          }
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
    for (const body of this.bodies) {
      body.update(delta, this.canvas);
    }

    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {
        this.bodies[i].checkCollision(this.bodies[j]);
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const body of this.bodies) {
      body.draw(this.ctx);
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
new SoftbodySimulation(canvas);