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

        socket.addEventListener("message", function (e) {
            // console.log("Listening message from Game", e);
            let backendResponse = JSON.parse(e.data);
            let status = backendResponse.status;
            let message = backendResponse.message;
            let data = backendResponse.data;
            let gameData, serializedPlayer, serverHand;
            if(backendResponse.gameData) {
                gameData = JSON.parse(backendResponse.gameData);
            }
            if(backendResponse.serializedPlayer) {
                serializedPlayer = JSON.parse(backendResponse.serializedPlayer);
                serverHand = serializedPlayer.hand;
                // myHand = new Hand(serializedPlayer.hand);
            }

            if(status === START_GAME) {
                // Adding cards to player's Hand.
                for(let i = 0; i < serverHand.length; ++i) {
                    let cardInHand = serverHand[i];
                    let category = cardInHand.category, number = cardInHand.number;
                    let cardObject = new Card(category, number);
                    let x  = gameDetails.deckX, y = gameDetails.deckY;
                    let depth = i+1, scale = gameDetails.myHandScale;
                    let cardSprite = _this.getCardSprite(cardObject, x, y, depth, scale);
                    myHand.addCardAndCardSprite(cardObject, cardSprite);
                }
                _this.startGame();
            }
            else if (status === END_GAME) {
                _this.endGame();
            }
            else if(status === PLAY_CARD) {
                let username_ = data.username;
                let playedCard = data.card; // Used if opponent has played the card.
                let index = data.index; // Used if current player has played the card.
                let playedCardObject = new Card(playedCard.category, playedCard.number);

                if(username_ === me) {
                    // Current Player plays a card.
                    _this.playCardSelf(index);
                } else {
                    // Opponent plays a card.
                    _this.playCardOpp(playedCardObject);
                }

                if(currentGame.getCurrentPlayer() === me) {
                    // Making Hand Interactive for current Player.
                    console.log("Making hand interactive for: ", me);
                    _this.makeHandInteractive();
                }

            }
            else if(status === DRAW_CARD) {
                console.log("Draw Card Event Struck! -- from Scene2");
                let username = data.username;
                let drawnCards = data.drawnCards;
                let drawnCardCount = data.drawnCardCount;
                if(username === me) {
                    for(let drawnCard of drawnCards) {
                        let category = drawnCard.category, number = drawnCard.number;
                        let drawnCardObject = new Card(category, number);
                        let x = gameDetails.deckX, y = gameDetails.deckY;
                        let depth = myHand.getCount(), scale = gameDetails.myHandScale;
                        let drawnCardSprite = _this.getCardSprite(drawnCardObject, x, y, depth, scale);
                        myHand.addCardAndCardSprite(drawnCardObject, drawnCardSprite);
                        _this.drawCardSelf(drawnCardSprite);
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
    
    addTween(target, toX, toY, duration) {
        let _this = this;
        _this.tweens.add({
			targets: target,
            x: toX,
			y: toY,
			ease: "Power1",
			duration: duration, // 1500
			repeat: 0,
			onComplete: function () {},
			callbackScope: _this
		});
    }

    startGame() {
        let _this = this;
        currentGame.startGame(); // Calling startGame() method of Game class.
        _this.placeTopCard(); // Placing Top Card
        _this.dealHand(); // Dealing Hands

        if(currentGame.getCurrentPlayer() === me) {
            console.log("Making hand interactive for: ", me);
            _this.makeHandInteractive();
        }
    }

    placeTopCard() {
        let _this = this;
        let x = _this.deckX, y = _this.deckY, depth = 0, scale = gameDetails.myHandScale;
        let toX = gameDetails.topCardX, toY = gameDetails.topCardY;
        _this.topCardSprite = _this.getCardSprite(currentGame.topCard, x, y, depth, scale);
        _this.addTween(_this.topCardSprite, toX, toY, 1500);
    }

    dealHand() {
        let _this = this;
        for (let i = 0; i < myHand.getCount(); ++i) {
            let card = myHand.getCardAt(i);
            let cardSprite = myHand.getCardSpriteAt(i);
            _this.drawCardSelf(cardSprite);

        }
    }

    getCardSprite(card, x, y, depth=0, scale=1) {
        let _this = this;
        let animKey = _this.createOrGetAnimationKey(card);
        let cardSprite = _this.physics.add.sprite(x, y, "uno");
        cardSprite.setScale(scale);
        cardSprite.play(animKey);
        cardSprite.depth = depth;
        return cardSprite;
    }

    playCardSelf(index) {
        let _this = this;
        // When current player plays a card.

        _this.topCardSprite.disableBody(true, true);

        let playedCard = myHand.getCardAt(index);
        let playedCardSprite = myHand.getCardSpriteAt(index);
        let x = gameDetails.topCardX, y = gameDetails.topCardY, duration = 500;
        _this.addTween(playedCardSprite, x, y, duration);

        playedCardSprite.disableInteractive();

        // Updating the topCardSprite and currentGame.topCard.
        _this.topCardSprite = playedCardSprite;
        currentGame.setTopCard(playedCard);

        // Removing card and cardSprite from Hand
        myHand.removeCardAndCardSpriteAt(index);

        // Adjusting other cards after playing.
        for(let i = 0; i < myHand.getCount(); ++i) {
            let cardSprite = myHand.getCardSpriteAt(i);

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
            } // Ended if statement
        } // Ended for loop
    }

    playCardOpp(card) {
        let _this = this;
        // When opponent plays a card.
        _this.topCardSprite.disableBody(true, true);
        let x = gameDetails.oppHandX, y = gameDetails.oppHandY;
        let depth = 0, scale = gameDetails.myHandScale;
        let playedCardSprite = _this.getCardSprite(card, x, y, depth, scale);

        // Setting as top Card.
        _this.topCardSprite = playedCardSprite;
        currentGame.setTopCard(card);

        // Moving card from Opponent's deck to TopCard Place.
        let toX = gameDetails.topCardX, toY = gameDetails.topCardY, duration = 500;
        _this.addTween(playedCardSprite, toX, toY, duration);
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

    drawCardSelf(cardSprite) {
        let _this = this;
        _this.addTween(cardSprite, _this.frontX, _this.frontY, 1500);
        _this.frontX += 35;

        cardSprite.on("pointerover", function (pointer) {
            console.log("Over this card. It can be played.", card);
            cardSprite.depth = 10;
            cardSprite.y -= 15;
        });

        cardSprite.on("pointerout", function (pointer) {
            cardSprite.depth = depth;
            cardSprite.y += 15;
        });

        cardSprite.on("pointerdown", function (pointer) {
            currentGame.playCard(card, depth-1);
        });
    }

    endGame() {
        let _this = this;
        _this.frontX = _this.config.width/2 - 100;

        if(_this.topCardSprite) {
            _this.topCardSprite.disableBody(true, true);//.destroy();
        }

        // Calling endGame() method of Game Class.
        currentGame.endGame();
        currentGame = null; // Setting currentGame reference to null.
    }

    makeHandInteractive() {
        let _this = this;
        if(currentGame.getCurrentPlayer() === me) {
            let count = myHand.getCount();
            for(let i = 0; i < count; ++i) {
                let card = myHand.getCardAt(i);
                let cardSprite = myHand.getCardSpriteAt(i);
                if(currentGame.canPlay(card)) {
                    cardSprite.setInteractive();
                }
            }
        }
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

    update() {

    }
}