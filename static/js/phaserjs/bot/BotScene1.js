class BotScene1 extends Phaser.Scene {
    constructor() {
        super("bootBotGame");
    }

    preload() {
        this.preLoadEverything();
    }

    create() {
        let _this = this;

        _this.starfield2 = _this.add.tileSprite(0, 0, game.config.width, game.config.height, "starfield_2");
        _this.starfield2.setOrigin(0,0);

        let FKey = _this.input.keyboard.addKey('F');

        FKey.on('down', function () {
            if (_this.scale.isFullscreen) {
                button.setFrame(0);
                _this.scale.stopFullscreen();
            }
            else {
                button.setFrame(1);
                _this.scale.startFullscreen();
            }
        }, _this);

        let button = _this.add.image(game.config.width-16, 16, 'fullscreen', 0).setOrigin(1, 0).setScale(0.5).setInteractive();

        button.on('pointerup', function () {
            if (_this.scale.isFullscreen) {
                button.setFrame(0);
                _this.scale.stopFullscreen();
            }
            else {
                button.setFrame(1);
                _this.scale.startFullscreen();
            }
        }, _this);

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

        _this.addPlayButton();


        _this.joinedX = game.config.width / 2;
        _this.joinedY = game.config.height / 2 + 130;

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


        socket.onopen = function(event) {
            console.log("socket connection is opened in Bot Game!");
        };

        socket.addEventListener("message", function (e) {
            // console.log("BotScene1 message");
            // Clearing the Four List on the Page
            id_bot_state.empty();
            id_player_state.empty();
            id_bot_game_state.empty();
            id_playable_cards.empty();
            
        // Both Button are now incorporated inside the UI
            // // Creating the Draw Card Button
            // id_playable_cards.append("<button id='DRAW_CARD'>" + "Draw Card" + "</button>");
            // let draw_card_button = document.getElementById('DRAW_CARD');
            // draw_card_button.addEventListener('click', send_card_play_request, false);
            // draw_card_button.myParam = "DRAW_CARD";
            // // Creating the End Game Button
            // let end_game_button = document.getElementById('END_GAME');
            // end_game_button.addEventListener('click', send_end_game_request, false);
            // end_game_button.myParam = "END_GAME";


            let server_response = JSON.parse(e.data);
            // {#console.log("The Message sent by the Server is: ", server_response);#}
            if(server_response.status) {
                let status = server_response.status;
                let message = server_response.message;
                let data = server_response.data;
                if(status === "change_scene") {
                    let sceneNumber = data.sceneNumber;
                    if(sceneNumber === 2) {
                        let wormhole = _this.add.video(game.config.width/2, game.config.height/2, "wormhole");
                        wormhole.setScale(1.6, 1);
                        wormhole.depth = 10;
                        wormhole.play();
                        let spaceSound = _this.sound.add("space");
                        spaceSound.play();
                        _this.time.delayedCall(3000, function () {
                            wormhole.destroy();
                            spaceSound.destroy();
                            _this.scene.start("playBotGame");
                        }, [], _this);
                    }
                }
            }
        });

        socket.onerror = function (e) {
            console.log("error");
        };

        socket.onclose = function (e) {
            console.log("close");
        };

        /*******************************
            WEBSOCKET CONNECTION ENDED
         *******************************/

        // Calling method to create all the animations used in game.
        _this.createAllAnimations();
    }

    addPlayButton() {
        let _this = this;

        _this.easyButton = _this.physics.add.sprite(game.config.width/2 - 200, game.config.height/2 + 100, "easyButton")
                                            .setScale(gameDetails.playButtonScale)
                                            .setInteractive();

        _this.mediumButton = _this.physics.add.sprite(game.config.width/2 + 200, game.config.height/2 + 100, "mediumButton")
                                            .setScale(gameDetails.playButtonScale)
                                            .setInteractive();


        _this.easyButton.on("pointerover", function (pointer) {
            document.querySelector("canvas").style.cursor = "pointer";
            _this.easyButton.setFrame(1);
        });

        _this.easyButton.on("pointerout", function (pointer) {
            document.querySelector("canvas").style.cursor = "default";
            _this.easyButton.setFrame(0);
        });

        _this.easyButton.on("pointerdown", function (pointer) {
            level = "Easy"; // Easy
            let data = {"status": "change_scene", "message": "Game is being started.", "data": {"sceneNumber": 2, "bot_level": 0}};
            let response = {"type": "change.scene", "text": data};
            socket.send(JSON.stringify(response));
        });

        _this.mediumButton.on("pointerover", function (pointer) {
            document.querySelector("canvas").style.cursor = "pointer";
            _this.mediumButton.setFrame(1);
        });

        _this.mediumButton.on("pointerout", function (pointer) {
            document.querySelector("canvas").style.cursor = "default";
            _this.mediumButton.setFrame(0);
        });

        _this.mediumButton.on("pointerdown", function (pointer) {
            level = "Medium"; // Medium
            let data = {"status": "change_scene", "message": "Game is being started.", "data": {"sceneNumber": 2, "bot_level": 1}};
            let response = {"type": "change.scene", "text": data};
            socket.send(JSON.stringify(response));
        });



        // _this.playButton = _this.physics.add.sprite(game.config.width/2, game.config.height/2 + 80, "playButton");
        // _this.playButton.setScale(gameDetails.playButtonScale);
        // _this.playButton.setInteractive();
        //
        // _this.playButton.on("pointerover", function (pointer) {
        //     _this.playButton.play("playButtonOver");
        // });
        //
        // _this.playButton.on("pointerout", function (pointer) {
        //     _this.playButton.play("playButtonOut");
        // });
        //
        // _this.playButton.on("pointerdown", function (pointer) {
        //     // console.log("PLAY NOW CLICKED!");
        //     let data = {"status": "change_scene", "message": "Game is being started.", "data": {"sceneNumber": 2}};
        //     let response = {"type": "change.scene", "text": data};
        //     socket.send(JSON.stringify(response));
        // });
    }

    createAllAnimations() {
        this.anims.create({
			key: "yourTurnAnim", // Name of animation
			frames: this.anims.generateFrameNumbers("turnIndicator"), // Using frames from "yourTurn" spritesheet
			frameRate: 50, // play at 20 frames per second
			repeat: -1 // For infinite loop (repeat) we user -1
		});

        this.anims.create({
            key: "noButtonOut",
            frames: this.anims.generateFrameNumbers("noButton", {
                start: 0,
                end: 0
            }),
            frameRate: 20,
            repeat: 0
        });

        this.anims.create({
            key: "noButtonOver",
            frames: this.anims.generateFrameNumbers("noButton", {
                start: 1,
                end: 1
            }),
            frameRate: 20,
            repeat: 0
        });

        this.anims.create({
            key: "yesButtonOut",
            frames: this.anims.generateFrameNumbers("yesButton", {
                start: 0,
                end: 0
            }),
            frameRate: 20,
            repeat: 0
        });

        this.anims.create({
            key: "yesButtonOver",
            frames: this.anims.generateFrameNumbers("yesButton", {
                start: 1,
                end: 1
            }),
            frameRate: 20,
            repeat: 0
        });

        this.anims.create({
            key: "unoButtonOut",
            frames: this.anims.generateFrameNumbers("unoButton", {
                start: 0,
                end: 0
            }),
            frameRate: 20,
            repeat: 0
        });

        this.anims.create({
            key: "unoButtonOver",
            frames: this.anims.generateFrameNumbers("unoButton", {
                start: 1,
                end: 1
            }),
            frameRate: 20,
            repeat: 0
        });

        this.anims.create({
            key: "challengeButtonOut",
            frames: this.anims.generateFrameNumbers("challengeButton", {
                start: 0,
                end: 0
            }),
            frameRate: 20,
            repeat: 0
        });

        this.anims.create({
            key: "challengeButtonOver",
            frames: this.anims.generateFrameNumbers("challengeButton", {
                start: 1,
                end: 1
            }),
            frameRate: 20,
            repeat: 0
        });

        this.anims.create({
            key: "crossButtonOut",
            frames: this.anims.generateFrameNumbers("crossButton", {
                start: 0,
                end: 0
            }),
            frameRate: 20,
            repeat: 0
        });

        this.anims.create({
            key: "crossButtonOver",
            frames: this.anims.generateFrameNumbers("crossButton", {
                start: 1,
                end: 1
            }),
            frameRate: 20,
            repeat: 0
        });

        this.anims.create({
            key: "exitButtonOut",
            frames: this.anims.generateFrameNumbers("exitButton", {
                start: 0,
                end: 0
            }),
            frameRate: 20,
            repeat: 0
        });

        this.anims.create({
            key: "exitButtonOver",
            frames: this.anims.generateFrameNumbers("exitButton", {
                start: 1,
                end: 1
            }),
            frameRate: 20,
            repeat: 0
        });

        this.anims.create({
            key: "playButtonOut",
            frames: this.anims.generateFrameNumbers("playButton", {
                start: 0,
                end: 0
            }),
            frameRate: 20,
            repeat: 0
        });

        this.anims.create({
            key: "playButtonOver",
            frames: this.anims.generateFrameNumbers("playButton", {
                start: 1,
                end: 1
            }),
            frameRate: 20,
            repeat: 0
        });

        this.anims.create({
            key: "chooseBlueButtonOut",
            frames: this.anims.generateFrameNumbers("chooseBlueButton", {
                start: 0,
                end: 0
            }),
            frameRate: 20,
            repeat: 0
        });

        this.anims.create({
            key: "chooseBlueButtonOver",
            frames: this.anims.generateFrameNumbers("chooseBlueButton", {
                start: 1,
                end: 1
            }),
            frameRate: 20,
            repeat: 0
        });

        this.anims.create({
            key: "chooseYellowButtonOut",
            frames: this.anims.generateFrameNumbers("chooseYellowButton", {
                start: 0,
                end: 0
            }),
            frameRate: 20,
            repeat: 0
        });

        this.anims.create({
            key: "chooseYellowButtonOver",
            frames: this.anims.generateFrameNumbers("chooseYellowButton", {
                start: 1,
                end: 1
            }),
            frameRate: 20,
            repeat: 0
        });

        this.anims.create({
            key: "chooseGreenButtonOut",
            frames: this.anims.generateFrameNumbers("chooseGreenButton", {
                start: 0,
                end: 0
            }),
            frameRate: 20,
            repeat: 0
        });

        this.anims.create({
            key: "chooseGreenButtonOver",
            frames: this.anims.generateFrameNumbers("chooseGreenButton", {
                start: 1,
                end: 1
            }),
            frameRate: 20,
            repeat: 0
        });

        this.anims.create({
            key: "chooseRedButtonOut",
            frames: this.anims.generateFrameNumbers("chooseRedButton", {
                start: 0,
                end: 0
            }),
            frameRate: 20,
            repeat: 0
        });

        this.anims.create({
            key: "chooseRedButtonOver",
            frames: this.anims.generateFrameNumbers("chooseRedButton", {
                start: 1,
                end: 1
            }),
            frameRate: 20,
            repeat: 0
        });
    }

    preLoadEverything(){
        this.load.image("starfield_2", `${generatePath("images", "starfield_2.jpg")}`);

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

        this.load.spritesheet('easyButton', `${generatePath("spritesheets", "easy_button.png")}`, {
            frameWidth: 182,
            frameHeight: 56
        });

        this.load.spritesheet('mediumButton', `${generatePath("spritesheets", "medium_button.png")}`, {
            frameWidth: 182,
            frameHeight: 56
        });

        this.load.bitmapFont("pixelFont", `${generatePath("font", "font.png")}`, `${generatePath("font", "font.xml")}`);

        this.load.video('wormhole', `${generatePath("video", "wormhole.mp4")}`, 'loadeddata', false, true);

        this.load.audio('unoCallVoice', [`${generatePath("sounds", "uno_call.mp3")}`]);

        this.load.audio('unoCallSound', [`${generatePath("sounds", "uno_button.mp3")}`]);
        this.load.audio('topColorRed', [`${generatePath("sounds", "top_color_red.mp3")}`]);
        this.load.audio('topColorBlue', [`${generatePath("sounds", "top_color_blue.mp3")}`]);
        this.load.audio('topColorGreen', [`${generatePath("sounds", "top_color_green.mp3")}`]);
        this.load.audio('topColorYellow', [`${generatePath("sounds", "top_color_yellow.mp3")}`]);
        this.load.audio('botWonGame', [`${generatePath("sounds", "bot_won_game.mp3")}`]);
        this.load.audio('youWonGame', [`${generatePath("sounds", "you_won_game.mp3")}`]);

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
    }
}