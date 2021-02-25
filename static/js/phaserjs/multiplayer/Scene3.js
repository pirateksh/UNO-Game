class Scene3 extends Phaser.Scene {
    constructor() {
        super("endGame");
    }

    preload(){
         // this.load.bitmapFont("pixelFont", `${generatePath("font", "font.png")}`, `${generatePath("font", "font.xml")}`);
        this.load.image("defaultAvatar", `${getDefaultImagePath()}`);
        // this.load.image("trophy", `${generatePath("images", "max_trophy.png")}`);
        // this.load.image("winLogo", `${generatePath("images", "win.png")}`);
    }

    create() {
        let _this = this;
        _this.config = game.config;
        let config = _this.config;

        _this.starfield2 = _this.add.tileSprite(0, 0, game.config.width, game.config.height, "starfield_2");
        _this.starfield2.setOrigin(0,0);

        addFullScreenButton(_this);

        _this.wonGameData = _this.scene.get("playGame").wonGameData;

        if(_this.wonGameData != null) {

            let graphics = this.add.graphics();
            graphics.fillStyle(0x0000CD, 1);

            let gx = game.config.width/2, gy = game.config.height/2 + 25;
            // Draw the Polygon Lines with coordinates.
            let offsetX = 450, offsetY = 270;
            graphics.beginPath();
            graphics.moveTo(gx-offsetX, gy-offsetY);
            graphics.lineTo(gx+offsetX, gy-offsetY);
            graphics.lineTo(gx+offsetX, gy+offsetY);
            graphics.lineTo(gx-offsetX, gy+offsetY);
            graphics.lineTo(gx-offsetX, gy-offsetY);
            // Close the path and fill the shape.
            graphics.closePath();
            graphics.fillPath();

            let usrx = gx-280, scrx = gx-30, ratx = gx+200, entY;

            _this.add.image(gx - 200, gy-220, "trophy").setScale(0.05);
            _this.add.image(gx + 200, gy-220, "trophy").setScale(0.05);

            let scoreCardBitmap = _this.add.bitmapText(gx-100, gy-235, "pixelFont", "SCOREBOARD", 50);
            let usernameBitmap = _this.add.bitmapText(usrx, gy-160, "pixelFont", "USER", 35);
            let playerScoreBitmap = _this.add.bitmapText(scrx, gy-160, "pixelFont", "SCORE", 35);
            let playerRatingChangeBitmap = _this.add.bitmapText(ratx, gy-160, "pixelFont", "RATING CHANGE", 35);

            // entY = gy - 100;
            // _this.add.bitmapText(usrx + 2, entY , "pixelFont", "ankitsang", 30);
            // _this.add.bitmapText(scrx + 8, entY , "pixelFont", "102", 30);
            // _this.add.bitmapText(ratx + 25, entY , "pixelFont", "+500", 30);


            let delY = 300 / (parseInt(_this.wonGameData.length) + 1);

            entY = gy-160 + delY;

            let winImage = _this.add.image(usrx - 85, entY + 10, "winLogo").setScale(0.5);

            _this.tweens.add({
                targets: winImage,
                scale: 0.7,
                duration: 1000,
                ease: 'Linear',
                yoyo: true,
                loop: -1,
                callbackScope: _this
            });
            for(let i = 0; i < _this.wonGameData.length; ++i) {
                let player = _this.wonGameData[i];
                let username = player.username, score = player.score, rating_change = parseInt(player.rating_change);
                if(currentGame.gameType === Game.FRIEND) {
                    // Rating Change should be zero if this is a CUSTOM/FRIEND Game.
                    rating_change = 0;
                }
                if(rating_change > 0) {
                    rating_change = `+${rating_change}`;
                }

                _this.add.bitmapText(usrx + 2, entY, "pixelFont", `${username}`, 25);
                _this.add.bitmapText(scrx + 8, entY, "pixelFont", `${score}`, 25);
                _this.add.bitmapText(ratx + 25, entY, "pixelFont", `${rating_change}`, 25);

                let path = getUserAvatarPath("ankitsang");
                if(doesFileExist(path)) {
                    _this.add.image(usrx-15, entY+8, `avatar_${username}`).setScale(0.3);
                }
                else {
                    _this.add.image(usrx-15, entY+8, "defaultAvatar").setScale(0.12);
                }
                entY += delY;
            }

            // let yy =
            //
            // _this.add.bitmapText(usrx + 2, entY + 50, "pixelFont", "ankitsang", 25);
            // _this.add.bitmapText(scrx + 8, entY + 50, "pixelFont", "102", 25);
            // _this.add.bitmapText(ratx + 25, entY + 50, "pixelFont", "+500", 25);
            // _this.add.text(config.width / 2 - 200, y, "Game has ended! Following are the player's scores:");
            // y += 40;
            // _this.add.text(config.width / 2 - 180, y, `USERNAME     SCORE     RATING CHANGE`);


        }

        let closeIn = _this.add.text(config.width/2 - 200, 13, "Redirecting in", {fontSize: 25, backgroundColor: "0x000000"});

        _this.time_ = _this.add.text(config.width/2 + 23, 13, "30", {fontSize: 25, backgroundColor: "0x000000"});
        _this.add.text(config.width/2 + 62, 13, "seconds.",  {fontSize: 25, backgroundColor: "0x000000"});
        //
        _this.timedEvent = _this.time.addEvent({ delay: 1000, callback: _this.onEvent, callbackScope: _this, loop: true });

        _this.timeRemaining = 30;
    }

    onEvent() {
        let _this = this;
        _this.timeRemaining--;

        if(_this.timeRemaining === 0) {
            window.location.replace(redirectUrl);
            _this.timedEvent.remove(false);
        }
    }

    update() {
        let _this = this;
        _this.time_.setText(_this.timeRemaining);
    }
}
