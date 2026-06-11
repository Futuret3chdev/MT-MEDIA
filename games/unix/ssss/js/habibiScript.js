document.addEventListener('DOMContentLoaded', function() {});

// Page Elements
var pageSplash = document.querySelector('#pageSplash'), splashScreenTxt = document.querySelector('#splashScreenTxt'), splashScreenLogo = document.querySelector('#splashScreenLogo');
var pagePlayDelay = document.querySelector('#pagePlayDelay'), palyDelayCont = document.querySelector('#palyDelayCont'), playDelayNum = document.querySelector('#playDelayNum');
var pagePlayArea = document.querySelector('#pagePlayArea'), gmStatsTimeProgress = document.querySelector('#gmStatsTimeProgress'), gmStatsPauseBtn = document.querySelector('#gmStatsPauseBtn'), gmStatsScore = document.querySelector('#gmStatsScore'), gmStatsLvlNumb = document.querySelector('#gmStatsLvlNumb'), gameSpace = document.querySelector('#gameSpace'), gmStatsCurrentTapCount = document.querySelector('#gmStatsCurrentTapCount'), gmStatsTotalTapCount = document.querySelector('#gmStatsTotalTapCount');
var pageGameMenu = document.querySelector('#pageGameMenu'), newGameBtn = document.querySelector('#newGameBtn'), multiplayerBtn = document.querySelector('#multiplayerBtn'), achievementsBtn = document.querySelector('#achievementsBtn'), aboutBtn = document.querySelector('#aboutBtn'), mysteryGameBtn = document.querySelector('#mysteryGameBtn');
var pageTutorial = document.querySelector('#pageTutorial'), tutPgStartGameBtn = document.querySelector('#tutPgStartGameBtn');
var pagePauseMenu = document.querySelector('#pagePauseMenu'), lvlPausedScore = document.querySelector('#lvlPausedScore'), pmRstrtLvlBtn = document.querySelector('#pmRstrtLvlBtn'), pmCntnuGmBtn = document.querySelector('#pmCntnuGmBtn');
var pageLevelPassed = document.querySelector('#pageLevelPassed'), lvlPssdTtl = document.querySelector('#lvlPssdTtl'), lvlPssdScore = document.querySelector('#lvlPssdScore'), lvlPssdBonusScore = document.querySelector('#lvlPssdBonusScore'), lvlPssdContinueNextLvlBtn = document.querySelector('#lvlPssdContinueNextLvlBtn');
var pageYouLost = document.querySelector('#pageYouLost'), lvlLostScore = document.querySelector('#lvlLostScore'), lvlLostTtl = document.querySelector('#lvlLostTtl'), lvlLostTryAgainBtn = document.querySelector('#lvlLostTryAgainBtn'), lvlLostIcon = document.querySelector('#lvlLostIcon');
var pageHighScore = document.querySelector('#pageHighScore'), lvlLostNewHighScore = document.querySelector('#lvlLostNewHighScore');
var pageAbout = document.querySelector('#pageAbout'), abtPageBackBtn = document.querySelector('#abtPageBackBtn');
var pageAchievements = document.querySelector('#pageAchievements'), achPageBackBtn = document.querySelector('#achPageBackBtn');
var pageMultiplayer = document.querySelector('#pageMultiplayer'), playerName = document.querySelector('#playerName'), joinGameBtn = document.querySelector('#joinGameBtn'), opponentScore = document.querySelector('#opponentScore'), mpBackBtn = document.querySelector('#mpBackBtn');
var pageMysteryGame = document.querySelector('#pageMysteryGame'), mysteryGuessInput = document.querySelector('#mysteryGuessInput'), mysteryGuessBtn = document.querySelector('#mysteryGuessBtn'), mysteryResult = document.querySelector('#mysteryResult'), mysteryBackBtn = document.querySelector('#mysteryBackBtn'), attemptsLeft = document.querySelector('#attemptsLeft');

