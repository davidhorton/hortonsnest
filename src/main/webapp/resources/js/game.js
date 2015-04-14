var app = {
	
	score : 0,
	difficulty : 0,
	
	state : 'pre-play',
	
	hitScreenShakeTimer : 0,
	SCREEN_SHAKE_MAX_TIME : 0.5,

	collisionMessageTimer : 0,
	COLLISION_MESSAGE_MAX_TIME : 1.5,

	GOOD_ITEM_LIKELIHOOD : 0.6,
	WEEKLY_BAD_INCREASE : 0.01,

	keyboard_dx : 20,

	startButtonMaxWidth : 125,
	startButtonHeight : 20,

	pregnancyCounter : {
		weeks:0,
		days:0,
		time:0
	},

	inFinalStretch : false

};

//	init
function startApp()
{
	//	set up our references to canvas and drawing context
	app.canvas = document.getElementById('canvas');
	app.ctx = app.canvas.getContext('2d');
	
	//	convenient copies of canvas width and height for drawing purposes later
	app.width = app.canvas.width;
	app.height = app.canvas.height;

	app.hortonImage = createImage("horton.png");
	app.backGroundImage = createImage("background.png");
	app.eggInNest = createImage("eggInNest.png");
	app.thoughtBubble = createImage("thoughtBubble.png");

	createItems();

	app.hitSound = new Audio();
	app.hitSound.src = "resources/audio/elephantHurt.mp3";

    //Background music
	app.backgroundMusic = new Audio("resources/audio/background.mp3");
    app.backgroundMusic.addEventListener('ended', function() {
        this.currentTime = 0;
        this.play();
    }, false);
    app.backgroundMusic.play();
	
	//	our master list of objects
	app.objects = [];

	spawnHorton();

	app.canvas.addEventListener('mousemove', onMouseOrTouchMove, false);
	app.canvas.addEventListener('touchmove', onMouseOrTouchMove, false);
	app.canvas.addEventListener('keydown', onKeyDown, false);
	app.canvas.addEventListener('mousedown', onMouseDown, false);

	//	kick off our animation loop
	window.requestAnimationFrame(frameUpdate);

}

function createItems() {
	app.items = {
		bottle : {
			type : "bottle",
			image : createImage("bottle.png"),
			points : 50,
			messageText : "Baby Bottle",
			goodGuy : true,
			xSize : 50
		},
		bananas : {
			type : "bananas",
			image : createImage("bananas.png"),
			points : 100,
			messageText : "Bananas",
			goodGuy : true
		},
		gnome : {
			type : "gnome",
			image : createImage("gnome.png"),
			points : 500,
			messageText : "Garden Gnome",
			goodGuy : true,
			xSize : 60
		},
		ducky : {
			type : "ducky",
			image : createImage("ducky.png"),
			points : 75,
			messageText : "Rubber Ducky",
			goodGuy : true
		},
		strawberry : {
			type : "strawberry",
			image : createImage("strawberry.png"),
			points : 25,
			messageText : "Strawberry",
			goodGuy : true
		},
		teddy : {
			type : "teddy",
			image : createImage("teddy.png"),
			points : 300,
			messageText : "Teddy Bear",
			goodGuy : true
		},
		kangaroo : {
			type : "kangaroo",
			image : createImage("kangaroo.png"),
			points : -150,
			messageText : "Nasty Kangaroo",
			goodGuy : false
		},
		leopard : {
			type : "leopard",
			image : createImage("leopard.png"),
			points : -300,
			messageText : "Leopard",
			goodGuy : false,
			xSize : 70
		},
		ostrich : {
			type : "ostrich",
			image : createImage("ostrich.png"),
			points : -25,
			messageText : "Evil Ostrich",
			goodGuy : false
		},
		snake : {
			type : "snake",
			image : createImage("snake.png"),
			points : -50,
			messageText : "Snake",
			goodGuy : false
		},
		monkey : {
			type : "monkey",
			image : createImage("monkey.png"),
			points : -500,
			messageText : "Evil Monkey",
			goodGuy : false
		}
	}
}

function createImage(filename) {
	var image = new Image();
	image.src = "resources/images/" + filename;
	return image;
}

