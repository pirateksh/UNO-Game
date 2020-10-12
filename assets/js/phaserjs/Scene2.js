class Scene2 extends Phaser.Scene {
    constructor() {
        super("playGame");
    }

    create() {
        var config = this.game.config;

        this.table = this.add.tileSprite(0, 0, config.width, config.height, "table");
        this.table.setOrigin(0,0);

        this.deck = this.physics.add.group();
        var initialPos = 200;
        for(let i = 0; i < 5; ++i) {
            var cardBack = this.physics.add.sprite(config.width/2 - initialPos, config.height/2, "cardBack");
            cardBack.setInteractive();
            this.deck.add(cardBack);
            initialPos -= 5;
        }
        this.frontX = this.game.config.width/2 - 100;
        this.frontY = this.game.config.height/2 + 150;
        this.input.on("gameobjectdown", this.drawCard, this);
    }

    drawCard(pointer, gameObject) {
        var x = gameObject.x;
        var y = gameObject.y;
        this.thisCard = this.physics.add.sprite(x, y, "cardFront");
        // this.thisCard.setInteractive();
        this.thisCard.setVelocityX(100);
        this.thisCard.setVelocityY(100);
        // thisCard.y += 50;
        // thisCard.x += 200;
    }

    update() {
        if(this.thisCard && this.thisCard.x > this.frontX) {
            this.thisCard.setVelocityX(0);
            this.frontX += 20;
        }
        if(this.thisCard && this.thisCard.y > this.frontY) {
            this.thisCard.setVelocityY(0);
        }
    }
}