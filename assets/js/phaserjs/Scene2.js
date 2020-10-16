class Scene2 extends Phaser.Scene {
    constructor() {
        super("playGame");
    }

    create() {
        let _this = this;
        _this.config = game.config;
        let config = _this.config;

        _this.table = _this.add.tileSprite(0, 0, config.width, config.height, "table");
        _this.table.setOrigin(0,0);

        _this.deck = _this.physics.add.group();
        _this.playerHand = _this.physics.add.group();
        // TODO: Remove this Phaser 3 group and use Game class for this.

        let initialPosX = 200, initialPosY = 0;
        _this.deckX = config.width/2 - initialPosX;
        _this.deckY = config.height/2 + initialPosY;

        for(let i = 0; i < 5; ++i) {
            let cardBack = _this.physics.add.sprite(config.width/2 - initialPosX, config.height/2 + initialPosY, "cardBack");
            // cardBack.setInteractive();
            // cardBack.on("pointerdown", this.drawCard, this);
            _this.deck.add(cardBack);
            initialPosX -= 3;
            initialPosY += 2;
        }

        // Opponents Hand Sprite.
        _this.oppHand = _this.physics.add.sprite(gameDetails.oppHandX, gameDetails.oppHandY, "oppHand");
        _this.oppHand.setScale(gameDetails.oppHandScale);

        _this.frontX = config.width/2 - 100;
        _this.frontY = config.height/2 + 200;
        // this.input.on("gameobjectdown", this.drawCard, this);

        

        socket.addEventListener("message", function (e) {
            // console.log("Listening message from Game", e);
            let backendResponse = JSON.parse(e.data);
            let status = backendResponse.status;
            let message = backendResponse.message;
            let data = backendResponse.data;
            if(status === "start_game") {
                _this.startGame();
            } else if (status === "end_game") {
                _this.endGame();
            }
            else if(status === "play_card") {
                let username_ = data.username;
                let card = data.card;
                let index = data.index;

                if(username_ === me) {
                    // console.log("Compare 1:", card);
                    // console.log("Compare 2:" ,myHand.cards[index]);
                    _this.playCardSelf(card, index);
                    myHand.removeCardAt(index);
                } else {
                    // Opponent plays a card.
                    _this.playCardOpp(card);
                }

                if(currentGame.getCurrentPlayer() === me) {
                    console.log("Making hand interactive for: ", me);
                    _this.makeHandInteractive();
                }

            }
            else if(status === "draw_card") {
                console.log("Draw Card Event Struck! -- from Scene2");
                let username = data.username;
                let drawnCards = data.drawnCards;
                let drawnCardCount = data.drawnCardCount;
                if(username === me) {
                    for(let card of drawnCards) {
                        // Current player has drawn the card.
                        let depth = 10; // FIX THIS
                        _this.placeCard(card, _this.deckX, _this.deckY, _this.frontX, _this.frontY, _this.playerHand, depth);
                        _this.frontX += 35;
                    }
                }
                else {
                    for(let i = 0; i < drawnCardCount; ++i) {
                        _this.drawCardOpp();
                    }
                }
            }
        });
    }

    playCardSelf(card, index) {
        let _this = this;
        // When current player plays a card.

        _this.topCard.disableBody(true, true);

        let moveThis = _this.playerHand.getChildren()[index];

        _this.tweens.add({
            targets: moveThis,
            x: gameDetails.topCardX,
            y: gameDetails.topCardY,
            ease: "Power1",
            duration: 500,
            repeat: 0,
            onComplete: function () {},
            callbackScope: _this
        });

        moveThis.disableInteractive();

        // Adjusting other cards after playing.
        for(let i = 0; i < _this.playerHand.getChildren().length; ++i) {
            let cardSprite = _this.playerHand.getChildren()[i];

            if(me !== currentGame.getCurrentPlayer()) {
                // Making cards Un-Interactive if it is not this player's turn.
                cardSprite.disableInteractive();
            }


            // Adjusting cards.
            if(i > index) {
                _this.tweens.add({
                    targets: cardSprite,
                    x: cardSprite.x - 35, // Only Move in X - axis
                    ease: "Power1",
                    duration: 250,
                    repeat: 0,
                    onComplete: function () {
                        _this.frontX -= 35;
                    },
                    callbackScope: _this
                });
            }
        }

        console.log("Before Removing: ", _this.playerHand);
        // Remove from group but do not remove from scene and do not destroy.
        this.playerHand.remove(moveThis, false, false);
        console.log("After Removing: ", _this.playerHand);
        _this.topCard = moveThis;
    }

    playCardOpp(card) {
        let _this = this;
        // When opponent plays a card.
        _this.topCard.disableBody(true, true);
        let animKey = _this.createOrGetAnimationKey(card);
        let x = gameDetails.oppHandX;
        let y = gameDetails.oppHandY;
        let moveThis = _this.physics.add.sprite(x, y, "uno");
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
            callbackScope: _this
        });
    }

    drawCardOpp() {
        let _this = this;
        // To be called when Opponent draws a card.
        let x = gameDetails.deckX;
        let y = gameDetails.deckY;
        let drawnCard = _this.physics.add.sprite(x, y, "cardBack");
        drawnCard.setScale(gameDetails.myHandScale);
        drawnCard.depth = 0;

        this.tweens.add({
            targets: drawnCard,
            x: gameDetails.oppHandX,
            y: gameDetails.oppHandY,
            ease: "Power1",
            duration: 500,
            repeat: 0,
            onComplete: function () {
                drawnCard.disableBody(true, true);
            },
            callbackScope: _this
        });
    }

    startGame() {
        let _this = this;
        _this.placeTopCard(); // Placing Top Card
        _this.dealHand(); // Dealing Hands

        if(currentGame.getCurrentPlayer() === me) {
            console.log("Making hand interactive for: ", me);
            _this.makeHandInteractive();
        }
    }

    endGame() {
        let _this = this;
        _this.frontX = _this.config.width/2 - 100;

        if(_this.topCard) {
            _this.topCard.disableBody(true, true);//.destroy();
        }

        this.playerHand.clear(true, true);
    }

    placeTopCard() {
        let _this = this;
        let x = _this.deckX, y = _this.deckY;
        let stopX = gameDetails.topCardX, stopY = gameDetails.topCardY;
        _this.placeCard(currentGame.topCard, x, y, stopX, stopY);
    }

    dealHand() {
        let _this = this;
        // console.log("Hands are being dealt!");
        for (let i = 0; i < myHand.getCount(); ++i) {
            let card = myHand.getCardAt(i);
            _this.placeCard(card, _this.deckX, _this.deckY, _this.frontX, _this.frontY, _this.playerHand, i+1);
            _this.frontX += 35;
        }
    }

    makeHandInteractive() {
        let _this = this;
        // console.log(currentGame.topCard);
        // console.log(currentGame.topColor);
        if(currentGame.getCurrentPlayer() === me) {
            let count = myHand.getCount();
            // console.log("Number of cards in deck:", count);
            for(let i = 0; i < count; ++i) {
                let card = myHand.getCardAt(i);
                let cardSprite = this.playerHand.getChildren()[i];
                let depth = i + 1;
                _this.makeCardInteractive(card, cardSprite, depth);
            }
        }
    }

    makeCardInteractive(card, cardSprite, depth) {
        // Method to be called on single (card, cardSprite) of currentPlayer's Hand.
        let _this = this;
        // If this is not the topCard and this card can be played on the top of currentGame.topCard.
        if(currentGame.canPlay(card)) {
            cardSprite.setInteractive();
        }
    }

    placeCard(card, x, y, stopX, stopY, group=null, depth=0) {
        let _this = this;
        let animKey = this.createOrGetAnimationKey(card);

        let thisCard = this.physics.add.sprite(x, y, "uno");
        thisCard.setScale(gameDetails.myHandScale);
        thisCard.play(animKey);
        thisCard.depth = depth;

        // TRYING THIS ////////////////////////////////////////
        thisCard.setInteractive();
        thisCard.on("pointerover", function (pointer) {
            console.log("Over this card. It can be played.", card);
            thisCard.depth = 10;
            thisCard.y -= 15;
        });

        thisCard.on("pointerout", function (pointer) {
            // console.log("Out of this card.");
            thisCard.depth = depth;
            thisCard.y += 15;
        });

        thisCard.on("pointerdown", function (pointer) {
            // Playing this card.

            // Double Check
            if(currentGame.canPlay(card)) {
                console.log("Before Playing: ", _this.playerHand);
                currentGame.playCard(card, depth-1);
                console.log("After Playing: ", _this.playerHand);
            }
            else {
                alert("Cheating: Trying To Play Invalid Card!")
            }
            /////////////////////////////////////
            ////////////////////////////////////
        });

        thisCard.disableInteractive();
        // TRYING ENDED/ //////////////////////////////////

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
			callbackScope: _this
		});
    }

    createOrGetAnimationKey(card) {
        let _this = this;
        // If animation for this card is not present, create it.
        // returns the animation key.

        let category = card.category;
        let number = card.number;
        let animKey = `uno_anim_${category}_${number}`;

        if (!currentAnimKeys.includes(animKey)) {

            // If animation for this card is not present.
            let imagePoint = getImagePoint(category, number);
            this.anims.create({
                key: animKey,
                frames: _this.anims.generateFrameNumbers("uno", {
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