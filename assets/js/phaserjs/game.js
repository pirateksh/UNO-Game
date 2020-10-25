const RED = "R", YELLOW = "Y", GREEN = "G", BLUE = "B", WILD = "W", WILD_FOUR = "WF";
const ZERO = 0, ONE = 1, TWO = 2, THREE = 3, FOUR = 4, FIVE = 5, SIX = 6, SEVEN = 7, EIGHT = 8, NINE = 9;
const SKIP = 10, REVERSE = 11, DRAW_TWO = 12;
const NONE = 13;

const STREAM = navigator.mediaDevices.getUserMedia({video: false, audio: true});
const peers = {};

let game, gameDetails, socket;
let currentAnimKeys = [];

window.onload = function () {

	let width = 1275, height = 610;

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
        chooseColorButtonScale: 0.5,
        dimAlpha: 0.2,
		timeOutLimitInSeconds: 10,
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