// Tools
var toolsBox = {
    delay: function(fun, delayTime) { setTimeout(fun, delayTime); },
    gnrtRndmNum: function(minNumb, maxNumb) { return Math.floor(Math.random() * (maxNumb - minNumb + 1)) + minNumb; },
    showPage: function(page) { page.style.display = "block"; },
    hidePage: function(page) { page.style.display = "none"; },
    hideSplashScreen: function() {
        splashScreenTxt.classList.add('fadeOut-animation');
        splashScreenLogo.classList.add('fadeOut-animation');
        toolsBox.delay(function() { toolsBox.showPage(pageGameMenu); toolsBox.hidePage(pageSplash); }, 1500);
    },
    onClickNTouchstart: function(element, fun) {
        element.addEventListener('click', fun, false);
        element.addEventListener('touchstart', fun, false);
    },
    toggleAnimation: function(element, animationClass) {
        element.classList.add(animationClass);
        element.addEventListener('animationend', function() { element.classList.remove(animationClass); }, false);
    },
    pagePlayDelay: {
        updateNumber: function() {
            toolsBox.toggleAnimation(playDelayNum, 'grow-animation');
            playDelayNum.innerHTML = parseInt(playDelayNum.innerHTML, 10) - 1;
        },
        start: function() {
            toolsBox.toggleAnimation(playDelayNum, 'grow-animation');
            var timer = setInterval(function() {
                if (playDelayNum.innerHTML > 1) {
                    audioPool.playSound(delayCount);
                    toolsBox.pagePlayDelay.updateNumber();
                } else {
                    clearInterval(timer);
                    toolsBox.hidePage(pagePlayDelay);
                    playDelayNum.innerHTML = 3;
                }
            }, 500);
        }
    },
    pageAbout: {}
};

// Time Engine
var timeEngine = {
    progressTimer: '',
    timeLeft: 0,
    levelTime: 0,
    progressValue: 100,
    endingSound: false,
    start: function(time) {
        timeEngine.timeLeft = time;
        timeEngine.progressTimer = setInterval(function(){ timeEngine.updateTimeProgress(time); }, 100);
    },
    stop: function() {
        clearInterval(timeEngine.progressTimer);
        gmStatsTimeProgress.classList.remove('switchColors-animation');
        if (timeEngine.endingSound) { timeEngine.endingSound = false; audioPool.stopSound(timeAlmostUp); }
    },
    resume: function() { timeEngine.start(timeEngine.timeLeft); },
    reset: function() {
        timeEngine.stop();
        timeEngine.timeLeft = 0;
        timeEngine.progressValue = 100;
        gmStatsTimeProgress.style.width = timeEngine.progressValue + "%";
    },
    updateTimeProgress: function(time) {
        timeEngine.timeLeft -= 0.1;
        timeEngine.progressValue = timeEngine.timeLeft * 100 / gameEngine.levelTime;
        gmStatsTimeProgress.style.width = timeEngine.progressValue + "%";
        timeEngine.checkTime();
    },
    checkTime: function() {
        if (timeEngine.timeLeft <= 0) {
            timeEngine.stop();
            gameEngine.timesUp();
            timeEngine.endingSound = false;
            audioPool.stopSound(timeAlmostUp);
        }
        if (timeEngine.timeLeft < 4 && timeEngine.timeLeft > 0) {
            gmStatsTimeProgress.classList.add('switchColors-animation');
            if (!timeEngine.endingSound) { timeEngine.endingSound = true; audioPool.playSound(timeAlmostUp); }
        }
    }
};