//	update
function frameUpdate(timestamp)
{
	window.requestAnimationFrame(frameUpdate);	//	trigger next update in the chain
	
	//	delta time calculation
	if (!app.lastTime)
		app.lastTime = timestamp;
	var dt = (timestamp - app.lastTime)/1000;
	app.lastTime = timestamp;
	
	//	play sequence
	if (app.state === 'play') {

		//difficulty and score
		app.difficulty += dt / 8;
		app.score += Math.floor(dt * 80);

		incrementPregnancyCounter(dt);
		//Bump up (no pun intended!) the difficulty for the final stretch
		if (app.pregnancyCounter.weeks >= 36 && !app.inFinalStretch) {
			app.difficulty += dt * 1000;
			app.inFinalStretch = true;
		}
		if (app.pregnancyCounter.weeks == 40) {
			app.state = "finished."
		}

		//	update screen shake timer, if there is one running
		if (app.hitScreenShakeTimer > 0) {
			app.hitScreenShakeTimer += dt;
			if (app.hitScreenShakeTimer > app.SCREEN_SHAKE_MAX_TIME) {
				app.hitScreenShakeTimer = 0;
			}
		}

		//	update collision message timer, if there is one running
		if (app.collisionMessageTimer > 0) {
			app.collisionMessageTimer += dt;
			if (app.collisionMessageTimer > app.COLLISION_MESSAGE_MAX_TIME) {
				app.collisionMessageTimer = 0;
			}
		}

		//	object updating (movement, rotation, etc.)
		for (var i = app.objects.length - 1; i >= 0; i--) {
			var o = app.objects[i];

			if (o.roll)	//	update roll/orientation
			{
				o.angle += o.roll * dt;
			}

			if (o.type !== 'horton') {
				if (o.speed) {
					o.pos.y += o.speed * dt;	//	move item down the screen
				}

				if (o.pos.y - o.ySize > app.height)	//	off bottom?
				{
					//	remove and respawn at top
					app.objects.splice(i, 1);
					spawnItem();
				}

				//	collision check
				var dx = app.horton.pos.x - o.pos.x;
				var dy = app.horton.pos.y - o.pos.y;
				var dist = Math.sqrt(dx * dx + dy * dy);	//	distance formula

				//This assumes that Horton's xSize is the same as his ySize (i.e. he's round)
				if (dist < (app.horton.xSize * .6)) {
					//	remove and respawn at top
					app.objects.splice(i, 1);
					spawnItem();

					app.collisionMessageTimer = 0.1;
					app.collisionMessage = {
						message: o.msg + "  " + (o.goodGuy ? "+" : "") + o.points,
						good: o.goodGuy
					};

					app.score += o.points;

					if (!o.goodGuy) {
						app.hitSound.play();
						app.hitScreenShakeTimer = 0.1;	//	start screen shake effect timer
					}
				}
			}
		}
	}
	
	//	re-draw everything once per update
	drawScene();
}

