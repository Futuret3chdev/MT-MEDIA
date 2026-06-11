document.addEventListener('DOMContentLoaded', function() {
    // Ensure viewport meta tag to disable zooming
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover, shrink-to-fit=no';
        document.head.appendChild(meta);
    } else {
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover, shrink-to-fit=no';
    }

    // Add CSS to lock screen, prevent zooming, and ensure clickable elements
    const style = document.createElement('style');
    style.innerHTML = `
        body, html {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100dvh !important;
            overflow: hidden !important;
            overflow-x: hidden !important;
            touch-action: none !important;
            overscroll-behavior: none !important;
            -webkit-overflow-scrolling: auto !important;
            -webkit-text-size-adjust: 100% !important;
            -webkit-user-zoom: fixed !important;
            -webkit-touch-callout: none !important;
            margin: 0 !important;
            padding: 0 !important;
            padding-top: env(safe-area-inset-top) !important;
            padding-bottom: env(safe-area-inset-bottom) !important;
        }
        .main-wrapper {
            width: 100vw !important;
            height: 100dvh !important;
            max-width: none !important;
            max-height: none !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            transform: none !important;
            touch-action: none !important;
            overflow: hidden !important;
            overflow-x: hidden !important;
        }
        .tpbl-circle, button, .submit-circle, [id$="Btn"] {
            cursor: pointer !important;
            pointer-events: auto !important;
            user-select: none !important;
            z-index: 2000 !important;
        }
        #gameSpace {
            position: relative;
            z-index: 500 !important;
            touch-action: none !important;
        }
        #pageHighScore, #pageYouLost {
            z-index: 5000 !important;
        }
        #pageGameMenu, #pagePlayArea, #pageTutorial, #pageYouLost, #pageHighScore, 
        #pageLeaderboard, #pageAbout, #pageAchievements, #pageMultiplayer, 
        #pageMysteryGame, #pagePauseMenu, #pageLevelPassed, #pageSplash, #pagePlayDelay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100dvh !important;
            transform: scale(1) !important;
            z-index: 1000 !important;
            touch-action: none !important;
        }
        #pageYouLost {
            z-index: 10000 !important; /* Highest z-index to ensure it’s above everything */
            background-color: rgba(0, 0, 0, 0.8) !important; /* Ensure visibility */
        }
        #lvlLostTryAgainBtn {
            z-index: 10001 !important; /* Even higher z-index for the button */
            pointer-events: auto !important;
            position: relative !important;
        }
        /* Ensure all elements except pageYouLost don’t capture events when pageYouLost is visible */
        body.pageYouLostVisible *:not(#pageYouLost):not(#pageYouLost *) {
            pointer-events: none !important;
            visibility: hidden !important;
        }
    `;
    document.head.appendChild(style);

    // Prevent touchmove scrolling
    document.addEventListener('touchmove', function(e) {
        e.preventDefault();
        e.stopPropagation();
    }, { passive: false });

    // Prevent pinch zooming
    document.addEventListener('gesturestart', function(e) {
        e.preventDefault();
    }, { passive: false });
    document.addEventListener('gesturechange', function(e) {
        e.preventDefault();
        document.body.style.transform = 'scale(1)';
    }, { passive: false });
    document.addEventListener('gestureend', function(e) {
        e.preventDefault();
        document.body.style.transform = 'scale(1)';
    }, { passive: false });

    // Prevent multi-touch zooming
    document.addEventListener('touchstart', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, { passive: false });

    // Prevent zoom via mouse wheel (for Android Chrome)
    document.addEventListener('wheel', function(e) {
        if (e.ctrlKey) {
            e.preventDefault();
        }
    }, { passive: false });

    // Force full-screen rendering on resize, orientation change, and initial load
    function enforceFullScreen() {
        window.scrollTo(0, 0);
        document.body.style.transform = 'scale(1)';
        document.documentElement.style.transform = 'scale(1)';
        // Ensure lvlLostTryAgainBtn is clickable
        if (lvlLostTryAgainBtn) {
            lvlLostTryAgainBtn.style.pointerEvents = 'auto !important';
            lvlLostTryAgainBtn.style.zIndex = '10001 !important';
        }
        // Log computed styles to check for conflicts
        const bodyStyles = window.getComputedStyle(document.body);
        const mainWrapperStyles = window.getComputedStyle(document.querySelector('.main-wrapper'));
        const pageYouLostStyles = window.getComputedStyle(pageYouLost);
        console.log('Computed body styles:', {
            touchAction: bodyStyles.touchAction,
            overflow: bodyStyles.overflow,
            width: bodyStyles.width,
            height: bodyStyles.height,
            transform: bodyStyles.transform
        });
        console.log('Computed main-wrapper styles:', {
            width: mainWrapperStyles.width,
            height: mainWrapperStyles.height,
            transform: mainWrapperStyles.transform
        });
        console.log('Computed pageYouLost styles:', {
            display: pageYouLostStyles.display,
            zIndex: pageYouLostStyles.zIndex
        });
    }
    window.addEventListener('resize', enforceFullScreen);
    window.addEventListener('orientationchange', function() {
        enforceFullScreen();
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover, shrink-to-fit=no';
    });
    window.addEventListener('load', enforceFullScreen);
    // Initial enforcement
    enforceFullScreen();
    // Reapply after a short delay to catch initial zoom
    setTimeout(enforceFullScreen, 100);

    // Validate critical DOM elements
    const requiredElements = [
        'pageGameMenu', 'newGameBtn', 'gameSpace', 'tutPgStartGameBtn', 'pagePlayArea',
        'gmStatsScore', 'gmStatsLvlNumb', 'gmStatsCurrentTapCount', 'gmStatsTotalTapCount',
        'usernameInput', 'pageTutorial', 'pageHighScore', 'pageYouLost', 'lvlLostTryAgainBtn'
    ];
    requiredElements.forEach(id => {
        if (!document.querySelector(`#${id}`)) {
            console.error(`Critical element missing: #${id}`);
        } else {
            console.log(`Found element: #${id}`);
        }
    });

    // Log DOM hierarchy for debugging
    console.log('DOM hierarchy:', document.body.innerHTML.substring(0, 500) + '...');

    // Add a capture-phase click listener on document to catch lvlLostTryAgainBtn clicks first
    document.addEventListener('click', function(e) {
        console.log('Capture-phase click event:', { target: e.target, id: e.target.id, class: e.target.className, coords: { x: e.clientX, y: e.clientY } });
        // Log viewport dimensions for context
        console.log('Viewport dimensions:', { width: window.innerWidth, height: window.innerHeight });
        if (e.target.id === 'lvlLostTryAgainBtn') {
            e.stopPropagation();
            e.preventDefault();
            console.log('Document capture-phase click on lvlLostTryAgainBtn:', e.target);
            const btnStyles = window.getComputedStyle(lvlLostTryAgainBtn);
            const btnRect = lvlLostTryAgainBtn.getBoundingClientRect();
            console.log('Computed lvlLostTryAgainBtn styles:', {
                display: btnStyles.display,
                zIndex: btnStyles.zIndex,
                pointerEvents: btnStyles.pointerEvents,
                boundingBox: btnRect
            });
            const pageYouLostStyles = window.getComputedStyle(pageYouLost);
            const pageYouLostRect = pageYouLost.getBoundingClientRect();
            console.log('Computed pageYouLost styles:', {
                display: pageYouLostStyles.display,
                zIndex: pageYouLostStyles.zIndex,
                boundingBox: pageYouLostRect
            });
            console.log('pageYouLost display before hide:', pageYouLost.style.display);
            console.log('pageGameMenu display before show:', pageGameMenu.style.display);
            gameEngine.stop();
            toolsBox.hidePage(pageYouLost);
            console.log('pageYouLost display after hide:', pageYouLost.style.display);
            setTimeout(() => {
                toolsBox.showPage(pageGameMenu);
                console.log('pageGameMenu display after show:', pageGameMenu.style.display);
            }, 100);
            audioPool.playSound(buttonTap);
        }
    }, { capture: true });

    // Add a capture-phase touchstart listener on document for mobile
    document.addEventListener('touchstart', function(e) {
        console.log('Capture-phase touchstart event:', { target: e.target, id: e.target.id, class: e.target.className, coords: { x: e.touches[0].clientX, y: e.touches[0].clientY } });
        // Log viewport dimensions for context
        console.log('Viewport dimensions:', { width: window.innerWidth, height: window.innerHeight });
        if (e.target.id === 'lvlLostTryAgainBtn') {
            e.stopPropagation();
            e.preventDefault();
            console.log('Document capture-phase touchstart on lvlLostTryAgainBtn:', e.target);
            const btnStyles = window.getComputedStyle(lvlLostTryAgainBtn);
            const btnRect = lvlLostTryAgainBtn.getBoundingClientRect();
            console.log('Computed lvlLostTryAgainBtn styles:', {
                display: btnStyles.display,
                zIndex: btnStyles.zIndex,
                pointerEvents: btnStyles.pointerEvents,
                boundingBox: btnRect
            });
            const pageYouLostStyles = window.getComputedStyle(pageYouLost);
            const pageYouLostRect = pageYouLost.getBoundingClientRect();
            console.log('Computed pageYouLost styles:', {
                display: pageYouLostStyles.display,
                zIndex: pageYouLostStyles.zIndex,
                boundingBox: pageYouLostRect
            });
            console.log('pageYouLost display before hide:', pageYouLost.style.display);
            console.log('pageGameMenu display before show:', pageGameMenu.style.display);
            gameEngine.stop();
            toolsBox.hidePage(pageYouLost);
            console.log('pageYouLost display after hide:', pageYouLost.style.display);
            setTimeout(() => {
                toolsBox.showPage(pageGameMenu);
                console.log('pageGameMenu display after show:', pageGameMenu.style.display);
            }, 100);
            audioPool.playSound(buttonTap);
        }
    }, { capture: true, passive: false });

    // Global click listener for debugging (bubbling phase)
    document.addEventListener('click', function(e) {
        console.log('Global click:', { target: e.target, id: e.target.id, class: e.target.className, coords: { x: e.clientX, y: e.clientY } });
        // Log parent elements to trace event propagation
        let parent = e.target;
        const parentChain = [];
        while (parent && parent !== document) {
            parentChain.push({ tag: parent.tagName, id: parent.id, class: parent.className });
            parent = parent.parentElement;
        }
        console.log('Event propagation path:', parentChain);
    }, false);

    // MutationObserver for dynamic elements
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.classList && node.classList.contains('submit-circle')) {
                            console.log('Dynamic submit-circle added:', node);
                        }
                        requiredElements.forEach(id => {
                            if (node.id === id || node.querySelector(`#${id}`)) {
                                console.log(`Dynamic element added: #${id}`);
                            }
                        });
                    }
                });
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
});

