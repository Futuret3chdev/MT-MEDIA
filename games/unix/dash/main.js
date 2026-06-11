window.requestAnimFrame = (function() {
  return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
  function(callback) {
    window.setTimeout(callback, 1000 / 60);
  };
})();

var canvas = document.getElementById('canvas'),
  ctx = canvas.getContext('2d');

var baseWidth = 422,
  baseHeight = 552;

var width = baseWidth,
  height = baseHeight;

var scaleX = 1,
  scaleY = 1;

var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (isMobile) {
  width = window.innerWidth;
  height = window.innerHeight;
  scaleX = width / baseWidth;
  scaleY = height / baseHeight;
}

canvas.width = width;
canvas.height = height;

var platforms = [],
  image = document.getElementById("sprite"),
  player, platformCount = 10,
  position = 0,
  gravity = 0.2,
  animloop,
  flag = 0,
  menuloop, broken = 0,
  dir, score = 0, firstRun = true;

// Move constructors up to ensure they are defined before use
var Base = function() {
  this.height = 5;
  this.width = baseWidth;

  this.cx = 0;
  this.cy = 614;
  this.cwidth = 100;
  this.cheight = 5;

  this.moved = 0;

  this.x = 0;
  this.y = baseHeight - this.height;

  this.draw = function() {
    try {
      if (isSpriteLoaded) {
        ctx.drawImage(image, this.cx, this.cy, this.cwidth, this.cheight, 
          this.x * scaleX, this.y * scaleY, this.width * scaleX, this.height * scaleY);
      } else {
        ctx.fillStyle = 'gray';
        ctx.fillRect(this.x * scaleX, this.y * scaleY, this.width * scaleX, this.height * scaleY);
      }
      console.log("Base drawn at x:", this.x, "y:", this.y);
    } catch (e) {
      console.error("Error drawing base:", e.message);
    }
  };
};

var Player = function() {
  this.vy = 11;
  this.vx = 0;

  this.isMovingLeft = false;
  this.isMovingRight = false;
  this.isDead = false;

  this.width = 55;
  this.height = 40;

  this.cx = 0;
  this.cy = 0;
  this.cwidth = 110;
  this.cheight = 80;

  this.dir = "left";

  this.x = baseWidth / 2 - this.width / 2;
  this.y = baseHeight - this.height;

  this.draw = function() {
    try {
      console.log("Attempting to draw player at frame:", performance.now());
      if (isSpriteLoaded) {
        if (this.dir == "right") this.cy = 121;
        else if (this.dir == "left") this.cy = 201;
        else if (this.dir == "right_land") this.cy = 289;
        else if (this.dir == "left_land") this.cy = 371;
        const scaledX = this.x * scaleX;
        const scaledY = this.y * scaleY;
        const scaledWidth = this.width * scaleX;
        const scaledHeight = this.height * scaleY;
        ctx.drawImage(image, this.cx, this.cy, this.cwidth, this.cheight, 
          scaledX, scaledY, scaledWidth, scaledHeight);
        console.log("Player drawn with sprite at x:", scaledX, "y:", scaledY, "width:", scaledWidth, "height:", scaledHeight);
      } else {
        ctx.fillStyle = 'red';
        const scaledX = this.x * scaleX;
        const scaledY = this.y * scaleY;
        const scaledWidth = this.width * scaleX;
        const scaledHeight = this.height * scaleY;
        ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);
        console.log("Drawing placeholder for player at x:", scaledX, "y:", scaledY, "width:", scaledWidth, "height:", scaledHeight);
      }
    } catch (e) {
      console.error("Error drawing player:", e.message);
    }
  };

  this.jump = function() {
    this.vy = -8;
  };

  this.jumpHigh = function() {
    this.vy = -16;
  };
};