// Circles Engine
var circlesEngine = {
    create: function(typeOfCircle, numOfCircles) {
        var element = document.createElement('div');
        switch (typeOfCircle.toLowerCase()) {
            case ".evil-circle":
                element.setAttribute('class', 'tpbl-circle c-red evil-circle');
                gameSpace.appendChild(element);
                toolsBox.onClickNTouchstart(element, circlesEngine.evilCircleTap);
                return element;
            case ".good-circle":
                element.setAttribute('class', 'tpbl-circle c-blue good-circle');
                gameSpace.appendChild(element);
                toolsBox.onClickNTouchstart(element, function(){ circlesEngine.goodCircleTap(typeOfCircle, numOfCircles); });
                return element;
        }
    },
    destroy: function(circle) { Array.from(circle).forEach(function(element){ element.parentNode.removeChild(element); }); },
    randomPosition: function(circle) {
        var gameSpcWidth = gameSpace.offsetWidth, gmSpcHeight = gameSpace.offsetHeight, tpblCircleWidth = circle.offsetWidth, tpblCircleHeight = circle.offsetHeight;
        circle.style.left = toolsBox.gnrtRndmNum(tpblCircleWidth, (gameSpcWidth - tpblCircleWidth)) + "px";
        circle.style.top = toolsBox.gnrtRndmNum(tpblCircleHeight, (gmSpcHeight - tpblCircleHeight)) + "px";
    },
    add: function(typeOfCircle, numOfCircles) {
        if (document.querySelectorAll(typeOfCircle).length > 0) { circlesEngine.destroy(document.querySelectorAll(typeOfCircle)); }
        if (numOfCircles) {
            for (var i = 0; i < numOfCircles; i++) {
                var circle = circlesEngine.create(typeOfCircle, numOfCircles);
                circlesEngine.randomPosition(circle);
                circlesEngine.addWithDelay(i, circle, typeOfCircle);
            }
        } else {
            var circle = circlesEngine.create(typeOfCircle, numOfCircles);
            circlesEngine.randomPosition(circle);
        }
    },
    addWithDelay: function(i, circle, typeOfCircle) {
        setTimeout(function() { circle.classList.add('grow-animation'); audioPool.playSound(circleAppear); }, i * 50);
    },
    goodCircleTap: function(typeOfCircle, numOfCircles) {
        gameEngine.goodCircleTap();
        circlesEngine.add(typeOfCircle, numOfCircles);
        var evilCircles = document.querySelectorAll('.evil-circle');
        if (evilCircles.length > 0) circlesEngine.add('.evil-circle', evilCircles.length);
    },
    evilCircleTap: function() { gameEngine.evilCircleTap(); },
    goodCirclesTapCount: 0,
    redCirclesTapCount: 0
};

