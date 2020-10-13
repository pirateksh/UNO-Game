const RED = "R", YELLOW = "Y", GREEN = "G", BLUE = "B", WILD = "W", WILD_FOUR = "WF";
const ZERO = 0, ONE = 1, TWO = 2, THREE = 3, FOUR = 4, FIVE = 5, SIX = 6, SEVEN = 7, EIGHT = 8, NINE = 9;
const SKIP = 10, REVERSE = 11, DRAW_TWO = 12;
const NONE = 13;
var game;

window.onload = function () {
	var config = {
		width: 700,
		height: 600,
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
	var point = 0, mul = 14;
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
