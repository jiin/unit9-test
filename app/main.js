(function() {
  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.requestAnimationFrame = requestAnimationFrame;
})();

var Game = function(canvasID) {
  
  this.canvas = document.getElementById(canvasID);
  this.ctx    = this.canvas.getContext('2d');

  this.stats  = {
    hp: document.getElementById('stats-hp-value'),
    frame: document.getElementById('stats-frame-value')
  };

  this.width = 1200;
  this.height = 800;

  this.character = {
    w: 30,
    h: 30,
    x: (this.width / 2) - 25,
    y: this.height - 50,
    speed: 8,
    velX: 0,
    velY: 0,
    jumping: false,
    flying: false,
    hp: 100,
    damage: 10,
    shooting: false,
    color: '#e74c3c'
  };

  this.keys  = [];
  this.shots = [];

  this.friction = 0.8;
  this.gravity  = 0.8;

  this.too_near = false;

  this.frameCount = 0;

  this.enemiesClasses = {
    sniper: {
      name: 'sniper',
      hp: 30,
      damage: 40,
      width: 20,
      height: 60,
      color: '#9b59b6',
      w: 20,
      h: 2,
      hits: 4
    },

    assaulter: {
      name: 'assaulter',
      hp: 60,
      damage: 10,
      width: 20,
      height: 60,
      color: '#16a085',
      w: 3,
      h: 2,
      hits: 10
    }
  };


  this.obstacles = [
    [0, 150, 400],
    [800, 300, this.width],
    [200, 500, this.width / 2]
  ];


  this.enemies = [
    { 
      type: this.enemiesClasses.sniper,
      floor: this.obstacles[0],
      x: -150,
      y: 90,
      direction: 'left'
    },
    { 
      type: this.enemiesClasses.assaulter,
      floor: this.obstacles[1],
      x: 0,
      y: 240,
      direction: 'right'
    }, 
    { 
      type: this.enemiesClasses.sniper,
      floor: this.obstacles[2],
      x: 150,
      y: 440,
      direction: 'left'
    }
  ];

  this.keyCodes = {
    W: 87,
    A: 65,
    S: 83,
    D: 68,
    FL: 75,
    FR: 76
  };

  document.body.addEventListener('keydown', this.pressKey.bind(this), false);
  document.body.addEventListener('keyup', this.releaseKey.bind(this), false);

  window.addEventListener('load', this.loop.bind(this));
};

Game.prototype.clear = function() {
  this.ctx.clearRect(0, 0, this.width, this.height);
};

Game.prototype.pressKey = function(event) {
  this.keys[event.keyCode] = true;
};

Game.prototype.releaseKey = function(event) {
  this.keys[event.keyCode] = false;
};

Game.prototype.drawEnemy = function(enemy) {
  this.ctx.fillStyle = enemy.type.color;
  this.ctx.fillRect((enemy.floor[0] + enemy.floor[2]) / 2 + enemy.x, enemy.floor[1] - enemy.type.height, enemy.type.width, enemy.type.height);
}

Game.prototype.drawCharacter = function() {
  this.ctx.fillStyle = this.character.color;
  this.ctx.fillRect(this.character.x, this.character.y, this.character.w, this.character.h);
};

Game.prototype.drawLoserFrame = function() {
  this.clear();

  this.ctx.font       = '76px Georgia';
  this.ctx.fillStyle  = 'red';

  this.ctx.fillText('You lose.', this.width / 2 - 150, this.height / 2);
};

Game.prototype.drawWinnerFrame = function() {
  this.clear();

  this.ctx.font       = '76px Georgia';
  this.ctx.fillStyle  = 'green';

  this.ctx.fillText('You win!', this.width / 2 - 150, this.height / 2);
};

