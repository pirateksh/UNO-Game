const RED = "R", YELLOW = "Y", GREEN = "G", BLUE = "B", WILD = "W", WILD_FOUR = "WF";
const ZERO = 0, ONE = 1, TWO = 2, THREE = 3, FOUR = 4, FIVE = 5, SIX = 6, SEVEN = 7, EIGHT = 8, NINE = 9;
const SKIP = 10, REVERSE = 11, DRAW_TWO = 12;
const NONE = 13;

// constraintObj = {
// 	audio: false,
// 	video: true
// 	// video: {
// 	// 	facingMode: "user",
// 	// }
// };
// const STREAM = navigator.mediaDevices.getUserMedia(constraintObj);
// // const STREAM = navigator.mediaDevices.getUserMedia({video: true, audio: true});
// const peers = {};

let game, gameDetails, socket;
let currentAnimKeys = [];

window.onload = function () {

	let width = 1230, height = 600;

	gameDetails = {
		deckX: width/2 - 100,
		deckY: height/2 - 90,
		deckScale: 0.55,
		myHandStartX: width/2 - 200,
		myHandEndX: width/2 + 200,
		myHandY: height/2 + 183,
		topCardX: width/2,
		topCardY: height/2,
        myHandScale: 1.4,
        oppHandScale: 0.35,
		oppHandX: width/2,
		oppHandY: height/2 - 200,
		centerX: width/2,
		centerY: height/2 - 50,
		radius: 225,
		unoButtonX: width/2,
		unoButtonY: height/2 + 275,
		unoButtonScale: 0.35,
		exitButtonX: 20,
		exitButtonY: 20,
		crossButtonX: 60,
		crossButtonY: 20,
        roundButtonScale: 0.4,
		playButtonScale: 0.3,
        chooseColorButtonScale: 0.5,
        dimAlpha: 0.2,
		timeOutLimitInSeconds: 60,
        liveFeedScale: 0.2,
        uniqueIdX: 50,
        uniqueIdY: height - 50,
        backgroundMusicVolume: 0.3,
        fullScreenButtonX: width - 16,
        fullScreenButtonY: 16,
        userAvatarScale: 0.3,
	};

	let config = {
		type: Phaser.AUTO,
		backgroundColor: 0xffffff,
		// scale: {
		// 	mode: Phaser.Scale.FIT,
		// 	// autoCenter: 1,
		// 	parent: 'id_phaser_game',
		// 	width: width,
		// 	height: height,
		// },
		width: width,
		height: height,
		scene: [Scene1, Scene2, Scene3],
		pixelArt: true,
        audio: {
            disableWebAudio: true
        },
		// Added for Physics Engine
		physics: {
			default: "arcade",
			arcade: {
				debug: false
			}
		}
	};

// Creating new instance of Phaser Game
	game = new Phaser.Game(config);

	resize();
    window.addEventListener("resize", resize, false);
};

function generatePath(folderName, fileName) {
	return `../../../../static/phaser_assets/${folderName}/${fileName}`;
}

function getDefaultImagePath() {
    let ext = "jpg";
    let filename = "default_male";
    return `../../../..${mediaUrl}${filename}.${ext}`;
}

function getUserAvatarPath(username) {
    let ext = "jpg";
    return `../../../..${mediaUrl}img/profile_avatars/${username}/avatar_${username}.${ext}`;
}

function getImagePoint(category, number) {
	let point = 0, mul = 14;
	if (category === "W") return 13;
	else if (category === "WF") return 69;
	if (category === "R") {
		point += 0;
	} else if (category === "Y") {
		point += 1;
	} else if (category === "G") {
		point += 2;
	} else if(category === "B") {
		point += 3;
	}
	point *= mul;
	point += number;
	return point;
}

function checkOriention (orientation, text)
{
    if (orientation === Phaser.Scale.PORTRAIT)
    {
        // ship.alpha = 0.2;
        text.setVisible(true);
    }
    else if (orientation === Phaser.Scale.LANDSCAPE)
    {
        // ship.alpha = 1;
        text.setVisible(false);
    }
}

