class Scene2 extends Phaser.Scene {
    constructor() {
        super("playGame");
    }

    create() {
        this.config = game.config;
        var config = this.config;

        this.table = this.add.tileSprite(0, 0, config.width, config.height, "table");
        this.table.setOrigin(0,0);

        this.deck = this.physics.add.group();
        this.playerHand = this.physics.add.group();
        var initialPosX = 200, initialPosY = 0;
        this.deckX = config.width/2 - initialPosX;
        this.deckY = config.height/2 + initialPosY;
        for(let i = 0; i < 5; ++i) {
            var cardBack = this.physics.add.sprite(config.width/2 - initialPosX, config.height/2 + initialPosY, "cardBack");
            cardBack.setInteractive();
            cardBack.on("pointerdown", this.drawCard, this);
            this.deck.add(cardBack);
            initialPosX -= 3;
            initialPosY += 2;
        }
        this.frontX = this.game.config.width/2 - 100;
        this.frontY = this.game.config.height/2 + 150;
        // this.input.on("gameobjectdown", this.drawCard, this);


        // this.uno = this.physics.add.sprite(config.width/2, config.height/2, "uno");
        // this.uno.setScale(1.61);
        // this.uno.play("uno_anim");

        // this.emitter = EventDispatcher.getInstance();
        // console.log(this.emitter);
        // this.emitter.on("DEAL_HANDS", this.dealHand.bind(this));
        var _this = this;
        socket.addEventListener("message", function (e) {
            console.log("Listening message from Game", e);
            var backendResponse = JSON.parse(e.data);
            var status = backendResponse.status;
            var message = backendResponse.message;
            var data = backendResponse.data;
            if(status === "start_game") {
                _this.dealHand();
            } else if (status === "end_game") {

            }
        });
    }

    dealHand() {
        console.log("Hands are being dealt!");
        for (var i = 0; i < myHand.length; ++i) {
            var card = myHand[i];
            console.log(card);
            var category = card.category;
            var number = card.number;
            var animKey = `uno_anim_${category}_${number}`;

            var sno = getImagePoint(category, number);
            this.anims.create({
                key: animKey,
                frames: this.anims.generateFrameNumbers("uno", {
                    start: sno,
                    end: sno
                }),
                frameRate: 0,
                repeat: 0
            });

            var x = this.deckX;
            var y = this.deckY;
            var thisCard = this.physics.add.sprite(x, y, "uno");
            thisCard.setScale(1.61);
            thisCard.play(animKey);
            this.playerHand.add(thisCard);
            // thisCard.setInteractive();
            thisCard.setVelocityX(150);
            thisCard.setVelocityY(150);
        }
    }

    drawCard(pointer) {
        var x = pointer.x;
        var y = pointer.y;
        var thisCard = this.physics.add.sprite(x, y, "uno"); // this.physics.add.sprite(x, y, "cardFront");
        thisCard.setScale(1.61);
        thisCard.play("uno_anim");
        this.playerHand.add(thisCard);
        thisCard.setInteractive();
        thisCard.setVelocityX(150);
        thisCard.setVelocityY(150);
    }

    update() {
        for(var i = 0; i < this.playerHand.getChildren().length; ++i) {
            var thisCard = this.playerHand.getChildren()[i];
            if(thisCard && thisCard.x > this.frontX) {
                thisCard.setVelocityX(0);
                this.frontX += 35;
            }
            if(thisCard && thisCard.y > this.frontY) {
                thisCard.setVelocityY(0);
            }
        }
    }
}