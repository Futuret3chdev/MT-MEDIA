/* Sound handlers added by Dr James Freeman who was sad such a great reverse was a silent movie */

window.audio = new preloadAudio(); // Expose audio to global scope

function audioTrack(url, volume) {
    var audio = new Audio(url);
    if (volume) audio.volume = volume;
    audio.load();
    var looping = false;
    this.audio = audio; // Store audio element for mute/volume control
    this.play = function(noResetTime) {
        if (!audio.muted) playSound(noResetTime);
    };
    this.startLoop = function(noResetTime) {
        if (looping || audio.muted) return;
        audio.addEventListener('ended', audioLoop);
        audioLoop(noResetTime);
        looping = true;
    };
    this.stopLoop = function(noResetTime) {
        try { audio.removeEventListener('ended', audioLoop); } catch (e) {}
        audio.pause();
        if (!noResetTime) audio.currentTime = 0;
        looping = false;
    };
    this.isPlaying = function() {
        return !audio.paused;
    };
    this.isPaused = function() {
        return audio.paused;
    };
    this.stop = this.stopLoop;
    this.setVolume = function(volume) {
        audio.volume = Math.max(0, Math.min(1, volume));
    };

    function audioLoop(noResetTime) {
        playSound(noResetTime);
    }
    function playSound(noResetTime) {
        if (!audio.paused) {
            audio.pause();
            if (!noResetTime) audio.currentTime = 0;
        }
        try {
            var playPromise = audio.play();
            if (playPromise) {
                playPromise.then(function(){}).catch(function(err){});
            }
        }
        catch(err) { console.error(err); }
    }
}

function preloadAudio() {
    this.isMuted = false;
    this.volume = 1.0;

    this.credit = new audioTrack('sounds/credit.mp3');
    this.coffeeBreakMusic = new audioTrack('sounds/coffee-break-music.mp3');
    this.die = new audioTrack('sounds/miss.mp3');
    this.ghostReturnToHome = new audioTrack('sounds/ghost-return-to-home.mp3');
    this.eatingGhost = new audioTrack('sounds/eating-ghost.mp3');
    this.ghostTurnToBlue = new audioTrack('sounds/ghost-turn-to-blue.mp3', 0.5);
    this.eatingFruit = new audioTrack('sounds/eating-fruit.mp3');
    this.ghostSpurtMove1 = new audioTrack('sounds/ghost-spurt-move-1.mp3');
    this.ghostSpurtMove2 = new audioTrack('sounds/ghost-spurt-move-2.mp3');
    this.ghostSpurtMove3 = new audioTrack('sounds/ghost-spurt-move-3.mp3');
    this.ghostSpurtMove4 = new audioTrack('sounds/ghost-spurt-move-4.mp3');
    this.ghostNormalMove = new audioTrack('sounds/ghost-normal-move.mp3');
    this.extend = new audioTrack('sounds/extend.mp3');
    this.eating = new audioTrack('sounds/eating.mp3', 0.5);
    this.startMusic = new audioTrack('sounds/start-music.mp3');

    this.toggleMute = function() {
        this.isMuted = !this.isMuted;
        for (var s in this) {
            if (s == 'silence' || s == 'ghostReset' || s == 'toggleMute' || s == 'isMuted' || s == 'setVolume' || s == 'volume') continue;
            this[s].audio.muted = this.isMuted;
        }
    };

    this.setVolume = function(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        for (var s in this) {
            if (s == 'silence' || s == 'ghostReset' || s == 'toggleMute' || s == 'isMuted' || s == 'setVolume' || s == 'volume') continue;
            this[s].setVolume(this.volume * (s == 'ghostTurnToBlue' || s == 'eating' ? 0.5 : 1));
        }
    };

    this.ghostReset = function(noResetTime) {
        for (var s in this) {
            if (s == 'silence' || s == 'ghostReset' || s == 'toggleMute' || s == 'isMuted' || s == 'setVolume' || s == 'volume') continue;
            if (s.match(/^ghost/)) this[s].stopLoop(noResetTime);
        }
    };

    this.silence = function(noResetTime) {
        for (var s in this) {
            if (s == 'silence' || s == 'ghostReset' || s == 'toggleMute' || s == 'isMuted' || s == 'setVolume' || s == 'volume') continue;
            this[s].stopLoop(noResetTime);
        }
    };
}