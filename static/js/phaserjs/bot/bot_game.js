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
let level;

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
		playButtonScale: 0.85,
        chooseColorButtonScale: 0.5,
        dimAlpha: 0.2,
		timeOutLimitInSeconds: 10,
        botX: width/2,
        botY: height/2 - 50 - 225,
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
		scene: [BotScene1, BotScene2, BotScene3],
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

function send_card_play_request(e, drawn_card_val=undefined){
    if(drawn_card_val !== undefined){
        let color_changed_to = "";
        if(drawn_card_val === "13 of W" || drawn_card_val === "13 of WF"){
            color_changed_to = window.prompt("Set top Card Color to:\n R for 'Red', \n G for 'Green',\n B for 'Blue', \n Y for 'Yellow'");
        }
        let response = {
            'play_keep_decision': 1,
            'drawn_card_val': drawn_card_val,
            'color_changed_to':color_changed_to,
        };
        console.log("Sending 2!");
        socket.send(JSON.stringify(response));
    }
    else{
        console.log("Click event Called on button: " + e.currentTarget.myParam);
        let color_changed_to = "";
        if(e.currentTarget.myParam === "13 of W" || e.currentTarget.myParam === "13 of WF"){
            color_changed_to = window.prompt("Set top Card Color to:\n R for 'Red', \n G for 'Green',\n B for 'Blue', \n Y for 'Yellow'");
        }
        let response = {
            'card_played_value': e.currentTarget.myParam,
            'color_changed_to':color_changed_to,
        };
        console.log("Sending 3!");
        socket.send(JSON.stringify(response));
    }
}

function cardPlayRequest(card, topColor) {
    let response = {
        'card_played_value': stringifyCard(card),
        'color_changed_to':topColor,
    };
    socket.send(JSON.stringify(response));
}

function keepCardRequest(drawnCard) {
    let response = {
        'play_keep_decision': 0, // Player will keep
        'drawn_card_val': stringifyCard(drawnCard),
    };
    socket.send(JSON.stringify(response));
}

function drawCardRequest() {
    let response = {
        'card_played_value': "DRAW_CARD",
        'color_changed_to':"",
    };
    socket.send(JSON.stringify(response));
}

function send_end_game_request(e){
    let response = {
        'card_played_value': "END_GAME",
        'color_changed_to':"",
    };
    // location.replace("{% url "user_profile" user%}");
    console.log("Sending 4!");
    socket.send(JSON.stringify(response));
}

function parseCard(cardString) {
    let splittedCardString = cardString.split(" of ");
    let category = splittedCardString[1], number = parseInt(splittedCardString[0]);
    return {"category": category, "number": number};
}

function stringifyCard(card) {
    return `${card.number} of ${card.category}`;
}

function isEqual(card1, card2) {
    return ((card1.category === card2.category) && (card1.number === card2.number));
}