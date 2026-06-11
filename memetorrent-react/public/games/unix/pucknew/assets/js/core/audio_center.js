define(["core/asset_loader"], function (AssetLoader) {

    var myAudioCenter, proto;
    var userInteracted = false;

    function makeNewAudioCenter() {
        if (myAudioCenter == null) {
            myAudioCenter = Object.create(proto);
        }
        return myAudioCenter;
    }

    // ================================
    // UNLOCK AUDIO ON FIRST TAP/CLICK
    // ================================
    function unlockAudio() {
        if (userInteracted) return;
        userInteracted = true;

        // Try to play theme if already requested
        if (myAudioCenter._pendingTheme) {
            var themeName = myAudioCenter._pendingTheme;
            var audio = AssetLoader.audios[themeName];
            if (audio) {
                audio.volume = 0.4;
                audio.loop = true;
                audio.play().catch(() => {});
            }
            myAudioCenter._pendingTheme = null;
        }

        document.removeEventListener("mousedown", unlockAudio);
        document.removeEventListener("touchstart", unlockAudio);
    }

    document.addEventListener("mousedown", unlockAudio);
    document.addEventListener("touchstart", unlockAudio);

    // ================================
    // AUDIO FUNCTIONS
    // ================================
    proto = {

        _pendingTheme: null,

        playSfx: function (name) {
            if (!userInteracted) return;

            let audio = AssetLoader.audios[name];
            if (!audio) return;

            // clone so overlapping SFX can play
            audio.cloneNode(true).play().catch(() => {});
        },

        playTheme: function (name) {
            let audio = AssetLoader.audios[name];
            if (!audio) return;

            audio.volume = 0.4;
            audio.loop = true;

            if (!userInteracted) {
                // Delay music until browser unlocks audio
                this._pendingTheme = name;
                return;
            }

            audio.play().catch(() => {});
        },

        pauseTheme: function (name) {
            let audio = AssetLoader.audios[name];
            if (audio) audio.pause();
        },

        stopTheme: function (name) {
            let audio = AssetLoader.audios[name];
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
        }
    };

    return makeNewAudioCenter();
});