// Game Engine
var gameEngine = {
    levelNum: 1,
    levelTime: 10,
    tapNum: 0,
    tapsGoal: 10,
    tapValue: 13,
    score: 0,
    goodCirclesCount: 1,
    evilCirclesCount: 4,
    highestScore: 0,
    bonusScore: 0,
    comboCounter: 0,
    lastTapTime: null,
    comboMultiplier: 1,
    comboTimeout: 1000,
    currentTheme: "default",
    updateScore: function(amount) { 
        gameEngine.score = amount; 
        gmStatsScore.innerHTML = gameEngine.score; 
        multiplayerEngine.syncTap(gameEngine.tapValue * gameEngine.comboMultiplier); // Sync tap instead of score
    },
    updateLevel: function(levelNum) { gameEngine.levelNum = levelNum; gmStatsLvlNumb.innerHTML = "Level " + gameEngine.levelNum; },
    updateTapCount: function(tapNum, tapsGoal) { gameEngine.tapNum = tapNum; gmStatsCurrentTapCount.innerHTML = gameEngine.tapNum; gameEngine.tapsGoal = tapsGoal; gmStatsTotalTapCount.innerHTML = "/" + gameEngine.tapsGoal; },
    updateLevelTime: function(time) { gameEngine.levelTime = time; },
    updateBonusScore: function(bonus) { gameEngine.bonusScore = bonus; },
    reset: function() {
        gameEngine.updateScore(0);
        gameEngine.updateLevel(1);
        gameEngine.updateLevelTime(7);
        gameEngine.updateTapCount(0, 5);
        gameEngine.tapValue = 3;
        gameEngine.goodCirclesCount = 1;
        gameEngine.evilCirclesCount = 4;
        gameEngine.comboCounter = 0;
        gameEngine.comboMultiplier = 1;
        gameEngine.lastTapTime = null;
        gameEngine.currentTheme = "default";
        document.getElementById('gmStatsCombo').innerHTML = '';
        gameSpace.className = "game-space";
    },
    start: function(score, level, time, tapsGoal, tapValue, goodCirclesCount, evilCirclesCount, theme) {
        gameEngine.updateScore(score);
        gameEngine.updateLevel(level);
        gameEngine.updateLevelTime(time);
        gameEngine.updateTapCount(0, tapsGoal);
        gameEngine.tapValue = tapValue;
        gameEngine.goodCirclesCount = goodCirclesCount;
        gameEngine.evilCirclesCount = evilCirclesCount;
        gameEngine.currentTheme = theme || "default";
        gameSpace.className = "game-space theme-" + gameEngine.currentTheme;
        circlesEngine.add('.good-circle', goodCirclesCount);
        circlesEngine.add('.evil-circle', evilCirclesCount);
        timeEngine.reset();
        timeEngine.start(time);
    },
    startLevel: function() {
        var levelData = levelsEngine.getLevel(gameEngine.levelNum);
        gameEngine.start(
            gameEngine.score,
            gameEngine.levelNum,
            levelData.time,
            levelData.tapsGoal,
            levelData.tapValue,
            levelData.goodCirclesCount,
            levelData.evilCirclesCount,
            levelData.theme
        );
    },
    checkTapsCount: function() {
        if (gameEngine.tapNum >= gameEngine.tapsGoal) {
            if (timeEngine.timeLeft > 0) gameEngine.showBonusScore();
            gameEngine.levelPassed();
        }
    },
    goodCircleTap: function() {
        var currentTime = Date.now();
        if (gameEngine.lastTapTime && (currentTime - gameEngine.lastTapTime) <= gameEngine.comboTimeout) {
            gameEngine.comboCounter++;
            gameEngine.comboMultiplier = Math.min(3, 1 + Math.floor(gameEngine.comboCounter / 2));
            toolsBox.toggleAnimation(gmStatsCurrentTapCount, 'burst-animation');
        } else {
            gameEngine.comboCounter = 1;
            gameEngine.comboMultiplier = 1;
        }
        gameEngine.lastTapTime = currentTime;
        gameEngine.tapNum += 1;
        gameEngine.updateScore(gameEngine.score + (gameEngine.tapValue * gameEngine.comboMultiplier));
        gameEngine.updateTapCount(gameEngine.tapNum, gameEngine.tapsGoal);
        gameEngine.checkTapsCount();
        document.getElementById('gmStatsCombo').innerHTML = gameEngine.comboCounter > 1 ? `Combo: ${gameEngine.comboCounter}x` : '';
        audioPool.playSound(touchBlue);
        achievementsEngine.checkAchievements();
    },
    evilCircleTap: function() {
        gameEngine.comboCounter = 0;
        gameEngine.comboMultiplier = 1;
        gameEngine.lastTapTime = null;
        document.getElementById('gmStatsCombo').innerHTML = '';
        gameEngine.deadlyTap();
        audioPool.playSound(touchRed);
    },
    pause: function() { timeEngine.stop(); },
    resume: function() { timeEngine.resume(); },
    stop: function() { timeEngine.stop(); gameEngine.reset(); },
    gameLost: function() {
        audioPool.playSound(levelLost);
        lvlLostScore.innerHTML = gameEngine.score;
        toolsBox.hidePage(pagePlayArea);
        toolsBox.showPage(pageYouLost);
        gameEngine.stop();
    },
    deadlyTap: function() {
        lvlLostTtl.innerHTML = "You Lost";
        if (lvlLostIcon.classList.contains('times-up-icon')) lvlLostIcon.classList.replace('times-up-icon', 'you-lost-icon');
        gameEngine.gameLost();
    },
    timesUp: function() {
        lvlLostTtl.innerHTML = "Time's Up";
        if (lvlLostIcon.classList.contains('you-lost-icon')) lvlLostIcon.classList.replace('you-lost-icon', 'times-up-icon');
        gameEngine.gameLost();
    },
    levelPassed: function() {
        audioPool.playSound(levelPassed);
        timeEngine.stop();
        lvlPssdTtl.innerHTML = "Level " + gameEngine.levelNum;
        if (gameEngine.bonusScore > 0) lvlPssdScore.innerHTML = gameEngine.score - gameEngine.bonusScore; else lvlPssdScore.innerHTML = gameEngine.score;
        gameEngine.updateLevel(gameEngine.levelNum + 1);
        levelsEngine.addNewLevel(gameEngine.levelNum, gameEngine.levelTime + 1, gameEngine.tapValue + 2, gameEngine.tapsGoal + 1, 1, gameEngine.evilCirclesCount + 1);
        gameEngine.comboCounter = 0;
        gameEngine.comboMultiplier = 1;
        gameEngine.lastTapTime = null;
        document.getElementById('gmStatsCombo').innerHTML = '';
        toolsBox.hidePage(pagePlayArea);
        toolsBox.showPage(pageLevelPassed);
        achievementsEngine.checkAchievements();
    },
    showBonusScore: function() {
        gameEngine.updateBonusScore(Math.round(timeEngine.timeLeft) * 10);
        if (gameEngine.bonusScore > 0) lvlPssdBonusScore.innerHTML = "Bonus +" + gameEngine.bonusScore;
        gameEngine.score += gameEngine.bonusScore;
    }
};

