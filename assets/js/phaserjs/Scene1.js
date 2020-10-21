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

        // this.load.spritesheet("turnIndicator", `${generatePath("spritesheets", "turn_indicator.png")}`, {
        //     frameWidth: 16,
        //     frameHeight: 16
        // });

        // this.load.spritesheet("turnIndicator", `${generatePath("spritesheets", "bird.jpg")}`, {
        //     frameWidth: 750,
        //     frameHeight: 800
        // });


        this.load.spritesheet("turnIndicator", `${generatePath("spritesheets", "turn_indicator_2.png")}`, {
            frameWidth: 73,
            frameHeight: 73
        });

        this.load.spritesheet("unoButton", `${generatePath("spritesheets", "uno_button.png")}`, {
            frameWidth: 300,
            frameHeight: 119
        });

        this.load.spritesheet("challengeButton", `${generatePath("spritesheets", "challenge_button.png")}`, {
            frameWidth: 73,
            frameHeight: 73
        });


        this.load.bitmapFont("pixelFont", `${generatePath("font", "font.png")}`, `${generatePath("font", "font.xml")}`);

    }

    create() {
        // Center game canvas on page
        // this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        // this.game.scale.pageAlignHorizontally = true;
        // this.game.scale.pageAlignVertically = true;

        this.add.text(20, 20, "Loading Game...");
        this.scene.start("playGame");

        // this.anims.create({
		// 	key: "yourTurnAnim", // Name of animation
		// 	frames: this.anims.generateFrameNumbers("turnIndicator"), // Using frames from "yourTurn" spritesheet
		// 	frameRate: 30, // play at 20 frames per second
		// 	repeat: -1 // For infinite loop (repeat) we user -1
		// });

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
    }
}