const RED = "R", YELLOW = "Y", GREEN = "G", BLUE = "B", WILD = "W", WILD_FOUR = "WF";
const ZERO = 0, ONE = 1, TWO = 2, THREE = 3, FOUR = 4, FIVE = 5, SIX = 6, SEVEN = 7, EIGHT = 8, NINE = 9;
const SKIP = 10, REVERSE = 11, DRAW_TWO = 12;
const NONE = 13;
let game, gameDetails;
let currentAnimKeys = [];

window.onload = function () {
	let width = 700, height = 600;

	gameDetails = {
		deckX: width/2 - 200,
		deckY: height/2,
		topCardX: width/2,
		topCardY: height/2,
        myHandScale: 1.61,
        oppHandScale: 0.35,
		oppHandX: width/2,
		oppHandY: height/2 - 200
	};

	let config = {
		width: width,
		height: height,
		backgroundColor: 0xff0000,
		scene: [Scene1, Scene2],
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
