var playing = false;
var score;
var trialsleft;
var step;
var action;
var level = 1;
var fruits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
var difficulty = "medium";
var highScore = localStorage.getItem("highScore") ? parseInt(localStorage.getItem("highScore")) : 0;

$(document).ready(function () {
  // Initial setup
  $("#front").show();
  $("#difficulty").show();
  $("#startReset").hide();
  $("#gameOver").hide();
  $("#highScoreValue").html(highScore);
  console.log("DOM ready, setting up initial state");
  console.log("Difficulty div found:", $("#difficulty").length);
  console.log("Difficulty buttons found:", $(".diffBtn").length);
  console.log("GameOver div found:", $("#gameOver").length);
  console.log("GameOver visibility:", $("#gameOver").is(":visible"));
});

$(document).ready(function () {
  // Verify elements exist
  if ($("#startReset").length) {
    console.log("Start/Reset button found in DOM");
  } else {
    console.error("Start/Reset button not found in DOM");
  }
  if ($("#musicToggle").length) {
    console.log("Music Toggle button found in DOM");
  } else {
    console.error("Music Toggle button not found in DOM");
  }
  if ($("#difficulty").length) {
    console.log("Difficulty container found in DOM");
  } else {
    console.error("Difficulty container not found in DOM");
  }
  if ($("#gameOver").length) {
    console.log("GameOver container found in DOM");
  } else {
    console.error("GameOver container not found in DOM");
  }

  // Bind events for Difficulty buttons
  $(".diffBtn").on("click touchstart", function (e) {
    e.preventDefault();
    difficulty = $(this).data("diff");
    console.log("Difficulty button clicked:", difficulty);
    startGame();
  });
  console.log("Difficulty events bound");

  // Bind events for Reset button (jQuery)
  $("#startReset").on("click touchstart", function (e) {
    e.preventDefault();
    console.log("Reset button triggered (jQuery) - Event type:", e.type);
    console.log("Button position:", $(this).offset());
    console.log("Playing state before:", playing);
    console.log("Reloading page for reset");
    location.reload();
    console.log("Playing state after:", playing);
  });
  console.log("Reset events bound (jQuery)");

  // Fallback vanilla JavaScript event listener for Reset
  var startResetBtn = document.getElementById("startReset");
  if (startResetBtn) {
    startResetBtn.addEventListener("click", function (e) {
      console.log("Reset button triggered (vanilla JS) - Event type: click");
    });
    startResetBtn.addEventListener("touchstart", function (e) {
      console.log("Reset button triggered (vanilla JS) - Event type: touchstart");
    });
    console.log("Reset events bound (vanilla JS)");
  }

  // Bind events for Music Toggle button (jQuery)
  $("#musicToggle").on("click touchstart", function (e) {
    e.preventDefault();
    console.log("Music toggle triggered (jQuery) - Event type:", e.type);
    var music = $("#bgmusic")[0];
    if (music.paused) {
      music.play().catch(function (error) {
        console.log("Music toggle play failed:", error);
      });
      $(this).html("Music: ON");
      console.log("Music toggled ON");
    } else {
      music.pause();
      $(this).html("Music: OFF");
      console.log("Music toggled OFF");
    }
  });
  console.log("Music Toggle events bound (jQuery)");

  // Fallback vanilla JavaScript event listener for Music Toggle
  var musicToggleBtn = document.getElementById("musicToggle");
  if (musicToggleBtn) {
    musicToggleBtn.addEventListener("click", function (e) {
      console.log("Music Toggle button triggered (vanilla JS) - Event type: click");
    });
    musicToggleBtn.addEventListener("touchstart", function (e) {
      console.log("Music Toggle button triggered (vanilla JS) - Event type: touchstart");
    });
    console.log("Music Toggle events bound (vanilla JS)");
  }

  // Bind events for fruit slicing
  $("#fruit1").on("mouseover touchstart", function (e) {
    e.preventDefault();
    console.log("Fruit interaction detected - Type:", e.type);
    console.log("Fruit position:", $(this).position());
    console.log("Playing state before slicing:", playing);
    if (!playing) {
      console.log("Game not playing, interaction ignored");
      return;
    }

    console.log("Fruit sliced");
    score++;
    $("#scoreValue").html(score);

    level = Math.floor(score / 10) + 1;
    $("#slicesound")[0].play();

    var pos = $(this).position();
    $("#splashEffect")
      .css({ left: pos.left, top: pos.top })
      .show()
      .delay(500)
      .queue(function (next) {
        $(this).hide();
        next();
      });

    // Stop the current fruit movement
    clearInterval(action);
    console.log("Cleared interval, hiding fruit");
    $("#fruit1").hide().removeClass().addClass("fruit");
    console.log("Fruit hidden, checking game state - Playing:", playing, "Trials left:", trialsleft);

    // Spawn a new fruit if the game is still active
    if (playing) {
      console.log("Game still active, scheduling new fruit spawn");
      setTimeout(function () {
        console.log("setTimeout executed - Playing:", playing);
        if (playing) {
          startAction();
        } else {
          console.log("Game no longer playing, skipping fruit spawn");
        }
      }, 500);

      // Fallback: Check if no fruits are present after a delay
      setTimeout(function () {
        if (playing && $("#fruit1").is(":hidden")) {
          console.log("Fallback triggered: No fruits present, restarting spawn");
          startAction();
        }
      }, 1000);
    } else {
      console.log("Game not active, not spawning new fruit");
    }
  });
  console.log("Fruit events bound");

  // Bind events for touchmove prevention
  $("#fruitcontainer").on("touchmove", function (e) {
    e.preventDefault();
  });
  console.log("Touchmove events bound");

  // Bind events for audio errors
  $("#bgmusic").on("error", function () {
    console.log("Error: Could not load bgmusic.mp3");
  });
  console.log("Audio error events bound");
});

