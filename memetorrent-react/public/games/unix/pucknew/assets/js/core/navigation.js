/* global $ */
define(["core/asset_loader", "settings"], function (AssetLoader, Settings) {

    var myNavigation, canvas, context;

    var ScreenId = {
        menu: 0,
        credits: 1,
        addplayers: 2,
        ingame: 3,
        notSupported: 4,
        online: 5
    };

    function makeNewInterface() {
        if (!myNavigation) {
            myNavigation = Object.create(proto);
            myNavigation.ScreenId = ScreenId;
        }
        return myNavigation;
    }

    var proto = {

        setup: function ($, Settings) {
            canvas = document.getElementById("canvas");
            canvas.width = Settings.gameWidth;
            canvas.height = Settings.gameHeight;
            context = canvas.getContext("2d");

            this.changeScreen(ScreenId.menu);
            return true;
        },

        init: function (Game) {

            var that = this;

            $("#btn-play").click(function () {

                $("#img-p1 .active").removeClass("active");
                $("#img-p2 .active").removeClass("active");

                $("#img-p1 .item #0").parent().addClass("active");
                $("#img-p2 .item #1").parent().addClass("active");

                $("#n-p1").children().first().val("player1");

                $("#n-p2").html(`<div class="bot-name">Innobot</div>`);

                that.changeScreen(ScreenId.addplayers);
            });

            $(".start-btn").click(function () {

                $("#profile-p1").attr("src", $("#img-p1 .active img").attr("src"));
                $("#profile-p2").attr("src", $("#img-p2 .active img").attr("src"));

                $("#name-p1").html($("#n-p1 input").val());
                $("#name-p2").html("Innobot");

                Game.start();
            });

            $("#btn-credits").click(function () {
                that.changeScreen(ScreenId.credits);
            });

            $("#btn-back-credits").click(function () {
                that.changeScreen(ScreenId.menu);
            });

            $("#btn-back-addplayers").click(function () {
                that.changeScreen(ScreenId.menu);
            });

            $("#btn-online").click(function () {
                console.log("Online play button works.");
                that.changeScreen(ScreenId.online);
            });

            $("#btn-back-online").click(function () {
                that.changeScreen(ScreenId.menu);
            });

        },

        changeScreen: function (nextScreen) {

            for (let key in ScreenId) {
                $("#" + key).hide();
            }

            let name = Object.keys(ScreenId).find(k => ScreenId[k] === nextScreen);

            $("#" + name).show();
        },

        getProfileId: function (id) {
            return $("#img-p" + id + " .active img").attr("id");
        },

        getGameFieldCanvas: function () {
            return canvas;
        },

        getContext: function () {
            return context;
        }

    };

    return makeNewInterface();
});