Game.prototype.loop = function() {

  var i, delta, ob;

  this.clear();

  this.too_near = false;

  /* Draw the walls */

  Object(this.obstacles).forEach(function (obstacle) {
    this.ctx.beginPath();
    this.ctx.moveTo(obstacle[0], obstacle[1]);
    this.ctx.lineTo(obstacle[2], obstacle[1]);
    this.ctx.stroke();
  }, this);

  /* Draw the enemies */

  Object(this.enemies).forEach(function (enemy) {
    this.drawEnemy(enemy);
  }, this);


  /* Move the enemies */

  for(i = 0; i < this.enemies.length; i++) {
    if (this.enemies[i].direction == 'left' && this.enemies[i].x !== -150) {
      this.enemies[i].x -= 5;
    } else if (this.enemies[i].direction == 'right' && this.enemies[i].x !== 150) {
      this.enemies[i].x += 5;
    }

    if (!(this.enemies[i].x % (300 / this.enemies[i].type.hits))) {

      this.shots.push({
        x: (this.enemies[i].floor[0] + this.enemies[i].floor[2]) / 2 + this.enemies[i].x + 10, 
        y: this.enemies[i].y + 15,
        w: this.enemies[i].type.w,
        h: this.enemies[i].type.h,
        damage: this.enemies[i].type.damage,
        from: this.enemies[i].type.name,
        direction: this.enemies[i].direction
      });

    }

    if (this.enemies[i].x == 150)
      this.enemies[i].direction = 'left';

    if (this.enemies[i].x == -150)
      this.enemies[i].direction = 'right';
  }

  /* OTHER ROUTES */

  if (this.keys[this.keyCodes.W]) {

    if (this.character.jumping)
      this.character.flying = true;

    if (!this.character.jumping)
      this.character.jumping = true;

    if (this.character.flying)
      this.character.velY = -this.character.speed;

    if (!this.character.flying && this.character.jumping)
      this.character.velY = -this.character.speed * 2;

  } else {
    this.character.jumping = false;
  }


  if (this.shots.length) {
    for(i = 0; i < this.shots.length; i++) {

      if (this.shots[i].x >= parseInt(this.character.x - this.character.w) && this.shots[i].x <= parseInt(this.character.x + this.character.w) && this.shots[i].y >= parseInt(this.character.y - this.character.h) && this.shots[i].y <= parseInt(this.character.y + this.character.h) && this.shots[i].from !== 'self') {

        this.character.hp -= this.shots[i].damage;
        this.shots.splice(i, 1);

      } else {

        if (this.shots[i].direction == 'left') {
          if (this.shots[i].x > 0) {
            this.shots[i].x -= 10;
          } else if (this.shots[i].x <= 0) {
            this.shots.splice(i, 1);
          }
        } else {
          if (this.shots[i].x < this.width) {
            this.shots[i].x += 10;
          } else if (this.shots[i].x >= this.width) {
            this.shots.splice(i, 1);
          }
        }

        if (!this.shots[i])
          continue;

        for(j = 0; j < this.enemies.length; j++) {

          if (this.shots[i].x >= parseInt((this.enemies[j].floor[0] + this.enemies[j].floor[2]) / 2 + (this.enemies[j].x - this.enemies[j].type.width))
           && this.shots[i].x <= parseInt((this.enemies[j].floor[0] + this.enemies[j].floor[2]) / 2 + (this.enemies[j].x + this.enemies[j].type.width)) 
           && this.shots[i].y >= parseInt((this.enemies[j].floor[1] - this.enemies[j].type.height))
           && this.shots[i].y <= parseInt((this.enemies[j].floor[1] + this.enemies[j].type.height))
           && this.shots[i].from === 'self') {

            this.enemies[j].type.hp -= this.character.damage;

            if (this.enemies[j].type.hp <= 0)
              this.enemies.splice(j, 1);

            this.shots.splice(i, 1);
          }        
        }

      }
    }

    for(i = 0; i < this.shots.length; i++) {
      this.ctx.fillStyle = '#d35400';
      this.ctx.fillRect(this.shots[i].x, this.shots[i].y, this.shots[i].w, this.shots[i].h);
    }
  }

  if (this.keys[this.keyCodes.FL] || this.keys[this.keyCodes.FR]) {

  if (this.shots.length > 0) {
    if (Math.abs(this.character.x - this.shots[this.shots.length - 1].x) <= 100) {
      this.too_near = true;
    }
  }

    if (!this.too_near)
      this.shots.push({
        x: this.character.x + 10, 
        y: this.character.y,
        w: 6,
        h: 3,
        damage: this.character.damage,
        from: 'self',
        direction: (this.keys[this.keyCodes.FL]) ? 'left' : 'right'
      });
  }

  if (this.keys[this.keyCodes.D]) {
    if (this.character.velX < this.character.speed) {
        this.character.velX++;
    }
  }

  if (this.keys[this.keyCodes.A]) {
    if (this.character.velX > -this.character.speed) {
        this.character.velX--;
    }
  }
 
  if (this.character.flying)
    this.character.velX *= this.friction;

  if (!this.keys[this.keyCodes.W])
    this.character.velY += this.gravity;

  for(i = 0; i < this.obstacles.length; i++) {

    delta = (parseInt(this.character.y) - this.character.h);
    ob    = this.obstacles[i];

    if (delta > (ob[1] - 40) && delta <= ob[1] - 25 && this.character.x >= ob[0] && this.character.x <= ob[2]) {

      if (!this.blocking)
        this.character.y = ob[1] - 10;
    
      this.blocking = true;
      this.character.velY = 8.9;
    }

    if (delta < ob[1] - 40 && delta >= ob[1] - 60 && this.character.x >= ob[0] && this.character.x <= ob[2]) {

      this.character.y = ob[1] - this.character.h;

      if (!this.character.jumping) 
        this.character.velY = 0;

      this.character.flying = false;
    }
  }

  this.character.x += this.character.velX;
  this.character.y += this.character.velY;
  
  if (this.character.x >= this.width - this.character.w) {
      this.character.x = this.width - this.character.w;
  } else if (this.character.x <= 0) {
      this.character.x = 0;
  }

  if(this.character.y >= this.height - this.character.h){
    this.character.y = this.height - this.character.h;
    this.character.jumping = false;
    this.character.flying  = false;
  } else if (this.character.y <= 0) {
    this.character.y = 0;
  }

  this.stats.hp.style.width  = this.character.hp + '%';
  this.stats.frame.innerHTML = this.frameCount; 

  this.ctx.fillStyle = "red";
  this.ctx.fillRect(this.character.x, this.character.y, this.character.w, this.character.h);

  this.frameCount += 1;

  if (this.character.hp <= 0) {
    this.stats.hp.style.width = '0%';

    this.drawLoserFrame();
  } else if (!this.enemies.length) {
    this.drawWinnerFrame();
  }else {
    requestAnimationFrame(this.loop.bind(this));
  }
};