function Platform() {
  this.width = 70;
  this.height = 17;

  this.x = Math.random() * (baseWidth - this.width);
  this.y = position;

  position += (baseHeight / platformCount);

  this.flag = 0;
  this.state = 0;

  this.cx = 0;
  this.cy = 0;
  this.cwidth = 105;
  this.cheight = 31;

  this.draw = function() {
    try {
      if (isSpriteLoaded) {
        if (this.type == 1) this.cy = 0;
        else if (this.type == 2) this.cy = 61;
        else if (this.type == 3 && this.flag === 0) this.cy = 31;
        else if (this.type == 3 && this.flag == 1) this.cy = 1000;
        else if (this.type == 4 && this.state === 0) this.cy = 90;
        else if (this.type == 4 && this.state == 1) this.cy = 1000;
        ctx.drawImage(image, this.cx, this.cy, this.cwidth, this.cheight, 
          this.x * scaleX, this.y * scaleY, this.width * scaleX, this.height * scaleY);
      } else {
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.x * scaleX, this.y * scaleY, this.width * scaleX, this.height * scaleY);
      }
      console.log("Platform drawn at x:", this.x, "y:", this.y);
    } catch (e) {
      console.error("Error drawing platform:", e.message);
    }
  };

  if (score >= 5000) this.types = [2, 3, 3, 3, 4, 4, 4, 4];
  else if (score >= 2000 && score < 5000) this.types = [2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4];
  else if (score >= 1000 && score < 2000) this.types = [2, 2, 2, 3, 3, 3, 3, 3];
  else if (score >= 500 && score < 1000) this.types = [1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3];
  else if (score >= 100 && score < 500) this.types = [1, 1, 1, 1, 2, 2];
  else this.types = [1];

  this.type = this.types[Math.floor(Math.random() * this.types.length)];

  if (this.type == 3 && broken < 1) {
    broken++;
  } else if (this.type == 3 && broken >= 1) {
    this.type = 1;
    broken = 0;
  }

  this.moved = 0;
  this.vx = 1;
}

var Platform_broken_substitute = function() {
  this.height = 30;
  this.width = 70;

  this.x = 0;
  this.y = 0;

  this.cx = 0;
  this.cy = 554;
  this.cwidth = 105;
  this.cheight = 60;

  this.appearance = false;

  this.draw = function() {
    try {
      if (this.appearance === true) {
        if (isSpriteLoaded) {
          ctx.drawImage(image, this.cx, this.cy, this.cwidth, this.cheight, 
            this.x * scaleX, this.y * scaleY, this.width * scaleX, this.height * scaleY);
        } else {
          ctx.fillStyle = 'gray';
          ctx.fillRect(this.x * scaleX, this.y * scaleY, this.width * scaleX, this.height * scaleY);
        }
      }
    } catch (e) {
      console.error("Error drawing broken platform:", e.message);
    }
  };
};

function Spring() {
  this.x = 0;
  this.y = 0;

  this.width = 26;
  this.height = 30;

  this.cx = 0;
  this.cy = 0;
  this.cwidth = 45;
  this.cheight = 53;

  this.state = 0;

  this.draw = function() {
    try {
      if (isSpriteLoaded) {
        if (this.state === 0) this.cy = 445;
        else if (this.state == 1) this.cy = 501;
        ctx.drawImage(image, this.cx, this.cy, this.cwidth, this.cheight, 
          this.x * scaleX, this.y * scaleY, this.width * scaleX, this.height * scaleY);
      } else {
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x * scaleX, this.y * scaleY, this.width * scaleX, this.height * scaleY);
      }
    } catch (e) {
      console.error("Error drawing spring:", e.message);
    }
  };
}

// Initialize game elements after constructors are defined
var base = new Base();
var player = new Player();
var spring = new Spring();
var platform_broken_substitute = new Platform_broken_substitute();
for (var i = 0; i < platformCount; i++) {
  platforms.push(new Platform());
}
player.x = baseWidth / 2 - player.width / 2;
player.y = baseHeight - player.height;

var lastTime = performance.now();
var deltaTime = 0;

var isSpriteLoaded = false;
var isGameStarted = false;
var maxRetries = 3;
var retryDelay = 200;
var retryCount = 0;

// Check if the game is running in Telegram and get the username
var telegramUser = null;
if (window.Telegram && window.Telegram.WebApp) {
  window.Telegram.WebApp.expand();
  const initData = window.Telegram.WebApp.initData;
  if (initData) {
    try {
      const params = new URLSearchParams(initData);
      const user = JSON.parse(params.get('user'));
      if (user && user.username) {
        telegramUser = { username: user.username };
        console.log('Telegram user detected:', telegramUser);
      }
    } catch (e) {
      console.error('Failed to parse Telegram initData:', e.message);
    }
  }
}

