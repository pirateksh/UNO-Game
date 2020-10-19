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

        // this.load.spritesheet("yourTurn", `${generatePath("spritesheets", "your_turn.jpeg")}`, {
        //     frameWidth: 62.75,
        //     frameHeight: 60.667
        // });

        // this.load.spritesheet("turnIndicator", `${generatePath("spritesheets", "turn_indicator.png")}`, {
        //     frameWidth: 16,
        //     frameHeight: 16
        // });

        this.load.spritesheet("turnIndicator", `${generatePath("spritesheets", "bird.jpg")}`, {
            frameWidth: 750,
            frameHeight: 800
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

        this.anims.create({
			key: "yourTurnAnim", // Name of animation
			frames: this.anims.generateFrameNumbers("turnIndicator"), // Using frames from "yourTurn" spritesheet
			frameRate: 30, // play at 20 frames per second
			repeat: -1 // For infinite loop (repeat) we user -1
		});
    }
}