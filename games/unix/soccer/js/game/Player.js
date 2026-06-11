class Player {
  constructor(team) {
    this.team = team;

    this.pos = p.createVector(
      50 + (WIDTH - 50 * 2) * team,
      HEIGHT - GROUND_HEIGHT - PLAYER_SIZE
    );
    this.vel = p.createVector(0, 0);

    this.radius = PLAYER_SIZE;
    this.mass = PLAYER_MASS;
    this.speed = PLAYER_SPEED;
	this.skin = localStorage.getItem("playerSkin") || "white";
  }

  update() {
    this.pos.add(this.vel);

    this.vel.x *= 0.95;

    if (this.pos.y > HEIGHT - GROUND_HEIGHT - PLAYER_SIZE) {
      this.vel.y *= -0.4;
      this.pos.y = HEIGHT - GROUND_HEIGHT - PLAYER_SIZE;
    } else {
      this.vel.y += GRAVITY;
    }

    if (this.pos.x < PLAYER_SIZE || this.pos.x > WIDTH - PLAYER_SIZE) {
      this.vel.x *= -1;
      if (this.pos.x < PLAYER_SIZE) {
        this.pos.x = PLAYER_SIZE;
      } else {
        this.pos.x = WIDTH - PLAYER_SIZE;
      }
    }
  }

  move(acc) {
    this.vel.x += acc;
  }

  jump() {
    if (this.pos.y >= HEIGHT - GROUND_HEIGHT - PLAYER_SIZE) {
      this.vel.y = -PLAYER_JUMP;
    }
  }

  moveAutomatic() {
    let closeness = (ball.pos.x - this.pos.x) * ((this.team - 0.5) * 2);
    if (
      (age > 60 && this.pos.y - ball.pos.y > 40) ||
      (0 < closeness && closeness < 100)
    ) {
      this.jump();
    }

    let boundary =
      ball.pos.x + (this.team - 0.5) * 2 * (PLAYER_SIZE + BALL_SIZE) * 0.9;
    if (this.pos.x > boundary) {
      this.move(-this.speed);
    } else {
      this.move(this.speed);
    }
  }

  display() {
    p.stroke('#fff');
    p.strokeWeight(2);

    let fillColor = '#fff';

    switch (this.skin) {
        case 'white': fillColor = '#ffffff'; break;
        case 'black': fillColor = '#000000'; break;
        case 'red': fillColor = '#ff4444'; break;
        case 'blue': fillColor = '#4287f5'; break;
        case 'gold': fillColor = '#ffd700'; break;

        case 'rainbow':
            // Animated rainbow
            const t = p.millis() * 0.002;
            fillColor = p.color(
                128 + 128 * Math.sin(t),
                128 + 128 * Math.sin(t + 2),
                128 + 128 * Math.sin(t + 4)
            );
            break;
    }

    p.fill(fillColor);
    p.ellipseMode('center');
    p.ellipse(this.pos.x, this.pos.y, PLAYER_SIZE * 2);
}

}
