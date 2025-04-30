class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.px = x;
    this.py = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 2;
  }

  update(delta) {
    // Save previous position
    this.px = this.x;
    this.py = this.y;

    // Apply gravity
    this.vy += 0.5 * delta;

    // Update position
    this.x += this.vx;
    this.y += this.vy;
  }
}

class WaterSimulation {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: 0, y: 0, down: false };
    this.lastTime = 0;
    this.init();
    this.bindEvents();
    this.animate();
  }

  init() {
    // Create initial particles to fill the width
    const particleSpacing = 5;
    const rows = Math.floor(this.canvas.height / 2 / particleSpacing);
    const cols = Math.floor(this.canvas.width / particleSpacing);
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        this.particles.push(new Particle(
          x * particleSpacing,
          y * particleSpacing
        ));
      }
    }
  }

  bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });

    this.canvas.addEventListener('mousedown', () => {
      this.mouse.down = true;
    });

    this.canvas.addEventListener('mouseup', () => {
      this.mouse.down = false;
    });

    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    // Reinitialize particles when resizing
    this.particles = [];
    this.init();
  }

  update(delta) {
    for (const particle of this.particles) {
      particle.update(delta);

      // Constrain to canvas bounds
      if (particle.x < 0) {
        particle.x = 0;
        particle.vx *= -0.5;
      }
      if (particle.x > this.canvas.width) {
        particle.x = this.canvas.width;
        particle.vx *= -0.5;
      }
      if (particle.y < 0) {
        particle.y = 0;
        particle.vy *= -0.5;
      }
      if (particle.y > this.canvas.height) {
        particle.y = this.canvas.height;
        particle.vy *= -0.5;
      }

      // Mouse interaction
      if (this.mouse.down) {
        const dx = particle.x - this.mouse.x;
        const dy = particle.y - this.mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 50) {
          particle.vx += (dx / dist) * 2;
          particle.vy += (dy / dist) * 2;
        }
      }

      // Apply simple fluid dynamics
      for (const other of this.particles) {
        if (other === particle) continue;
        
        const dx = other.x - particle.x;
        const dy = other.y - particle.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < 5) {
          const force = (5 - dist) / 5;
          particle.vx -= (dx / dist) * force * 0.03;
          particle.vy -= (dy / dist) * force * 0.03;
        }
      }

      // Apply velocity damping
      particle.vx *= 0.995;
      particle.vy *= 0.995;
    }
  }

  draw() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw particles with a gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, 'rgba(79, 164, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(79, 164, 255, 0.2)');
    
    this.ctx.fillStyle = gradient;
    for (const particle of this.particles) {
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  animate(time = 0) {
    const delta = (time - this.lastTime) / 1000;
    this.lastTime = time;

    this.update(delta);
    this.draw();
    requestAnimationFrame((t) => this.animate(t));
  }
}

// Initialize the simulation
const canvas = document.getElementById('canvas');
new WaterSimulation(canvas);