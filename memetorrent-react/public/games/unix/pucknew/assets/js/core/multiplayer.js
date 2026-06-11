define(function () {

    let socket = null;
    let peer = null;
    let channel = null;

    let roomCode = "";
    let isHost = false;

    function connect() {
        socket = io("https://my-puck-signal.onrender.com");

        socket.on("player-joined", () => {
            console.log("Guest joined room → sending offer...");
            createOffer();
        });

        socket.on("signal", data => {
            if (data.type === "offer") handleOffer(data.offer);
            if (data.type === "answer") handleAnswer(data.answer);
            if (data.type === "ice") peer.addIceCandidate(data.candidate);
        });
    }

    // HOST creates 4-digit room
    function hostGame() {
        isHost = true;
        roomCode = Math.floor(1000 + Math.random() * 9000).toString();

        alert("Room Code: " + roomCode);

        socket.emit("host", roomCode);
    }

    // Guest enters room code
    function joinGame(code) {
        isHost = false;
        roomCode = code;

        socket.emit("join", roomCode);
    }

    // WebRTC Peer Setup
    function createPeer() {
        peer = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });

        peer.onicecandidate = evt => {
            if (evt.candidate) {
                socket.emit("signal", {
                    type: "ice",
                    code: roomCode,
                    candidate: evt.candidate
                });
            }
        };

        peer.ondatachannel = evt => {
            channel = evt.channel;
            channel.onmessage = receive;
            console.log("DataChannel received!");
        };
    }

    // Offer creation — host sends offer to guest
    function createOffer() {
        createPeer();
        channel = peer.createDataChannel("game");
        channel.onmessage = receive;

        peer.createOffer().then(offer => {
            peer.setLocalDescription(offer);

            socket.emit("signal", {
                type: "offer",
                code: roomCode,
                offer: offer
            });
        });
    }

    // Guest handles offer
    function handleOffer(offer) {
        createPeer();
        peer.setRemoteDescription(offer);

        peer.createAnswer().then(answer => {
            peer.setLocalDescription(answer);

            socket.emit("signal", {
                type: "answer",
                code: roomCode,
                answer: answer
            });
        });
    }

    function handleAnswer(answer) {
        peer.setRemoteDescription(answer);
    }

    // Send data to opponent
    function send(msg) {
        if (channel && channel.readyState === "open") {
            channel.send(JSON.stringify(msg));
        }
    }

    // Receive data from opponent
    function receive(evt) {
        const msg = JSON.parse(evt.data);

        if (msg.type === "shot") Match.remoteShot(msg);
        if (msg.type === "turn") Match.remoteTurn(msg);
        if (msg.type === "goal") Match.remoteGoal(msg);
        if (msg.type === "timer") Match.remoteTimer(msg);
    }

    return {
        connect,
        hostGame,
        joinGame,
        send
    };

});
