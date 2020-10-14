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
            // cardBack.setInteractive();
            // cardBack.on("pointerdown", this.drawCard, this);
            this.deck.add(cardBack);
            initialPosX -= 3;
            initialPosY += 2;
        }

        this.frontX = config.width/2 - 100;
        this.frontY = config.height/2 + 200;
        // this.input.on("gameobjectdown", this.drawCard, this);

        var _this = this;
        socket.addEventListener("message", function (e) {
            // console.log("Listening message from Game", e);
            var backendResponse = JSON.parse(e.data);
            var status = backendResponse.status;
            var message = backendResponse.message;
            var data = backendResponse.data;
            if(status === "start_game") {
                _this.startGame();
            } else if (status === "end_game") {
                _this.endGame();
            }
            else if(status === "play_card") {
                var username_ = data.username;
                var card = data.card;
                var index = data.index;
                if(currentGame.getCurrentPlayer() === me) {
                    console.log("Making hand interactive for: ", me);
                    _this.makeHandInteractive();
                }
                if(username_ === me) {
                    _this.topCard.disableBody(true, true);

                    var moveThis = _this.playerHand.getChildren()[index];
                    _this.tweens.add({
                        targets: moveThis,
                        x: gameDetails.topCardX,
                        y: gameDetails.topCardY,
                        ease: "Power1",
                        duration: 500,
                        repeat: 0,
                        onComplete: function () {},
                        callbackScope: this
                    });
                    _this.playerHand.remove(moveThis, false, false);
                    _this.topCard = moveThis;
                } else {
                    _this.topCard.disableBody(true, true);
                    var animKey = _this.createOrGetAnimationKey(card);
                    var x = gameDetails.oppHandX;
                    var y = gameDetails.oppHandY;
                    var moveThis = _this.physics.add.sprite(x, y, "uno");
                    moveThis.setScale(gameDetails.myHandScale);
                    moveThis.play(animKey);
                    moveThis.depth = 0;

                    _this.topCard = moveThis;
                    _this.tweens.add({
                        targets: moveThis,
                        x: gameDetails.topCardX,
                        y: gameDetails.topCardY,
                        ease: "Power1",
                        duration: 500,
                        repeat: 0,
                        onComplete: function () {},
                        callbackScope: this
                    });
                }
            }

        });
    }

    startGame() {
        this.placeTopCard(); // Placing Top Card
        this.dealHand(); // Dealing Hands

        if(currentGame.getCurrentPlayer() === me) {
            console.log("Making hand interactive for: ", me);
            this.makeHandInteractive();
        }
    }

    endGame() {
        this.frontX = this.config.width/2 - 100;

        // for(var i = 0; i < this.playerHand.getChildren().length; ++i) {
        //     var thisObject = this.playerHand.getChildren()[i];
        //     if(thisObject) {
        //         thisObject.disableBody(true, true);//.destroy();
        //     }
        // }
        if(this.topCard) {
            this.topCard.disableBody(true, true);//.destroy();
        }

        this.playerHand.clear(true, true);
    }

    placeTopCard() {
        var x = this.deckX, y = this.deckY;
        var stopX = gameDetails.topCardX, stopY = gameDetails.topCardY;
        this.placeCard(currentGame.topCard, x, y, stopX, stopY);
    }

    dealHand() {
        console.log("Hands are being dealt!");
        var stopX = this.frontX, stopY = this.frontY;
        var this_ = this;
        for (var i = 0; i < myHand.getCount(); ++i) {
            var card = myHand.getCardAt(i);
            this_.placeCard(card, this_.deckX, this_.deckY, this_.frontX, this_.frontY, this.playerHand, i+1);
            this_.frontX += 35;
        }
    }

    makeHandInteractive() {
        var count = myHand.getCount();
        for(var i = 0; i < count; ++i) {
            var card = myHand.getCardAt(i);
            var cardSprite = this.playerHand.getChildren()[i];
            var depth = i + 1;
            this.makeCardInteractive(card, cardSprite, depth);
        }
    }

    makeCardInteractive(card, cardSprite, depth) {
        // Method to be called on single (card, cardSprite) of currentPlayer's Hand.
        var _this = this;
        // If this is not the topCard and this card can be played on the top of currentGame.topCard.
        if(currentGame.canPlay(card)) {
            cardSprite.setInteractive();
            cardSprite.on("pointerover", function (pointer) {
                // console.log("Over this card. It can be played.");
                cardSprite.depth = 10;
                cardSprite.y -= 15;
            });

            cardSprite.on("pointerout", function (pointer) {
                // console.log("Out of this card.");
                cardSprite.depth = depth;
                cardSprite.y += 15;
            });

            cardSprite.on("pointerdown", function (pointer) {
                // Playing this card.
                _this.playCard(card, depth-1);
            })
        }
    }

    playCard(card, index) {
        // Method to send data to backend using socket and play a card.
        console.log("Playing card: ", card);
        var data = {
            "status": "play_card",
            "message": "A player played a card.",
            "data": {
                "username": currentGame.getCurrentPlayer(),
                "card": card,
                "index": index
            }
        };
        var response = {
            "type": "play.card",
            "text": data
        };
        socket.send(JSON.stringify(response));
    }

    placeCard(card, x, y, stopX, stopY, group=null, depth=0) {

        var animKey = this.createOrGetAnimationKey(card);

        var thisCard = this.physics.add.sprite(x, y, "uno");
        thisCard.setScale(gameDetails.myHandScale);
        thisCard.play(animKey);
        thisCard.depth = depth;
        if(group) {
            group.add(thisCard);
        } else {
            this.topCard = thisCard;
        }

        this.tweens.add({
			targets: thisCard,
            x: stopX,
			y: stopY,
			ease: "Power1",
			duration: 1500,
			repeat: 0,
			onComplete: function () {},
			callbackScope: this
		});
    }

    createOrGetAnimationKey(card) {
        // If animation for this card is not present, create it.
        // returns the animation key.

        var category = card.category;
        var number = card.number;
        var animKey = `uno_anim_${category}_${number}`;

        if (!currentAnimKeys.includes(animKey)) {

            // If animation for this card is not present.
            var imagePoint = getImagePoint(category, number);
            this.anims.create({
                key: animKey,
                frames: this.anims.generateFrameNumbers("uno", {
                    start: imagePoint,
                    end: imagePoint
                }),
                frameRate: 0,
                repeat: 0
            });

            // Push this animation key in currentAnimKeys
            currentAnimKeys.push(animKey);
        }

        return animKey;
    }



    // drawCard(pointer) {
    // }

    update() {

    }
}