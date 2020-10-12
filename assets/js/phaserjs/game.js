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
	var game = new Phaser.Game(config);
};

function generatePath(fileName) {
	return `../../../../static/phaser_assets/images/${fileName}`;
}
