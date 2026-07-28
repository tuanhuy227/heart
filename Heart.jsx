import React, { useEffect, useRef, useState } from 'react';
import './Heart.css';

const Heart = () => {
  const canvasRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showMessageSection, setShowMessageSection] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setShowMessageSection(true);
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
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
  }, []);

  const handleAddMessage = () => {
    if (newMessage.trim()) {
      setMessages([...messages, { text: newMessage, time: new Date().toLocaleString('vi-VN') }]);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddMessage();
    }
  };

  return (
    <div className="heart-container" onClick={() => !isOpen && setIsOpen(true)}>
      {/* Hidden YouTube iframe for music - only loads when opened */}
      {isOpen && (
        <iframe
          style={{ display: 'none' }}
          src="https://www.youtube.com/embed/DK23U3sJrYg?autoplay=1&mute=0&loop=1&playlist=DK23U3sJrYg&controls=0"
          allow="autoplay; encrypted-media"
          title="Background Music"
        />
      )}
      
      {!isOpen ? (
        <div className="message-container">
          <h1>Chào Phương Thảo nha!</h1>
          <div className="heart-emoji">💖</div>
          <p>Anh có một món quà tặng em</p>
          <p className="click-hint">Click để mở quà nhé! ✨</p>
        </div>
      ) : !showMessageSection ? (
        <div className="message-container">
          <div className="heart-emoji">💖</div>
          <h1 className="phuong-thao-name">Phương Thảo</h1>
        </div>
      ) : (
        <div className="gift-opened" onClick={(e) => e.stopPropagation()}>
          <div className="gift-content">
            <h1>💝 Món Quà Của Anh 💝</h1>
            <div className="gift-message">
              <p>Gửi Phương Thảo yêu quý,</p>
              <p>Đây là món quà nhỏ anh muốn tặng em</p>
              <p>Hãy để lại lời nhắn cho anh nhé! 💖</p>
            </div>

            <div className="message-section">
              <h2>💌 Lời Nhắn</h2>
              
              <div className="message-input-area">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Viết lời nhắn của em tại đây..."
                  rows="4"
                />
                <button onClick={handleAddMessage} className="send-button">
                  Gửi lời nhắn 💕
                </button>
              </div>

              {messages.length > 0 && (
                <div className="messages-list">
                  <h3>Các lời nhắn đã gửi:</h3>
                  {messages.map((msg, index) => (
                    <div key={index} className="message-item">
                      <p className="message-text">{msg.text}</p>
                      <p className="message-time">{msg.time}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} id="pinkboard"></canvas>
    </div>
  );
};

export default Heart;