//	draw
function drawScene()
{
	var ctx = app.ctx;
	
	//Make the screen blue
	ctx.fillStyle = "#0080ff";
	ctx.fillRect(0, 0, app.width, app.height);
	
	ctx.save();	//	save before screen shake or any other rendering
	ctx.drawImage(app.backGroundImage, 0, 0, app.width, app.height);
	
	//	screen shake
	if (app.hitScreenShakeTimer > 0)
	{
		ctx.translate(Math.random() * 20 - 5, Math.random() * 20 - 5);
	}

	if(app.state === 'play' || app.state === 'pre-play') {
		//Draw the egg first so it shows behind everything else
		ctx.save();
		ctx.translate(app.width-100, app.height - 40);
		ctx.drawImage(app.eggInNest, -60, -50, 120, 100);
		ctx.restore();
	}

	if (app.collisionMessageTimer > 0) {
		ctx.font = "italic 20px Courier";
		ctx.textAlign = "center";
		if(app.collisionMessage.good) {
			ctx.fillStyle = "#adff2f";
		}
		else {
			ctx.fillStyle = "#ff0000";
		}

		ctx.fillText(app.collisionMessage.message, app.width/2, 65);
	}
	
	//	draw objects
	for (var i = 0; i < app.objects.length; i++)
	{
		var o = app.objects[i];
		
		//	don't draw horton outside of normal play state
		if (o.type === 'horton' && app.state !== 'play')
			continue;
		
		//	draw object image, centered/rotated around its pos
		ctx.save();
			ctx.translate(o.pos.x, o.pos.y);
			ctx.rotate(o.angle);
			ctx.drawImage(o.image, -o.xSize/2, -o.ySize/2, o.xSize, o.ySize);
		ctx.restore();
	}
	
	//	done with all game world drawing - restore old ctx state
	ctx.restore();
	
	//	show score, depending on game state
	if (app.state === 'play')
	{
		ctx.font = "italic 25px Courier";
		ctx.textAlign = "center";
		ctx.fillStyle = "#FFFF00";
		
		ctx.fillText("Score " + app.score, app.width/2, 40);

		ctx.fillStyle = "#000080";
		ctx.textAlign = "right";
		ctx.fillText(app.pregnancyCounter.weeks + " " + (app.pregnancyCounter.weeks == 1 ? "week" : "weeks")
			+ " and " + app.pregnancyCounter.days + " " + (app.pregnancyCounter.days == 1 ? "day" : "days"), app.width - 15, 40);
	}
	else if(app.state === 'pre-play') {
		//Draw a big happy elephant
		ctx.save();
			ctx.translate(app.width/7, app.height - 120);
			ctx.drawImage(app.horton.image, -120, -120, 240, 240);
		ctx.restore();

		//Draw a thought bubble
		ctx.save();
			ctx.translate(app.width *.53, app.height *.3);
			ctx.drawImage(app.thoughtBubble, -500, -270, 900, 540);
		ctx.restore();

		roundRect(ctx, app.width/2-app.startButtonMaxWidth *.5, app.height *.75-app.startButtonHeight*1.25, app.startButtonMaxWidth, app.startButtonHeight*2, 10, true, true);

		ctx.font = "22px Courier";
		ctx.textAlign = "center";
		ctx.fillStyle = "#000080";
		ctx.fillText("Horton is hatching an egg! Help him catch all", app.width/2, app.height/7 + 35);
		ctx.fillText("the happy things so that he can prepare his", app.width/2, app.height/7 + 70);
		ctx.fillText("nest before the elephant-bird hatches.", app.width/2, app.height/7 + 105);

		ctx.font = app.startButtonHeight + "px Courier";
		ctx.textAlign = "center";
		ctx.fillStyle = "#000080";
		ctx.fillText("Start!", app.width/2, app.height *.75, app.startButtonMaxWidth)
	}
	else {
		ctx.font = "italic 130px Courier";
		ctx.textAlign = "center";
		ctx.fillStyle = "#FFFF00";
		
		ctx.fillText("Final Score " + app.score, app.width/2, app.height/2);
	}
}


function spawnItem()
{

	var goodGuySelection = Math.random();
	var goodGuy = goodGuySelection <= app.GOOD_ITEM_LIKELIHOOD;

    var itemTypeSelection = Math.random();
	var fallingItem;
    //Good guys
    if(goodGuy) {
		if (itemTypeSelection >= 0 && itemTypeSelection < 0.18) {
			fallingItem = app.items.bananas;
		}
		else if (itemTypeSelection >= 0.18 && itemTypeSelection < 0.36) {
			fallingItem = app.items.bottle;
		}
		else if (itemTypeSelection >= 0.36 && itemTypeSelection < 0.54) {
			fallingItem = app.items.ducky;
		}
		else if (itemTypeSelection >= 0.54 && itemTypeSelection < 0.72) {
			fallingItem = app.items.strawberry;
		}
		else if (itemTypeSelection >= 0.72 && itemTypeSelection < 0.9) {
			fallingItem = app.items.teddy;
		}
		else {
			fallingItem = app.items.gnome;
		}
	}
	else {
		//Bad guys
		if (itemTypeSelection >= 0 && itemTypeSelection < 0.2) {
			fallingItem = app.items.kangaroo;
		}
		else if (itemTypeSelection >= 0.2 && itemTypeSelection < 0.4) {
			fallingItem = app.items.leopard;
		}
		else if (itemTypeSelection >= 0.4 && itemTypeSelection < 0.6) {
			fallingItem = app.items.monkey;
		}
		else if (itemTypeSelection >= 0.6 && itemTypeSelection < 0.8) {
			fallingItem = app.items.ostrich;
		}
		else {
			fallingItem = app.items.snake;
		}
	}

	var rollRange = Math.PI * 2;
	var item = {
		type : fallingItem.type,
		pos : {x:Math.random() * app.width, y:Math.random() * -app.height},
		angle : Math.random() * Math.PI,
		roll : Math.random() * rollRange - rollRange/2,
		ySize : 80,
		xSize : fallingItem.xSize === undefined ? 80 : fallingItem.xSize,
		image : fallingItem.image,
		speed : 150 + 25 * app.difficulty,
		points : fallingItem.points,
		goodGuy : fallingItem.goodGuy,
		msg : fallingItem.messageText
	};
	app.objects.push(item);
}