function resize() {
	// Source: https://stackoverflow.com/a/51530180/11671368
    var canvas = document.querySelector("canvas");
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    var windowRatio = windowWidth / windowHeight;
    var gameRatio = game.config.width / game.config.height;

    if(windowRatio < gameRatio){
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else {
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}

function copyToClipboard(text) {
	navigator.clipboard.writeText(text).then(function() {
		text = "Unique ID has been copied to clipboard.";
		textToSpeech(text);
	}, function(err) {
	    console.log(err);
		text = "Unique ID could not be copied to clipboard.";
		textToSpeech(text);
	});
}

function textToSpeech(text) {
    let msg = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(msg);
}

function addLabelOnLiveFeed(scene, vidElem, label) {
    let _this = scene;
    let scale = gameDetails.liveFeedScale;
    let scaledWidth = 640 * scale;
    let scaledHeight = 480 * scale;
    let labelX = vidElem.x - (scaledWidth/2), labelY = vidElem.y - (scaledHeight/2);

    let labelText;
    if(label === me) {
        labelText =  _this.add.text(labelX, labelY, `${label}(me)`, {backgroundColor: "0xffffff"});
    }
    else {
        labelText = _this.add.text(labelX, labelY, label, {backgroundColor: "0xffffff"});
    }
    labelText.setInteractive();
    labelText.setData({"username": label});
    _this.labelGroup.add(labelText);
    labelText.depth = 1;
    labelText.on("pointerover", function (pointer) {
        document.querySelector("canvas").style.cursor = "pointer";
    }, _this);

    labelText.on("pointerout", function (pointer) {
        document.querySelector("canvas").style.cursor = "default";
    }, _this);

    let origVidX = vidElem.x, origVidY = vidElem.y;
    labelText.on("pointerdown", function (pointer) {
        _this.tweens.add({
            targets: labelText,
            x: game.config.width/2 - (scaledWidth*5)/2,
            y: game.config.height/2 - (scaledHeight*5)/2,
            duration: 500,
            depth: 21,
            scale: 3,
            ease: "Power1",
            callbackScope: _this,
        });
        _this.tweens.add({
            targets: vidElem,
            x: game.config.width/2,
            y: game.config.height/2,
            depth: 20,
            scale: 1,
            ease: "Power1",
            duration: 500,
            onComplete: function() {
                _this.starfield2.setInteractive();
                _this.starfield2.alpha = 0.2;
                vidElem.on("pointerover", function (pointer) {
                    document.querySelector("canvas").style.cursor = "default";
                });

                _this.starfield2.on("pointerover", function (pointer) {
                    document.querySelector("canvas").style.cursor = "pointer";
                });
                _this.starfield2.on("pointerout", function (pointer) {
                    document.querySelector("canvas").style.cursor = "default";
                });
                _this.starfield2.on("pointerdown", function (pointer) {
                    _this.tweens.add({
                        targets: labelText,
                        x: labelX,
                        y: labelY,
                        duration: 500,
                        depth: 1,
                        scale: 1,
                        ease: "Power1",
                        callbackScope: _this,
                    });

                    _this.tweens.add({
                        targets: vidElem,
                        x: origVidX,
                        y: origVidY,
                        depth: 0,
                        ease: "Power1",
                        scale: scale,
                        duration: 500,
                        onComplete: function() {
                            _this.starfield2.disableInteractive();
                            _this.starfield2.alpha = 1;
                        },
                        callbackScope: _this
                    });
                });
            },
            callbackScope: _this,
        });
    }, _this);
}

function addFullScreenButton(scene) {
    let _this = scene;
    let FKey = _this.input.keyboard.addKey('F');

    FKey.on('down', function () {
        if (_this.scale.isFullscreen) {
            _this.fullScreenButton.setFrame(0);
            _this.scale.stopFullscreen();
        }
        else {
            _this.fullScreenButton.setFrame(1);
            _this.scale.startFullscreen();
        }

    }, _this);

    _this.fullScreenButton = _this.add.image(gameDetails.fullScreenButtonX, gameDetails.fullScreenButtonY, 'fullscreen', 0).setOrigin(1, 0).setScale(0.5).setInteractive();

    _this.fullScreenButton.on('pointerover', function () {
        document.querySelector("canvas").style.cursor = "pointer";
    });

    _this.fullScreenButton.on('pointerout', function () {
        document.querySelector("canvas").style.cursor = "default";
    });

    _this.fullScreenButton.on('pointerup', function () {
        if (_this.scale.isFullscreen) {
            _this.fullScreenButton.setFrame(0);
            _this.scale.stopFullscreen();
        }
        else {
            _this.fullScreenButton.setFrame(1);
            _this.scale.startFullscreen();
        }
    }, _this);
}

function doesFileExist(urlToFile) {
    // Source: https://www.kirupa.com/html5/checking_if_a_file_exists.htm#:~:text=To%20use%20it%20in%20your,the%20file%20doesn't%20exist.
    let xhr = new XMLHttpRequest();
    xhr.open('HEAD', urlToFile, false);
    xhr.send();

    if (xhr.status == "404") {
        return false;
    } else {
        return true;
    }
}
