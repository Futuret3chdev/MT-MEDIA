define(function () {

    var myInput, proto, inputRect;

    function makeInput() {
        if (!myInput) {
            myInput = Object.create(proto);
            myInput.mouseX = 0;
            myInput.mouseY = 0;
            myInput.mouseDown = false;
            myInput.mouseUp = false;
            myInput.inputPaused = false;
        }
        return myInput;
    }

    function getScaledPosition(canvas, evt) {
        let rect = canvas.getBoundingClientRect();

        let scaleX = canvas.width / rect.width;
        let scaleY = canvas.height / rect.height;

        return {
            x: (evt.clientX - rect.left) * scaleX,
            y: (evt.clientY - rect.top) * scaleY
        };
    }

    proto = {

        useMouse: function (canvas) {

            canvas.addEventListener("mousedown", function (e) {
                let pos = getScaledPosition(canvas, e);
                myInput.mouseX = pos.x;
                myInput.mouseY = pos.y;
                myInput.mouseDown = true;
                myInput.mouseUp = false;
                myInput.onMouseDown();
            });

            canvas.addEventListener("mouseup", function (e) {
                myInput.mouseDown = false;
                myInput.mouseUp = true;
                myInput.onMouseUp();
            });

            canvas.addEventListener("mousemove", function (e) {
                let pos = getScaledPosition(canvas, e);
                myInput.mouseX = pos.x;
                myInput.mouseY = pos.y;
                if (myInput.mouseDown) myInput.onMouseDrag();
            });

            // TOUCH EVENTS
            canvas.addEventListener("touchstart", function (e) {
                let t = e.changedTouches[0];
                let pos = getScaledPosition(canvas, t);
                myInput.mouseX = pos.x;
                myInput.mouseY = pos.y;
                myInput.mouseDown = true;
                myInput.mouseUp = false;
                myInput.onMouseDown();
                e.preventDefault();
            });

            canvas.addEventListener("touchmove", function (e) {
                let t = e.changedTouches[0];
                let pos = getScaledPosition(canvas, t);
                myInput.mouseX = pos.x;
                myInput.mouseY = pos.y;
                if (myInput.mouseDown) myInput.onMouseDrag();
                e.preventDefault();
            });

            canvas.addEventListener("touchend", function (e) {
                myInput.mouseDown = false;
                myInput.mouseUp = true;
                myInput.onMouseUp();
                e.preventDefault();
            });
        },

        update: function () {},

        onMouseDrag: function () {},
        onMouseDown: function () {},
        onMouseUp: function () {},

    };

    return makeInput();
});
