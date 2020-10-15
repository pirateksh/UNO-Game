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
    }

    create() {
        // Center game canvas on page
        // this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        // this.game.scale.pageAlignHorizontally = true;
        // this.game.scale.pageAlignVertically = true;

        this.add.text(20, 20, "Loading Game...");
        this.scene.start("playGame");
    }
}