// Functions

function startGame() {
  console.log("Starting game with difficulty:", difficulty);
  $("#front").hide();
  $("#difficulty").hide();
  $("#startReset").css({ top: "10px", left: "10px", transform: "none" });
  $("#startReset").show();
  $("#score").show();
  $("#gameOver").hide();
  console.log("GameOver hidden in startGame, visibility:", $("#gameOver").is(":visible"));
  playing = true;
  score = 0;
  level = 1;
  $("#scoreValue").html(score);
  $("#difficultyDisplay").html(difficulty.charAt(0).toUpperCase() + difficulty.slice(1));
  $("#trialsleft").show();
  trialsleft = 3;
  addhearts();
  $("#startReset").html("Reset Game");
  var music = $("#bgmusic")[0];
  music.play().catch(function (error) {
    console.log("Music playback failed:", error);
  });
  startAction();
}

function addhearts() {
  $("#trialsleft").empty();
  for (var i = 0; i < trialsleft; i++) {
    $("#trialsleft").append(
      '<img src="https://raw.githubusercontent.com/Saumya-07/Fruit-Slicer/master/images/wrong.png" class="life">'
    );
  }
}

function startAction() {
  if (!playing) {
    console.log("Game not playing, stopping fruit spawn");
    return;
  }

  console.log("Starting new fruit spawn");
  $("#fruit1").show();
  chooseRandom();
  var containerWidth = $("#fruitcontainer").width();
  var containerHeight = $("#fruitcontainer").height();
  var fruitWidth = $(".fruit").width() || 60;
  console.log("Container width:", containerWidth, "Container height:", containerHeight, "Fruit width:", fruitWidth);
  $("#fruit1").css({
    left: Math.round((containerWidth - fruitWidth) * Math.random()),
    top: -fruitWidth,
  });
  var diffMultiplier = difficulty === "easy" ? 0.5 : difficulty === "hard" ? 1.5 : 1;
  step = (1 + Math.round(5 * Math.random())) * (1 + (level - 1) * 0.2) * diffMultiplier;
  clearInterval(action);
  action = setInterval(function () {
    if (!playing) {
      console.log("Game stopped during interval, clearing interval");
      clearInterval(action);
      return;
    }
    var fruitTop = $("#fruit1").position().top;
    $("#fruit1").css("top", fruitTop + step);
    if (fruitTop > containerHeight - fruitWidth) {
      console.log("Fruit missed, reached bottom");
      if (trialsleft > 1) {
        $("#fruit1").hide();
        chooseRandom();
        $("#fruit1").show();
        $("#fruit1").css({
          left: Math.round((containerWidth - fruitWidth) * Math.random()),
          top: -fruitWidth,
        });
        var diffMultiplier = difficulty === "easy" ? 0.5 : difficulty === "hard" ? 1.5 : 1;
        step = (1 + Math.round(5 * Math.random())) * (1 + (level - 1) * 0.2) * diffMultiplier;
        trialsleft--;
        addhearts();
      } else {
        console.log("No trials left, ending game");
        gameOver();
      }
    }
  }, 10);
}

function chooseRandom() {
  var fruitType = fruits[Math.round(9 * Math.random())];
  var imageUrl = "https://raw.githubusercontent.com/Saumya-07/Fruit-Slicer/master/images/" + fruitType + ".png";
  console.log("Attempting to load image:", imageUrl);
  $("#fruit1")
    .attr("src", imageUrl)
    .removeClass()
    .addClass("fruit")
    .on("error", function () {
      console.error("Failed to load image: " + fruitType + " (" + imageUrl + ")");
      $("#fruit1").css("border", "5px solid red").attr("alt", "Missing: " + fruitType);
    })
    .on("load", function () {
      console.log("Successfully loaded image: " + fruitType);
      $("#fruit1").css("border", "none").attr("alt", fruitType);
    });
}

function gameOver() {
  playing = false;
  console.log("Game over, playing set to false");
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
    console.log("New high score:", highScore);
    $("#highScoreValue").html(highScore);
  }
  $("#score").hide();
  $("#front").hide();
  $("#difficulty").show();
  $("#startReset").css({
    top: "calc(20vh + 250px)",
    left: "50%",
    transform: "translateX(-50%)"
  });
  $("#startReset").show();
  $("#gameOver").show();
  $("#gameOver").html(
    "<p>Game Over!</p><p>Your score is " + score + "</p><p>FUTURET3CH | MEMETORRENT</p>"
  );
  $("#trialsleft").hide();
  $("#bgmusic")[0].pause();
  console.log("GameOver shown, visibility:", $("#gameOver").is(":visible"));
  stopAction();
}

function stopAction() {
  clearInterval(action);
  $("#fruit1").hide();
  console.log("Action stopped, fruit hidden");
}