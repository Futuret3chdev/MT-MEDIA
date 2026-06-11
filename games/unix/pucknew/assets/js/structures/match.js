define([
    "structures/puck",
    "structures/vector2",
    "settings",
    "structures/player",
    "structures/formation",
    "structures/ball",
    "core/asset_loader",
    "core/audio_center",
    "core/navigation",
    "core/input",
    "core/multiplayer"       // ✅ multiplayer support added
], function (
    Puck, Vector2, Settings, Player, Formation, Ball,
    AssetLoader, AudioCenter, Navigation, Input, Multiplayer
) {

    var i, players = [],
        playerOneTurn = true,
        turnTimer = null,
        timerValue = 0,
        puckSelected = -1,
        minIndex = 0,
        maxIndex = 10;

    var proto = {};
    var BOT_ENABLED = true;

    function makeNewMatch() {
        var match = Object.create(proto);
        match.distanceSelected = Vector2.new();
        match.pucks = [];
        return match;
    }

    // ============================================================
    // MULTIPLAYER HELPERS
    // ============================================================

    function sendShot(puckIndex, velocity) {
        if (!Multiplayer.isOnline()) return;
        Multiplayer.send({
            type: "shot",
            puck: puckIndex,
            vel: { x: velocity.x, y: velocity.y }
        });
    }

    function sendTurn(turnId) {
        if (!Multiplayer.isOnline()) return;
        Multiplayer.send({
            type: "turn",
            current: turnId
        });
    }

    function sendTimer(value) {
        if (!Multiplayer.isOnline()) return;
        Multiplayer.send({
            type: "timer",
            time: value
        });
    }

    // ============================================================
    // BOT LOGIC
    // ============================================================
    proto.thinkBot = function () {
        if (!BOT_ENABLED) return;
        if (Multiplayer.isOnline()) return; // ❗ never run bot online

        if (this.getCurrentPlayerId() !== 1) return;

        var puckIndex = Math.floor(Math.random() * 5) + 5;
        var puck = this.pucks[puckIndex];
        var ball = this.pucks[10];

        var dx = ball.getCenterX() - puck.getCenterX();
        var dy = ball.getCenterY() - puck.getCenterY();
        var dir = Vector2.new(dx, dy);
        dir.normalize();

        var velocity = Vector2.new(
            dir.x * Settings.pullStrength,
            dir.y * Settings.pullStrength
        );

        puck.velocity = velocity;
        AudioCenter.playSfx("puck_whoosh");

        this.endTurn(true, false);
    };

    proto.getInputPaused = function () {
        return Input.inputPaused;
    };

    // ============================================================
    // START MATCH
    // ============================================================
    proto.start = function (playerOne) {
        this.startTurn(playerOne);
    };

    // ============================================================
    // END TURN
    // ============================================================
    proto.endTurn = function (changePlayer, loop) {

        puckSelected = -1;
        clearInterval(turnTimer);

        if (loop) {
            playerOneTurn = changePlayer ? !playerOneTurn : playerOneTurn;
            this.startTurn(playerOneTurn);
        }

        sendTurn(playerOneTurn); // multiplayer turn sync
    };

    // ============================================================
    // START TURN
    // ============================================================
    proto.startTurn = function (isPlayerOne) {
        playerOneTurn = isPlayerOne;

        Navigation.setActive("#bar-p1", playerOneTurn);
        Navigation.setActive("#bar-p2", !playerOneTurn);

        timerValue = Settings.turnCooldown;
        sendTimer(timerValue);

        var that = this;

        turnTimer = setInterval(function () {
            timerValue--;

            sendTimer(timerValue);

            if (timerValue <= 0) {
                that.endTurn(true, true);
            }
        }, 1000);

        if (!playerOneTurn && BOT_ENABLED && !Multiplayer.isOnline()) {
            setTimeout(() => that.thinkBot(), 600);
        }
    };

    // ============================================================
    // INIT MATCH (PUCKS + BALL)
    // ============================================================
    proto.init = function (canvas) {

        Navigation.setActive("#bar-p1", false);
        Navigation.setActive("#bar-p2", false);

        Formation.init(Settings.fieldWidth / 2.0, Settings.fieldHeight);

        this.pucks = [];
        players = [];

        // Player 1 pucks
        var id1 = Navigation.getProfileId("1");
        for (i = 0; i < 5; i++) this.pucks.push(Puck.new(i, id1));

        // Player 2 pucks
        var id2 = Navigation.getProfileId("2");
        for (i = 5; i < 10; i++) this.pucks.push(Puck.new(i, id2));

        // Ball
        this.pucks.push(Ball.new(11));

        players.push(Player.new("p1"));
        players.push(Player.new("p2"));

        this.reset();
        Input.useMouse(canvas);

        var that = this;

        // ============================================================
        // INPUT HANDLING
        // ============================================================

        Input.onMouseDown = function () {

            if (Multiplayer.isOnline() && !Multiplayer.isMyTurn(playerOneTurn)) return;

            if (puckSelected === -1) {
                minIndex = playerOneTurn ? 0 : 5;
                maxIndex = playerOneTurn ? 5 : 10;

                for (i = minIndex; i < maxIndex; i++) {
                    if (Vector2.new(
                        that.pucks[i].getCenterX() - this.mouseX,
                        that.pucks[i].getCenterY() - this.mouseY
                    ).magnitude() < that.pucks[i].radius + that.pucks[10].radius) {
                        puckSelected = i;
                        break;
                    }
                }
            }
        };

        Input.onMouseUp = function () {

            if (puckSelected === -1) return;

            var puck = that.pucks[puckSelected];

            var velocity = Vector2.new(
                puck.getCenterX() - Input.mouseX,
                puck.getCenterY() - Input.mouseY
            );

            var mag = velocity.magnitude() / Settings.maxDirectionalSize;

            velocity.normalize().multiplyMe(
                (Math.abs(mag) > 0.5 ? 1 : mag * 2) * Settings.pullStrength
            );

            puck.velocity = velocity;
            AudioCenter.playSfx("puck_whoosh");

            sendShot(puckSelected, velocity); // MULTIPLAYER sync

            puckSelected = -1;
            Input.inputPaused = true;

            that.endTurn(false, false);
        };

        Input.update = function (deltaTime) {

            if (Input.inputPaused) {

                for (i = 0; i < that.pucks.length; i++)
                    if (that.pucks[i].velocity.magnitude() > 0.05)
                        return;

                Input.inputPaused = false;
                that.endTurn(true, true);
            }
        };
    };

    // ============================================================
    // RESET GAME STATE
    // ============================================================
    proto.reset = function () {

        for (i = 0; i < 5; i++) {
            this.pucks[i].velocity = Vector2.new();
            this.pucks[i].position = Formation.getFormation(
                this.getPlayer(0).formation, true
            )[i];
        }

        for (i = 5; i < 10; i++) {
            this.pucks[i].velocity = Vector2.new();
            this.pucks[i].position = Formation.getFormation(
                this.getPlayer(1).formation, false
            )[i - 5];
        }

        this.pucks[10].velocity = Vector2.new();
        this.pucks[10].position = Vector2.new(
            Settings.fieldWidth / 2,
            Settings.fieldHeight / 2
        );
    };

    proto.getPlayer = function (id) {
        return players[id];
    };

    proto.getSelectedPuck = function () {
        return puckSelected !== -1 ? this.pucks[puckSelected] : null;
    };

    proto.getTimer = function () {
        return timerValue;
    };

    proto.getCurrentPlayerId = function () {
        return playerOneTurn ? 0 : 1;
    };

    proto.delete = function () {
        this.pucks = [];
        players = [];
    };

    return {
        new: makeNewMatch
    };
});
