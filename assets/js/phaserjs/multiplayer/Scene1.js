class Scene1 extends Phaser.Scene {
    constructor() {
        super("bootGame");
    }

    preload() {
        // this.load.image("table", `${generatePath("images", "table.jpg")}`);
        // this.load.image("starfield_1", `${generatePath("images", "starfield_1.png")}`);
        this.load.image("starfield_2", `${generatePath("images", "starfield_2.jpg")}`);


        this.load.image("trophy", `${generatePath("images", "max_trophy.png")}`);

        this.load.image("winLogo", `${generatePath("images", "win.png")}`);

        this.load.image("defaultAvatar", `${getDefaultImagePath()}`);

        this.load.spritesheet("unoLogo", `${generatePath("spritesheets", "uno.png")}`, {
            frameWidth: 419,
            frameHeight: 369
        });

        this.load.spritesheet("cardBack", `${generatePath("images", "back.png")}`, {
            frameWidth: 93,
            frameHeight: 140
        });

        this.load.spritesheet("cardFront", `${generatePath("images", "outl.png")}`, {
            frameWidth: 93,
            frameHeight: 140
        });

        this.load.spritesheet("uno", `${generatePath("spritesheets", "uno_game.jpeg")}`, {
            frameWidth: 57,
            frameHeight: 86
        });

        this.load.spritesheet("oppHand", `${generatePath("images", "opp_hand.jpg")}`, {
            frameWidth: 260,
            frameHeight: 146
        });

        this.load.spritesheet("noButton", `${generatePath("spritesheets", "no_button.png")}`, {
            frameWidth: 149,
            frameHeight: 149
        });

        this.load.spritesheet("yesButton", `${generatePath("spritesheets", "yes_button.png")}`, {
            frameWidth: 148,
            frameHeight: 148
        });

        this.load.spritesheet("turnIndicator", `${generatePath("spritesheets", "turn_indicator.png")}`, {
            frameWidth: 16,
            frameHeight: 16
        });

        this.load.spritesheet("unoButton", `${generatePath("spritesheets", "uno_button.png")}`, {
            frameWidth: 300,
            frameHeight: 119
        });

        this.load.spritesheet("challengeButton", `${generatePath("spritesheets", "challenge_button.png")}`, {
            frameWidth: 73,
            frameHeight: 73
        });

        this.load.spritesheet("crossButton", `${generatePath("spritesheets", "cross_button.png")}`, {
            frameWidth: 73,
            frameHeight: 73
        });

        this.load.spritesheet("exitButton", `${generatePath("spritesheets", "exit_button.png")}`, {
            frameWidth: 73,
            frameHeight: 73
        });

        this.load.spritesheet("musicToggleButton", `${generatePath("spritesheets", "music_toggle_button.png")}`, {
            frameWidth: 75,
            frameHeight: 75
        });


        //csk
        this.load.spritesheet("startRecordingButton", `${generatePath("spritesheets", "start_recording_button.png")}`, {
            frameWidth: 73,
            frameHeight: 73
        });

        this.load.spritesheet("pauseRecordingButton", `${generatePath("spritesheets", "pause_button.png")}`, {
            frameWidth: 73,
            frameHeight: 73
        });

        this.load.spritesheet("resumeRecordingButton", `${generatePath("spritesheets", "resume_button.png")}`, {
            frameWidth: 73,
            frameHeight: 73
        });

        this.load.spritesheet("saveRecordingButton", `${generatePath("spritesheets", "save_button.png")}`, {
            frameWidth: 72,
            frameHeight: 72
        });

        this.load.spritesheet("playButton", `${generatePath("spritesheets", "play_button.png")}`, {
            frameWidth: 562,
            frameHeight: 221
        });

        this.load.image("chooseAColor", `${generatePath("spritesheets", "choose_color_rounded.png")}`);

        this.load.spritesheet("chooseBlueButton", `${generatePath("spritesheets", "choose_blue_button.png")}`, {
            frameWidth: 130,
            frameHeight: 130
        });

        this.load.spritesheet("chooseYellowButton", `${generatePath("spritesheets", "choose_yellow_button.png")}`, {
            frameWidth: 130,
            frameHeight: 130
        });

        this.load.spritesheet("chooseGreenButton", `${generatePath("spritesheets", "choose_green_button.png")}`, {
            frameWidth: 130,
            frameHeight: 130
        });

        this.load.spritesheet("chooseRedButton", `${generatePath("spritesheets", "choose_red_button.png")}`, {
            frameWidth: 130,
            frameHeight: 130
        });

        this.load.spritesheet('fullscreen', `${generatePath("spritesheets", "fullscreen-white.png")}`, {
            frameWidth: 64,
            frameHeight: 64
        });

        this.load.bitmapFont("pixelFont", `${generatePath("font", "font.png")}`, `${generatePath("font", "font.xml")}`);

        this.load.video('wormhole', `${generatePath("video", "wormhole.mp4")}`, 'loadeddata', false, true);

        this.load.audio('unoCallVoice', [`${generatePath("sounds", "uno_call.mp3")}`]);

        this.load.audio('unoCallSound', [`${generatePath("sounds", "uno_button.mp3")}`]);

        this.load.audio('topColorRed', [`${generatePath("sounds", "top_color_red.mp3")}`]);
        this.load.audio('topColorBlue', [`${generatePath("sounds", "top_color_blue.mp3")}`]);
        this.load.audio('topColorGreen', [`${generatePath("sounds", "top_color_green.mp3")}`]);
        this.load.audio('topColorYellow', [`${generatePath("sounds", "top_color_yellow.mp3")}`]);
        
        this.load.audio('drawSingle', [`${generatePath("sounds", "drawSingle.mp3")}`]);
        this.load.audio('playCard', [`${generatePath("sounds", "playCard.mp3")}`]);
        this.load.audio('playerTurn', [`${generatePath("sounds", "playerTurn.mp3")}`]);
        this.load.audio('plus2', [`${generatePath("sounds", "plus2.mp3")}`]);
        this.load.audio('specialCards', [`${generatePath("sounds", "specialCards.mp3")}`]);
        this.load.audio('swish', [`${generatePath("sounds", "swish.mp3")}`]);
        this.load.audio('tap', [`${generatePath("sounds", "tap.mp3")}`]);
        this.load.audio('win', [`${generatePath("sounds", "win.mp3")}`]);

        this.load.audio('shuffle', [`${generatePath("sounds", "card_shuffle.mp3")}`]);
    
        this.load.audio('space', [`${generatePath("sounds", "space.wav")}`]);
        this.load.audio('welcome', [`${generatePath("sounds", "welcome_galactic_uno.mp3")}`]);
        this.load.audio('backgroundMusic', [`${generatePath("sounds", "background.mp3")}`]);

        this.load.audio('clockTicking', [`${generatePath("sounds", "clock_ticking.mp3")}`]);
        this.load.audio('10Seconds', [`${generatePath("sounds", "game_will_start_in_10_seconds.mp3")}`]);
    }

    create() {
        let _this = this;

        _this.starfield2 = _this.add.tileSprite(0, 0, game.config.width, game.config.height, "starfield_2");
        _this.starfield2.setOrigin(0,0);

        addFullScreenButton(_this);


        _this.unoLogo = _this.physics.add.sprite(game.config.width/2, 180, "unoLogo");
        _this.unoLogo.setScale(0.8);
        this.tweens.add({
            targets: _this.unoLogo,
            scale: 0.5,
            duration: 2000,
            ease: 'Linear',
            yoyo: true,
            loop: -1
        });

        _this.joinedX = game.config.width / 2;
        _this.joinedY = game.config.height / 2 + 80;
        let emptyTagCoordinates = [];
        for(let i = 0; i < 5; ++i) {
            let emptyCoordinateLeft = {"isEmpty": true, "x": _this.joinedX - 260, "y": _this.joinedY};
            let emptyCoordinateRight = {"isEmpty": true, "x": _this.joinedX + 170, "y": _this.joinedY};
            _this.joinedY += 35;
            emptyTagCoordinates.push(emptyCoordinateLeft);
            emptyTagCoordinates.push(emptyCoordinateRight);
        }

        /*******************************
            WEBSOCKET CONNECTION
         *******************************/
        // Fetching Endpoint
        let loc = window.location;
        let wsStart = 'ws://';
        if(loc.protocol === 'https:') {
            // To make it Production Ready
            wsStart = 'wss://'
        }
        let endpoint = wsStart + loc.host + loc.pathname;
        // Making WebSocket Object
        // let socket = new ReconnectingWebSocket(endpoint);
        socket = new WebSocket(endpoint);

        const my_peer = new Peer(undefined, { // making available a Peer Object from peerjs library to work on the root path
            host: '/',
            port: '8001'
            // host: 'pirateksh-028b1663.localhost.run',
            // port: ''

            // host: 'sangwan-e071a5cd.localhost.run',
            // port: ''
        });

        const get_my_peer_id = new Promise(resolve => {
            my_peer.on('open', (uid) => {
                    resolve({"unique_peer_id": uid});
            });
        });

        const open_socket = new Promise(resolve => {
            socket.addEventListener("open", (e) => {
                resolve({"open_socket_state": socket.readyState});
            });
        });

        let VideoGrid = document.getElementById('VideoGrid');
        let Video = document.createElement('video'); // This video Element will contain users own video


        Promise.all([get_my_peer_id, open_socket]).then(result => {
             console.log("open");
             MY_UNIQUE_PEER_ID = result[0].unique_peer_id;
             let data = {
                 "status": "user_new",
                 "message": "New user entered the room.",
                 "data": {
                     "new_user_username" : me,
                     "unique_peer_id": result[0].unique_peer_id,
                     "game_room_unique_id": gameRoomUniqueId
                 }
             };
             let response = {"type": "user.new", "text": data};
             socket.send(JSON.stringify(response));
             STREAM
                 .then(stream => {
                    addVideoStream(Video, stream, me);
                 })
                 .catch((err) =>{
                     console.log("Error Occurred While Starting the Stream:", err);
                 })
        });

        _this.videoX = 80;
        _this.videoY = 100;
        let emptyVideoStreamCoordinates = [];
        for(let i = 0; i < 5; ++i) {
            let emptyVideoCoordinateLeft = {"isEmpty": true, "x": _this.videoX, "y": _this.videoY};
            let emptyVideoCoordinateRight = {"isEmpty": true, "x": _this.videoX + 1110, "y": _this.videoY};
            _this.videoY += 105;
            emptyVideoStreamCoordinates.push(emptyVideoCoordinateLeft);
            emptyVideoStreamCoordinates.push(emptyVideoCoordinateRight);
        }
        _this.videoGroup = [];
        _this.labelGroup = _this.physics.add.group();
        _this.streamDict = {};

        function addVideoStream(Video, stream, label="Some user in Room") {
            let vidElem;
            for(let i = 0; i < emptyVideoStreamCoordinates.length; ++i) {
                let emptyVideoCoordinate = emptyVideoStreamCoordinates[i];
                if(emptyVideoCoordinate.isEmpty) {
                    let x = emptyVideoCoordinate.x, y = emptyVideoCoordinate.y;
                    vidElem = _this.add.video(x, y);
                    emptyVideoStreamCoordinates[i].isEmpty = false;
                    vidElem.loadURL("", 'loadeddata', false);
                    vidElem.video.srcObject = stream;
                    _this.streamDict[label] = stream;
                    vidElem.video.addEventListener('loadedmetadata', () => {
                        vidElem.video.play();
                        vidElem.depth = 0;
                        vidElem.setData({"username": label});
                        vidElem.setScale(gameDetails.liveFeedScale);
                        _this.videoGroup.push(vidElem);
                    });

                    addLabelOnLiveFeed(_this, vidElem, label);

                    if(label === me){
                        vidElem.video.muted = true;
                        console.log("Self Stream Was Muted.")
                    }
                    break;
                }
            }
        }

        function connectToNewUser(other_unique_peer_id, var_new_user_username){
            if(MY_UNIQUE_PEER_ID === other_unique_peer_id){ // My own stream was already added
                return ;
            }
            STREAM
                .then(stream => {
                    setTimeout(()=>{
                        const call = my_peer.call(other_unique_peer_id, stream, {metadata: {"username": me}}); // Calling the Newly Connected peer
                        const Video = document.createElement('video');
                        call.on('stream', remoteStream => { // adding the others video element to video-grid on our page.
                            if(peers[var_new_user_username] !== undefined){
                                console.log("Made Second Call to", var_new_user_username);
                            }
                            else{
                                addVideoStream(Video, remoteStream, var_new_user_username);
                                peers[var_new_user_username] = call;
                                console.log("Made First Call to", var_new_user_username);
                            }
                        });
                        call.on('close', () => {
                            Video.remove();
                        });
                    }, 5000);
                })
                .catch((err)=>{
                    console.log("Error Occurred while starting the stream:", err);
                });
        }

        STREAM
            .then((stream) => {
                my_peer.on('call', (call) => { // Someone is Calling me
                    let caller = call.metadata.username;
                    call.answer(stream); // Answer the call with an A/V stream.
                    const othersVideo = document.createElement('video');
                    call.on('stream', (remoteStream) => {
                         if(peers[caller] !== undefined){ // Already Answered Once
                            console.log("Second Answer to", caller);
                         }
                         else{
                             peers[caller] = call;
                             addVideoStream(othersVideo, remoteStream, caller);
                             console.log("First Answer to", caller);
                         }
                     });
                });
            })
            .catch((err) => {
                console.log("Error Occurred While Starting the Stream:", err);
            });

        _this.joinedPlayersTag = _this.physics.add.group();
        _this.joinedPlayersAvatar = _this.physics.add.group();

        // Used in update()
        _this.isChangeSceneRequestSent = false;

        socket.addEventListener("message", function (e) {
            let backendResponse = JSON.parse(e.data);
            let status = backendResponse.status;
            let message = backendResponse.message;
            let data = backendResponse.data;
            let gameData;

            if(backendResponse.gameData) {
                gameData = JSON.parse(backendResponse.gameData);
                if(currentGame == null) {
                    currentGame = new Game(gameData);
                    if(me === currentGame.adminUsername && currentGame.gameType === Game.FRIEND) { // Game Type is Friend.
                        _this.addPlayButton();
                    }
                    else { // TODO: Change this
                        if(currentGame.gameType === Game.FRIEND) {
                            _this.add.text(game.config.width/2 - 140, game.config.height/2 + 30, "Wait for admin to start the game.");
                        }
                        else if(currentGame.gameType === Game.PUBLIC) {
                            _this.add.text(game.config.width/2 - 160, game.config.height/2 + 30, "Game will start once sufficient players join.");
                        }
                    }

                    // Adding Unique ID of Game.
                    _this.addUniqueIdTag();

                    for(let i = 0; i < currentGame.players.length; ++i) {
                        let player = currentGame.players[i];
                        for(let j = 0; j < emptyTagCoordinates.length; ++j) {
                            let tagCoordinate = emptyTagCoordinates[j];
                            let isEmpty = tagCoordinate.isEmpty;
                            if(isEmpty) {
                                let x = tagCoordinate.x, y = tagCoordinate.y;
                                let text;
                                if(player === currentGame.adminUsername && currentGame.gameType === Game.FRIEND) {
                                    text = `${player}(admin)`;
                                } else {
                                    text = `${player}`;
                                }
                                let playerTag = _this.add.text(x, y, text, {fill: '#00ff00'});
                                playerTag.setData({'username': player});
                                _this.joinedPlayersTag.add(playerTag);
                                _this.loadAndPlaceUserAvatar(player, x, y);
                                emptyTagCoordinates[j].isEmpty = false;
                                break;
                            }
                        }
                    }
                }
             }

            if(status === "user_new") {
                let unique_peer_id = data.unique_peer_id;
                let game_room_unique_id = data.game_room_unique_id;
                let new_user_username = data.new_user_username;
                console.log("New User connected: ", new_user_username);
                connectToNewUser(unique_peer_id, new_user_username);
                if(!currentGame.players.includes(new_user_username)) {
                    currentGame.players.push(new_user_username);
                    for(let j = 0; j < emptyTagCoordinates.length; ++j) {
                        let tagCoordinate = emptyTagCoordinates[j];
                        let isEmpty = tagCoordinate.isEmpty;
                        if(isEmpty) {
                            let x = tagCoordinate.x, y = tagCoordinate.y;
                            let text;
                            if(new_user_username === currentGame.adminUsername && currentGame.gameType === Game.FRIEND) {
                                text = `${new_user_username}(admin)`;
                            } else {
                                text = `${new_user_username}`;
                            }
                            let playerTag = _this.add.text(x, y, text, {fill: '#00ff00'});
                            playerTag.setData({'username': new_user_username});
                            _this.joinedPlayersTag.add(playerTag);
                            _this.loadAndPlaceUserAvatar(new_user_username, x, y);

                            emptyTagCoordinates[j].isEmpty = false;
                            break;
                        }
                    }
                }
            }
            else if(status === "user_left_room"){
                let left_user_username = data.left_user_username;
                console.log(`${left_user_username} left.`);
                if(currentGame.isGameRunning === false) {
                    if(currentGame.players.includes(left_user_username)) {
                        currentGame.players.splice(currentGame.players.indexOf(left_user_username), 1); // TESTING
                    }
                    for(let i = 0; i < _this.joinedPlayersTag.getChildren().length; ++i) {
                        let leftPlayerTag = _this.joinedPlayersTag.getChildren()[i];
                        let labelText = _this.labelGroup.getChildren()[i];
                        let vidElem = _this.videoGroup[i];
                        let avatarElem = _this.joinedPlayersAvatar.getChildren()[i];
                        let leftPlayerUsername = leftPlayerTag.getData("username");
                        if(left_user_username === leftPlayerUsername) {
                            for(let j = 0; j < emptyTagCoordinates.length; ++j) {
                                let tagCoordinate = emptyTagCoordinates[j];
                                if(tagCoordinate.x === leftPlayerTag.x && tagCoordinate.y === leftPlayerTag.y) {
                                    emptyTagCoordinates[j].isEmpty = true;
                                    break;
                                }
                            }
                            leftPlayerTag.destroy();
                            labelText.destroy();
                            _this.videoGroup.splice(i, 1);
                            for(let j = 0; j < emptyVideoStreamCoordinates.length; ++j) {
                                let videoCoordinate = emptyVideoStreamCoordinates[j];
                                if(videoCoordinate.x === vidElem.x && videoCoordinate.y === vidElem.y) {
                                    emptyVideoStreamCoordinates[j].isEmpty = true;
                                    break;
                                }
                            }
                            vidElem.destroy();
                            avatarElem.destroy();
                            break;
                        }
                    }
                }

                if (peers[left_user_username]){
                    peers[left_user_username].close();
                    delete peers[left_user_username];
                     if(document.getElementById("div_" + left_user_username)){
                        document.getElementById("div_" + left_user_username).remove();
                     }
                     if(document.getElementById("vid_" + left_user_username)){
                        document.getElementById("vid_" + left_user_username).remove();
                     }
                } else{
                    console.log("This user was not yet added in the Peers Network.");
                }
            }
            else if(status === "change_scene") {
                let sceneNumber = data.sceneNumber;
                for(let i = 0; i < _this.videoGroup.length; ++i) {
                    let vidElem =  _this.videoGroup[i];
                    vidElem.destroy();
                }
                if(sceneNumber === 2) {
                    let wormhole = _this.add.video(game.config.width/2, game.config.height/2, "wormhole");
                    wormhole.setScale(1.6, 1);
                    wormhole.depth = 10;
                    wormhole.play();
                    let spaceSound = _this.sound.add("space");
                    spaceSound.play();
                    _this.time.delayedCall(3000, function () {
                        wormhole.destroy();
                        spaceSound.stop();
                        _this.scene.start("playGame");
                    }, [], _this);
                }
            }
        });

        socket.onerror = function (e) {
            console.log("error");
            let text = "This Game is Probably Full. Try Another One!";
            textToSpeech(text);
            window.location.replace(redirectUrl);
        };

        socket.onclose = function (e) {
            let text = "You got disconnected!";
            textToSpeech(text);
        };

        /*******************************
            WEBSOCKET CONNECTION ENDED
         *******************************/

        // Calling method to create all the animations used in game.
        _this.createAllAnimations();
    }

    loadAndPlaceUserAvatar(username, x, y) {
        let _this = this;
        let path = `${getUserAvatarPath(username)}`, img;

        if(doesFileExist(path)) {
            console.log("File Exists.");
            _this.load.image(`avatar_${username}`, path);
            _this.load.once('complete', function () {
                img = _this.add.image(x - 20, y+8, `avatar_${username}`).setScale(gameDetails.userAvatarScale);
                _this.joinedPlayersAvatar.add(img);
            });
            _this.load.start();
        }
        else {
            console.log("File DNE.");
            img = _this.add.image(x - 20, y+8, "defaultAvatar").setScale(0.12).setDepth(1);
            _this.joinedPlayersAvatar.add(img);
        }
    }

    addUniqueIdTag() {
        let _this = this;
        if(currentGame.gameType === Game.FRIEND) {
            _this.uniqueIdTag = _this.add.text(15, game.config.height - 30, `Unique ID: ${currentGame.uniqueId} (Click to Copy)`);
            _this.uniqueIdTag.setInteractive();
            _this.uniqueIdTag.on("pointerover", function (pointer) {
                document.querySelector("canvas").style.cursor = "pointer";
            });
            _this.uniqueIdTag.on("pointerout", function (pointer) {
                document.querySelector("canvas").style.cursor = "default";
            });
            _this.uniqueIdTag.on("pointerdown", function (pointer) {
                copyToClipboard(currentGame.uniqueId);
            });
        }
        else {
            _this.uniqueIdTag = _this.add.text(15, game.config.height - 30, `Unique ID: ${currentGame.uniqueId}`);
        }
    }

    addPlayButton() {
        let _this = this;
        _this.playButton = _this.physics.add.sprite(game.config.width/2, game.config.height/2 + 80, "playButton");
        _this.playButton.setScale(gameDetails.playButtonScale);
        _this.playButton.setInteractive();

        _this.playButton.on("pointerover", function (pointer) {
            document.querySelector("canvas").style.cursor = "pointer";
            _this.playButton.setFrame(1);
        });

        _this.playButton.on("pointerout", function (pointer) {
            document.querySelector("canvas").style.cursor = "default";
            _this.playButton.setFrame(0);
        });

        _this.playButton.on("pointerdown", function (pointer) {
            if(_this.videoGroup.length === currentGame.players.length) {
                if(currentGame.players.length === 1) {
                    let p = prompt("This is for Testing. Only 1 Player. DO you want to continue?");
                    if(p === "Y") {
                        currentGame.changeSceneRequest(socket, 2);
                    }
                    else {
                        let text = "Wait for more players to join.";
                        textToSpeech(text);
                    }
                } else {
                    currentGame.changeSceneRequest(socket, 2);
                }
            }
            else {
                let text = "Wait for Video/Audio stream to load.";
                textToSpeech(text);
            }
        });
    }

    createAllAnimations() {
        this.anims.create({
			key: "yourTurnAnim", // Name of animation
			frames: this.anims.generateFrameNumbers("turnIndicator"), // Using frames from "yourTurn" spritesheet
			frameRate: 50, // play at 20 frames per second
			repeat: -1 // For infinite loop (repeat) we user -1
		});
    }

    update() {
        let _this = this;
        if (currentGame !=null && !_this.isChangeSceneRequestSent) {
            if (currentGame.gameType === Game.PUBLIC && currentGame.players.length === Game.MAX_LIMIT) {
                if (_this.videoGroup.length === currentGame.players.length) {
                    // If this is a public game send change scene request after Max. Player Join.
                    console.log("Sending Change Scene Request!");
                    _this.isChangeSceneRequestSent = true;
                    // _this.sound.play("10Seconds");
                    _this.time.delayedCall(
                        2000,
                        function () {
                            if (me === currentGame.adminUsername) {
                                console.log("Sent Change Scene Request!");
                                currentGame.changeSceneRequest(socket, 2);
                            }
                        },
                        [], _this
                    );

                }
            }
        }
    }
}