function spawnItems(numberOfItems)
{
	for (var i = 0; i < numberOfItems; i++)
	{
		spawnItem();
	}
}


function spawnHorton()
{
	app.horton = {
		type : 'horton',
		pos : {x:app.width/2, y: app.height - 60},
		angle : 0,
		xSize : 120,
		ySize : 120,
		image : app.hortonImage
	};
	app.objects.push(app.horton);
}

function incrementPregnancyCounter(dt) {
	app.pregnancyCounter.time += dt;
	if(app.pregnancyCounter.time > 0.6) {
		app.pregnancyCounter.time = 0;
		app.pregnancyCounter.days++;
	}

	if(app.pregnancyCounter.days == 7) {

		//Each week, make it so slightly more bad things than good things happen
		app.GOOD_ITEM_LIKELIHOOD -= app.WEEKLY_BAD_INCREASE;

		app.pregnancyCounter.weeks++;
		app.pregnancyCounter.days = 0;

		if(app.pregnancyCounter.weeks % 5 == 0) {
			spawnItem();
		}
	}
}

function onKeyDown(event) {

    if(app.state === 'play') {
        switch (event.keyCode) {
            case 37:  /* Left arrow was pressed */
                if (app.horton.pos.x - app.keyboard_dx > 0) {
                    app.horton.pos.x -= app.keyboard_dx;
                }
                break;
            case 39:  /* Right arrow was pressed */
                if (app.horton.pos.x + app.keyboard_dx < app.width) {
                    app.horton.pos.x += app.keyboard_dx;
                }
                break;
        }
    }
}


function onMouseOrTouchMove(event) {
	if (app.state === 'play')
	{
		app.horton.pos.x = event.pageX;
	}
}

function onMouseDown(event) {
	if (app.state === 'pre-play')
	{
		var leftSide = app.width/2 - app.startButtonMaxWidth/2;
		var rightSide = app.width/2 + app.startButtonMaxWidth/2;
		var bottomSide = app.height*3/4 - app.startButtonHeight;
		var topSide = app.height*3/4 + app.startButtonHeight;

		var x = event.pageX;
		var y = event.pageY;
		if (x>=leftSide && x<=rightSide && y>=bottomSide && y<=topSide) {
			spawnItems(10);
			app.state = 'play';
		}

	}
}

/**
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} radius The corner radius. Defaults to 5;
 * @param {Boolean} fill Whether to fill the rectangle. Defaults to false.
 * @param {Boolean} stroke Whether to stroke the rectangle. Defaults to true.
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
	if (typeof stroke == "undefined" ) {
		stroke = true;
	}
	if (typeof radius === "undefined") {
		radius = 5;
	}

	ctx.fillStyle = "#ffffff";

	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	ctx.lineTo(x + width, y + height - radius);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	ctx.lineTo(x + radius, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	ctx.lineTo(x, y + radius);
	ctx.quadraticCurveTo(x, y, x + radius, y);
	ctx.closePath();
	if (stroke) {
		ctx.stroke();
	}
	if (fill) {
		ctx.fill();
	}
}