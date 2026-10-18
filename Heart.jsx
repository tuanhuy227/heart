import React, { useEffect, useRef, useState } from 'react';
import './Heart.css';

const Heart = () => {
  const canvasRef = useRef(null);
  const fireworksRef = useRef(null);
  const [answered, setAnswered] = useState(false);

  const handleYes = () => {
    setAnswered(true);
  };

  useEffect(() => {
    if (!answered) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const settings = {
      particles: {
        length: 500,
        duration: 2,
        velocity: 100,
        effect: -0.75,
        size: 30,
      },
    };

    class Point {
      constructor(x, y) {
        this.x = typeof x !== 'undefined' ? x : 0;
        this.y = typeof y !== 'undefined' ? y : 0;
      }
      clone() {
        return new Point(this.x, this.y);
      }
      length(length) {
        if (typeof length == 'undefined')
          return Math.sqrt(this.x * this.x + this.y * this.y);
        this.normalize();
        this.x *= length;
        this.y *= length;
        return this;
      }
      normalize() {
        var length = this.length();
        this.x /= length;
        this.y /= length;
        return this;
      }
    }

    class Particle {
      constructor() {
        this.position = new Point();
        this.velocity = new Point();
        this.acceleration = new Point();
        this.age = 0;
      }
      initialize(x, y, dx, dy) {
        this.position.x = x;
        this.position.y = y;
        this.velocity.x = dx;
        this.velocity.y = dy;
        this.acceleration.x = dx * settings.particles.effect;
        this.acceleration.y = dy * settings.particles.effect;
        this.age = 0;
      }
      update(deltaTime) {
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.velocity.x += this.acceleration.x * deltaTime;
        this.velocity.y += this.acceleration.y * deltaTime;
        this.age += deltaTime;
      }
      draw(context, image) {
        function ease(t) {
          return (--t) * t * t + 1;
        }
        var size = image.width * ease(this.age / settings.particles.duration);
        context.globalAlpha = 1 - this.age / settings.particles.duration;
        context.drawImage(image, this.position.x - size / 2, this.position.y - size / 2, size, size);
      }
    }

    class ParticlePool {
      constructor(length) {
        this.particles = new Array(length);
        for (var i = 0; i < this.particles.length; i++)
          this.particles[i] = new Particle();
        this.firstActive = 0;
        this.firstFree = 0;
        this.duration = settings.particles.duration;
      }
      add(x, y, dx, dy) {
        this.particles[this.firstFree].initialize(x, y, dx, dy);
        this.firstFree++;
        if (this.firstFree == this.particles.length) this.firstFree = 0;
        if (this.firstActive == this.firstFree) this.firstActive++;
        if (this.firstActive == this.particles.length) this.firstActive = 0;
      }
      update(deltaTime) {
        var i;
        if (this.firstActive < this.firstFree) {
          for (i = this.firstActive; i < this.firstFree; i++)
            this.particles[i].update(deltaTime);
        }
        if (this.firstFree < this.firstActive) {
          for (i = this.firstActive; i < this.particles.length; i++)
            this.particles[i].update(deltaTime);
          for (i = 0; i < this.firstFree; i++)
            this.particles[i].update(deltaTime);
        }
        while (this.particles[this.firstActive].age >= this.duration && this.firstActive != this.firstFree) {
          this.firstActive++;
          if (this.firstActive == this.particles.length) this.firstActive = 0;
        }
      }
      draw(context, image) {
        if (this.firstActive < this.firstFree) {
          for (var i = this.firstActive; i < this.firstFree; i++)
            this.particles[i].draw(context, image);
        }
        if (this.firstFree < this.firstActive) {
          for (var i = this.firstActive; i < this.particles.length; i++)
            this.particles[i].draw(context, image);
          for (var i = 0; i < this.firstFree; i++)
            this.particles[i].draw(context, image);
        }
      }
    }

    function pointOnHeart(t) {
      return new Point(
        160 * Math.pow(Math.sin(t), 3),
        130 * Math.cos(t) - 50 * Math.cos(2 * t) - 20 * Math.cos(3 * t) - 10 * Math.cos(4 * t) + 25
      );
    }

    const context = canvas.getContext('2d');
    const particles = new ParticlePool(settings.particles.length);
    const particleRate = settings.particles.length / settings.particles.duration;
    let time;

    // Create particle image
    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d');
    tempCanvas.width = settings.particles.size;
    tempCanvas.height = settings.particles.size;

    function to(t) {
      var point = pointOnHeart(t);
      point.x = settings.particles.size / 2 + point.x * settings.particles.size / 350;
      point.y = settings.particles.size / 2 - point.y * settings.particles.size / 350;
      return point;
    }

    tempContext.beginPath();
    var t = -Math.PI;
    var point = to(t);
    tempContext.moveTo(point.x, point.y);
    while (t < Math.PI) {
      t += 0.01;
      point = to(t);
      tempContext.lineTo(point.x, point.y);
    }
    tempContext.closePath();
    tempContext.fillStyle = '#ea80b0';
    tempContext.fill();

    const image = new Image();
    image.src = tempCanvas.toDataURL();

    function render() {
      requestAnimationFrame(render);
      
      var newTime = new Date().getTime() / 1000;
      var deltaTime = newTime - (time || newTime);
      time = newTime;
      
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      var amount = particleRate * deltaTime;
      for (var i = 0; i < amount; i++) {
        var pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());
        var dir = pos.clone().length(settings.particles.velocity);
        particles.add(canvas.width / 2 + pos.x, canvas.height / 2 - pos.y, dir.x, -dir.y);
      }
      
      particles.update(deltaTime);
      particles.draw(context, image);
    }

    function onResize() {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }

    window.addEventListener('resize', onResize);
    onResize();
    render();

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [answered]);

  // Fireworks effect
  useEffect(() => {
    if (!answered) return;
    
    const canvas = fireworksRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;
    
    class Firework {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.createParticles();
      }
      
      createParticles() {
        const particleCount = 30;
        const colors = ['#ff6b9d', '#c06c84', '#ea80b0', '#ffd700', '#ff69b4', '#ffb6c1'];
        for (let i = 0; i < particleCount; i++) {
          const angle = (Math.PI * 2 * i) / particleCount;
          const velocity = 2 + Math.random() * 3;
          this.particles.push({
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            life: 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 2 + Math.random() * 3
          });
        }
      }
      
      update() {
        this.particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.05; // gravity
          p.life -= 0.01;
        });
        this.particles = this.particles.filter(p => p.life > 0);
      }
      
      draw(ctx) {
        this.particles.forEach(p => {
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }
    
    function animate() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((fw, index) => {
        fw.update();
        fw.draw(ctx);
        if (fw.particles.length === 0) {
          particles.splice(index, 1);
        }
      });
      
      animationId = requestAnimationFrame(animate);
    }
    
    function createFirework() {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height * 0.5;
      particles.push(new Firework(x, y));
    }
    
    function onResize() {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }
    
    window.addEventListener('resize', onResize);
    onResize();
    animate();
    
    const interval = setInterval(createFirework, 500);
    
    return () => {
      window.removeEventListener('resize', onResize);
      clearInterval(interval);
      cancelAnimationFrame(animationId);
    };
  }, [answered]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
    }
  };

  return (
    <div className="heart-container">
      {/* Hidden YouTube iframe for music - only loads when answered yes */}
      {answered && (
        <iframe
          style={{ display: 'none' }}
          src="https://www.youtube.com/embed/DK23U3sJrYg?autoplay=1&mute=0&loop=1&playlist=DK23U3sJrYg&controls=0"
          allow="autoplay; encrypted-media"
          title="Background Music"
        />
      )}
      
      {!answered ? (
        <div className="message-container">
          <div className="photo-frame">
            <img src="/image.png" alt="Thảo My" className="birthday-photo" />
          </div>
          
          <h1 className="confession-question">Em có đồng ý làm người yêu anh không</h1>
          <h2 className="confession-name">Thảo My</h2>
          
          <div className="buttons-container">
            <button className="yes-button" onClick={handleYes}>
              💖 Đồng ý
            </button>
            <button className="yes-button yes-button-2" onClick={handleYes}>
              💕 Đồng ý luôn
            </button>
          </div>
        </div>
      ) : (
        <div className="gift-opened">
          <div className="gift-content">
            <h1>💝 Yêu Em 💝</h1>
            
            <div className="photo-frame">
              <img src="/image.png" alt="Thảo My" className="birthday-photo" />
            </div>
            
            <div className="birthday-wishes">
              <div className="cat-happy">
                <span style={{fontSize: '60px'}}>😻</span>
                <p style={{fontSize: '20px', margin: '10px 0'}}>Anh thích em!</p>
              </div>
            </div>
            <div className="gift-message">
              <p>💖 Thảo My ơi 💖</p>
              <p>Cậu biết không, sau một thời gian tìm hiểu</p>
              <p>Con tim tớ đã thuộc về 1 người</p>
              <p>Cậu đồng ý làm người yêu tớ nhé Thảo My 💕</p>
            </div>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} id="pinkboard"></canvas>
      {answered && <canvas ref={fireworksRef} className="fireworks-canvas"></canvas>}
    </div>
  );
};

export default Heart;