// Levels Engine
var levelsEngine = {
    levels: [
        { levelNum: 1, time: 7, tapValue: 3, tapsGoal: 5, goodCirclesCount: 1, evilCirclesCount: 4, theme: "default" }
    ],
    addNewLevel: function(lN, t, tV, tG, gC, eC) {
        var nextTheme = lN % 3 === 0 ? "chaos" : lN % 2 === 0 ? "reverse" : "night";
        levelsEngine.levels.push({ levelNum: lN, time: t, tapValue: tV, tapsGoal: tG, goodCirclesCount: gC, evilCirclesCount: eC, theme: nextTheme });
    },
    getLevel: function(levelNum) {
        var level = levelsEngine.levels.find(l => l.levelNum === levelNum);
        if (!level) {
            levelsEngine.addNewLevel(levelNum, 7 + levelNum, 3 + levelNum, 5 + levelNum, 1, 4 + levelNum);
            level = levelsEngine.levels.find(l => l.levelNum === levelNum);
        }
        return level;
    }
};

// Achievements Engine
var achievementsEngine = {
    achievements: [
        { id: "comboMaster", name: "Combo Master", description: "Reach a 10x combo", condition: () => gameEngine.comboCounter >= 10, unlocked: false, reward: 100 },
        { id: "speedDemon", name: "Speed Demon", description: "Finish a level in under 5 seconds", condition: () => timeEngine.timeLeft > (gameEngine.levelTime - 5), unlocked: false, reward: 50 },
        { id: "themeExplorer", name: "Theme Explorer", description: "Complete a themed level", condition: () => gameEngine.currentTheme !== "default", unlocked: false, reward: 75 }
    ],
    allAchievementsUnlocked: false,
    checkAchievements: function() {
        achievementsEngine.achievements.forEach(achievement => {
            if (!achievement.unlocked && achievement.condition()) {
                achievement.unlocked = true;
                gameEngine.updateScore(gameEngine.score + achievement.reward);
                document.querySelector(`#${achievement.id} .status`).innerHTML = "Unlocked";
                document.querySelector(`#${achievement.id} .status`).classList.add('status-unlocked');
                audioPool.playSound(levelPassed);
                if (achievementsEngine.achievements.every(ach => ach.unlocked)) {
                    achievementsEngine.allAchievementsUnlocked = true;
                    achievementsEngine.unlockRiddleChallenge();
                }
            }
        });
    },
    unlockRiddleChallenge: function() {
        const mysteryGameBtn = document.querySelector('#mysteryGameBtn');
        if (mysteryGameBtn) {
            mysteryGameBtn.style.display = 'block';
        }
    }
};

