/* global requirejs */

requirejs.config({
    urlArgs: "bust=" + (new Date()).getTime(),
    waitSeconds: 45,
    shim: {
        "bootstrap": { "deps": ["jquery"] }
    },
    paths: {
        jquery: "../lib/jquery-2.1.3.min",
        bootstrap: "../lib/bootstrap.min",
        lib: "../lib"
    }
});

requirejs(
    ["structures/game", "jquery", "core/navigation", "settings", "core/input", "bootstrap"],

    function (Game, $, Navigation, Settings, Input) {

        $(function () {

            Navigation.changeScreen(Navigation.ScreenId.menu);

            $("#element").carousel();

            let loaded = Navigation.setup($, Settings);

            console.log("Navigation setup " + (loaded ? "OK" : "FAILED"));

            Game.init(Navigation.getGameFieldCanvas());
        });
    }
);
