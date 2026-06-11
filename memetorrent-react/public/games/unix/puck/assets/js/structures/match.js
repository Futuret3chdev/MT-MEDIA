define([ "structures/puck", "structures/vector2", "settings", "structures/player", "structures/formation", "structures/ball", "core/asset_loader", "core/audio_center", "core/navigation", "core/input" ],
    function (Puck, Vector2, Settings, Player, Formation, Ball, AssetLoader, AudioCenter, Navigation, Input) {
    var i, proto, players = [], canv, mag,
        playerOneTurn = true, turnTimer, timerValue = 0,
        minIndex = 0, maxIndex = 10,
        puckSelected = -1, selectedPos = Vector2.new(), selectedSize = 0;

    var BOT_ENABLED = true;

    function makeNewMatch() {
        var match = Object.create(proto);
        match.distanceSelected = Vector2.new();
        return match;
    }
   
    proto = {
        thinkBot: function () {
            if (!BOT_ENABLED) return;
            if (this.getCurrentPlayerId() !== 1) return;

            var that = this;
            var puckIndex = Math.floor(Math.random() * 5) + 5;
            var puck = this.pucks[puckIndex];
            var ball = this.pucks[10];

            var dx = ball.getCenterX() - puck.getCenterX();
            var dy = ball.getCenterY() - puck.getCenterY();
            var dir = Vector2.new(dx, dy);
            dir.normalize();

            puck.velocity = Vector2.new(
                dir.x * Settings.pullStrength * 1.0,
                dir.y * Settings.pullStrength * 1.0
            );
            AudioCenter.playSfx("puck_whoosh"); // added sound like human
            Input.inputPaused = true;

            this.endTurn(true, false); // end bot turn normally
        },

        getInputPaused: function () {
            return Input.inputPaused;
        },
        pucks: [],
        start: function (playerOne, p0Info, p1Info) {
            this.startTurn(playerOne);
        },

        endTurn: function (changePlayer, loop) {
            puckSelected = -1;
            Input.mouseDown = false;
            Input.mouseUp = true;
            clearInterval(turnTimer);

            if (loop){
                this.startTurn(changePlayer ? !playerOneTurn : playerOneTurn);
            }

            // REMOVED THE setTimeout THAT CAUSED INFINITE LOOP
            // Bot now triggers only in startTurn() — once per turn
        },

        startTurn: function (playerOne) {
            var that = this;
           
            timerValue = Settings.turnCooldown;
            Navigation.setActive("#bar-p" + (playerOneTurn ? 1 : 2), false);
            playerOneTurn = playerOne;
            Navigation.setActive("#bar-p" + (playerOneTurn ? 1 : 2), true);
           
            turnTimer = setInterval((function() {
                return function () {
                    if (timerValue <= 0) {
                        that.endTurn(true, true);
                    }
                    timerValue -= 1;
                }
            }()), 1000);

            // ONLY FIX: Bot thinks ONCE when his turn starts
            if (!playerOneTurn && BOT_ENABLED) {
                setTimeout(function() {
                    that.thinkBot();
                }, 600); // small delay so it feels natural
            }
        },

        init: function(canvas) {
            Navigation.setActive("#bar-p1", false);
            Navigation.setActive("#bar-p2", false);
           
            Formation.init(Settings.fieldWidth / 2.0, Settings.fieldHeight);
            var i, that = this, spriteId;
           
            spriteId = Navigation.getProfileId("1");
            for (i = 0; i < 5; i += 1) {
                this.pucks.push(Puck.new(i, spriteId));
            }
            spriteId = Navigation.getProfileId("2");
            for (i = 5; i < 10; i += 1) {
                this.pucks.push(Puck.new(i, spriteId));
            }
            this.pucks.push(Ball.new(11));
            players.push(Player.new("211-a"));
            players.push(Player.new("202-a"));
            this.reset();
            Input.useMouse(canvas);
           
            Input.onMouseDrag = function() {
                if (puckSelected !== -1) {
                    that.distanceSelected.x = that.pucks[ puckSelected ].getCenterX() - this.mouseX;
                    that.distanceSelected.y = that.pucks[ puckSelected ].getCenterY() - this.mouseY;
                }
            };
            Input.onMouseDown = function() {
                if (puckSelected == -1) {
                    if (!Settings.godMode) {
                        minIndex = playerOneTurn ? 0 : 5;
                        maxIndex = playerOneTurn ? 5 : 10;
                    }
                    for (i = minIndex; i < maxIndex; i += 1) {
                        if (Vector2.new(that.pucks[i].getCenterX() - this.mouseX,
                            that.pucks[i].getCenterY() - this.mouseY).magnitude() <
                            that.pucks[i].radius + that.pucks[10].radius) {
                            puckSelected = i;
                            that.distanceSelected.x = that.pucks[puckSelected].getCenterX() - this.mouseX;
                            that.distanceSelected.y = that.pucks[puckSelected].getCenterY() - this.mouseY;
                            break;
                        }
                    }
                }
            };
            Input.onMouseUp = function() {
                if (puckSelected != -1) {
                    AudioCenter.playSfx("puck_whoosh");
                   
                    that.pucks[puckSelected].velocity =
                        Vector2.new(that.pucks[puckSelected].getCenterX() - Input.mouseX,
                                    that.pucks[puckSelected].getCenterY() - Input.mouseY);
                    mag = that.pucks[puckSelected].velocity.magnitude() / Settings.maxDirectionalSize;
                    that.pucks[puckSelected].velocity.normalize()
                        .multiplyMe((Math.abs(mag) > 0.5 ? 1 : mag*2) * Settings.pullStrength);
                    puckSelected = -1;
                    Input.inputPaused = true;
                    that.endTurn(false, false);
                }
            };
            Input.update = function(deltaTime) {
                if (Input.inputPaused) {
                    for (i = 0; i < that.pucks.length; i += 1) {
                        if (that.pucks[i].velocity.magnitude() > 0.05) {
                            break;
                        }
                    }
                    if (i == 11) {
                        Input.inputPaused = false;
                        that.endTurn(true, true);
                    }
                }
            };
            console.log("Current match initialized.");
        },

        // ... rest of your methods unchanged ...
        inputUpdate: function (deltaTime) {
            Input.update(deltaTime);
        },
        getSelectedPuck: function () {
            return puckSelected != -1 ? this.pucks[ puckSelected ] : null;
        },
        reset: function () {
            for (i = 0; i < 5; i += 1) {
                this.pucks[i].velocity = Vector2.new();
                this.pucks[i].position = Formation.getFormation(this.getPlayer(0).formation, true)[i];
            }
            for (i = 5; i < 10; i += 1) {
                this.pucks[i].velocity = Vector2.new();
                this.pucks[i].position = Formation.getFormation(this.getPlayer(1).formation, false)[i - 5];
            }
            this.pucks[10].velocity = Vector2.new();
            this.pucks[10].position = Vector2.new(
                Settings.fieldWidth / 2 - this.pucks[10].radius + Settings.fieldOffsetX,
                Settings.fieldHeight / 2 - this.pucks[10].radius + Settings.fieldOffsetY
            );
        },
        getPlayer: function (id) {
            return players[id];
        },
        drawSelectedPuck: function (context) {
            if (this.getSelectedPuck() != null) {
                selectedSize = (this.getSelectedPuck().radius + 30) *
                               this.distanceSelected.magnitude() /
                               this.getSelectedPuck().radius;
                selectedSize = selectedSize > Settings.maxDirectionalSize ?
                               Settings.maxDirectionalSize : selectedSize;
                selectedPos.x = this.getSelectedPuck().getCenterX() - selectedSize / 2;
                selectedPos.y = this.getSelectedPuck().getCenterY() - selectedSize / 2;
                var translateX = selectedPos.x + (selectedSize / 2);
                var translateY = selectedPos.y + (selectedSize / 2);
                context.save();
                context.translate(translateX, translateY);
                context.rotate(this.distanceSelected.angle(true));
                context.translate(-translateX, -translateY);
                context.drawImage(AssetLoader.imgs["dir_circle"], selectedPos.x, selectedPos.y, selectedSize, selectedSize);
                context.restore();
            }
        },
        getTimer: function () {
            return timerValue;
        },
        getCurrentPlayerId: function () {
            return playerOneTurn ? 0 : 1;
        },
        delete: function () {
            for (i = 0; i < 11; i += 1) {
                delete this.pucks[i];
            }
            this.pucks = [];
            delete players[0];
            delete players[1];
            players = [];
        }
    };
    return {
        new: makeNewMatch
    };
});