// Riddle Game Engine
var riddleGameEngine = {
    currentRiddle: null,
    attemptsRemaining: 3,
    riddles: [
        { question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", answer: "echo", codePart: "X7K9P" },
        { question: "What has keys but can't open locks?", answer: "piano", codePart: "X7K9P" },
        { question: "The more you take, the more you leave behind. What am I?", answer: "footsteps", codePart: "X7K9P" },
        { question: "What can travel around the world while staying in a corner?", answer: "stamp", codePart: "X7K9P" },
        { question: "I’m tall when I’m young, and I’m short when I’m old. What am I?", answer: "candle", codePart: "X7K9P" },
        { question: "What has a heart that doesn’t beat?", answer: "artichoke", codePart: "X7K9P" },
        { question: "What gets wetter the more it dries?", answer: "towel", codePart: "X7K9P" },
        { question: "What has cities, but no houses; forests, but no trees; and rivers, but no water?", answer: "map", codePart: "X7K9P" },
        { question: "What can fill a room but takes up no space?", answer: "light", codePart: "X7K9P" },
        { question: "What has one eye, but can’t see?", answer: "needle", codePart: "X7K9P" }
    ],
    start: function() {
        riddleGameEngine.attemptsRemaining = 3;
        riddleGameEngine.currentRiddle = riddleGameEngine.riddles[toolsBox.gnrtRndmNum(0, riddleGameEngine.riddles.length - 1)];
        mysteryResult.innerHTML = riddleGameEngine.currentRiddle.question;
        attemptsLeft.innerHTML = `Attempts Left: ${riddleGameEngine.attemptsRemaining}`;
        mysteryGuessInput.value = "";
        mysteryGuessInput.placeholder = "Type your answer here";
        mysteryGuessBtn.disabled = false;
    },
    guess: function() {
        const userAnswer = mysteryGuessInput.value.trim().toLowerCase();
        if (!userAnswer) {
            mysteryResult.innerHTML = "Please enter an answer!";
            audioPool.playSound(touchRed);
            return;
        }
        if (userAnswer === riddleGameEngine.currentRiddle.answer) {
            mysteryResult.innerHTML = `Correct! Part 1 Achieved: "${riddleGameEngine.currentRiddle.codePart}". Play Pacman Achievements to gain Part 2 and unlock the secret code!`;
            audioPool.playSound(levelPassed);
            mysteryGuessBtn.disabled = true;
            mysteryGuessInput.disabled = true;
        } else {
            riddleGameEngine.attemptsRemaining--;
            attemptsLeft.innerHTML = `Attempts Left: ${riddleGameEngine.attemptsRemaining}`;
            mysteryResult.innerHTML = "Wrong answer! Try again.";
            audioPool.playSound(touchRed);
            if (riddleGameEngine.attemptsRemaining <= 0) {
                mysteryResult.innerHTML = "Out of attempts! You must restart the game to try again.";
                mysteryGuessBtn.disabled = true;
                mysteryGuessInput.disabled = true;
                toolsBox.delay(function() {
                    toolsBox.hidePage(pageMysteryGame);
                    toolsBox.showPage(pageGameMenu);
                    gameEngine.stop();
                    achievementsEngine.achievements.forEach(ach => ach.unlocked = false);
                    document.querySelectorAll('.status').forEach(status => {
                        status.innerHTML = "Locked";
                        status.classList.remove('status-unlocked');
                    });
                    document.querySelector('#mysteryGameBtn').style.display = 'none';
                }, 2000);
            }
        }
        mysteryGuessInput.value = "";
    }
};

// Multiplayer Engine (Updated for Heroku)
var multiplayerEngine = {
    socket: null,
    playerId: null,
    gameId: null,
    opponentId: null,
    maxRetries: 3,
    retryCount: 0,
    retryDelay: 3000, // 3 seconds between retries
    init: function() {},
    joinGame: function(name) {
        this.gameId = name ? `${name}_game` : 'default';
        this.playerId = name || `Player${Math.floor(Math.random() * 1000)}`;
        this.retryCount = 0;
        this.connect();
    },
    connect: function() {
        console.log(`Attempting to connect (Attempt ${this.retryCount + 1}/${this.maxRetries}) to wss://taptaptap-server-61423.herokuapp.com?gameId=${this.gameId}&playerName=${this.playerId}`);
        this.socket = new WebSocket(`wss://taptaptap-server-61423.herokuapp.com?gameId=${this.gameId}&playerName=${this.playerId}`);

        this.socket.onopen = () => {
            console.log('Connected to server');
            this.retryCount = 0; // Reset retry count on success
            toolsBox.hidePage(pageMultiplayer);
            toolsBox.showPage(pageTutorial);
        };

        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received message:', data);
            switch (data.type) {
                case 'welcome':
                    this.playerId = data.playerId;
                    break;
                case 'playerList':
                    console.log('Players:', data.players);
                    break;
                case 'gameState':
                    this.updateGameState(data.state);
                    break;
            }
        };

        this.socket.onclose = (event) => {
            console.log('Disconnected from server. Code:', event.code, 'Reason:', event.reason);
            if (this.retryCount < this.maxRetries) {
                this.retryCount++;
                console.log(`Retrying connection in ${this.retryDelay/1000} seconds...`);
                setTimeout(() => this.connect(), this.retryDelay);
            } else {
                console.error('Max retries reached. Could not connect to server.');
                toolsBox.showPage(pageGameMenu);
                toolsBox.hidePage(pagePlayArea);
            }
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            if (error instanceof Event) {
                console.error('Error details:', {
                    type: error.type,
                    target: error.target ? error.target.url : 'No target',
                    message: error.message || 'No message'
                });
            }
        };
    },
    syncTap: function(tapValue) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            console.log('Sending tap:', tapValue);
            this.socket.send(JSON.stringify({ type: 'tap', tapValue: tapValue }));
        } else {
            console.log('Cannot sync tap: WebSocket not connected');
        }
    },
    startGame: function() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            console.log('Sending startGame');
            this.socket.send(JSON.stringify({ type: 'startGame' }));
        } else {
            console.log('Cannot start game: WebSocket not connected');
        }
    },
    updateGameState: function(state) {
        console.log('Updating game state:', state);
        if (state.gameActive && pagePlayArea.style.display !== 'block') {
            toolsBox.showPage(pagePlayArea);
            toolsBox.hidePage(pageTutorial);
            gameEngine.start(gameEngine.score, gameEngine.levelNum, 7, 5, 3, 1, 4);
        }
        Object.keys(state.scores).forEach(player => {
            if (player !== this.playerId) {
                opponentScore.innerHTML = `Opponent Score: ${state.scores[player]}`;
            } else {
                gameEngine.score = state.scores[player];
                gmStatsScore.innerHTML = gameEngine.score;
            }
        });
    }
};