function preloadSprite() {
  console.log('Preloading sprite...');
  const sprite = new Image();
  sprite.src = 'sprites.png';
  sprite.onload = function() {
    console.log("Sprite image loaded successfully");
    isSpriteLoaded = true;
    image.src = sprite.src;
    document.getElementById('loadingMessage').style.display = 'none';
    // Show the Play button only when the sprite is loaded
    document.querySelector('.button').classList.remove('hidden');
    // Force a redraw of the canvas to ensure the character appears
    menu,menuLoop();
  };
  sprite.onerror = function() {
    retryCount++;
    if (retryCount < maxRetries) {
      console.warn(`Sprite preload failed, retrying (${retryCount}/${maxRetries})...`);
      setTimeout(preloadSprite, retryDelay);
    } else {
      console.error("Failed to preload sprite image after", maxRetries, "retries");
      isSpriteLoaded = false;
      document.getElementById('loadingMessage').style.display = 'none';
      // Show the Play button even if sprite fails (will show red placeholder)
      document.querySelector('.button').classList.remove('hidden');
      // Force a redraw even if sprite fails
      menuLoop();
    }
  };
}

preloadSprite();

async function saveHighScore(score) {
  const telegramScore = Math.floor(score);
  let playerName;

  if (telegramUser && telegramUser.username) {
    playerName = `@${telegramUser.username}`;
    console.log('Auto-using Telegram username:', playerName);
  } else {
    playerName = prompt('Enter your username (up to 20 characters, letters, numbers, @, -, space allowed):');
    if (playerName) {
      playerName = playerName.trim().slice(0, 20);
    }
    console.log('Prompted username:', playerName);
    if (!playerName) {
      playerName = 'Anonymous';
    } else if (!/^[a-zA-Z0-9_@ -]+$/.test(playerName)) {
      alert('Invalid username. Use only letters, numbers, underscores, @, hyphens, or spaces.');
      console.log('Invalid username rejected:', playerName);
      return false;
    }
  }

  try {
    const response = await fetch('leaderboard.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_name: playerName, score: telegramScore })
    });
    const responseData = await response.json();
    if (!response.ok) throw new Error(`Failed to save score: ${responseData.error || response.statusText}`);
    console.log('Score saved successfully:', { player_name: playerName, score: telegramScore });
    return true;
  } catch (error) {
    console.error('Error saving score:', error.message);
    alert('Failed to save score: ' + error.message);
    return false;
  }
}

async function displayHighScores() {
  try {
    const response = await fetch('leaderboard.php');
    const responseData = await response.json();
    if (!response.ok) throw new Error(`Failed to fetch scores: ${responseData.error || response.statusText}`);
    const list = document.getElementById('highScoresList');
    list.innerHTML = '';
    responseData.forEach((entry, index) => {
      const li = document.createElement('li');
      li.textContent = `${index + 1}. ${entry.player_name}: ${entry.score}`;
      list.appendChild(li);
    });
    console.log('Leaderboard loaded:', responseData);
  } catch (error) {
    console.error('Error fetching scores:', error.message);
    alert('Failed to load leaderboard: ' + error.message);
  }
}

function postToTelegram() {
  const botToken = '7899518581:AAGWGghZCOSN_Dyoi-7GDNAJYQBvPvR5ozk';
  const chatId = '-1002403282101';
  const telegramScore = Math.floor(score);
  const message = 'I just scored ' + telegramScore + ' in Doodle Dash by Futuret3ch | MemeTorrent';

  const url = 'https://api.telegram.org/bot' + botToken + '/sendMessage';

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message
    })
  })
  .then(function(response) {
    if (!response.ok) {
      throw new Error('Failed to post to Telegram');
    }
    return response.json();
  })
  .then(function(data) {
    console.log('Posted to Telegram:', data);
    alert('Score posted to Telegram group!');
  })
  .catch(function(error) {
    console.error('Error posting to Telegram:', error.message);
    alert('Failed to post to Telegram. Please try again.');
  });
}

