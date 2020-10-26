class Scene2 extends Phaser.Scene {
    constructor() {
        super("playGame");
    }
    /*
    * TODO: -- Kshitiz.
    *  1. Implement Illegal Wild Four Draw / Challenging when a Wild Four is Drawn.
    *  2. Try to implement a game tour for new players.
    *  3. Show current top color after wild and wild four.
    *  4. Can make customizable cards available to players of certain league.
    * */
    create() {
        let _this = this;
        _this.config = game.config;
        let config = _this.config;

        _this.starfield2 = _this.add.tileSprite(0, 0, game.config.width, game.config.height, "starfield_2");
        _this.starfield2.setOrigin(0,0);


        let FKey = this.input.keyboard.addKey('F');

        FKey.on('down', function () {
            if (this.scale.isFullscreen) {
                button.setFrame(0);
                this.scale.stopFullscreen();
            }
            else {
                button.setFrame(1);
                this.scale.startFullscreen();
            }

        }, this);

        let button = _this.add.image(game.config.width-16, 16, 'fullscreen', 0).setOrigin(1, 0).setScale(0.5).setInteractive();

        button.on('pointerup', function () {
            if (_this.scale.isFullscreen) {
                button.setFrame(0);
                _this.scale.stopFullscreen();
            }
            else {
                button.setFrame(1);
                _this.scale.startFullscreen();
            }
        }, _this);


        _this.videoX = 90;
        _this.videoY = 90;
        _this.videoGroup = [];
        _this.labelGroup = _this.physics.add.group();
        _this.graphicsGroup = _this.physics.add.group();
        _this.streamDict = _this.scene.get("bootGame").streamDict;

        for(let label in _this.streamDict) {
            if(_this.streamDict.hasOwnProperty(label)) {
                let stream = _this.streamDict[label];
                let vidElem = _this.add.video(_this.videoX, _this.videoY);
                _this.videoY += 105;
                vidElem.loadURL("", 'loadeddata', false);
                vidElem.video.srcObject = stream;
                vidElem.video.addEventListener('loadedmetadata', () => {
                    vidElem.video.play();
                    vidElem.depth = 0;
                    vidElem.setData({"username": label});
                    vidElem.setScale(gameDetails.liveFeedScale);
                    _this.videoGroup.push(vidElem);
                    vidElem.setData({"username": label});
                });

                addLabelOnLiveFeed(_this, vidElem, label);

                if(label === me){
                    vidElem.video.muted = true;
                }
            }
        }

        _this.timeRemainingToSkip = gameDetails.timeOutLimitInSeconds;
        _this.timeRemainingCounter =_this.add.bitmapText(_this.config.width - 50, _this.config.height - 50, "pixelFont", _this.timeRemainingToSkip, 50);

        // Adding exit button
        _this.exitButton = _this.physics.add.sprite(gameDetails.exitButtonX, gameDetails.exitButtonY, "exitButton");
        _this.exitButton.setScale(gameDetails.roundButtonScale);
        _this.exitButton.setInteractive();
        _this.exitButton.on("pointerout", function (pointer) {
            _this.exitButton.play("exitButtonOut");
        });

        _this.exitButton.on("pointerover", function (pointer) {
            _this.exitButton.play("exitButtonOver");
        });

        _this.exitButton.on("pointerdown", function (pointer) {
            // alert("Do you really want to exit?");
            currentGame.leaveGameRequest(socket);
            _this.scene.start("endGame");
        });

        if(me === currentGame.adminUsername  && currentGame.gameType === Game.FRIEND) {
            // Adding cross button
            _this.crossButton = _this.physics.add.sprite(gameDetails.crossButtonX, gameDetails.crossButtonY, "crossButton");
            _this.crossButton.setScale(gameDetails.roundButtonScale);
            _this.crossButton.setInteractive();
            _this.crossButton.on("pointerout", function (pointer) {
                _this.crossButton.play("crossButtonOut");
            });

            _this.crossButton.on("pointerover", function (pointer) {
                _this.crossButton.play("crossButtonOver");
            });

            _this.crossButton.on("pointerdown", function (pointer) {
                // alert("Do you really want to end the game?");
                currentGame.endGameRequest(socket);
            });
        }

        // Adding Unique ID of Game.
        _this.uniqueIdTag = _this.add.text(50, game.config.height - 50, `Unique ID: ${currentGame.uniqueId}`);

        _this.unoButton = _this.physics.add.sprite(gameDetails.unoButtonX, gameDetails.unoButtonY, "unoButton");
        _this.unoButton.setInteractive();
        _this.unoButton.setScale(gameDetails.unoButtonScale);
        _this.unoButton.on("pointerover", function (pointer) {
            _this.unoButton.play("unoButtonOver");
        });

        _this.unoButton.on("pointerout", function (pointer) {
            _this.unoButton.play("unoButtonOut");
        });

        _this.unoButton.on("pointerdown", function (pointer) {
            currentGame.callUnoRequest(socket);
        });

        _this.deck = _this.physics.add.group();
        _this.discardedTopCards = _this.physics.add.group();
        _this.maxTopCardDepth = -1;

        _this.playerNameBitMap =  _this.physics.add.group();
        _this.playerRemainingCardsCountBitMap = _this.physics.add.group();
        _this.challengeButtons = _this.physics.add.group();

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

        _this.topDeckCard.on("pointerover", function (pointer) {
            _this.topDeckCard.y = gameDetails.deckY + 20;
        });

        _this.topDeckCard.on("pointerout", function (pointer) {
            _this.topDeckCard.y = gameDetails.deckY;
        });

        _this.topDeckCard.on("pointerdown", function (pointer) {
            console.log("Deck card has been clicked.");
            currentGame.drawCardRequest(socket); ////
        });

        socket.addEventListener("message", function (e) {
            let backendResponse = JSON.parse(e.data);
            let status = backendResponse.status;
            let message = backendResponse.message;
            let data = backendResponse.data;
            let gameData;
            if(backendResponse.gameData) {
                gameData = JSON.parse(backendResponse.gameData);
            }

            if(status === "connected") {
                console.log("Connected from Scene 2.");
            }
            if(status === "start_game") {

                if(status === "start_game") {
                    console.log("Start Game From Scene 2");
                }
                currentGame.copyData(gameData);

                _this.startTimer();

                _this.startGameEventConsumer(backendResponse.serializedPlayer);

                if(me !== currentGame.getCurrentPlayer()) {
                    _this.topDeckCard.disableInteractive();
                }
            }
            else if (status === "end_game") {
                _this.endGame();
                // _this.scene.start("bootGame");
                currentGame.changeSceneRequest(socket, 3);
            }
            else if(status === "play_card") {
                currentGame.copyData(gameData);

                _this.startTimer();

                _this.playCardEventConsumer(backendResponse, false);

                if(me !== currentGame.getCurrentPlayer()) {
                    _this.topDeckCard.disableInteractive();
                }

                _this.moveOrSetTurnIndicator(true);
            }
            else if(status === "forced_draw_card") {
                // When someone played DRAW TWO or WILD FOUR card.

                // Play the Card.
                currentGame.copyData(gameData);

                _this.startTimer();

                _this.playCardEventConsumer(backendResponse, false);

                // Draw card for next player.
                let forcedDrawData = backendResponse.forcedDrawData;
                let username = forcedDrawData.username;
                let drawnCards = JSON.parse(forcedDrawData.drawnCards);
                let drawnCardCount = forcedDrawData.drawnCardCount;
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
                    for(let i = 0; i < parseInt(drawnCardCount); ++i) {
                        _this.drawCardOpp(username);
                    }
                }

                if(me !== currentGame.getCurrentPlayer()) {
                    _this.topDeckCard.disableInteractive();
                }

                _this.moveOrSetTurnIndicator(true);
            }
            else if(status === "voluntary_draw_card") {
                // TODO: Bug when player drew WILD FOUR. Look into it.
                currentGame.copyData(gameData);

                _this.startTimer();

                let voluntaryDrawData = backendResponse.voluntaryDrawData;
                let username = voluntaryDrawData.username;
                let drawnCard = JSON.parse(voluntaryDrawData.drawnCard);
                if(username === me) { // The player who drew the card.
                    currentGame.canDrawCard = false;
                    _this.topDeckCard.disableInteractive();
                    let category = drawnCard.category, number = drawnCard.number;
                    let drawnCardObject = new Card(category, number);
                    let x = gameDetails.deckX, y = gameDetails.deckY;
                    let depth = myHand.getCount() + 1, scale = gameDetails.myHandScale;
                    let index = myHand.getCount();
                    let drawnCardSprite = _this.getCardSprite(drawnCardObject, x, y, depth, scale);
                    myHand.addCardAndCardSprite(drawnCardObject, drawnCardSprite);
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
                    _this.drawCardOpp(username);
                }

                if(me !== username) {
                    // Making Hand Interactive for current Player.
                    _this.makeHandInteractive();
                }

                if(me !== currentGame.getCurrentPlayer()) {
                    _this.topDeckCard.disableInteractive();
                }

                _this.moveOrSetTurnIndicator(true);
            }
            else if(status === "keep_card") {
                currentGame.copyData(gameData);

                _this.startTimer();

                _this.makeHandInteractive();

                if(me !== currentGame.getCurrentPlayer()) {
                    _this.topDeckCard.disableInteractive();
                }

                _this.moveOrSetTurnIndicator(true);
            }
            else if(status === "won_round") { // TODO: Add timer or not. -- Kshitiz
                _this.playCardEventConsumer(backendResponse, true);
            }
            else if(status === "won_game") {
                _this.endGame();
                let wonData = backendResponse.wonData;
                let wonUsername = wonData.username;
                let wonScore = wonData.score;
                // Game.addScoreToDOM(wonUsername, wonScore);
                alert(`${wonUsername} won with score = ${wonScore}. Start a new game or leave the room.`);
                currentGame.changeSceneRequest(socket, 3);
            }
            else if(status === "call_uno") {
                let username = data.username;
                if(username !== me) {
                    alert(`${username} called UNO!`);
                }
            }
            else if(status === "failed_call_uno") {
                let username = data.username;
                if(username === me) {
                    alert("You UNO Call failed!");
                }
            }
            else if(status === "catch_player") {
                let catcher = data.catcher;
                let caught = data.caught;
                let caughtData = backendResponse.caughtData;

                if(caught === me) {
                let drawnCards = JSON.parse(caughtData.drawnCards);
                console.log("CAUGHT", catcher, caught, caughtData);
                    alert(`You were caught by ${catcher}.`);
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
                    alert(`${catcher} caught ${caught}.`);
                    for(let i = 0; i < 2; ++i) { // Only two cards are drawn in this case.
                        _this.drawCardOpp(caught);
                    }
                }
            }
            else if(status === "failed_catch_player") {
                let catcher = data.catcher;
                let caught = data.caught;
                if(catcher === me) {
                    alert(`Your catch request failed. Probably ${caught} already yelled UNO or ${caught} has more than one card.`)
                }
            }
            if(status === "change_scene") {
                let sceneNumber = data.sceneNumber;
                if(sceneNumber === 3) {
                    _this.scene.start("endGame");
                    socket.close();
                }
            }
            if(status === "time_out") {
                currentGame.copyData(gameData);
                // TODO: Card count is not getting updated.
                _this.startTimer();

                _this.makeHandInteractive();
                let username = data.username;
                let timeOutData = backendResponse.timeOutData;
                alert(`${username} couldn't play card in given time limit. ${username} is penalised with 2 cards.`);
                if(username === me) {
                    let drawnCards = JSON.parse(timeOutData.drawnCards);
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
                    for(let i = 0; i < 2; ++i) {
                        _this.drawCardOpp(username);
                    }
                }

                if(me !== currentGame.getCurrentPlayer()) {
                    _this.topDeckCard.disableInteractive();
                }

                _this.moveOrSetTurnIndicator(true);
            }
            else if(status === "user_left_room") {
                console.log("USER LEFT ROOM.");
                let leftUsername = data.left_user_username;

                if(currentGame.players.includes(leftUsername)) {
                    currentGame.players.splice(currentGame.players.indexOf(leftUsername), 1); // TESTING
                }


                if(me !== leftUsername) {
                    for(let i = 0; i < _this.oppHandGroup.getChildren().length; ++i) {
                        let oppPlayerSprite = _this.oppHandGroup.getChildren()[i];
                        let oppUsername = oppPlayerSprite.getData("username");
                        if(oppUsername === leftUsername) {
                            _this.tweens.add({
                                targets: oppPlayerSprite,
                                x: gameDetails.deckX,
                                y: gameDetails.deckY,
                                duration: 700,
                                repeat: 0,
                                onComplete: function () {
                                    oppPlayerSprite.destroy();
                                    alert(`${leftUsername} has left the game. ${leftUsername}'s card will be included into the deck.`);
                                },
                                callbackScope: _this
                            });
                            break;
                        }
                    }
                }

                for(let i = 0; i < _this.videoGroup.length; ++i) {
                    let vidElem = _this.videoGroup[i];
                    let left = vidElem.getData("username");
                    if(left === leftUsername) {
                        console.log(leftUsername, left);
                        _this.videoGroup.splice(i, 1);
                        vidElem.destroy();
                        break;
                    }
                }
                for(let i = 0; i < _this.labelGroup.getChildren().length; ++i) {
                    let labelText = _this.labelGroup.getChildren()[i];
                    let graphics = _this.graphicsGroup.getChildren()[i];
                    let leftPlayerUsername = labelText.getData("username");
                    if(leftUsername === leftPlayerUsername) {
                        labelText.destroy();
                        graphics.destroy();
                        _this.videoY -= 105;
                        break;
                    }
                }

                if (peers[leftUsername]){
                    peers[leftUsername].close();
                    delete peers[leftUsername];
                     if(document.getElementById("div_" + leftUsername)){
                        document.getElementById("div_" + leftUsername).remove();
                     }
                     if(document.getElementById("vid_" + leftUsername)){
                        document.getElementById("vid_" + leftUsername).remove();
                     }
                } else{
                    console.log("Tha hi nhi");
                }
                if(document.getElementById(leftUsername)){
                    document.getElementById(leftUsername).remove();
                }
            }
        });
    }

    startTimer() {
        let _this = this;
        _this.timeRemainingToSkip = 60;// gameDetails.timeOutLimitInSeconds;
        if(_this.timedSkipEvent) {
            _this.timedSkipEvent.remove(false);
        }
        if(currentGame.getCurrentPlayer() === me) {
            console.log("TIMER HAS BEEN STARTED.");
            _this.timedSkipEvent = _this.time.addEvent({
                delay: 1000,
                callback: _this.skipTurn,
                callbackScope: _this,
                loop: true
            });
        }
    }

    skipTurn() {
        let _this = this;
        _this.timeRemainingToSkip--;
        if(_this.timeRemainingToSkip === 0) {
            currentGame.timeOutRequest(socket);
            _this.timedSkipEvent.remove(false);
        }
    }

    dimOrBrightBackground(dim) {
        let _this = this;
        let dimAlpha;
        if(dim) {
            dimAlpha = gameDetails.dimAlpha;
        } else {
            dimAlpha = 1;
        }

        _this.starfield2.alpha = dimAlpha;

        for(let i = 0; i < myHand.getCount() - 1; ++i) { // Not dimming the just drawn card which is already included in the hand.
            let cardSprite = myHand.getCardSpriteAt(i);
            if(cardSprite != null) {
                cardSprite.alpha = dimAlpha;
            }
        }

        for(let i = 0; i < _this.deck.getChildren().length; ++i) {
            let deckCardSprite = _this.deck.getChildren()[i];
            deckCardSprite.alpha = dimAlpha;
        }

        for(let i = 0; i < _this.oppHandGroup.getChildren().length; ++i) {
            let oppHandSprite = _this.oppHandGroup.getChildren()[i];
            oppHandSprite.alpha = dimAlpha;
        }

        _this.topCardSprite.alpha = dimAlpha;

        _this.turnIndicator.alpha = dimAlpha;
    }

    wonRoundEventHandler(backendResponse) {
        let _this = this;
        let wonData = backendResponse.wonData;
        let serializedPlayer = backendResponse.serializedPlayer;
        let gameData = JSON.parse(backendResponse.gameData);
        let wonUsername = wonData.username;
        let wonScore = wonData.score;
        // Game.addScoreToDOM(wonUsername, wonScore);
        alert(`${wonUsername} won with score = ${wonScore}. New round is going to start.`);

        // Emptying Hands.
        let removeCardSpritesArray = [];
        for(let i = 0; i < myHand.getCount(); ++i) {
            let cardSprite = myHand.getCardSpriteAt(i);
            if(cardSprite != null) {
                removeCardSpritesArray.push(cardSprite);
            }
        }

        myHand.emptyHand();

        let toX = gameDetails.deckX, toY = gameDetails.deckY, duration = 700;
        _this.tweens.add({
            targets: removeCardSpritesArray,
            x: toX,
            y: toY,
            duration: duration,
            onComplete: function () { // TODO: Test this
                for(let i = 0; i < removeCardSpritesArray.length; ++i) {
                    removeCardSpritesArray[i].destroy();
                    _this.adjustSelfHandOnTable();
                }
            },
            callbackScope: _this
        });


        // Destroying previous round's top card.
        _this.discardedTopCards.clear(true, true);
        _this.topCardSprite.destroy();

        _this.topDeckCard.disableInteractive();
        _this.oppHandGroup.clear(true, true);
        _this.playerRemainingCardsCountBitMap.clear(true, true);
        _this.turnIndicator.destroy();

        // TODO: Next Round will start in 3 2 1....
        // Starting new round.
        currentGame.copyData(gameData);
        console.log("After Won: ", gameData);
        if(serializedPlayer) {
            _this.startGameEventConsumer(serializedPlayer);
        }
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

        currentGame.coordinatesOfPlayers[me] = [btmX+30, btmY-105];
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
                    // Adding Player's name.
                    let nameBitMap = _this.add.bitmapText(newX, newY + 20, "pixelFont", otherPlayer, 20);
                    _this.playerNameBitMap.add(nameBitMap);

                    // Adding Player's card count.
                    let cardCountBitMap = _this.add.bitmapText(newX + 50, newY, "pixelFont", "7", 30);
                    cardCountBitMap.setData({"username": otherPlayer});
                    _this.playerRemainingCardsCountBitMap.add(cardCountBitMap);

                    // Adding Challenge Button
                    let challengeButton = _this.physics.add.sprite(newX + 40, newY + 50, "challengeButton");
                    challengeButton.setInteractive();
                    challengeButton.setScale(gameDetails.roundButtonScale);
                    challengeButton.setData({"username": otherPlayer});
                    challengeButton.on("pointerover", function (pointer) {
                        challengeButton.play("challengeButtonOver");
                    });
                    challengeButton.on("pointerout", function (pointer) {
                        challengeButton.play("challengeButtonOut");
                    });
                    challengeButton.on("pointerdown", function (pointer) {
                        currentGame.catchPlayerRequest(socket, otherPlayer);
                    });

                    _this.challengeButtons.add(challengeButton);

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

        // Setting Turn Indicator.
        _this.moveOrSetTurnIndicator(false);
    }

    playCardEventConsumer(backendResponse, won) {
        let _this = this;
        // Called when play_card event is encountered.
        let data = backendResponse.data;
        let username_ = data.username;
        let playedCard = data.card; // Used if opponent has played the card.
        let index = data.index; // Used if current player has played the card.
        let playedCardObject = new Card(playedCard.category, playedCard.number);

        if(username_ === me) {
            // Current Player plays a card.
            _this.playCardSelf(backendResponse, index, won);
        } else {
            // Opponent plays a card.
            _this.playCardOpp(backendResponse, playedCardObject, username_, won);
        }
    }

    giveOptionToPlayOrKeep(drawnCardObject, drawnCardSprite, depth, index) {
        let _this = this;

        // Dimming Background
        _this.dimOrBrightBackground(true);

        drawnCardSprite.setScale(1.5 * gameDetails.myHandScale);
        drawnCardSprite.depth = _this.maxTopCardDepth + 1;
        let toX = _this.config.width/2, toY = _this.config.height/2 - 100, duration = 700;
        _this.tweens.add({
            targets: drawnCardSprite,
            x: toX,
            y: toY,
            duration: duration,
            repeat: 0,
            onComplete: function () {
                let noX = _this.config.width/2 - 85, noY = _this.config.height/2 + 100;
                let yesX = _this.config.width/2 + 85, yesY = _this.config.height/2 + 100;
                let noButton = _this.physics.add.sprite(noX, noY, "noButton");
                noButton.setScale(0.85);
                noButton.depth = myHand.getCount() + 1;
                let yesButton = _this.physics.add.sprite(yesX, yesY, "yesButton");
                yesButton.setScale(0.85);
                yesButton.depth = myHand.getCount() + 1;

                noButton.setInteractive();
                yesButton.setInteractive();

                noButton.on("pointerover", function (pointer) {
                    noButton.play("noButtonOver");
                });

                noButton.on("pointerout", function (pointer) {
                    noButton.play("noButtonOut");
                });

                noButton.on("pointerdown", function (pointer) {
                    currentGame.keepCardAfterDrawingRequest(socket, drawnCardObject);
                    yesButton.destroy();
                    noButton.destroy();

                    drawnCardSprite.setScale(gameDetails.myHandScale);
                    _this.drawCardSelf(drawnCardObject, drawnCardSprite, depth, index);
                    _this.adjustSelfHandOnTable();

                    // Brightening Background
                    _this.dimOrBrightBackground(false);
                });

                yesButton.on("pointerover", function (pointer) {
                    yesButton.play("yesButtonOver");
                });

                yesButton.on("pointerout", function (pointer) {
                    yesButton.play("yesButtonOut");
                });

                yesButton.on("pointerdown", function (pointer) {
                    yesButton.destroy();
                    noButton.destroy();
                    if(drawnCardObject.category === "W" || drawnCardObject.category === "WF") {
                        _this.chooseColorOfWildCards(drawnCardObject, index);
                    }
                    else {
                        currentGame.playCardRequest(socket, drawnCardObject, index, drawnCardObject.category);

                        // Brightening Background
                        _this.dimOrBrightBackground(false);
                    }
                });


            },
            callbackScope: _this
        });
        // TODO: Error in positioning and playing of keep card.
    }

    chooseColorOfWildCards(drawnCardObject, index) {
        let _this = this;
        _this.chooseColorText = _this.add.image(_this.config.width/2, _this.config.height/2 - 150, "chooseAColor");
        _this.blueButton = _this.add.sprite(_this.config.width/2 - 150, _this.config.height/2 + 20, "chooseBlueButton");
        _this.greenButton = _this.add.sprite(_this.config.width/2 - 50, _this.config.height/2 + 20, "chooseGreenButton");
        _this.redButton = _this.add.sprite(_this.config.width/2 + 50, _this.config.height/2 + 20, "chooseRedButton");
        _this.yellowButton = _this.add.sprite(_this.config.width/2 + 150, _this.config.height/2 + 20, "chooseYellowButton");
        _this.chooseColorText.depth = myHand.getCount() + 1;
        _this.blueButton.depth = myHand.getCount() + 1;
        _this.greenButton.depth = myHand.getCount() + 1;
        _this.redButton.depth = myHand.getCount() + 1;
        _this.yellowButton.depth = myHand.getCount() + 1;
        _this.blueButton.setInteractive();
        _this.greenButton.setInteractive();
        _this.redButton.setInteractive();
        _this.yellowButton.setInteractive();
        _this.blueButton.setScale(gameDetails.chooseColorButtonScale);
        _this.greenButton.setScale(gameDetails.chooseColorButtonScale);
        _this.redButton.setScale(gameDetails.chooseColorButtonScale);
        _this.yellowButton.setScale(gameDetails.chooseColorButtonScale);

        _this.blueButton.on("pointerover", function (pointer) {
            _this.blueButton.play("chooseBlueButtonOver");
        });
        _this.blueButton.on("pointerout", function (pointer) {
            _this.blueButton.play("chooseBlueButtonOut");
        });
        _this.blueButton.on("pointerdown", function (pointer) {
            _this.chooseColorText.destroy();
            _this.blueButton.destroy();
            _this.greenButton.destroy();
            _this.redButton.destroy();
            _this.yellowButton.destroy();
            currentGame.playCardRequest(socket, drawnCardObject, index, "B");

            // Brightening Background
            _this.dimOrBrightBackground(false);
        });

        _this.greenButton.on("pointerover", function (pointer) {
            _this.greenButton.play("chooseGreenButtonOver");
        });
        _this.greenButton.on("pointerout", function (pointer) {
            _this.greenButton.play("chooseGreenButtonOut");
        });
        _this.greenButton.on("pointerdown", function (pointer) {
            _this.chooseColorText.destroy();
            _this.blueButton.destroy();
            _this.greenButton.destroy();
            _this.redButton.destroy();
            _this.yellowButton.destroy();
            currentGame.playCardRequest(socket, drawnCardObject, index, "G");

            // Brightening Background
            _this.dimOrBrightBackground(false);
        });

        _this.redButton.on("pointerover", function (pointer) {
            _this.redButton.play("chooseRedButtonOver");
        });
        _this.redButton.on("pointerout", function (pointer) {
            _this.redButton.play("chooseRedButtonOut");
        });
        _this.redButton.on("pointerdown", function (pointer) {
            _this.chooseColorText.destroy();
            _this.blueButton.destroy();
            _this.greenButton.destroy();
            _this.redButton.destroy();
            _this.yellowButton.destroy();
            currentGame.playCardRequest(socket, drawnCardObject, index, "R");

            // Brightening Background
            _this.dimOrBrightBackground(false);
        });

        _this.yellowButton.on("pointerover", function (pointer) {
            _this.yellowButton.play("chooseYellowButtonOver");
        });
        _this.yellowButton.on("pointerout", function (pointer) {
            _this.yellowButton.play("chooseYellowButtonOut");
        });
        _this.yellowButton.on("pointerdown", function (pointer) {
            _this.chooseColorText.destroy();
            _this.blueButton.destroy();
            _this.greenButton.destroy();
            _this.redButton.destroy();
            _this.yellowButton.destroy();
            currentGame.playCardRequest(socket, drawnCardObject, index, "Y");

            // Brightening Background
            _this.dimOrBrightBackground(false);
        });
    }

    adjustSelfHandOnTable(skipIndex=-1) {
        let _this = this;
        // To adjust the positioning of cards in Hand on the Table after dealing, playing, drawing, etc.
        if(currentGame.isGameRunning) { // If the Game is Running.
            let activeCardsCount = myHand.getActiveCount();
            if(activeCardsCount > 0) { // If active cards are present in the hand.
                let window = gameDetails.myHandEndX - gameDetails.myHandStartX;
                let incrementValue = window / activeCardsCount;
                // let angleIncrementValue = 60 / activeCardsCount;
                // let startAngle = -30;
                let toX = gameDetails.myHandStartX, toY = gameDetails.myHandY;
                for(let i = 0; i < myHand.getCount(); ++i) {
                    if(skipIndex !== i) { // If this card doesn't have to be skipped.
                        let card = myHand.getCardAt(i);
                        let cardSprite = myHand.getCardSpriteAt(i);
                        let depth = i + 1;
                        if(card != null && cardSprite != null) {
                            // console.log("Adjusting:", card);
                            let duration = 700;
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

                            if(me !== currentGame.getCurrentPlayer()) {
                                // Making cards Un-Interactive if it is not this player's turn.
                                cardSprite.disableInteractive();
                            }
                            // startAngle += angleIncrementValue;
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

        // Placing opponent's hands on the table.
        _this.placeOppHandsOnTable();

        _this.makeHandInteractive();
    }

    moveOrSetTurnIndicator(isAlreadySet) {
        let _this = this;
        let currentPlayer = currentGame.getCurrentPlayer();
        // console.log("Coordinates: ", currentGame.coordinatesOfPlayers);
        for(let i = 0; i < currentGame.getPlayersCount(); ++i) {
            let player = currentGame.players[i];
            if(currentPlayer === player) {
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
                    _this.turnIndicator.setScale(1.4);
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

    playCardSelf(backendResponse, index, won) {
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

                    if(!won) {
                        // Generating new cardSprite at TopCard position.
                        let depth = _this.maxTopCardDepth + 1;
                        _this.maxTopCardDepth = depth;
                        _this.topCardSprite = _this.getCardSprite(playedCard, x, y, depth, gameDetails.myHandScale);

                        _this.makeHandInteractive();
                        // Adjusting Cards in the Hand present on table.
                        _this.adjustSelfHandOnTable(index);
                    }
                    else if(won) {
                        // Add here csk
                        //  _this.topCardSprite.destroy();
                        _this.wonRoundEventHandler(backendResponse);
                    }
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
                cardSprite.depth = depth + 2;
                cardSprite.y = (gameDetails.myHandY - 15);
            });

            cardSprite.on("pointerout", function (pointer) {
                cardSprite.depth = depth;
                cardSprite.y = gameDetails.myHandY;
            });

            cardSprite.on("pointerdown", function (pointer) {
                if(card.category === "W" || card.category === "WF") {
                    // Dimming Background
                    _this.dimOrBrightBackground(true);
                    _this.chooseColorOfWildCards(card, index);
                }
                else {
                    currentGame.playCardRequest(socket, card, index, card.category);
                }
            });
        }
    }

    endGame() {
        let _this = this;
        _this.topDeckCard.disableInteractive();

        if(_this.topCardSprite) {
            _this.topCardSprite.disableBody(true, true);//.destroy();
        }

        _this.discardedTopCards.clear(true, true);
        _this.oppHandGroup.clear(true, true);
        _this.playerNameBitMap.clear(true, true);
        _this.playerRemainingCardsCountBitMap.clear(true, true);
        _this.challengeButtons.clear(true, true);
        _this.turnIndicator.destroy();

        // Disabling CardSprite in Hand of Player.
        for(let i = 0; i < myHand.getCount(); ++i) {
            let cardSprite = myHand.getCardSpriteAt(i);
            if(cardSprite != null) {
                cardSprite.disableBody(true, true);
            }
        }
        // Calling endGame() method of Game Class.
        currentGame.endGame();
    }

    makeHandInteractive() {
        let _this = this;
        if(currentGame.getCurrentPlayer() === me) {
            currentGame.canDrawCard = true;
            _this.topDeckCard.setInteractive();
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

     playCardOpp(backendResponse, card, oppUsername, won) {
        let _this = this;
        // When opponent plays a card.
         _this.topCardSprite.destroy();
         let oppCoordinates = currentGame.coordinatesOfPlayers[oppUsername];
         let x = oppCoordinates[0], y = oppCoordinates[1];
         _this.maxTopCardDepth += 1;
         let depth = _this.maxTopCardDepth, scale = gameDetails.myHandScale;
         let playedCardSprite = _this.getCardSprite(card, x, y, depth, scale);

         // Adjusting card count of opponents.
         for(let i = 0; i < _this.playerRemainingCardsCountBitMap.getChildren().length; ++i) {
             let countBitmap = _this.playerRemainingCardsCountBitMap.getChildren()[i];
             if(oppUsername === countBitmap.getData("username")) {
                 let cardCount = parseInt(countBitmap.text);
                 cardCount -= 1;
                 countBitmap.text = cardCount;
                 break;
             }
         }

        // Moving card from Opponent's deck to TopCard Place.
        let toX = gameDetails.topCardX, toY = gameDetails.topCardY, duration = 700;
        _this.addTween(playedCardSprite, toX, toY, duration);
        _this.tweens.add({
            targets: playedCardSprite,
            x: toX,
            y: toY,
            repeat: 0,
            onComplete: function () { // rcb
                if(won) {
                    playedCardSprite.destroy();
                    _this.wonRoundEventHandler(backendResponse);
                }
                else {
                    _this.makeHandInteractive();

                    // Setting as top Card.

                    _this.topCardSprite = playedCardSprite;
                    currentGame.setTopCard(card);
                }
            },
            callbackScope: _this
        });
    }

    drawCardOpp(oppUsername) {
        let _this = this;
        // To be called when Opponent draws a card.
        let oppCoordinates = currentGame.coordinatesOfPlayers[oppUsername];
        let toX = oppCoordinates[0], toY = oppCoordinates[1];
        let x = gameDetails.deckX;
        let y = gameDetails.deckY;
        let drawnCard = _this.physics.add.sprite(x, y, "cardBack");
        drawnCard.setScale(gameDetails.oppHandScale);
        drawnCard.depth = 0;

        // Adjusting card count of opponents.
         for(let i = 0; i < _this.playerRemainingCardsCountBitMap.getChildren().length; ++i) {
             let countBitmap = _this.playerRemainingCardsCountBitMap.getChildren()[i];
             if(oppUsername === countBitmap.getData("username")) {
                 let cardCount = parseInt(countBitmap.text);
                 cardCount += 1;
                 countBitmap.text = cardCount;
                 break;
             }
         }

        this.tweens.add({
            targets: drawnCard,
            x: toX,
            y: toY,
            ease: "Power1",
            duration: 700,
            repeat: 0,
            onComplete: function () {
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
        let _this = this;
        _this.timeRemainingCounter.setText(_this.timeRemainingToSkip);
    }
}