// Audio Pool
var audioPool = {
    sounds: [
        circleAppear = { sound: "circleAppear", preload: true, volume: 1, loop: false },
        touchBlue = { sound: "touchBlue", preload: true, volume: 0.5, loop: false },
        touchRed = { sound: "touchRed", preload: true, volume: 1, loop: false },
        levelPassed = { sound: "levelPassed", preload: true, volume: 1, loop: false },
        levelLost = { sound: "levelLost", preload: true, volume: 1, loop: false },
        buttonTap = { sound: "buttonTap", preload: true, volume: 1, loop: false },
        delayCount = { sound: "delayCount", preload: true, volume: 1, loop: false },
        timeAlmostUp = { sound: "timeAlmostUp", preload: true, volume: 0.5, loop: true }
    ],
    createAudioPlayer: function(element) {
        element.audioPlayer = document.createElement('audio');
        var mp3Source = document.createElement('source'), oggSource = document.createElement('source');
        mp3Source.setAttribute('type', 'audio/mpeg'); oggSource.setAttribute('type', 'audio/ogg');
        mp3Source.setAttribute('src', "sounds/mp3/" + element.sound + ".mp3");
        oggSource.setAttribute('src', "sounds/ogg/" + element.sound + ".ogg");
        element.audioPlayer.appendChild(mp3Source); element.audioPlayer.appendChild(oggSource);
        document.body.appendChild(element.audioPlayer);
        element.audioPlayer.volume = element.volume;
        if (element.preload) element.audioPlayer.load();
        if (element.loop) element.audioPlayer.loop = true;
    },
    addSounds: function() { for (var i = 0; i < audioPool.sounds.length; i++) audioPool.createAudioPlayer(audioPool.sounds[i]); },
    playSound: function(soundName) { soundName.audioPlayer.currentTime = 0; soundName.audioPlayer.play(); },
    stopSound: function(soundName) { soundName.audioPlayer.pause(); soundName.audioPlayer.currentTime = 0; }
};
audioPool.addSounds();

