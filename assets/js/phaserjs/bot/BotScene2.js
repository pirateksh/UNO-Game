class BotScene2 extends Phaser.Scene {
    constructor() {
        super("playBotGame");
    }

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

        // Adding Unique ID of Game.
        // _this.uniqueIdTag = _this.add.text(50, game.config.height - 50, `Unique ID: ${currentGame.uniqueId}`);


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

        _this.drewCard = false;

        _this.topDeckCard.on("pointerdown", function (pointer) {
            console.log("Deck card has been clicked.");
            drawCardRequest();
            _this.drewCard = true;
        });

        _this.isGameRunning = false;
        _this.playerHand = [];
        _this.playerHandSprites = _this.physics.add.group();

        socket.addEventListener("message", function (e) {
            console.log("BotScene2 message.");
            let server_response = JSON.parse(e.data);
            
            let let_bot_state = JSON.parse("[" + server_response.bot_state + "]")[0];
            // let_bot_state array contains the card values that bot possess
            
            let let_player_state = JSON.parse("[" + server_response.player_state + "]")[0];
            // let_player_state array contains the card values that the player possess

            // let_bot_game_state array contains only one element i.e. the Top Card Value
            let let_bot_game_state = JSON.parse("[" + server_response.bot_game_state + "]");
            
            let let_playable_cards = server_response.playable_cards;
            // let_playable_cards array contains the card values which are allowed to play for the player

            let let_bot_played_cards = server_response.bot_played_cards;
            // let_bot_played_cards array contains the card values that bot previously played
            console.log("BOT PLAYED THIS", let_bot_played_cards);

            let top_color = server_response.top_color;
            // top_color variable represents the top card color if the bot played a W or WF card
            
            let bot_says_uno = server_response.bot_says_uno;
            // bot_says_uno variable is defined if the bot have yelled UNO
            
            let bot_won = server_response.bot_won;
            // bot_won variable is defined if the bot have won the Match
            
            let player_won = server_response.player_won;
            // player_won variable is defined if the player have won the Match
            
            let choose_to_play_or_keep = server_response.choose_to_play_or_keep;
            // choose_to_play_or_keep variable is defined if the player have choice to Play or keep the Drawn 
            console.log("CHOOSE TO PLAY OR KEEP", choose_to_play_or_keep);
            let drawn_card_val = server_response.drawn_card_val;
            console.log("DRAWN CARD VALUE", drawn_card_val);
            // drawn_card_val variable is defined if the Player played the Drawn Card and it will contain the drawn card value

            if(!_this.isGameRunning) {
                _this.startGame(let_bot_game_state, let_player_state, let_playable_cards);
                _this.isGameRunning = true;
            }
            else {

                _this.playerHand = [];

                if(_this.drewCard) {
                    let drawnCard = parseCard(let_player_state[let_player_state.length - 1]);
                    let x = gameDetails.deckX, y = gameDetails.deckY;
                    let depth = let_player_state.length, scale = gameDetails.myHandScale;
                    let drawnCardSprite = _this.getCardSprite(drawnCard, x, y, depth, scale);
                    console.log("HERE 2");
                    if(choose_to_play_or_keep === undefined) {
                        // This means that player drew a card but could not play it and bot also played a card.
                        _this.tweens.add({
                            targets: drawnCardSprite,
                            x: config.width/2,
                            y: gameDetails.myHandY,
                            duration: 700,
                            onComplete: function () {
                                drawnCardSprite.destroy();
                                _this.playerHandSprites.clear(true, true);
                                _this.dealHand(let_player_state, game.config.width/2, game.config.height/2 + 200);
                                _this.makeHandInteractive(let_playable_cards);
                                _this.botCardPlayHandler(let_player_state, let_bot_played_cards, let_playable_cards, let_bot_game_state);
                            },
                            callbackScope: _this
                        });
                    }
                    else {
                        // Player drew a card and this card can be played, so give option to play or keep.
                        _this.giveOptionToPlayOrKeep(drawnCard, drawnCardSprite, depth, depth - 1);
                    }
                    _this.drewCard = false;
                }
                else {
                    _this.botCardPlayHandler(let_player_state, let_bot_played_cards, let_playable_cards, let_bot_game_state);
                }

                console.log("HERE 3");
            }

            // To print the list of cards that bot posses using array let_bot_state
            for(let i=0;i < let_bot_state.length;i++){
                id_bot_state.append("<li>" + let_bot_state[i] + "</li>");
            }
            // To print the list of cards that bot played previously using array let_bot_played_cards
            for(let i=0;i < let_bot_played_cards.length;i++){
                id_bot_played_cards.prepend("<li><button disabled>" + let_bot_played_cards[i] + "</button></li>");
            }
            // To print the list of cards that player posses by using array let_player_state
            for(let i=0;i < let_player_state.length;i++){
                id_player_state.append("<li>" + let_player_state[i] + "</li>");
            }
            // To print current Top Card by using let_bot_game_state array
            for(let i=0;i < let_bot_game_state.length;i++){
                // console.log(let_bot_game_state[i]);
                id_bot_game_state.append("<li>" + let_bot_game_state[i] + "</li>");
            }

            // Creating Buttons for Allowed Cards using let_player_state array and let_playable_cards array
            for(let i=0;i < let_player_state.length;i++){
                // {#console.log("Checking Card " + let_player_state[i]);#}
                if(let_playable_cards.includes(let_player_state[i])){
                   // {#console.log("An allowed Card " + let_player_state[i]);#}
                    id_playable_cards.append(function(){
                        return $("<button style='margin: 10px' id="+i+" >" + let_player_state[i] + "</button>");
                    });

                    let current_button = document.getElementById(i);
                    let text = current_button.innerHTML;
                    // {#console.log("text is :" + text);#}
                    current_button.addEventListener('click', send_card_play_request, false);
                    current_button.myParam = text;
                }
            }

            // top_color is defined => Bot Played W or WF => new Top Card COLOR is set to top_color
            if(top_color !== undefined && top_color !== null){
                alert("The top Color is: " + top_color);
            }
            if(bot_says_uno === 1){
                alert("BOT: UUUNNNOOOOO!!")
            }
            if(bot_won === 1){
                alert("BOT Won the Game! Ending this Game...");
                $('#END_GAME').click();
            }
            if(player_won === 1){
                alert("Congrats!!! You Won the Game! Ending this Game...");
                $('#END_GAME').click();
            }
        });
    }

    botCardPlayHandler(let_player_state, let_bot_played_cards, let_playable_cards, let_bot_game_state) {
        let _this = this;
        let handIndex = let_player_state.length - 1;

        for(let i = 0; i < let_bot_played_cards.length; ++i) {
            let playedCardString = let_bot_played_cards[i];
            if(playedCardString !== "DRAW_CARD") {
                let playedCard = parseCard(let_bot_played_cards[i]);
                if(playedCard.category === WILD_FOUR) {
                    // console.log("Bot Played WILD FOUR");
                    handIndex -= 4;
                }
                else if(playedCard.number === DRAW_TWO) {
                    // console.log("Bot Played DRAW TWO");
                    handIndex -= 2;
                }
            }
        }

        _this.playCardBot(let_bot_played_cards, 0, handIndex, let_player_state, let_playable_cards);

        if(let_bot_played_cards.length === 0) {
            let newTopCard = parseCard(let_bot_game_state[0]);
            let x = gameDetails.topCardX, y = gameDetails.topCardY;
            let depth = 0, scale = gameDetails.myHandScale;
            _this.topCardSprite = _this.getCardSprite(newTopCard, x, y, depth, scale);
        }
    }

    playCardBot(let_bot_played_cards, index, playerHandIndex, let_player_state, let_playable_cards) {
        let _this = this;
        if(index === let_bot_played_cards.length) {
            _this.playerHandSprites.clear(true, true);
            _this.dealHand(let_player_state, game.config.width/2, game.config.height/2 + 200);
            _this.makeHandInteractive(let_playable_cards);
            return;
        }
        let playedCardString = let_bot_played_cards[index];
        if(playedCardString !== "DRAW_CARD") {
            let playedCard = parseCard(let_bot_played_cards[index]);
            let playedCardSprite = _this.getCardSprite(playedCard, gameDetails.botX, gameDetails.botY, 0, gameDetails.myHandScale);
            _this.tweens.add({
                targets: playedCardSprite,
                x: gameDetails.topCardX,
                y: gameDetails.topCardY,
                duration: 1000,
                depth: _this.topCardSprite.depth + 1,
                scale: gameDetails.myHandScale,
                onComplete: function () {
                    _this.topCardSprite.destroy();
                    _this.topCardSprite = playedCardSprite;

                    if(playedCard.category === WILD_FOUR) {
                        console.log("Bot Played WILD FOUR");
                        _this.drawCardOnebyOne(playerHandIndex, index, let_bot_played_cards, 4, let_player_state, let_playable_cards);

                    }
                    else if(playedCard.number === DRAW_TWO) {
                        console.log("Bot Played DRAW TWO", playerHandIndex, let_player_state);
                        _this.drawCardOnebyOne(playerHandIndex, index, let_bot_played_cards, 2, let_player_state, let_playable_cards);
                    }
                    else {
                        _this.playCardBot(let_bot_played_cards, index + 1, playerHandIndex, let_player_state, let_playable_cards);
                    }
                },
                callbackScope: _this,
            });
        }
        else {
            // To be called when Opponent draws a card.
            let x = gameDetails.deckX, y = gameDetails.deckY;
            let botX = gameDetails.centerX , botY = gameDetails.centerY - gameDetails.radius;
            let drawnCard = _this.physics.add.sprite(x, y, "cardBack");
            drawnCard.setScale(gameDetails.oppHandScale);
            drawnCard.depth = 0;

            // Adjusting card count of bot.
             let cardCount = parseInt(_this.botCardCount.text);
             cardCount += 1;
             _this.botCardCount.text = cardCount;

            this.tweens.add({
                targets: drawnCard,
                x: botX,
                y: botY,
                ease: "Power1",
                duration: 1000,
                repeat: 0,
                onComplete: function () {
                    drawnCard.destroy();
                    _this.playCardBot(let_bot_played_cards, index + 1, playerHandIndex, let_player_state, let_playable_cards);
                },
                callbackScope: _this
            });
        }
    }

    drawCardOnebyOne(handIndex, index, let_bot_played_cards, count, let_player_state, let_playable_cards) {
        let _this = this;
        if(count === 0) {
            _this.playCardBot(let_bot_played_cards, index + 1, handIndex, let_player_state, let_playable_cards);
            console.log("HERE 4");
            return;
        }
        let card = parseCard(let_player_state[handIndex]);
        let x = gameDetails.deckX, y = gameDetails.deckY;
        let scale = gameDetails.myHandScale;
        let cardSprite = _this.getCardSprite(card, x, y, handIndex + 1, scale);
        _this.playerHandSprites.add(cardSprite);
        _this.tweens.add({
            targets: cardSprite,
            x: game.config.width/2,
            y: gameDetails.myHandY,
            duration: 700,
            onComplete: function () {
                _this.drawCardOnebyOne(handIndex+1, index, let_bot_played_cards, count-1, let_player_state, let_playable_cards);
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

        for(let i = 0; i < _this.playerHand.length - 1; ++i) { // Not dimming the just drawn card which is already included in the hand.
            let cardSprite = _this.playerHandSprites.getChildren()[i];
            if(cardSprite != null) {
                cardSprite.alpha = dimAlpha;
            }
        }

        for(let i = 0; i < _this.deck.getChildren().length; ++i) {
            let deckCardSprite = _this.deck.getChildren()[i];
            deckCardSprite.alpha = dimAlpha;
        }

        _this.botHand.alpha = dimAlpha;

        _this.topCardSprite.alpha = dimAlpha;

        // _this.turnIndicator.alpha = dimAlpha;
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

    placeBotHandsOnTable() {
        let _this = this;

        let botX = gameDetails.centerX , botY = gameDetails.centerY - gameDetails.radius;
        _this.botHand = _this.physics.add.sprite(gameDetails.deckX, gameDetails.deckY, "oppHand");
        _this.botHand.setScale(gameDetails.oppHandScale);

        _this.tweens.add({
            targets: _this.botHand,
            x: gameDetails.botX,
            y: gameDetails.botY,
            duration: 700,
            repeat: 0,
            onComplete: function () {
                _this.botCardCount = _this.add.text(botX + 50, botY, "7", {fontSize: 25, backgroundColor: "0x000000"});
                // Adding Challenge Button
                let challengeButton = _this.physics.add.sprite(botX + 40, botY + 50, "challengeButton");
                challengeButton.setInteractive();
                challengeButton.setScale(gameDetails.roundButtonScale);
                challengeButton.on("pointerover", function (pointer) {
                    challengeButton.play("challengeButtonOver");
                });
                challengeButton.on("pointerout", function (pointer) {
                    challengeButton.play("challengeButtonOut");
                });
                challengeButton.on("pointerdown", function (pointer) {
                    // currentGame.catchPlayerRequest(socket, otherPlayer);
                });
            },
            callbackScope: _this
        });
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
                noButton.depth = _this.playerHand.length + 1;
                let yesButton = _this.physics.add.sprite(yesX, yesY, "yesButton");
                yesButton.setScale(0.85);
                yesButton.depth = _this.playerHand.length + 1;

                noButton.setInteractive();
                yesButton.setInteractive();

                noButton.on("pointerover", function (pointer) {
                    noButton.play("noButtonOver");
                });

                noButton.on("pointerout", function (pointer) {
                    noButton.play("noButtonOut");
                });

                noButton.on("pointerdown", function (pointer) {
                    _this.tweens.add({
                        targets: drawnCardSprite,
                        x: game.config.width/2,
                        y: gameDetails.myHandY,
                        scale: gameDetails.myHandScale,
                        onComplete: function () {
                            drawnCardSprite.destroy();
                            keepCardRequest(drawnCardObject);
                        },
                        callbackScope: _this,
                    });
                    yesButton.destroy();
                    noButton.destroy();

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
                    _this.topCardSprite.destroy();
                    _this.topCardSprite = drawnCardSprite;
                    _this.topCardSprite.depth = 0;

                    if(drawnCardObject.category === "W" || drawnCardObject.category === "WF") {
                        _this.chooseColorOfWildCards(drawnCardSprite, drawnCardObject, index);
                    }
                    else {
                        _this.tweens.add({
                            targets: drawnCardSprite,
                            x: gameDetails.topCardX,
                            y: gameDetails.topCardY,
                            duration: 700,
                            scale: gameDetails.myHandScale,
                            onComplete: function () {
                                cardPlayRequest(drawnCardObject, "");
                                drawnCardSprite.destroy();
                            },
                            callbackScope: _this,
                        });

                        // Brightening Background
                        _this.dimOrBrightBackground(false);
                    }
                });
            },
            callbackScope: _this
        });
        // TODO: Error in positioning and playing of keep card.
    }

    chooseColorOfWildCards(drawnCardSprite, drawnCardObject, index) {
        let _this = this;
        _this.chooseColorText = _this.add.image(_this.config.width/2, _this.config.height/2 - 150, "chooseAColor");
        _this.blueButton = _this.add.sprite(_this.config.width/2 - 150, _this.config.height/2 + 20, "chooseBlueButton");
        _this.greenButton = _this.add.sprite(_this.config.width/2 - 50, _this.config.height/2 + 20, "chooseGreenButton");
        _this.redButton = _this.add.sprite(_this.config.width/2 + 50, _this.config.height/2 + 20, "chooseRedButton");
        _this.yellowButton = _this.add.sprite(_this.config.width/2 + 150, _this.config.height/2 + 20, "chooseYellowButton");
        let depth = _this.playerHand.length + 1;
        _this.chooseColorText.depth = depth;
        _this.blueButton.depth = depth;
        _this.greenButton.depth = depth;
        _this.redButton.depth = depth;
        _this.yellowButton.depth = depth;

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

            _this.tweens.add({
                targets: drawnCardSprite,
                x: gameDetails.topCardX,
                y: gameDetails.topCardY,
                duration: 700,
                scale: gameDetails.myHandScale,
                onComplete: function () {
                    cardPlayRequest(drawnCardObject, "B");
                },
                callbackScope: _this,
            });

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
            _this.tweens.add({
                targets: drawnCardSprite,
                x: gameDetails.topCardX,
                y: gameDetails.topCardY,
                duration: 700,
                scale: gameDetails.myHandScale,
                onComplete: function () {
                    cardPlayRequest(drawnCardObject, "G");
                },
                callbackScope: _this,
            });

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

            _this.tweens.add({
                targets: drawnCardSprite,
                x: gameDetails.topCardX,
                y: gameDetails.topCardY,
                duration: 700,
                scale: gameDetails.myHandScale,
                onComplete: function () {
                    cardPlayRequest(drawnCardObject, "R");
                },
                callbackScope: _this,
            });

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

            _this.tweens.add({
                targets: drawnCardSprite,
                x: gameDetails.topCardX,
                y: gameDetails.topCardY,
                duration: 700,
                scale: gameDetails.myHandScale,
                onComplete: function () {
                    cardPlayRequest(drawnCardObject, "Y");
                },
                callbackScope: _this,
            });

            // Brightening Background
            _this.dimOrBrightBackground(false);
        });
    }

    adjustSelfHandOnTable(skipIndex=-1) {
        let _this = this;
        // To adjust the positioning of cards in Hand on the Table after dealing, playing, drawing, etc.
        let cardsCount = _this.playerHand.length;
        if(cardsCount > 0) { // If active cards are present in the hand.
            let window = gameDetails.myHandEndX - gameDetails.myHandStartX;
            let incrementValue = window / cardsCount;

            let toX = gameDetails.myHandStartX, toY = gameDetails.myHandY;
            for(let i = 0; i < cardsCount; ++i) {
                if(skipIndex !== i) { // If this card doesn't have to be skipped.
                    let card = _this.playerHand[i];
                    let cardSprite = _this.playerHandSprites.getChildren()[i];
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
                        toX += incrementValue;
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

    startGame(let_bot_game_state, let_player_state, let_playable_cards) {
        let _this = this;

        _this.placeTopCard(let_bot_game_state); // Placing Top Card
        _this.dealHand(let_player_state, gameDetails.deckX, gameDetails.deckY); // Dealing Hands

        // Placing opponent's hands on the table.
        _this.placeBotHandsOnTable();

        _this.makeHandInteractive(let_playable_cards);
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

    placeTopCard(let_bot_game_state) {
        let _this = this;
        _this.topCard = parseCard(let_bot_game_state[0]);
        let x = _this.deckX, y = _this.deckY, depth = 0, scale = gameDetails.myHandScale;
        let toX = gameDetails.topCardX, toY = gameDetails.topCardY;
        _this.topCardSprite = _this.getCardSprite(_this.topCard, x, y, depth, scale);
        _this.maxTopCardDepth += 1;
        _this.topCardSprite.depth = 0;//_this.maxTopCardDepth;
        _this.addTween(_this.topCardSprite, toX, toY, 1500);
    }

    dealHand(let_player_state, x, y) {
        let _this = this;
        for(let i = 0; i < let_player_state.length; ++i) {
            let cardString = let_player_state[i];
            let card = parseCard(cardString);
            let depth = i + 1, scale = gameDetails.myHandScale;
            let cardSprite = _this.getCardSprite(card, x, y, depth, scale);
            _this.playerHandSprites.add(cardSprite);
            _this.playerHand.push(card);
            _this.setEventsOnCard(card, cardSprite, depth, depth - 1);
        }

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

    setEventsOnCard(card, cardSprite, depth, index) {
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
                _this.topCardSprite.destroy();
                _this.topCardSprite = cardSprite;
                _this.topCardSprite.depth = 0;
                if(card.category === "W" || card.category === "WF") {
                    // Dimming Background
                    _this.dimOrBrightBackground(true);
                    _this.chooseColorOfWildCards(cardSprite, card, index);
                }
                else {

                    _this.tweens.add({
                        targets: cardSprite,
                        x: gameDetails.topCardX,
                        y: gameDetails.topCardY,
                        duration: 700,
                        scale: gameDetails.myHandScale,
                        onComplete: function () {
                            cardPlayRequest(card, "");
                        },
                        callbackScope: _this,
                    });

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



    makeHandInteractive(let_playable_cards) {
        let _this = this;
        _this.topDeckCard.setInteractive();
        let playableCards = [];
        for(let i = 0; i < let_playable_cards.length; ++i) {
            let cardString = let_playable_cards[i];
            let card = parseCard(cardString);
            playableCards.push(card);
        }
        let playableIndex = 0;

        let count = _this.playerHand.length;
        for(let i = 0; i < count && playableIndex < playableCards.length; ++i) {
            let card = _this.playerHand[i];
            let cardSprite = _this.playerHandSprites.getChildren()[i];
            if(isEqual(playableCards[playableIndex], card)) {
                cardSprite.setInteractive();
                playableIndex++;
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

    drawCardBot() {
        let _this = this;
        // To be called when Opponent draws a card.
        let x = gameDetails.deckX, y = gameDetails.deckY;
        let botX = gameDetails.centerX , botY = gameDetails.centerY - gameDetails.radius;
        let drawnCard = _this.physics.add.sprite(x, y, "cardBack");
        drawnCard.setScale(gameDetails.oppHandScale);
        drawnCard.depth = 0;

        // Adjusting card count of bot.
         let cardCount = parseInt(_this.botCardCount.text);
         cardCount += 1;
         _this.botCardCount.text = cardCount;

        this.tweens.add({
            targets: drawnCard,
            x: botX,
            y: botY,
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
        let number = parseInt(card.number);
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