function handleTouchStart(e) {
  e.preventDefault();
  console.log('Touchstart triggered:', JSON.stringify(e));
  if (!isSpriteLoaded && !image.src) {
    console.log('Touchstart ignored: sprites not loaded');
    return;
  }
  var touch = e.touches[0];
  var canvasRect = canvas.getBoundingClientRect();
  var touchX = (touch.clientX - canvasRect.left) / scaleX;

  if (touchX < baseWidth / 2) {
    dir = "left";
    player.isMovingLeft = true;
    player.isMovingRight = false;
  } else {
    dir = "right";
    player.isMovingRight = true;
    player.isMovingLeft = false;
  }

  if (touchX > baseWidth / 3 && touchX < 2 * baseWidth / 3 && 
      (touch.clientY - canvasRect.top) / scaleY > baseHeight / 3 && 
      (touch.clientY - canvasRect.top) / scaleY < 2 * baseHeight / 3) {
    if (firstRun === true) {
      console.log('Touchstart triggered startGame');
      window.startGame();
    } else {
      reset();
    }
  }
}

function handleTouchMove(e) {
  e.preventDefault();
  console.log('Touchmove triggered:', JSON.stringify(e));
  if (!isSpriteLoaded && !image.src) {
    console.log('Touchmove ignored: sprites not loaded');
    return;
  }
  var touch = e.touches[0];
  var canvasRect = canvas.getBoundingClientRect();
  var touchX = (touch.clientX - canvasRect.left) / scaleX;

  if (touchX < baseWidth / 2) {
    dir = "left";
    player.isMovingLeft = true;
    player.isMovingRight = false;
  } else {
    dir = "right";
    player.isMovingRight = true;
    player.isMovingLeft = false;
  }
}

function handleTouchEnd(e) {
  e.preventDefault();
  console.log('Touchend triggered:', JSON.stringify(e));
  if (!isSpriteLoaded && !image.src) {
    console.log('Touchend ignored: sprites not loaded');
    return;
  }
  player.isMovingLeft = false;
  player.isMovingRight = false;
}