// Button Event Listeners
document.ontouchmove = function(e) { e.preventDefault(); };
toolsBox.onClickNTouchstart(tutPgStartGameBtn, function() {
    audioPool.playSound(buttonTap);
    gameEngine.stop();
    toolsBox.hidePage(pageTutorial);
    toolsBox.showPage(pagePlayDelay);
    toolsBox.pagePlayDelay.start();
    toolsBox.delay(function() { toolsBox.showPage(pagePlayArea); }, 1500);
    toolsBox.delay(function() { 
        gameEngine.startLevel(); 
        multiplayerEngine.startGame(); // Sync game start with server
    }, 1500);
});
toolsBox.onClickNTouchstart(lvlPssdContinueNextLvlBtn, function() {
    audioPool.playSound(buttonTap);
    toolsBox.hidePage(pageLevelPassed);
    toolsBox.showPage(pagePlayDelay);
    toolsBox.pagePlayDelay.start();
    toolsBox.delay(function() { toolsBox.showPage(pagePlayArea); }, 1500);
    toolsBox.delay(gameEngine.startLevel, 1500);
});
lvlLostTryAgainBtn.addEventListener('click', function() {
    audioPool.playSound(buttonTap);
    toolsBox.hidePage(pageYouLost);
    toolsBox.showPage(pageGameMenu);
    gameEngine.stop();
}, false);
toolsBox.onClickNTouchstart(gmStatsPauseBtn, function() {
    audioPool.playSound(buttonTap);
    gameEngine.pause();
    toolsBox.showPage(pagePauseMenu);
    toolsBox.hidePage(pagePlayArea);
    lvlPausedScore.innerHTML = gameEngine.score;
});
toolsBox.onClickNTouchstart(pmRstrtLvlBtn, function() {
    audioPool.playSound(buttonTap);
    toolsBox.showPage(pageGameMenu);
    toolsBox.hidePage(pagePauseMenu);
    gameEngine.stop();
});
toolsBox.onClickNTouchstart(pmCntnuGmBtn, function() {
    audioPool.playSound(buttonTap);
    toolsBox.showPage(pagePlayArea);
    toolsBox.hidePage(pagePauseMenu);
    gameEngine.resume();
});
abtPageBackBtn.addEventListener('click', function() {
    audioPool.playSound(buttonTap);
    toolsBox.showPage(pageGameMenu);
    toolsBox.hidePage(pageAbout);
}, false);
newGameBtn.addEventListener('click', function() {
    audioPool.playSound(buttonTap);
    toolsBox.showPage(pageTutorial);
    toolsBox.hidePage(pageGameMenu);
}, false);
aboutBtn.addEventListener('click', function() {
    audioPool.playSound(buttonTap);
    toolsBox.showPage(pageAbout);
    toolsBox.hidePage(pageGameMenu);
}, false);
achievementsBtn.addEventListener('click', function() {
    audioPool.playSound(buttonTap);
    toolsBox.showPage(pageAchievements);
    toolsBox.hidePage(pageGameMenu);
}, false);
achPageBackBtn.addEventListener('click', function() {
    audioPool.playSound(buttonTap);
    toolsBox.showPage(pageGameMenu);
    toolsBox.hidePage(pageAchievements);
}, false);
multiplayerBtn.addEventListener('click', function() {
    audioPool.playSound(buttonTap);
    toolsBox.showPage(pageMultiplayer);
    toolsBox.hidePage(pageGameMenu);
}, false);
joinGameBtn.addEventListener('click', function() {
    audioPool.playSound(buttonTap);
    multiplayerEngine.joinGame(playerName.value);
}, false);
mpBackBtn.addEventListener('click', function() {
    audioPool.playSound(buttonTap);
    toolsBox.showPage(pageGameMenu);
    toolsBox.hidePage(pageMultiplayer);
}, false);

// Riddle Game Event Listeners
mysteryGameBtn.addEventListener('click', function() {
    audioPool.playSound(buttonTap);
    toolsBox.showPage(pageMysteryGame);
    toolsBox.hidePage(pageGameMenu);
    riddleGameEngine.start();
}, false);
mysteryGuessBtn.addEventListener('click', function() {
    audioPool.playSound(buttonTap);
    riddleGameEngine.guess();
}, false);
mysteryBackBtn.addEventListener('click', function() {
    audioPool.playSound(buttonTap);
    toolsBox.showPage(pageGameMenu);
    toolsBox.hidePage(pageMysteryGame);
}, false);

// Initial Setup
toolsBox.hideSplashScreen();