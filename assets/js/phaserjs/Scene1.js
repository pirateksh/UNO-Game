class Scene1 extends Phaser.Scene {
    constructor() {
        super("bootGame");
    }

    preload() {
        this.load.image("table", `${generatePath("table.jpg")}`);

        this.load.spritesheet("cardBack", `${generatePath("back.png")}`, {
            frameWidth: 93,
            frameHeight: 140
        });

        this.load.spritesheet("cardFront", `${generatePath("outl.png")}`, {
            frameWidth: 93,
            frameHeight: 140
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