window.startGame = function() {
  console.log('startGame called');
  isGameStarted = true;
  dir = "left";
  var jumpCount = 0;
  
  firstRun = false;

  menuLoop = function() { console.log("Menu loop stopped"); return; };
  console.log("Menu loop stopped in startGame");

  canvas.removeEventListener('touchstart', handleTouchStart);
  canvas.removeEventListener('touchmove', handleTouchMove);
  canvas.removeEventListener('touchend', handleTouchEnd);

  score = 0;
  flag = 0;
  position = 0;
  broken = 0;

  hideMenu();
  showScore();
  console.log("Game started, score should be visible");

  ctx.clearRect(0, 0, width, height);
  base.draw();
  platforms.forEach(p => p.draw());
  player.draw();

  function paintCanvas() {
    ctx.clearRect(0, 0, width, height);
  }

  function playerCalc() {
    if (!isGameStarted) {
      console.log('playerCalc skipped: game not started');
      return;
    }

    if (dir == "left") {
      player.dir = "left";
      if (player.vy < -7 && player.vy > -15) player.dir = "left_land";
    } else if (dir == "right") {
      player.dir = "right";
      if (player.vy < -7 && player.vy > -15) player.dir = "right_land";
    }

    document.onkeydown = function(e) {
      var key = e.keyCode;
      
      if (key == 37 || key == 65) {
        dir = "left";
        player.isMovingLeft = true;
      } else if (key == 39 || key == 68) {
        dir = "right";
        player.isMovingRight = true;
      }
      
      if(key == 32) {
        if(firstRun === true)
          window.startGame();
        else 
          reset();
      }
    };

    document.onkeyup = function(e) {
      var key = e.keyCode;
    
      if (key == 37 || key == 65) {
        dir = "left";
        player.isMovingLeft = false;
      } else if (key == 39 || key == 68) {
        dir = "right";
        player.isMovingRight = false;
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart, false);
    canvas.addEventListener('touchmove', handleTouchMove, false);
    canvas.addEventListener('touchend', handleTouchEnd, false);

    if (player.isMovingLeft === true) {
      player.x += player.vx * deltaTime;
      player.vx -= 0.15 * deltaTime;
    } else {
      player.x += player.vx * deltaTime;
      if (player.vx < 0) player.vx += 0.1 * deltaTime;
    }

    if (player.isMovingRight === true) {
      player.x += player.vx * deltaTime;
      player.vx += 0.15 * deltaTime;
    } else {
      player.x += player.vx * deltaTime;
      if (player.vx > 0) player.vx -= 0.1 * deltaTime;
    }

    if(player.vx > 8) player.vx = 8;
    else if(player.vx < -8) player.vx = -8;

    if ((player.y + player.height) > base.y && base.y < baseHeight) player.jump();

    if (base.y > baseHeight && (player.y + player.height) > baseHeight && player.isDead != "lol") {
      player.isDead = true;
    }

    if (player.x > baseWidth) player.x = 0 - player.width;
    else if (player.x < 0 - player.width) player.x = baseWidth;

    if (player.y >= (baseHeight / 2) - (player.height / 2)) {
      player.y += player.vy * deltaTime;
      player.vy += gravity * deltaTime;
    } else {
      platforms.forEach(function(p, i) {
        if (player.vy < 0) {
          p.y -= player.vy * deltaTime;
        }
        if (p.y > baseHeight) {
          platforms[i] = new Platform();
          platforms[i].y = p.y - baseHeight;
        }
      });

      base.y -= player.vy * deltaTime;
      player.vy += gravity * deltaTime;

      if (player.vy >= 0) {
        player.y += player.vy * deltaTime;
        player.vy += gravity * deltaTime;
      }

      if (isGameStarted) {
        score += deltaTime;
      }
    }

    console.log("Player physics: vy:", player.vy, "y:", player.y);
    collides();

    if (player.isDead === true) gameOver();
  }

  function springCalc() {
    if (!isGameStarted) {
      console.log('springCalc skipped: game not started');
      return;
    }
    var s = spring;
    var p = platforms[0];

    if (p.type == 1 || p.type == 2) {
      s.x = p.x + p.width / 2 - s.width / 2;
      s.y = p.y - p.height - 10;

      if (s.y > baseHeight / 1.1) s.state = 0;

      s.draw();
    } else {
      s.x = 0 - s.width;
      s.y = 0 - s.height;
    }
  }

  function platformCalc() {
    if (!isGameStarted) {
      console.log('platformCalc skipped: game not started');
      return;
    }
    var subs = platform_broken_substitute;

    platforms.forEach(function(p, i) {
      if (p.type == 2) {
        if (p.x < 0 || p.x + p.width > baseWidth) p.vx *= -1;
        p.x += p.vx * deltaTime;
      }

      if (p.flag == 1 && subs.appearance === false && jumpCount === 0) {
        subs.x = p.x;
        subs.y = p.y;
        subs.appearance = true;
        jumpCount++;
      }

      p.draw();
    });

    if (subs.appearance === true) {
      subs.draw();
      subs.y += 8 * deltaTime;
    }

    if (subs.y > baseHeight) subs.appearance = false;
  }

  function collides() {
    if (!isGameStarted) {
      console.log('collides skipped: game not started');
      return;
    }
    platforms.forEach(function(p, i) {
      if (player.vy > 0 && p.state === 0 && 
          (player.x + 15 < p.x + p.width) && 
          (player.x + player.width - 15 > p.x) && 
          (player.y + player.height > p.y) && 
          (player.y + player.height < p.y + p.height)) {
        if (p.type == 3 && p.flag === 0) {
          p.flag = 1;
          jumpCount = 0;
          return;
        } else if (p.type == 4 && p.state === 0) {
          player.jump();
          p.state = 1;
        } else if (p.flag == 1) return;
        else {
          player.jump();
        }
      }
    });

    var s = spring;
    if (player.vy > 0 && (s.state === 0) && 
        (player.x + 15 < s.x + s.width) && 
        (player.x + player.width - 15 > s.x) && 
        (player.y + player.height > s.y) && 
        (player.y + player.height < s.y + s.height)) {
      s.state = 1;
      player.jumpHigh();
    }
  }

  function updateScore() {
    if (!isGameStarted) {
      console.log('updateScore skipped: game not started');
      return;
    }
    var scoreText = document.getElementById("score");
    if (scoreText) {
      scoreText.innerHTML = Math.floor(score);
      console.log('Score updated to:', Math.floor(score));
    } else {
      console.error('Score element not found');
    }
  }

  async function gameOver() {
    if (!isGameStarted) {
      console.log('gameOver skipped: game not started');
      return;
    }
    platforms.forEach(function(p, i) {
      p.y -= 12 * deltaTime;
    });

    if (player.y > baseHeight / 2 && flag === 0) {
      player.y -= 8 * deltaTime;
      player.vy = 0;
    } else if (player.y < baseHeight / 2) flag = 1;
    else if (player.y + player.height > baseHeight) {
      showGoMenu();
      hideScore();
      player.isDead = "lol";

      const saved = await saveHighScore(score);
      if (saved) {
        await displayHighScores();
      }

      var tweet = document.getElementById("tweetBtn");
      var telegramScore = Math.floor(score);
      tweet.href = 'https://x.com/intent/post?text=I%20just%20scored%20' + telegramScore + '%20in%20Doodle%20Dash%20by%20@Futuret3ch%20%7C%20@MemeTorrent&url=https://memetorrent.futuret3ch.com.au/games/dash';
    }
  }

  function update() {
    if (!isGameStarted) {
      console.log("Update skipped: game not started");
      return;
    }
    paintCanvas();
    platformCalc();
    springCalc();
    playerCalc();
    base.draw();
    platforms.forEach(p => p.draw());
    player.draw();
    updateScore();
  }

  animloop = function(timestamp) {
    if (!isGameStarted) {
      console.log("Animloop skipped: game not started");
      requestAnimFrame(animloop);
      return;
    }
    deltaTime = (timestamp - lastTime) / (1000 / 60);
    lastTime = timestamp;

    update();
    requestAnimFrame(animloop);
  };

  requestAnimFrame(animloop);
}

function reset() {
  if (!isSpriteLoaded && !image.src) {
    console.log('Reset delayed: sprites not loaded');
    alert('Please wait for sprites to load.');
    return;
  }

  hideGoMenu();
  showScore();
  player.isDead = false;
  
  flag = 0;
  position = 0;
  score = 0;

  base = new Base();
  player = new Player();
  spring = new Spring();
  platform_broken_substitute = new Platform_broken_substitute();

  platforms = [];
  for (var i = 0; i < platformCount; i++) {
    platforms.push(new Platform());
  }

  player.x = baseWidth / 2 - player.width / 2;
  player.y = baseHeight - player.height;
  console.log("Player reset at x:", player.x, "y:", player.y);

  ctx.clearRect(0, 0, width, height);
  base.draw();
  platforms.forEach(p => p.draw());
  player.draw();
}

function hideMenu() {
  var menu = document.getElementById("mainMenu");
  if (menu) {
    menu.style.zIndex = -1;
    menu.style.visibility = 'hidden';
    menu.style.display = 'none';
    console.log("Main menu hidden");
  } else {
    console.error("Main menu element not found");
  }
}

function showGoMenu() {
  var menu = document.getElementById("gameOverMenu");
  if (menu) {
    menu.style.zIndex = 1;
    menu.style.visibility = "visible";
    menu.style.display = 'block';
    console.log("Game over menu shown");
  } else {
    console.error("Game over menu element not found");
  }

  var scoreText = document.getElementById("go_score");
  if (scoreText) {
    scoreText.innerHTML = "You scored " + Math.floor(score) + " points!";
  }
}

function hideGoMenu() {
  var menu = document.getElementById("gameOverMenu");
  if (menu) {
    menu.style.zIndex = -1;
    menu.style.visibility = "hidden";
    menu.style.display = 'none';
    console.log("Game over menu hidden");
  } else {
    console.error("Game over menu element not found");
  }
}

function showScore() {
  var menu = document.getElementById("scoreBoard");
  if (menu) {
    menu.style.zIndex = 1;
    menu.style.visibility = "visible";
    menu.style.display = 'block';
    console.log("Scoreboard shown");
  } else {
    console.error("Scoreboard element not found");
  }
}

function hideScore() {
  var menu = document.getElementById("scoreBoard");
  if (menu) {
    menu.style.zIndex = -1;
    menu.style.visibility = "hidden";
    menu.style.display = 'none';
    console.log("Scoreboard hidden");
  } else {
    console.error("Scoreboard element not found");
  }
}

menuLoop = function() {
  if (isGameStarted) {
    console.log("Menu loop stopped: game started");
    return;
  }
  ctx.clearRect(0, 0, width, height);
  base.draw();
  platforms.forEach(p => p.draw());
  player.draw();
  requestAnimFrame(menuLoop);
};

console.log('Page loaded, starting menu loop');
menuLoop();