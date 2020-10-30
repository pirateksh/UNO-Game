class Scene3 extends Phaser.Scene {
    constructor() {
        super("endGame");
    }

    create() {
        let _this = this;
        _this.config = game.config;
        let config = _this.config;

        // _this.table = _this.add.tileSprite(0, 0, config.width, config.height, "table");
        // _this.table.setOrigin(0,0);

        _this.starfield2 = _this.add.tileSprite(0, 0, game.config.width, game.config.height, "starfield_2");
        _this.starfield2.setOrigin(0,0);


        let FKey = _this.input.keyboard.addKey('F');

        FKey.on('down', function () {
            if (_this.scale.isFullscreen) {
                button.setFrame(0);
                _this.scale.stopFullscreen();
            }
            else {
                button.setFrame(1);
                _this.scale.startFullscreen();
            }
        }, _this);

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

        _this.wonGameData = _this.scene.get("playGame").wonGameData;

        let y = 50;

        if(_this.wonGameData != null) {
            _this.add.text(config.width / 2 - 200, y, "Game has ended! Following are the player's scores:");
            y += 40;
            _this.add.text(config.width / 2 - 180, y, `USERNAME     SCORE     RATING CHANGE`);

            for(let i = 0; i < _this.wonGameData.length; ++i) {
                y += 30;
                let player = _this.wonGameData[i];
                _this.add.text(config.width / 2 - 180, y, `${player.username}     ${player.score}     ${player.rating_change}`);
            }
        }

        let closeIn = _this.add.text(config.width / 2 - 200, y + 40,
            "You will be redirected to Play Now page in ");

        _this.time_ = _this.add.text(closeIn.x, closeIn.y + 40, "10 ");
        _this.add.text(_this.time_.x, _this.time_.y + 30, "seconds.");

        _this.timedEvent = _this.time.addEvent({ delay: 1000, callback: _this.onEvent, callbackScope: _this, loop: true });

        _this.timeRemaining = 10;
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