// Page Elements
var pageSplash = document.querySelector('#pageSplash'), splashScreenTxt = document.querySelector('#splashScreenTxt'), splashScreenLogo = document.querySelector('#splashScreenLogo');
var pagePlayDelay = document.querySelector('#pagePlayDelay'), palyDelayCont = document.querySelector('#palyDelayCont'), playDelayNum = document.querySelector('#playDelayNum');
var pagePlayArea = document.querySelector('#pagePlayArea'), gmStatsTimeProgress = document.querySelector('#gmStatsTimeProgress'), gmStatsPauseBtn = document.querySelector('#gmStatsPauseBtn'), gmStatsScore = document.querySelector('#gmStatsScore'), gmStatsLvlNumb = document.querySelector('#gmStatsLvlNumb'), gameSpace = document.querySelector('#gameSpace'), gmStatsCurrentTapCount = document.querySelector('#gmStatsCurrentTapCount'), gmStatsTotalTapCount = document.querySelector('#gmStatsTotalTapCount');
var pageGameMenu = document.querySelector('#pageGameMenu'), newGameBtn = document.querySelector('#newGameBtn'), multiplayerBtn = document.querySelector('#multiplayerBtn'), achievementsBtn = document.querySelector('#achievementsBtn'), aboutBtn = document.querySelector('#aboutBtn'), mysteryGameBtn = document.querySelector('#mysteryGameBtn'), leaderboardBtn = document.querySelector('#leaderboardBtn');
var pageTutorial = document.querySelector('#pageTutorial'), tutPgStartGameBtn = document.querySelector('#tutPgStartGameBtn'), usernameInput = document.querySelector('#usernameInput');
var pagePauseMenu = document.querySelector('#pagePauseMenu'), lvlPausedScore = document.querySelector('#lvlPausedScore'), pmRstrtLvlBtn = document.querySelector('#pmRstrtLvlBtn'), pmCntnuGmBtn = document.querySelector('#pmCntnuGmBtn');
var pageLevelPassed = document.querySelector('#pageLevelPassed'), lvlPssdTtl = document.querySelector('#lvlPssdTtl'), lvlPssdScore = document.querySelector('#lvlPssdScore'), lvlPssdBonusScore = document.querySelector('#lvlPssdBonusScore'), lvlPssdContinueNextLvlBtn = document.querySelector('#lvlPssdContinueNextLvlBtn');
var pageYouLost = document.querySelector('#pageYouLost'), lvlLostScore = document.querySelector('#lvlLostScore'), lvlLostTtl = document.querySelector('#lvlLostTtl'), lvlLostTryAgainBtn = document.querySelector('#lvlLostTryAgainBtn'), lvlLostIcon = document.querySelector('#lvlLostIcon');
var pageHighScore = document.querySelector('#pageHighScore'), lvlLostNewHighScore = document.querySelector('#lvlLostNewHighScore');
var pageAbout = document.querySelector('#pageAbout'), abtPageBackBtn = document.querySelector('#abtPageBackBtn');
var pageAchievements = document.querySelector('#pageAchievements'), achPageBackBtn = document.querySelector('#achPageBackBtn');
var pageMultiplayer = document.querySelector('#pageMultiplayer'), playerName = document.querySelector('#playerName'), joinGameBtn = document.querySelector('#joinGameBtn'), opponentScore = document.querySelector('#opponentScore'), mpBackBtn = document.querySelector('#mpBackBtn');
var pageMysteryGame = document.querySelector('#pageMysteryGame'), mysteryGuessInput = document.querySelector('#mysteryGuessInput'), mysteryGuessBtn = document.querySelector('#mysteryGuessBtn'), mysteryResult = document.querySelector('#mysteryResult'), mysteryBackBtn = document.querySelector('#mysteryBackBtn'), attemptsLeft = document.querySelector('#attemptsLeft');
var pageLeaderboard = document.querySelector('#pageLeaderboard'), leaderboardBackBtn = document.querySelector('#leaderboardBackBtn'), leaderboardBody = document.querySelector('#leaderboardBody');

