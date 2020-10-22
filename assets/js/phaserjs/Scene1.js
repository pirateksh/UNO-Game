class Scene1 extends Phaser.Scene {
    constructor() {
        super("bootGame");
    }

    preload() {
        this.load.image("table", `${generatePath("images", "table.jpg")}`);

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

        // this.load.spritesheet("turnIndicator", `${generatePath("spritesheets", "bird.jpg")}`, {
        //     frameWidth: 750,
        //     frameHeight: 800
        // });


        // this.load.spritesheet("turnIndicator", `${generatePath("spritesheets", "turn_indicator_2.png")}`, {
        //     frameWidth: 73,
        //     frameHeight: 73
        // });

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


        this.load.bitmapFont("pixelFont", `${generatePath("font", "font.png")}`, `${generatePath("font", "font.xml")}`);

    }

    create() {
        let _this = this;
        // Center game canvas on page
        // this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        // this.game.scale.pageAlignHorizontally = true;
        // this.game.scale.pageAlignVertically = true;
        _this.table = _this.add.tileSprite(0, 0, game.config.width, game.config.height, "table");
        _this.table.setOrigin(0,0);


        // _this.add.text(20, 20, "Loading Game...", {color: "#fff"});

        if(me === gameRoomAdmin) {
            _this.playButton = _this.physics.add.sprite(game.config.width/2, game.config.height/2, "playButton");
            _this.playButton.setScale(0.3);
            _this.playButton.setInteractive();

            _this.playButton.on("pointerover", function (pointer) {
                _this.playButton.play("playButtonOver");
            });

            _this.playButton.on("pointerout", function (pointer) {
                _this.playButton.play("playButtonOut");
            });

            _this.playButton.on("pointerdown", function (pointer) {
                Game.changeSceneRequest(2);
            });
        }
        else { // This will be changed.
            // _this.scene.start("playGame");
            _this.add.text(game.config.width/2, game.config.height/2, "Waiting for players to be added....");
        }

        _this.joinedX = game.config.width / 2;
        _this.joinedY = game.config.height / 2 + 100;

        // socket.onopen = function(e) {
        //     console.log("Inside Scene 1.");
        //     let data = {"status": "connected", "message": "Connecting...", "data": {"username": me}};
        //     let response = {"type": "enter.room", "text": data};
        //     socket.send(JSON.stringify(response));
        // };

        // socket.addEventListener("open", function (e) {
        //     console.log("Inside Scene 1.");
        //     let data = {"status": "connected", "message": "Connecting...", "data": {"username": me}};
        //     let response = {"type": "enter.room", "text": data};
        //     socket.send(JSON.stringify(response));
        // });

        _this.scene1PlayerList = [];
        // console.log("CSKKKK");
        _this.time.delayedCall(2000, function () {
            if(currentGame.players) {
                for(let player of currentGame.players) {
                     if(!_this.scene1PlayerList.includes(player)) {
                        _this.scene1PlayerList.push(player);
                        _this.time.delayedCall(600, function () {
                            _this.add.bitmapText(_this.joinedX - 200, _this.joinedY, "pixelFont", player, 20);
                            _this.joinedY += 20;
                        });
                     }
                }
            }
        });


        socket.addEventListener("message", function (e) {
            console.log("Message from Scene 1.");
            let backendResponse = JSON.parse(e.data);
            let status = backendResponse.status;
            let message = backendResponse.message;
            let data = backendResponse.data;
            let gameData;

            // if(backendResponse.gameData) {
            //     gameData = JSON.parse(backendResponse.gameData);
            //     let players = gameData.players;
            //     if(currentGame == null) {
            //         currentGame = new Game(gameData);
            //         console.log("JOINED:", players);
            //         for(let player of players) {
            //             _this.add.bitmapText( _this.joinedX, _this.joinedY, "pixelFont", player, 20);
            //             // _this.add.text(_this.joinedX, _this.joinedY, player);
            //             _this.joinedY += 20;
            //         }
            //     }
            // }



            if(status === "change_scene") {
                let sceneNumber = data.sceneNumber;
                if(sceneNumber === 2) {
                    _this.scene.start("playGame");
                    if(me === gameRoomAdmin) {
                        Game.startGameRequest();
                    }
                }
            }
            else if(status === "connected") {
                let username = data.username;
                console.log(`${username} added.`);
                if(!_this.scene1PlayerList.includes(username)) {
                // if(!currentGame.players.includes(username)) {
                //     currentGame.players.push(username);
                    _this.scene1PlayerList.push(username);
                    _this.add.bitmapText( _this.joinedX - 200, _this.joinedY, "pixelFont", username, 20);
                    // _this.add.text(_this.joinedX, _this.joinedY, username);
                    _this.joinedY += 20;
                }
                // currentGame.connectPlayer(username);
            }
        });


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
}