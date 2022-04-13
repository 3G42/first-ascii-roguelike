// Tamanho da fonte
var FONT = 60;

// Tamanho do mapa
var ROWS = 10;
var COLS = 15;

// Numero de personagens por mapa - incluindo o jogador
var ACTORS = 10;

// Inicia phaser
var game = new Phaser.Game(COLS * FONT * 0.6, ROWS * FONT, Phaser.AUTO, null, {
	create: create,
});

function create() {
	game.input.keyboard.addCallbacks(null, null, onKeyUp);

	// Inicia mapa
	initMap();

	asciidisplay = [];
	for (var y = 0; y < ROWS; y++) {
		var newRow = [];
		asciidisplay.push(newRow);
		for (var x = 0; x < COLS; x++) {
			newRow.push(initCell("", x, y));
		}
	}
	initActors();
	drawnMap();
	drawnActors();
}

function initCell(chr, x, y) {
	var style = { font: FONT + "px monospace", fill: "#fff" };
	return game.add.text(FONT * 0.6 * x, FONT * y, chr, style);
}

function initMap() {
	//Criar um mapa novo;
	map = [];
	for (var y = 0; y < ROWS; y++) {
		var newRow = [];
		for (var x = 0; x < COLS; x++) {
			if (Math.random() > 0.8) {
				newRow.push("#");
			} else newRow.push(".");
		}
		map.push(newRow);
	}
}

function drawnMap() {
	for (var y = 0; y < ROWS; y++) {
		for (var x = 0; x < COLS; x++) {
			asciidisplay[y][x].content = map[y][x];
		}
	}
}

function randomInt(max) {
	return Math.floor(Math.random() * max);
}

function initActors() {
	// Crias os personagens em locais aleatorios do mapa
	actorList = [];
	actorMap = {};
	for (var e = 0; e < ACTORS; e++) {
		// Cria o novo personagem
		var actor = {
			x: 0,
			y: 0,
			hp: e == 0 ? 3 : 1,
		};
		do {
			actor.y = randomInt(ROWS);
			actor.x = randomInt(COLS);
		} while (
			map[actor.y][actor.x] == "#" ||
			actorMap[actor.y + "_" + actor.x] != null
		);
		actorMap[actor.y + "_" + actor.x] = actor;
		actorList.push(actor);
	}

	player = actorList[0];
	livingEnemies = ACTORS - 1;
	console.log(
		"🚀 ~ file: rl.js ~ line 172 ~ initActors ~ actorList",
		actorList
	);
	console.log("🚀 ~ file: rl.js ~ line 171 ~ initActors ~ actorMap", actorMap);
}

function drawnActors() {
	for (var a in actorList) {
		if (actorList[a] != null && actorList[a].hp > 0) {
			asciidisplay[actorList[a].y][actorList[a].x].content =
				a == 0 ? "" + player.hp : "e";
		}
	}
}

function canGo(actor, dir) {
	return (
		actor.x + dir.x >= 0 &&
		actor.x + dir.x <= COLS - 1 &&
		actor.y + dir.y >= 0 &&
		actor.y + dir.y <= ROWS - 1 &&
		map[actor.y + dir.y][actor.x + dir.x] == "."
	);
}

function moveTo(actor, dir) {
	// Verifica se personagem pode mover-se;
	if (!canGo(actor, dir)) return false;
	// Mover para novo local;
	var posy = actor.y + dir.y;
	var newKey = posy + "_" + (actor.x + dir.x);

	if (actorMap[newKey] != null) {
		var victim = actorMap[newKey];
		victim.hp--;

		if (victim.hp == 0) {
			actorMap[newKey] = null;
			actorList[actorList.indexOf(victim)] = null;
			if (victim != player) {
				livingEnemies--;
				if (livingEnemies == 0) {
					var victory = game.add.text(
						game.world.centerX,
						game.world.centerY,
						"Victory! \nCtrl+r to restart",
						{ fill: "#2e2", align: "center" }
					);
					victory.anchor.setTo(0.5, 0.5);
				}
			}
		}
	} else {
		actorMap[actor.y + "_" + actor.x] = null;

		actor.y += dir.y;
		actor.x += dir.x;

		actorMap[actor.y + "_" + actor.x] = actor;
	}
	console.log("🚀 ~ file: rl.js ~ line 81 ~ moveTo ~ actorList", actorList);
	console.log("🚀 ~ file: rl.js ~ line 101 ~ moveTo ~ actorMap", actorMap);
	return true;
}

// --------------------- Movimentação ----------------------------
function onKeyUp(event) {
	drawnMap();

	var acted = false;
	switch (event.keyCode) {
		case Phaser.Keyboard.LEFT:
			acted = moveTo(player, { x: -1, y: 0 });
			break;
		case Phaser.Keyboard.RIGHT:
			acted = moveTo(player, { x: 1, y: 0 });
			break;
		case Phaser.Keyboard.UP:
			acted = moveTo(player, { x: 0, y: -1 });
			break;
		case Phaser.Keyboard.DOWN:
			acted = moveTo(player, { x: 0, y: 1 });
			break;
	}
	if (acted)
		for (var enemy in actorList) {
			// skip the player
			if (enemy == 0) continue;

			var e = actorList[enemy];
			if (e != null) aiAct(e);
		}
	drawnActors();
}

//  ------------------ REVISITAR CRIAÇÃO DO MAPA ----------------------
var map;

var asciidisplay;

//------------- PERSONAGENS ------------------------------

var player;
var actorList;
var livingEnemies;

var actorMap;

function aiAct(actor) {
	var directions = [
		{ x: -1, y: 0 },
		{ x: 1, y: 0 },
		{ x: 0, y: -1 },
		{ x: 0, y: 1 },
	];
	var dx = player.x - actor.x;
	var dy = player.y - actor.y;

	// if player is far away, walk randomly
	if (Math.abs(dx) + Math.abs(dy) > 6)
		// try to walk in random directions until you succeed once
		while (!moveTo(actor, directions[randomInt(directions.length)])) {}

	// otherwise walk towards player
	if (Math.abs(dx) > Math.abs(dy)) {
		if (dx < 0) {
			// left
			moveTo(actor, directions[0]);
		} else {
			// right
			moveTo(actor, directions[1]);
		}
	} else {
		if (dy < 0) {
			// up
			moveTo(actor, directions[2]);
		} else {
			// down
			moveTo(actor, directions[3]);
		}
	}
	if (player.hp < 1) {
		// game over message
		var gameOver = game.add.text(
			game.world.centerX,
			game.world.centerY,
			"Game Over\nCtrl+r to restart",
			{ fill: "#e22", align: "center" }
		);
		gameOver.anchor.setTo(0.5, 0.5);
	}
}