// Tools
var toolsBox = {
    delay: function(fun, delayTime) { setTimeout(fun, delayTime); },
    gnrtRndmNum: function(minNumb, maxNumb) { return Math.floor(Math.random() * (maxNumb - minNumb + 1)) + minNumb; },
    showPage: function(page) {
        page.style.display = "block";
        // Force reset zoom and position
        document.body.style.transform = 'scale(1)';
        document.body.style.transformOrigin = '0 0';
        window.scrollTo(0, 0);
        // Only manage gameSpace and pagePlayArea for specific pages (e.g., after gameplay starts)
        const pagesRequiringRemoval = [pageYouLost, pageHighScore, pagePauseMenu, pageLevelPassed];
        if (pagesRequiringRemoval.includes(page)) {
            // Remove gameSpace from DOM
            if (gameSpace && gameSpace.parentNode) {
                gameSpace.parentNode.removeChild(gameSpace);
                console.log('Removed gameSpace from DOM');
            }
            // Remove pagePlayArea from DOM
            if (pagePlayArea && pagePlayArea.parentNode) {
                pagePlayArea.parentNode.removeChild(pagePlayArea);
                console.log('Removed pagePlayArea from DOM');
            }
            // Remove gameSpace event listeners as a precaution
            removeGameSpaceListeners();
        } else if (page === pagePlayArea) {
            // Reattach pagePlayArea to DOM
            if (!pagePlayArea.parentNode) {
                const mainWrapper = document.querySelector('.main-wrapper') || document.body;
                mainWrapper.appendChild(pagePlayArea);
                console.log('Reattached pagePlayArea to DOM');
                // Verify critical child elements
                const gmStatsCombo = pagePlayArea.querySelector('#gmStatsCombo');
                const gameSpaceChild = pagePlayArea.querySelector('#gameSpace');
                console.log('After reattaching pagePlayArea:', {
                    gmStatsComboExists: !!gmStatsCombo,
                    gameSpaceExists: !!gameSpaceChild
                });
            }
            // Reattach gameSpace to pagePlayArea
            if (!gameSpace.parentNode) {
                pagePlayArea.appendChild(gameSpace);
                console.log('Reattached gameSpace to pagePlayArea');
            }
            gameSpace.style.display = 'block !important';
            gameSpace.style.pointerEvents = 'auto !important';
            gameSpace.style.visibility = 'visible !important';
            pagePlayArea.style.display = 'block !important';
            // Reattach gameSpace event listeners
            attachGameSpaceListeners();
        }
        // Add class to body to indicate pageYouLost visibility
        if (page === pageYouLost) {
            document.body.classList.add('pageYouLostVisible');
        } else {
            document.body.classList.remove('pageYouLostVisible');
        }
        // Log computed styles for debugging
        const pagePlayAreaStyles = window.getComputedStyle(pagePlayArea);
        console.log('Computed pagePlayArea styles:', { display: pagePlayAreaStyles.display, zIndex: pagePlayAreaStyles.zIndex });
    },
    hidePage: function(page) { 
        page.style.display = "none"; 
        // Remove pageYouLostVisible class if hiding pageYouLost
        if (page === pageYouLost) {
            document.body.classList.remove('pageYouLostVisible');
        }
    },
    hideSplashScreen: function() {
        splashScreenTxt.classList.add('fadeOut-animation');
        splashScreenLogo.classList.add('fadeOut-animation');
        toolsBox.delay(function() { toolsBox.showPage(pageGameMenu); toolsBox.hidePage(pageSplash); }, 1500);
    },
    onClickNTouchstart: function(element, fun) {
        const handler = function(e) {
            console.log(`${e.type} event on:`, element, 'id:', element.id, 'class:', element.className, 'coords:', { x: e.clientX, y: e.clientY });
            fun(e);
        };
        element.addEventListener('click', handler, false);
        element.addEventListener('mousedown', handler, false);
        element.addEventListener('touchstart', handler, { passive: true });
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
                if (parseInt(playDelayNum.innerHTML, 10) > 1) {
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

// Leaderboard Engine
var leaderboardEngine = {
    maxEntries: 10,
    apiUrl: 'https://memetorrent.futuret3ch.com.au/games/unix/tap/api/leaderboard.php',
    hasShownSanitizationAlert: false, // Flag to prevent double alerts
    // In-memory fallback for scores if localStorage is unavailable (e.g., Safari private mode)
    inMemoryScores: [],
    // Check if localStorage is available (e.g., not blocked in Safari private browsing mode)
    isLocalStorageAvailable: function() {
        try {
            const testKey = '__test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            console.warn('localStorage is not available:', e.message);
            return false;
        }
    },
    // Save scores to localStorage or in-memory fallback
    saveScores: function(scores) {
        if (leaderboardEngine.isLocalStorageAvailable()) {
            try {
                localStorage.setItem('localScores', JSON.stringify(scores));
                console.log('Scores saved to localStorage:', scores);
            } catch (error) {
                console.error('Error saving scores to localStorage:', error.message);
                leaderboardEngine.inMemoryScores = scores;
                console.log('Scores saved to in-memory fallback:', scores);
            }
        } else {
            leaderboardEngine.inMemoryScores = scores;
            console.log('Scores saved to in-memory fallback (localStorage unavailable):', scores);
        }
    },
    // Load scores from localStorage or in-memory fallback
    loadScores: function() {
        if (leaderboardEngine.isLocalStorageAvailable()) {
            try {
                const scores = JSON.parse(localStorage.getItem('localScores') || '[]');
                console.log('Scores loaded from localStorage:', scores);
                return scores;
            } catch (error) {
                console.error('Error loading scores from localStorage:', error.message);
                console.log('Falling back to in-memory scores:', leaderboardEngine.inMemoryScores);
                return leaderboardEngine.inMemoryScores;
            }
        } else {
            console.log('localStorage unavailable, using in-memory scores:', leaderboardEngine.inMemoryScores);
            return leaderboardEngine.inMemoryScores;
        }
    },
    // Save a server score with display name for later mapping
    saveServerScoreWithDisplayName: function(serverScore, displayName) {
        if (leaderboardEngine.isLocalStorageAvailable()) {
            try {
                const serverScores = JSON.parse(localStorage.getItem('serverScores') || '[]');
                // Avoid duplicates by checking if this score already exists
                const existingIndex = serverScores.findIndex(s => s.score === serverScore.score && s.player_name === serverScore.player_name);
                if (existingIndex !== -1) {
                    serverScores[existingIndex].display_name = displayName;
                } else {
                    serverScores.push({ ...serverScore, display_name: displayName });
                }
                localStorage.setItem('serverScores', JSON.stringify(serverScores));
                console.log('Server score with display name saved to localStorage:', serverScores);
            } catch (error) {
                console.error('Error saving server score to localStorage:', error.message);
            }
        }
    },
    // Load server scores with display names
    loadServerScores: function() {
        if (leaderboardEngine.isLocalStorageAvailable()) {
            try {
                const scores = JSON.parse(localStorage.getItem('serverScores') || '[]');
                console.log('Server scores loaded from localStorage:', scores);
                return scores;
            } catch (error) {
                console.error('Error loading server scores from localStorage:', error.message);
                return [];
            }
        }
        return [];
    },
    saveScore: async function(playerName, score) {
        try {
            const sanitizedScore = parseInt(score, 10);
            const displayName = playerName || 'player';
            const serverName = 'guest'; // Fixed name that the server accepts
            console.log(`Using serverName: ${serverName} for API, displayName: ${displayName} for UI`);
            if (isNaN(sanitizedScore) || sanitizedScore <= 0) {
                throw new Error('Client-side validation failed: Score must be a positive number');
            }
            const payload = {
                player_name: serverName,
                score: sanitizedScore
            };
            console.log('Saving score with payload:', JSON.stringify(payload), 'displayName:', displayName);
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': navigator.userAgent // Add User-Agent to identify client
            };
            console.log('Request headers:', headers);
            console.log('Sending fetch request to:', leaderboardEngine.apiUrl);
            let response;
            try {
                response = await fetch(leaderboardEngine.apiUrl, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(payload)
                });
            } catch (fetchError) {
                console.error('Fetch error:', fetchError.message, 'Stack:', fetchError.stack);
                throw new Error(`Network error during fetch: ${fetchError.message}`);
            }
            console.log('Server response status:', response.status, 'Status text:', response.statusText);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));
            let result;
            try {
                result = await response.json();
                console.log('Parsed server response:', result);
            } catch (parseError) {
                console.error('Error parsing server response as JSON:', parseError.message, 'Stack:', parseError.stack);
                const rawText = await response.text();
                console.log('Raw server response:', rawText);
                throw new Error(`Failed to parse server response as JSON: ${parseError.message}. Raw response: ${rawText}`);
            }
            if (!response.ok) {
                console.error('Server returned non-OK status:', response.status, 'Response body:', result);
                throw new Error(`Failed to save score: ${response.status} ${result.error || 'Unknown error'}`);
            }
            console.log('Score saved successfully to server:', result);
            // Save the server score with display name for later mapping
            leaderboardEngine.saveServerScoreWithDisplayName({ player_name: serverName, score: sanitizedScore }, displayName);
            return { ...result, success: true, display_name: displayName };
        } catch (error) {
            console.error('Error saving score to server:', error.message, 'Stack:', error.stack);
            // Fallback to local storage or in-memory storage
            try {
                const localScores = leaderboardEngine.loadScores();
                const newScore = { 
                    player_name: playerName || 'player', 
                    score: parseInt(score, 10), 
                    display_name: playerName || 'player'
                };
                localScores.push(newScore);
                leaderboardEngine.saveScores(localScores);
                alert('Score saved locally due to a server issue. It will appear on the leaderboard when you’re back online.');
                return { error: error.message, savedLocally: true, display_name: playerName || 'player' };
            } catch (localStorageError) {
                console.error('Error saving score to local storage:', localStorageError.message, 'Stack:', localStorageError.stack);
                alert('Failed to save score to server or locally. Please try again later.');
                return { error: `Server error: ${error.message}, Local storage error: ${localStorageError.message}`, savedLocally: false, display_name: playerName || 'player' };
            }
        }
    },
    getScores: async function() {
        try {
            console.log('Fetching scores from server:', leaderboardEngine.apiUrl);
            const response = await fetch(leaderboardEngine.apiUrl);
            if (!response.ok) throw new Error('Failed to fetch scores: ' + response.statusText);
            let apiScores = await response.json();
            console.log('Raw apiScores from server:', apiScores);
            // Load server scores with display names from localStorage
            const serverScoresWithNames = leaderboardEngine.loadServerScores();
            // Map display names to apiScores
            apiScores = apiScores.map(score => {
                const matchedScore = serverScoresWithNames.find(s => s.score === score.score && s.player_name === score.player_name);
                if (matchedScore && matchedScore.display_name) {
                    return { ...score, display_name: matchedScore.display_name };
                }
                return score;
            });
            console.log('apiScores after mapping display names:', apiScores);
            const localScores = leaderboardEngine.loadScores();
            console.log('localScores:', localScores);
            // Use display_name if available, otherwise fall back to player_name
            const combinedScores = [...apiScores, ...localScores].map(score => ({
                ...score,
                player_name: score.display_name || score.player_name
            }));
            console.log('Combined scores:', combinedScores);
            return combinedScores.sort((a, b) => b.score - a.score).slice(0, leaderboardEngine.maxEntries);
        } catch (error) {
            console.error('Error fetching scores from server:', error.message, 'Stack:', error.stack);
            leaderboardBody.innerHTML = '<tr><td colspan="3">Failed to load leaderboard from server</td></tr>';
            const localScores = leaderboardEngine.loadScores();
            console.log('Falling back to localScores:', localScores);
            return localScores.map(score => ({
                ...score,
                player_name: score.display_name || score.player_name
            })).sort((a, b) => b.score - a.score).slice(0, leaderboardEngine.maxEntries);
        }
    },
    displayLeaderboard: async function() {
        const scores = await leaderboardEngine.getScores();
        leaderboardBody.innerHTML = '';
        if (scores.length === 0) {
            leaderboardBody.innerHTML = '<tr><td colspan="3">No scores yet!</td></tr>';
            return;
        }
        scores.forEach((entry, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${entry.player_name}</td>
                <td>${entry.score}</td>
            `;
            leaderboardBody.appendChild(row);
        });
        console.log('Leaderboard displayed with scores:', scores);
    },
    promptForName: async function(score) {
        console.log('promptForName: score=', score);
        if (isNaN(score) || score <= 0) {
            console.error('Invalid score, cannot save:', score);
            alert('Cannot save score: Your score is not positive. Try playing again!');
            toolsBox.hidePage(pagePlayArea);
            toolsBox.showPage(pageYouLost);
            gameEngine.stop();
            return;
        }
        let playerName = localStorage.getItem('playerUsername') || 'player';
        console.log('promptForName: playerName=', playerName);
        leaderboardEngine.hasShownSanitizationAlert = false; // Reset alert flag for this session
        try {
            const result = await leaderboardEngine.saveScore(playerName, score);
            console.log('Save score result:', result);
            if (result.success) {
                toolsBox.hidePage(pageYouLost);
                toolsBox.showPage(pageHighScore);
                lvlLostNewHighScore.innerHTML = score;
                alert('Score saved successfully!');
            } else {
                console.error('Failed to save score:', result.error);
                // Alert is already handled in saveScore
                toolsBox.hidePage(pagePlayArea);
                toolsBox.showPage(pageYouLost);
                gameEngine.stop();
            }
        } catch (error) {
            console.error('Unexpected error in promptForName:', error.message, 'Stack:', error.stack);
            alert('An unexpected error occurred while saving your score. Please try again later.');
            toolsBox.hidePage(pagePlayArea);
            toolsBox.showPage(pageYouLost);
            gameEngine.stop();
        }
    }
};

// Time Engine
var timeEngine = {
    progressTimer: null, // Ensure this is null initially
    timeLeft: 0,
    levelTime: 0,
    progressValue: 100,
    endingSound: false,
    start: function(time) {
        timeEngine.timeLeft = time;
        timeEngine.progressTimer = setInterval(function(){ timeEngine.updateTimeProgress(time); }, 100);
        console.log('Time engine started, timer ID:', timeEngine.progressTimer);
    },
    stop: function() {
        if (timeEngine.progressTimer) {
            clearInterval(timeEngine.progressTimer);
            timeEngine.progressTimer = null; // Ensure timer is cleared
            console.log('Time engine stopped');
        }
        gmStatsTimeProgress.classList.remove('switchColors-animation');
        if (timeEngine.endingSound) { 
            timeEngine.endingSound = false; 
            audioPool.stopSound(timeAlmostUp); 
        }
    },
    resume: function() { 
        if (!timeEngine.progressTimer) {
            timeEngine.start(timeEngine.timeLeft); 
        }
    },
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
        if (timeEngine.timeLeft <= 0 && !gameEngine.isGameOver) {
            timeEngine.stop();
            gameEngine.timesUp();
            timeEngine.endingSound = false;
            audioPool.stopSound(timeAlmostUp);
        }
        if (timeEngine.timeLeft < 4 && timeEngine.timeLeft > 0) {
            gmStatsTimeProgress.classList.add('switchColors-animation');
            if (!timeEngine.endingSound) { 
                timeEngine.endingSound = true; 
                audioPool.playSound(timeAlmostUp); 
            }
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
                console.log('Created evil-circle:', element);
                return element;
            case ".good-circle":
                element.setAttribute('class', 'tpbl-circle c-blue good-circle');
                gameSpace.appendChild(element);
                console.log('Created good-circle:', element);
                return element;
        }
    },
    destroy: function(circle) { 
        if (circle) {
            Array.from(circle).forEach(function(element){ 
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });
        }
    },
    randomPosition: function(circle) {
        var gameSpcWidth = gameSpace.offsetWidth, gmSpcHeight = gameSpace.offsetHeight, tpblCircleWidth = circle.offsetWidth, tpblCircleHeight = circle.offsetHeight;
        circle.style.left = toolsBox.gnrtRndmNum(tpblCircleWidth, (gameSpcWidth - tpblCircleWidth)) + "px";
        circle.style.top = toolsBox.gnrtRndmNum(tpblCircleHeight, (gmSpcHeight - tpblCircleHeight)) + "px";
    },
    add: function(typeOfCircle, numOfCircles) {
        if (document.querySelectorAll(typeOfCircle).length > 0) { 
            circlesEngine.destroy(document.querySelectorAll(typeOfCircle)); 
        }
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
        setTimeout(function() { 
            circle.classList.add('grow-animation'); 
            requestAnimationFrame(() => audioPool.playSound(circleAppear)); 
        }, i * 50);
    },
    goodCircleTap: function(typeOfCircle, numOfCircles) {
        gameEngine.goodCircleTap();
        // Defer DOM updates to avoid blocking the main thread
        requestAnimationFrame(() => {
            circlesEngine.add(typeOfCircle, numOfCircles);
            var evilCircles = document.querySelectorAll('.evil-circle');
            if (evilCircles.length > 0) circlesEngine.add('.evil-circle', evilCircles.length);
        });
    },
    evilCircleTap: function() { 
        gameEngine.evilCircleTap(); 
    },
    goodCirclesTapCount: 0,
    redCirclesTapCount: 0
};

// Function to attach gameSpace event listeners
function attachGameSpaceListeners() {
    let lastMouseDownTime = 0;
    const debounceDelay = 100; // Debounce delay in ms

    window.circleClickHandler = function(e) {
        const target = e.target;
        console.log('circleClickHandler triggered:', { target: target.id, class: target.className });
        if (gameSpace.style.display === 'none') return; // Stop handling clicks when gameSpace is hidden
        if (target.classList.contains('good-circle')) {
            console.log('Delegated click on good-circle:', target);
            circlesEngine.goodCircleTap('.good-circle', gameEngine.goodCirclesCount);
        } else if (target.classList.contains('evil-circle')) {
            console.log('Delegated click on evil-circle:', target);
            circlesEngine.evilCircleTap();
        }
    };

    window.circleMouseDownHandler = function(e) {
        const now = Date.now();
        if (now - lastMouseDownTime < debounceDelay) return; // Debounce
        lastMouseDownTime = now;

        const target = e.target;
        console.log('circleMouseDownHandler triggered:', { target: target.id, class: target.className });
        if (gameSpace.style.display === 'none') return;
        if (target.classList.contains('good-circle')) {
            console.log('Delegated mousedown on good-circle:', target);
            circlesEngine.goodCircleTap('.good-circle', gameEngine.goodCirclesCount);
        } else if (target.classList.contains('evil-circle')) {
            console.log('Delegated mousedown on evil-circle:', target);
            circlesEngine.evilCircleTap();
        }
    };

    window.circleTouchStartHandler = function(e) {
        const target = e.target;
        console.log('circleTouchStartHandler triggered:', { target: target.id, class: target.className });
        if (gameSpace.style.display === 'none') return;
        if (target.classList.contains('good-circle')) {
            console.log('Delegated touchstart on good-circle:', target);
            circlesEngine.goodCircleTap('.good-circle', gameEngine.goodCirclesCount);
        } else if (target.classList.contains('evil-circle')) {
            console.log('Delegated touchstart on evil-circle:', target);
            circlesEngine.evilCircleTap();
        }
    };

    gameSpace.addEventListener('click', window.circleClickHandler, false);
    gameSpace.addEventListener('mousedown', window.circleMouseDownHandler, false);
    gameSpace.addEventListener('touchstart', window.circleTouchStartHandler, { passive: true });
    console.log('Attached gameSpace event listeners');
}

function removeGameSpaceListeners() {
    if (window.circleClickHandler) {
        gameSpace.removeEventListener('click', window.circleClickHandler, false);
        console.log('Removed click listener from gameSpace');
    }
    if (window.circleMouseDownHandler) {
        gameSpace.removeEventListener('mousedown', window.circleMouseDownHandler, false);
        console.log('Removed mousedown listener from gameSpace');
    }
    if (window.circleTouchStartHandler) {
        gameSpace.removeEventListener('touchstart', window.circleTouchStartHandler, { passive: true });
        console.log('Removed touchstart listener from gameSpace');
    }
    // Additional check to ensure no listeners remain
    const events = ['click', 'mousedown', 'touchstart'];
    events.forEach(event => {
        const listeners = gameSpace.__proto__[event] ? gameSpace.__proto__[event].listeners : [];
        if (listeners && listeners.length > 0) {
            console.warn(`Unexpected listeners still attached to gameSpace for ${event}:`, listeners);
        }
    });
}

// Attach gameSpace listeners initially
if (gameSpace) {
    attachGameSpaceListeners();
}

// Event delegation for buttons (excluding lvlLostTryAgainBtn)
document.addEventListener('click', function(e) {
    const target = e.target;
    if (target.id === 'newGameBtn') {
        console.log('Delegated click on newGameBtn:', target);
        toolsBox.showPage(pageTutorial);
        toolsBox.hidePage(pageGameMenu);
        audioPool.playSound(buttonTap);
    } else if (target.id === 'tutPgStartGameBtn') {
        console.log('Delegated click on tutPgStartGameBtn:', target);
        let username = usernameInput.value.trim();
        if (username) {
            localStorage.setItem('playerUsername', username);
        } else {
            localStorage.setItem('playerUsername', 'player');
        }
        gameEngine.stop();
        toolsBox.hidePage(pageTutorial);
        toolsBox.showPage(pagePlayDelay);
        toolsBox.pagePlayDelay.start();
        toolsBox.delay(function() { toolsBox.showPage(pagePlayArea); }, 1500);
        toolsBox.delay(gameEngine.startLevel, 1500);
        audioPool.playSound(buttonTap);
    } else if (target.id === 'lvlPssdContinueNextLvlBtn') {
        console.log('Delegated click on lvlPssdContinueNextLvlBtn:', target);
        toolsBox.hidePage(pageLevelPassed);
        toolsBox.showPage(pagePlayDelay);
        toolsBox.pagePlayDelay.start();
        toolsBox.delay(function() { toolsBox.showPage(pagePlayArea); }, 1500);
        toolsBox.delay(gameEngine.startLevel, 1500);
        audioPool.playSound(buttonTap);
    } else if (target.id === 'gmStatsPauseBtn') {
        console.log('Delegated click on gmStatsPauseBtn:', target);
        gameEngine.pause();
        toolsBox.showPage(pagePauseMenu);
        toolsBox.hidePage(pagePlayArea);
        lvlPausedScore.innerHTML = gameEngine.score;
        audioPool.playSound(buttonTap);
    } else if (target.id === 'pmRstrtLvlBtn') {
        console.log('Delegated click on pmRstrtLvlBtn:', target);
        toolsBox.showPage(pageGameMenu);
        toolsBox.hidePage(pagePauseMenu);
        gameEngine.stop();
        audioPool.playSound(buttonTap);
    } else if (target.id === 'pmCntnuGmBtn') {
        console.log('Delegated click on pmCntnuGmBtn:', target);
        toolsBox.showPage(pagePlayArea);
        toolsBox.hidePage(pagePauseMenu);
        gameEngine.resume();
        audioPool.playSound(buttonTap);
    } else if (target.id === 'abtPageBackBtn') {
        console.log('Delegated click on abtPageBackBtn:', target);
        toolsBox.showPage(pageGameMenu);
        toolsBox.hidePage(pageAbout);
        audioPool.playSound(buttonTap);
    } else if (target.id === 'aboutBtn') {
        console.log('Delegated click on aboutBtn:', target);
        toolsBox.showPage(pageAbout);
        toolsBox.hidePage(pageGameMenu);
        audioPool.playSound(buttonTap);
    } else if (target.id === 'achievementsBtn') {
        console.log('Delegated click on achievementsBtn:', target);
        toolsBox.showPage(pageAchievements);
        toolsBox.hidePage(pageGameMenu);
        audioPool.playSound(buttonTap);
    } else if (target.id === 'achPageBackBtn') {
        console.log('Delegated click on achPageBackBtn:', target);
        toolsBox.showPage(pageGameMenu);
        toolsBox.hidePage(pageAchievements);
        audioPool.playSound(buttonTap);
    } else if (target.id === 'multiplayerBtn') {
        console.log('Delegated click on multiplayerBtn:', target);
        toolsBox.showPage(pageMultiplayer);
        toolsBox.hidePage(pageGameMenu);
        audioPool.playSound(buttonTap);
    } else if (target.id === 'joinGameBtn') {
        console.log('Delegated click on joinGameBtn:', target);
        toolsBox.showPage(pageGameMenu);
        toolsBox.hidePage(pageMultiplayer);
        audioPool.playSound(buttonTap);
    } else if (target.id === 'mpBackBtn') {
        console.log('Delegated click on mpBackBtn:', target);
        toolsBox.showPage(pageGameMenu);
        toolsBox.hidePage(pageMultiplayer);
        audioPool.playSound(buttonTap);
    } else if (target.id === 'mysteryGameBtn') {
        console.log('Delegated click on mysteryGameBtn:', target);
        toolsBox.showPage(pageMysteryGame);
        toolsBox.hidePage(pageGameMenu);
        riddleGameEngine.start();
        audioPool.playSound(buttonTap);
    } else if (target.id === 'mysteryGuessBtn') {
        console.log('Delegated click on mysteryGuessBtn:', target);
        riddleGameEngine.guess();
        audioPool.playSound(buttonTap);
    } else if (target.id === 'mysteryBackBtn') {
        console.log('Delegated click on mysteryBackBtn:', target);
        toolsBox.showPage(pageGameMenu);
        toolsBox.hidePage(pageMysteryGame);
        audioPool.playSound(buttonTap);
    } else if (target.id === 'leaderboardBtn') {
        console.log('Delegated click on leaderboardBtn:', target);
        toolsBox.showPage(pageLeaderboard);
        toolsBox.hidePage(pageGameMenu);
        leaderboardEngine.displayLeaderboard();
        audioPool.playSound(buttonTap);
    } else if (target.id === 'leaderboardBackBtn') {
        console.log('Delegated click on leaderboardBackBtn:', target);
        toolsBox.showPage(pageGameMenu);
        toolsBox.hidePage(pageLeaderboard);
        audioPool.playSound(buttonTap);
    } else if (target.classList.contains('submit-circle') && target.id !== 'lvlLostTryAgainBtn') {
        console.log('Delegated click on submit-circle (not lvlLostTryAgainBtn):', target);
        const btnStyles = window.getComputedStyle(target);
        console.log('Computed submit-circle styles:', {
            display: btnStyles.display,
            zIndex: btnStyles.zIndex,
            pointerEvents: btnStyles.pointerEvents
        });
        console.log('Submit button clicked on pageHighScore');
        gameEngine.stop();
        toolsBox.hidePage(pageHighScore);
        console.log('pageHighScore display after hide:', pageHighScore.style.display);
        setTimeout(() => {
            toolsBox.showPage(pageGameMenu);
            console.log('pageGameMenu display after show:', pageGameMenu.style.display);
        }, 100);
        console.log('Game reset triggered');
        audioPool.playSound(buttonTap);
    }
}, false);

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
    highestScore: (function() {
        const storedScore = localStorage.getItem('highestScore');
        return storedScore && !isNaN(storedScore) ? parseInt(storedScore, 10) : 0;
    })(),
    bonusScore: 0,
    comboCounter: 0,
    lastTapTime: null,
    comboMultiplier: 1,
    comboTimeout: 1000,
    currentTheme: "default",
    isGameOver: false, // Flag to prevent multiple saves
    updateScore: function(amount) { 
        gameEngine.score = amount; 
        gmStatsScore.innerHTML = gameEngine.score; 
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
        gameEngine.isGameOver = false; // Reset game over flag
        // Safely update gmStatsCombo if it exists
        const gmStatsCombo = document.getElementById('gmStatsCombo');
        if (gmStatsCombo) {
            gmStatsCombo.innerHTML = '';
        } else {
            console.warn('gmStatsCombo element not found in DOM during reset');
        }
        gameSpace.className = "game-space";
        // Clear circles
        circlesEngine.destroy(document.querySelectorAll('.good-circle'));
        circlesEngine.destroy(document.querySelectorAll('.evil-circle'));
        console.log('Game state reset');
    },
    start: function(score, level, time, tapsGoal, tapValue, goodCirclesCount, evilCirclesCount, theme) {
        gameEngine.isGameOver = false; // Reset game over flag
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
        // Reset zoom and position
        document.body.style.transform = 'scale(1)';
        document.body.style.transformOrigin = '0 0';
        window.scrollTo(0, 0);
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
        console.log('Game level started:', {
            levelNum: gameEngine.levelNum,
            goodCirclesCount: gameEngine.goodCirclesCount,
            evilCirclesCount: gameEngine.evilCirclesCount
        });
    },
    checkTapsCount: function() {
        if (gameEngine.tapNum >= gameEngine.tapsGoal) {
            if (timeEngine.timeLeft > 0) gameEngine.showBonusScore();
            gameEngine.levelPassed();
        }
    },
    goodCircleTap: function() {
        if (gameEngine.isGameOver) return; // Prevent actions after game over
        var currentTime = Date.now();
        if (gameEngine.lastTapTime && (currentTime - gameEngine.lastTapTime) <= gameEngine.comboTimeout) {
            gameEngine.comboCounter++;
            gameEngine.comboMultiplier = Math.min(3, 1 + Math.floor(gameEngine.comboCounter / 2));
            requestAnimationFrame(() => toolsBox.toggleAnimation(gmStatsCurrentTapCount, 'burst-animation'));
        } else {
            gameEngine.comboCounter = 1;
            gameEngine.comboMultiplier = 1;
        }
        gameEngine.lastTapTime = currentTime;
        gameEngine.tapNum += 1;
        gameEngine.updateScore(gameEngine.score + (gameEngine.tapValue * gameEngine.comboMultiplier));
        gameEngine.updateTapCount(gameEngine.tapNum, gameEngine.tapsGoal);
        gameEngine.checkTapsCount();
        const gmStatsCombo = document.getElementById('gmStatsCombo');
        if (gmStatsCombo) {
            gmStatsCombo.innerHTML = gameEngine.comboCounter > 1 ? `Combo: ${gameEngine.comboCounter}x` : '';
        } else {
            console.warn('gmStatsCombo element not found in DOM during goodCircleTap');
        }
        requestAnimationFrame(() => audioPool.playSound(touchBlue));
        achievementsEngine.checkAchievements();
    },
    evilCircleTap: function() {
        if (gameEngine.isGameOver) return; // Prevent actions after game over
        gameEngine.comboCounter = 0;
        gameEngine.comboMultiplier = 1;
        gameEngine.lastTapTime = null;
        const gmStatsCombo = document.getElementById('gmStatsCombo');
        if (gmStatsCombo) {
            gmStatsCombo.innerHTML = '';
        } else {
            console.warn('gmStatsCombo element not found in DOM during evilCircleTap');
        }
        gameEngine.deadlyTap();
        requestAnimationFrame(() => audioPool.playSound(touchRed));
    },
    pause: function() { 
        timeEngine.stop(); 
    },
    resume: function() { 
        timeEngine.resume(); 
    },
    stop: function() { 
        timeEngine.stop(); 
        gameEngine.isGameOver = true; // Set game over flag
        gameEngine.reset(); 
        console.log('Game stopped');
        // Ensure circles are cleared
        circlesEngine.destroy(document.querySelectorAll('.good-circle'));
        circlesEngine.destroy(document.querySelectorAll('.evil-circle'));
        // Remove gameSpace and pagePlayArea from DOM
        if (gameSpace && gameSpace.parentNode) {
            gameSpace.parentNode.removeChild(gameSpace);
            console.log('Removed gameSpace from DOM in stop');
        }
        if (pagePlayArea && pagePlayArea.parentNode) {
            pagePlayArea.parentNode.removeChild(pagePlayArea);
            console.log('Removed pagePlayArea from DOM in stop');
        }
        // Remove gameSpace event listeners
        removeGameSpaceListeners();
        // Ensure lvlLostTryAgainBtn isогод: If you want to disable memory for this conversation, you can go to your settings page and toggle off "Save conversations to memory". If you would like to delete a specific memory, you can do so by clicking the book icon beneath this message and selecting the conversation from the menu.

        // Ensure lvlLostTryAgainBtn is clickable after stop
        if (lvlLostTryAgainBtn) {
            lvlLostTryAgainBtn.style.pointerEvents = 'auto !important';
            lvlLostTryAgainBtn.style.zIndex = '10001 !important';
        }
    },
    gameLost: async function() {
        if (gameEngine.isGameOver) {
            console.log('Game already over, skipping save');
            return; // Prevent multiple saves
        }
        gameEngine.isGameOver = true; // Set game over flag
        timeEngine.stop(); // Ensure timer is stopped
        audioPool.playSound(levelLost);
        lvlLostScore.innerHTML = gameEngine.score;
        gameEngine.highestScore = gameEngine.score;
        localStorage.setItem('highestScore', gameEngine.highestScore);
        // Clear circles before showing game over screen
        circlesEngine.destroy(document.querySelectorAll('.good-circle'));
        circlesEngine.destroy(document.querySelectorAll('.evil-circle'));
        // Remove gameSpace and pagePlayArea from DOM
        if (gameSpace && gameSpace.parentNode) {
            gameSpace.parentNode.removeChild(gameSpace);
            console.log('Removed gameSpace from DOM in gameLost');
        }
        if (pagePlayArea && pagePlayArea.parentNode) {
            pagePlayArea.parentNode.removeChild(pagePlayArea);
            console.log('Removed pagePlayArea from DOM in gameLost');
        }
        // Remove gameSpace event listeners
        removeGameSpaceListeners();
        console.log('gameSpace and pagePlayArea removed from DOM, listeners removed');
        // Ensure lvlLostTryAgainBtn is clickable
        if (lvlLostTryAgainBtn) {
            lvlLostTryAgainBtn.style.pointerEvents = 'auto !important';
            lvlLostTryAgainBtn.style.zIndex = '10001 !important';
        }
        if (gameEngine.score > 0) {
            console.log('Attempting to save score:', gameEngine.score);
            await leaderboardEngine.promptForName(gameEngine.score);
        } else {
            console.log('Score is 0, skipping leaderboard save');
            alert('Game Over: No score to save. Try again to earn points!');
            toolsBox.hidePage(pagePlayArea);
            toolsBox.showPage(pageYouLost);
            gameEngine.stop();
        }
    },
    deadlyTap: function() {
        if (gameEngine.isGameOver) return; // Prevent multiple triggers
        lvlLostTtl.innerHTML = "You Lost";
        if (lvlLostIcon.classList.contains('times-up-icon')) lvlLostIcon.classList.replace('times-up-icon', 'you-lost-icon');
        gameEngine.gameLost();
    },
    timesUp: function() {
        if (gameEngine.isGameOver) return; // Prevent multiple triggers
        lvlLostTtl.innerHTML = "Time's Up";
        if (lvlLostIcon.classList.contains('you-lost-icon')) lvlLostIcon.classList.replace('you-lost-icon', 'times-up-icon');
        gameEngine.gameLost();
        // Ensure page transition after timesUp
        toolsBox.hidePage(pagePlayArea);
        toolsBox.showPage(pageYouLost);
        console.log('timesUp triggered, pageYouLost displayed');
    },
    levelPassed: function() {
        if (gameEngine.isGameOver) return; // Prevent actions after game over
        audioPool.playSound(levelPassed);
        timeEngine.stop();
        lvlPssdTtl.innerHTML = "Level " + gameEngine.levelNum;
        if (gameEngine.bonusScore > 0) lvlPssdScore.innerHTML = gameEngine.score - gameEngine.bonusScore; else lvlPssdScore.innerHTML = gameEngine.score;
        gameEngine.updateLevel(gameEngine.levelNum + 1);
        levelsEngine.addNewLevel(gameEngine.levelNum, gameEngine.levelTime + 1, gameEngine.tapValue + 2, gameEngine.tapsGoal + 1, 1, gameEngine.evilCirclesCount + 1);
        gameEngine.comboCounter = 0;
        gameEngine.comboMultiplier = 1;
        gameEngine.lastTapTime = null;
        const gmStatsCombo = document.getElementById('gmStatsCombo');
        if (gmStatsCombo) {
            gmStatsCombo.innerHTML = '';
        } else {
            console.warn('gmStatsCombo element not found in DOM during levelPassed');
        }
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

// Initial Setup
toolsBox.hideSplashScreen();