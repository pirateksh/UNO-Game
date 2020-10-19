class Scene2 extends Phaser.Scene {
    constructor() {
        super("playGame");
    }
    /*
    * TODO: -- Kshitiz.
    *  1. Implement Illegal Wild Four Draw / Challenging when a Wild Four is Drawn.
    *  2. Implement calling UNO / Challenging if UNO is not called by player left with 1 card.
    *
    * */
    create() {
        let _this = this;
        _this.config = game.config;
        let config = _this.config;

        _this.table = _this.add.tileSprite(0, 0, config.width, config.height, "table");
        _this.table.setOrigin(0,0);

        _this.deck = _this.physics.add.group();
        _this.discardedTopCards = _this.physics.add.group();
        _this.maxTopCardDepth = -1;

        let initialPosX = 0, initialPosY = 0;
        _this.deckX = config.width/2 - initialPosX;
        _this.deckY = config.height/2 + initialPosY;
        for(let i = 0; i < 4; ++i) {
            let cardBack = _this.physics.add.sprite(gameDetails.deckX + initialPosX, gameDetails.deckY + initialPosY, "cardBack");
            cardBack.setScale(gameDetails.deckScale);
            _this.topDeckCard = cardBack;
            _this.deck.add(cardBack);
            initialPosX -= 3;
            initialPosY += 2;
        }

        // Setting top Deck as interactive for draw card move.
        // TODO: Implement Draw Card -- Kshitiz

        _this.topDeckCard.on("pointerover", function (pointer) {
            _this.topDeckCard.y = gameDetails.deckY + 20;
        });

        _this.topDeckCard.on("pointerout", function (pointer) {
            _this.topDeckCard.y = gameDetails.deckY;
        });

        _this.topDeckCard.on("pointerdown", function (pointer) {
            console.log("Deck card has been clicked.");
            currentGame.drawCardRequest(); ////
        });

        socket.addEventListener("message", function (e) {
            // console.log("Listening message from Game", e);
            let backendResponse = JSON.parse(e.data);
            let status = backendResponse.status;
            let message = backendResponse.message;
            let data = backendResponse.data;
            let gameData;
            if(backendResponse.gameData) {
                gameData = JSON.parse(backendResponse.gameData);
            }


            if(status === "start_game") {
                currentGame.copyData(gameData);
                _this.startGameEventConsumer(backendResponse.serializedPlayer);

                if(me !== currentGame.getCurrentPlayer()) {
                    _this.topDeckCard.disableInteractive();
                }
            }
            else if (status === "end_game") {
                _this.endGame();
            }
            else if(status === "play_card") {
                currentGame.copyData(gameData);
                _this.playCardEventConsumer(data);

                if(me !== currentGame.getCurrentPlayer()) {
                    _this.topDeckCard.disableInteractive();
                }

                _this.moveOrSetTurnIndicator(true);
            }
            else if(status === "forced_draw_card") {
                // When someone played DRAW TWO or WILD FOUR card.

                // Play the Card.
                currentGame.copyData(gameData);
                _this.playCardEventConsumer(data);

                // Draw card for next player.
                // TODO: Bug when cards are drawn.
                let forcedDrawData = backendResponse.forcedDrawData;
                let username = forcedDrawData.username;
                let drawnCards = JSON.parse(forcedDrawData.drawnCards);
                let drawnCardCount = data.drawnCardCount;

                console.log("Drawn Cards are:", drawnCards);
                if(username === me) {
                    for(let drawnCard of drawnCards) {
                        let category = drawnCard.category, number = drawnCard.number;
                        let drawnCardObject = new Card(category, number);
                        let x = gameDetails.deckX, y = gameDetails.deckY;
                        let depth = myHand.getCount() + 1, scale = gameDetails.myHandScale;
                        let index = myHand.getCount();
                        let drawnCardSprite = _this.getCardSprite(drawnCardObject, x, y, depth, scale);
                        myHand.addCardAndCardSprite(drawnCardObject, drawnCardSprite);
                        _this.drawCardSelf(drawnCardObject, drawnCardSprite, depth, index);
                    }

                    // Adjusting cards in hand on the table.
                    _this.adjustSelfHandOnTable();

                }
                else {
                    for(let i = 0; i < drawnCardCount; ++i) {
                        _this.drawCardOpp();
                    }
                }

                if(me !== currentGame.getCurrentPlayer()) {
                    _this.topDeckCard.disableInteractive();
                }

                _this.moveOrSetTurnIndicator(true);
            }
            else if(status === "voluntary_draw_card") {
                // TODO: Bug when player drew WILD FOUR. Look into it.
                console.log("Card drawn verified by the server.");
                currentGame.copyData(gameData);
                let voluntaryDrawData = backendResponse.voluntaryDrawData;
                let username = voluntaryDrawData.username;
                let drawnCard = JSON.parse(voluntaryDrawData.drawnCard);
                if(username === me) {
                    // console.log(voluntaryDrawData);
                    currentGame.canDrawCard = false;
                    _this.topDeckCard.disableInteractive();
                    // console.log("Drawn Card:", drawnCard);
                    let category = drawnCard.category, number = drawnCard.number;
                    let drawnCardObject = new Card(category, number);
                    // console.log("Drawn Card Object:", drawnCardObject);
                    let x = gameDetails.deckX, y = gameDetails.deckY;
                    let depth = myHand.getCount() + 1, scale = gameDetails.myHandScale;
                    let index = myHand.getCount();
                    let drawnCardSprite = _this.getCardSprite(drawnCardObject, x, y, depth, scale);
                    myHand.addCardAndCardSprite(drawnCardObject, drawnCardSprite);
                    console.log("My Hand after draw: ", JSON.parse(JSON.stringify(myHand.cards)));
                    if(currentGame.canPlay(drawnCardObject)) {
                        _this.giveOptionToPlayOrKeep(drawnCardObject, drawnCardSprite, depth, index);
                    }
                    else {
                        // Player couldn't play this card.
                        // Setting onclick etc handlers for card.
                        _this.drawCardSelf(drawnCardObject, drawnCardSprite, depth, index);
                        // Adjusting cards in hand on the table.
                        _this.adjustSelfHandOnTable();
                    }
                }
                else {
                    // Opponent drew a card.
                    _this.drawCardOpp();
                }

                if(currentGame.getCurrentPlayer() === me && me !== username) {
                    // Making Hand Interactive for current Player.
                    console.log("Making top deck card interactive for draw card.", me);
                    currentGame.canDrawCard = true;
                    _this.topDeckCard.setInteractive();
                    console.log("Making hand interactive for: ", me);
                    _this.makeHandInteractive();

                    // alert("It's your turn!");
                    // _this.moveOrSetTurnIndicator(true);
                }

                if(me !== currentGame.getCurrentPlayer()) {
                    _this.topDeckCard.disableInteractive();
                }

                _this.moveOrSetTurnIndicator(true);
            }
            else if(status === "keep_card") {
                currentGame.copyData(gameData);
                if(currentGame.getCurrentPlayer() === me) {
                    // Making Hand Interactive for current Player.
                    console.log("Making top deck card interactive for draw card.", me);
                    currentGame.canDrawCard = true;
                    _this.topDeckCard.setInteractive();
                    console.log("Making hand interactive for: ", me);
                    _this.makeHandInteractive();

                    // alert("It's your turn!");
                    // _this.moveOrSetTurnIndicator(true);
                }

                _this.moveOrSetTurnIndicator(true);
            }
            else if(status === "won_round") {
                _this.playCardEventConsumer(data);
                let wonData = backendResponse.wonData;
                let wonUsername = wonData.username;
                let wonScore = wonData.score;
                Game.addScoreToDOM(wonUsername, wonScore);
                alert(`${wonUsername} won with score = ${wonScore}. New round is going to start.`);

                // Emptying Hands.
                for(let i = 0; i < myHand.getCount(); ++i) {
                    let cardSprite = myHand.getCardSpriteAt(i);
                    if(cardSprite != null) {
                        let toX = gameDetails.deckX, toY = gameDetails.deckY, duration = 500;
                        _this.addTween(cardSprite, toX, toY, duration);

                        console.log("Disable Body 1: Inside won_round.");
                        cardSprite.disableBody(true, true);
                    }
                }
                myHand.emptyHand();

                // Destroying previous round's top card.
                console.log("clear() and destroy(): Inside won_round.");
                _this.discardedTopCards.clear(true, true);
                _this.topCardSprite.destroy();

                _this.topDeckCard.disableInteractive();
                _this.oppHandGroup.clear(true, true);
                _this.turnIndicator.destroy();

                // TODO: Next Round will start in 3 2 1....
                //       Error in Cards Placement of that player who has won.
                // Starting new round.
                currentGame.copyData(gameData);
                if(backendResponse.serializedPlayer) {
                    _this.startGameEventConsumer(backendResponse.serializedPlayer);
                }
            }
            else if(status === "won_game") {
                _this.endGame();
                let wonData = backendResponse.wonData;
                let wonUsername = wonData.username;
                let wonScore = wonData.score;
                Game.addScoreToDOM(wonUsername, wonScore);
                alert(`${wonUsername} won with score = ${wonScore}. Start a new game or leave the room.`);
            }
        });
    }

    placeOppHandsOnTable() {
        let _this = this;
        _this.oppHandGroup = _this.physics.add.group();
        let n = currentGame.getPlayersCount();
        let angle = (2*Math.PI)/(n);
        let btmX = gameDetails.centerX , btmY = gameDetails.centerY + gameDetails.radius;//gameDetails.myHandY;
        let r = gameDetails.radius;

        let allPlayers = currentGame.getPlayers();
        let myIndex = allPlayers.indexOf(me);

        currentGame.coordinatesOfPlayers[me] = [btmX, btmY];
        let theta = angle;
        for (let i = 1; i < n; ++i) {
            let otherIndex = (myIndex + i) % n;
            let otherPlayer = currentGame.players[otherIndex];
            let costheta = Math.cos(theta);
            let sintheta = Math.sin(theta);
            let newX = btmX + (r * sintheta), newY = btmY - (r*(1 - costheta));
            let oppHand = _this.physics.add.sprite(gameDetails.deckX, gameDetails.deckY, "oppHand");
            oppHand.setScale(gameDetails.oppHandScale);
            oppHand.setData({"username": otherPlayer});
            _this.oppHandGroup.add(oppHand);

            currentGame.coordinatesOfPlayers[otherPlayer] = [newX, newY];

            _this.tweens.add({
                targets: oppHand,
                x: newX,
                y: newY,
                duration: 700,
                repeat: 0,
                onComplete: function (){
                    _this.add.bitmapText(newX, newY + 20, "pixelFont", otherPlayer, 20);
                },
                callbackScope: _this
            });
            theta += angle;
        }
    }

    startGameEventConsumer(strigifiedSerializedPlayer) {
        let _this = this;
        let serializedPlayer = JSON.parse(strigifiedSerializedPlayer);
        let serverHand = serializedPlayer.hand;
        for(let i = 0; i < serverHand.length; ++i) {
            let cardInHand = serverHand[i];
            let category = cardInHand.category, number = cardInHand.number;
            let cardObject = new Card(category, number);
            let x  = gameDetails.deckX, y = gameDetails.deckY;
            let depth = i+1, scale = gameDetails.myHandScale;
            let cardSprite = _this.getCardSprite(cardObject, x, y, depth, scale);
            myHand.addCardAndCardSprite(cardObject, cardSprite);
        }
        _this.maxTopCardDepth = -1;
        _this.startGame();

        // Placing opponent's hands on the table.
        _this.placeOppHandsOnTable();

        // Setting Turn Indicator.
        _this.moveOrSetTurnIndicator(false);
    }

    playCardEventConsumer(data) {
        let _this = this;
        // Called when play_card event is encountered.

        let username_ = data.username;
        let playedCard = data.card; // Used if opponent has played the card.
        let index = data.index; // Used if current player has played the card.
        let playedCardObject = new Card(playedCard.category, playedCard.number);

        if(username_ === me) {
            // Current Player plays a card.
            console.log(JSON.parse(JSON.stringify(myHand.cards)));
            console.log("Index of played card in create(): ", index);
            _this.playCardSelf(index);
        } else {
            // Opponent plays a card.
            _this.playCardOpp(playedCardObject);
        }

        if(currentGame.getCurrentPlayer() === me) {
            // Making Hand Interactive for current Player.
            console.log("Making top deck card interactive for draw card.", me);
            currentGame.canDrawCard = true;
            _this.topDeckCard.setInteractive();
            console.log("Making hand interactive for: ", me);
            _this.makeHandInteractive();

            // alert("It's your turn!");
            // _this.moveOrSetTurnIndicator(true);
        }
    }

    giveOptionToPlayOrKeep(drawnCardObject, drawnCardSprite, depth, index) {
        let _this = this;
        // drawnCardSprite.setScale(2 * gameDetails.myHandScale);
        let toX = _this.config.width/2, toY = _this.config.height/2, duration = 1000;
        _this.addTween(drawnCardSprite, toX, toY, duration);
        let playOrKeep = prompt(`You have drawn ${drawnCardObject.number} of ${drawnCardObject.category}. Choose Play or Keep ('P' or 'K')`);
        if(playOrKeep === 'P') { // Play
            currentGame.playCardRequest(drawnCardObject, index);
        }
        else if(playOrKeep === 'K'){ // Keep
            // Setting onclick etc handlers for card.
            _this.drawCardSelf(drawnCardObject, drawnCardSprite, depth, index);
            // Adjusting cards in hand on the table.
            _this.adjustSelfHandOnTable();

            currentGame.keepCardAfterDrawingRequest();
            // TODO: Error in positioning of keep card.
        }
    }


    adjustSelfHandOnTable(skipIndex=-1) {
        let _this = this;
        // To adjust the positioning of cards in Hand on the Table after dealing, playing, drawing, etc.
        if(currentGame.isGameRunning) { // If the Game is Running.
            let activeCardsCount = myHand.getActiveCount();
            if(activeCardsCount > 0) { // If active cards are present in the hand.
                let window = gameDetails.myHandEndX - gameDetails.myHandStartX;
                let incrementValue = window / activeCardsCount;
                let angleIncrementValue = 60 / activeCardsCount;
                let startAngle = -30;
                let toX = gameDetails.myHandStartX, toY = gameDetails.myHandY;
                for(let i = 0; i < myHand.getCount(); ++i) {
                    if(skipIndex !== i) { // If this card doesn't have to be skipped.
                        let card = myHand.getCardAt(i);
                        let cardSprite = myHand.getCardSpriteAt(i);
                        let depth = i + 1;
                        if(card != null && cardSprite != null) {
                            // console.log("Adjusting:", card);
                            let duration = 500;


                            _this.tweens.add({
                                targets: cardSprite,
                                x: toX,
                                y: toY,
                                // angle: startAngle,
                                depth: depth,
                                ease: "Power1",
                                duration: duration, // 1500
                                repeat: 0,
                                onComplete: function () {},
                                callbackScope: _this
                            });

                            // _this.addTween(cardSprite, toX, toY, duration);

                            // cardSprite.depth = depth;
                            //
                            // // Testing Angles,
                            // cardSprite.setAngle(startAngle);


                            if(me !== currentGame.getCurrentPlayer()) {
                                // Making cards Un-Interactive if it is not this player's turn.
                                cardSprite.disableInteractive();
                            }
                            startAngle += angleIncrementValue;
                            depth += 1;
                            toX += incrementValue;
                        }
                    }
                }
            }
        }
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
            console.log("Making Deck interactive for Drawing Card: ", me);
            currentGame.canDrawCard = true;
            _this.topDeckCard.setInteractive();
            console.log("Making hand interactive for: ", me);
            _this.makeHandInteractive();

            // alert("It's your turn!");
            // _this.moveOrSetTurnIndicator(false);

        }
    }

    moveOrSetTurnIndicator(isAlreadySet) {
        let _this = this;
        let currentPlayer = currentGame.getCurrentPlayer();
        // console.log("Coordinates: ", currentGame.coordinatesOfPlayers);
        for(let i = 0; i < currentGame.getPlayersCount(); ++i) {
            let player = currentGame.players[i];
            if(currentPlayer === player) {
                console.log("Inside:", player, currentGame.coordinatesOfPlayers[player]);
                let coordinates = currentGame.coordinatesOfPlayers[player];
                let toX = coordinates[0], toY = coordinates[1];
                if(isAlreadySet) {
                    _this.tweens.add({
                        targets: _this.turnIndicator,
                        x: toX - 25,
                        y: toY + 35,
                        repeat: 0,
                        callbackScope: _this
                    });
                }
                else {
                    _this.turnIndicator = _this.physics.add.sprite(toX - 25, toY + 35, "turnIndicator");
                    _this.turnIndicator.depth = 20;
                    _this.turnIndicator.setScale(0.05);
                    _this.turnIndicator.play("yourTurnAnim");
                }
            }
        }
    }

    placeTopCard() {
        let _this = this;
        let x = _this.deckX, y = _this.deckY, depth = 0, scale = gameDetails.myHandScale;
        let toX = gameDetails.topCardX, toY = gameDetails.topCardY;
        _this.topCardSprite = _this.getCardSprite(currentGame.topCard, x, y, depth, scale);
        _this.maxTopCardDepth += 1;
        _this.topCardSprite.depth = _this.maxTopCardDepth;
        _this.addTween(_this.topCardSprite, toX, toY, 1500);
    }

    dealHand() {
        let _this = this;
        for (let i = 0; i < myHand.getCount(); ++i) {
            let card = myHand.getCardAt(i);
            let cardSprite = myHand.getCardSpriteAt(i);
            if(card != null && cardSprite != null) {
                let depth = i + 1;
                _this.drawCardSelf(card, cardSprite, depth, i);
            }
        }

        //Adjusting cards in hand present on the table.
        _this.adjustSelfHandOnTable();
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
        let playedCard = myHand.getCardAt(index);
        let playedCardSprite = myHand.getCardSpriteAt(index);

        if(playedCard != null && playedCardSprite != null) {
            let x = gameDetails.topCardX, y = gameDetails.topCardY, duration = 1000;

            // Removing card and cardSprite from Hand
            myHand.removeCardAndCardSpriteAt(index);

            // Updating topCard of currentGame
            currentGame.setTopCard(playedCard);

            _this.topCardSprite.destroy();
            _this.discardedTopCards.clear(true, true);

            // Moving played card to Top Card Position.
            // _this.addTween(playedCardSprite, x, y, duration);
            _this.tweens.add({
                targets: playedCardSprite,
                x: x,
                y: y,
                ease: "Power1",
                duration: 700, // 1500
                repeat: 0,
                onComplete: function () {
                    // Destroying playedCardSprite
                    playedCardSprite.destroy();

                    // Generating new cardSprite at TopCard position.
                    let depth = _this.maxTopCardDepth + 1;
                    _this.maxTopCardDepth = depth;
                    _this.topCardSprite = _this.getCardSprite(playedCard, x, y, depth, gameDetails.myHandScale);

                    console.log(`Depth of top Card = ${_this.topCardSprite.depth} | Max Top Card Depth = ${_this.maxTopCardDepth}`);

                    // Adjusting Cards in the Hand present on table.
                    _this.adjustSelfHandOnTable(index);
                },
                callbackScope: _this
            });

        } else {
            console.log("playedCard is null.");
        }
    }

    drawCardSelf(card, cardSprite, depth, index) {
        let _this = this;
        if(card != null && cardSprite != null) {

            cardSprite.on("pointerover", function (pointer) {
                // console.log("Can Play this card: ", card);
                cardSprite.depth = depth + 2;
                cardSprite.y = (gameDetails.myHandY - 15);
            });

            cardSprite.on("pointerout", function (pointer) {
                cardSprite.depth = depth;
                cardSprite.y = gameDetails.myHandY;
            });

            cardSprite.on("pointerdown", function (pointer) {
                console.log("Index of played card inside handler:", index);
                currentGame.playCardRequest(card, index);
            });
        }
    }

    endGame() {
        let _this = this;
        _this.topDeckCard.disableInteractive();

        if(_this.topCardSprite) {
            console.log("Disable Body 3: Inside end_game()");
            _this.topCardSprite.disableBody(true, true);//.destroy();
        }

        _this.discardedTopCards.clear(true, true);
        _this.oppHandGroup.clear(true, true);

        _this.turnIndicator.destroy();

        // Disabling CardSprite in Hand of Player.
        for(let i = 0; i < myHand.getCount(); ++i) {
            let cardSprite = myHand.getCardSpriteAt(i);
            if(cardSprite != null) {
                console.log("Disable Body 4: Inside end_game()");
                cardSprite.disableBody(true, true);
            }
        }
        // Calling endGame() method of Game Class.
        currentGame.endGame();
        // currentGame = null; // Setting currentGame reference to null.
    }

    makeHandInteractive() {
        let _this = this;
        if(currentGame.getCurrentPlayer() === me) {
            let count = myHand.getCount();
            for(let i = 0; i < count; ++i) {
                let card = myHand.getCardAt(i);
                let cardSprite = myHand.getCardSpriteAt(i);
                if(card != null && cardSprite != null) {
                    if(currentGame.canPlay(card)) { // TODO: Remove this if condition if there is any bug.
                        cardSprite.setInteractive();
                    }
                }
            }
        }
    }

     playCardOpp(card) {
        let _this = this;
        // When opponent plays a card.
         console.log("Disable Body 5: Inside playCardOpp().");
        // _this.topCardSprite.disableBody(true, true);
         _this.topCardSprite.destroy();
        let x = gameDetails.oppHandX, y = gameDetails.oppHandY;
        _this.maxTopCardDepth += 1;
        let depth = _this.maxTopCardDepth, scale = gameDetails.myHandScale;
        let playedCardSprite = _this.getCardSprite(card, x, y, depth, scale);

        // Moving card from Opponent's deck to TopCard Place.
        let toX = gameDetails.topCardX, toY = gameDetails.topCardY, duration = 1000;
        _this.addTween(playedCardSprite, toX, toY, duration);

        // Setting as top Card.
        _this.topCardSprite = playedCardSprite;
        // _this.topCardSprite.depth = 0;
         console.log(`Depth of top Card = ${_this.topCardSprite.depth} | Max Top Card Depth = ${_this.maxTopCardDepth}`);
        currentGame.setTopCard(card);
    }

    drawCardOpp() {
        let _this = this;
        // To be called when Opponent draws a card.
        let x = gameDetails.deckX;
        let y = gameDetails.deckY;
        let drawnCard = _this.physics.add.sprite(x, y, "cardBack");
        drawnCard.setScale(gameDetails.oppHandScale);
        drawnCard.depth = 0;

        this.tweens.add({
            targets: drawnCard,
            x: gameDetails.oppHandX,
            y: gameDetails.oppHandY,
            ease: "Power1",
            duration: 500,
            repeat: 0,
            onComplete: function () {
                console.log("Disable body 6: Inside drawCardOpp().");
                drawnCard.disableBody(true, true);
            },
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

    update() {

    }
}