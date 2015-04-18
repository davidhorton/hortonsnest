var app = createApp();

function createApp() {
	return {
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

		inFinalStretch : false,

		speakerSettings : {
			on : true,
			xPos : 20,
			yPos : 20,
			xSize : 50,
			ySize : 50
		},

		showEmptyNest : true,

		endingSettings : {
			showBrokenEgg : false,
			playingFinalMusic : false,
			elephantBirdSettings : {
				show : false,
				risingWeight : 0
			},
			nextButton : {
				height : 20,
				maxWidth : 140,
				ready : false
			},
			phaseOneTimer : 0, 		//pause until the background music stops and/or changes
			phaseOneLimit : 0,		//Unused for now
			phaseTwoTimer : 0,		//pause before "I think it's hatching!" message is showing
			phaseTwoLimit : 1,
			phaseThreeTimer : 0,	//pause with "I think it's hatching!" message showing
			phaseThreeLimit : 3,
			phaseFourTimer : 0,		//pause before egg hatches
			phaseFourLimit : 1,
			phaseFiveTimer : 0,		//pause with egg hatched image
			phaseFiveLimit : 1,
			phaseSixTimer : 0,		//while elephant bird flies up
			phaseSixLimit : 1,
			phaseSevenTimer : 0,	//pause before happy music starts and ending message is shown
			phaseSevenLimit : 0.5,
			phaseEightTimer : 0		//pause before the leader board is shown
		}

	};
}

//	init
function startApp()
{
	//	set up our references to canvas and drawing context
	app.canvas = document.getElementById('canvas');
	app.ctx = app.canvas.getContext('2d');

	//	convenient copies of canvas width and height for drawing purposes later
	app.width = app.canvas.width;
	app.height = app.canvas.height;

	//Load images
	app.hortonImage = createImage("horton.png");
	app.backGroundImage = createImage("background.png");
	app.eggInNest = createImage("eggInNest.png");
	app.thoughtBubble = createImage("thoughtBubble.png");
	app.speakerOn = createImage("speakerOn.png");
	app.speakerOff = createImage("speakerOff.png");
	app.emptyNest = createImage("emptyNest.png");
	app.lilHortonInEgg = createImage("hortonHatchedEgg.png");
	app.emptyHatchedEgg = createImage("emptyHatchedEgg.png");
	app.elephantBird = createImage("elephantBird.png");

	createItems();

	//Load sounds
	app.hitSound = createAudio("elephantHurt.mp3");
	app.eggHatching = createAudio("eggHatching.mp3");
	app.eggHatching.volume = 1.0;
	app.endingSequenceMusic = createAudio("endingSequence.mp3");
	makeAudioRepeat(app.endingSequenceMusic);
	app.finalMusic = createAudio("happyEndingMusic.mp3");
	makeAudioRepeat(app.finalMusic);
	app.backgroundMusic = createAudio("background.mp3");
	makeAudioRepeat(app.backgroundMusic);
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

function restartApp() {

	app.finalMusic.pause();
	app = createApp();
	startApp();
}

function createItems() {
	app.items = {
		bottle : {
			type : "bottle",
			image : createImage("bottle.png"),
			points : 100,
			messageText : "Baby Bottle",
			goodGuy : true,
			xSize : 50
		},
		bananas : {
			type : "bananas",
			image : createImage("bananas.png"),
			points : 200,
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
			points : 175,
			messageText : "Rubber Ducky",
			goodGuy : true
		},
		strawberry : {
			type : "strawberry",
			image : createImage("strawberry.png"),
			points : 150,
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
			messageText : "Killer Kangaroo",
			goodGuy : false
		},
		leopard : {
			type : "leopard",
			image : createImage("leopard.png"),
			points : -250,
			messageText : "Nasty Leopard",
			goodGuy : false,
			xSize : 70
		},
		spider : {
			type : "spider",
			image : createImage("spider.png"),
			points : -500,
			messageText : "Spawn of Satan",
			goodGuy : false
		},
		snake : {
			type : "snake",
			image : createImage("snake.png"),
			points : -50,
			messageText : "Sneaky Snake",
			goodGuy : false
		},
		monkey : {
			type : "monkey",
			image : createImage("monkey.png"),
			points : -300,
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

function createAudio(filename) {
	var audio = new Audio();
	audio.src = "resources/audio/" + filename;
	return audio;
}

function makeAudioRepeat(audio) {
	audio.addEventListener('ended', function() {
		this.currentTime = 0;
		this.play();
	}, false);
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

		//difficulty
		app.difficulty += dt / 8;

		incrementPregnancyCounter(dt);
		//Bump up (no pun intended!) the difficulty for the final stretch
		if (app.pregnancyCounter.weeks >= 36 && !app.inFinalStretch) {
			app.difficulty += dt * 1000;
			app.inFinalStretch = true;
		}
		if (app.pregnancyCounter.weeks == 40) {
			app.state = "finished";
			app.endingSettings.phaseOneTimer = 0.1;
			app.hitScreenShakeTimer = 0;
			app.objects.length = 0;
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

	}
	if(app.state === 'play') {
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
					if(app.state === 'play') {
						spawnItem();
					}
				}

				//	collision check
				var dx = app.horton.pos.x - o.pos.x;
				var dy = app.horton.pos.y - o.pos.y;
				var dist = Math.sqrt(dx * dx + dy * dy);	//	distance formula

				if(app.state === 'play') {
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
							if (app.speakerSettings.on) {
								app.hitSound.play();
							}
							app.hitScreenShakeTimer = 0.1;	//	start screen shake effect timer
						}
					}
				}
			}
		}
	}
	if(app.state === "finished") {
		if(app.endingSettings.phaseOneTimer > 0) {
			app.endingSettings.phaseOneTimer += dt;
			if(app.endingSettings.phaseOneTimer > app.endingSettings.phaseOneLimit) {
				app.endingSettings.phaseOneTimer = 0;
				app.endingSettings.phaseTwoTimer = 0.1;
				app.backgroundMusic.pause();
				if (app.speakerSettings.on) {
					app.endingSequenceMusic.play();
				}
			}
		}
		else if(app.endingSettings.phaseTwoTimer > 0) {
			app.endingSettings.phaseTwoTimer += dt;
			if(app.endingSettings.phaseTwoTimer > app.endingSettings.phaseTwoLimit) {
				app.endingSettings.phaseTwoTimer = 0;
				app.endingSettings.phaseThreeTimer = 0.1;
			}
		}
		else if(app.endingSettings.phaseThreeTimer > 0) {
			app.endingSettings.phaseThreeTimer += dt;
			if(app.endingSettings.phaseThreeTimer > app.endingSettings.phaseThreeLimit) {
				app.endingSettings.phaseThreeTimer = 0;
				app.endingSettings.phaseFourTimer = 0.1;
			}
		}
		else if(app.endingSettings.phaseFourTimer > 0) {
			app.endingSettings.phaseFourTimer += dt;
			if(app.endingSettings.phaseFourTimer > app.endingSettings.phaseFourLimit) {
				app.endingSettings.phaseFourTimer = 0;
				app.endingSettings.phaseFiveTimer = 0.1;
				app.showEmptyNest = false;
			}
		}
		else if(app.endingSettings.phaseFiveTimer > 0) {
			app.endingSettings.phaseFiveTimer += dt;
			if(app.endingSettings.phaseFiveTimer > app.endingSettings.phaseFiveLimit) {
				app.endingSettings.phaseFiveTimer = 0;
				app.endingSettings.phaseSixTimer = 0.1;
				app.endingSettings.showBrokenEgg = true;
				app.endingSettings.elephantBirdSettings.finalXPosition = app.width - 100;
				app.endingSettings.elephantBirdSettings.finalYPosition = app.height *.5;
				app.endingSettings.elephantBirdSettings.size = 140;
				if (app.speakerSettings.on) {
					app.eggHatching.play();
				}
			}
		}
		else if(app.endingSettings.phaseSixTimer > 0) {
			app.endingSettings.phaseSixTimer += dt;
			app.endingSettings.elephantBirdSettings.risingWeight += 8;
			if(app.endingSettings.phaseSixTimer > app.endingSettings.phaseSixLimit) {
				app.endingSettings.phaseSixTimer = 0;
				app.endingSettings.phaseSevenTimer = 0.1;
				app.endingSettings.elephantBirdSettings.show = true;
				app.endingSequenceMusic.pause();
				if (app.speakerSettings.on) {
					app.finalMusic.play();
				}
				app.endingSettings.playingFinalMusic = true;
			}
		}
		else if(app.endingSettings.phaseSevenTimer > 0) {
			app.endingSettings.phaseSevenTimer += dt;
			if(app.endingSettings.phaseSevenTimer > app.endingSettings.phaseSevenLimit) {
				app.endingSettings.phaseSevenTimer = 0;
				app.endingSettings.phaseEightTimer = 0.1;
				app.endingSettings.nextButton.ready = true;
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

	ctx.save();	//	save before screen shake or any other rendering

	//Draw background
	ctx.drawImage(app.backGroundImage, 0, 0, app.width, app.height);

	//Draw speaker
	var speakerImage;
	if(app.speakerSettings.on) {
		speakerImage = app.speakerOn;
	}
	else {
		speakerImage = app.speakerOff;
	}
	ctx.drawImage(speakerImage, app.speakerSettings.xPos, app.speakerSettings.yPos, app.speakerSettings.xSize, app.speakerSettings.ySize);

	//	screen shake
	if (app.hitScreenShakeTimer > 0)
	{
		ctx.translate(Math.random() * 20 - 5, Math.random() * 20 - 5);
	}

	//Draw the egg first so it shows behind everything else
	ctx.save();
		ctx.translate(app.width - 100, app.height - 40);
		ctx.drawImage(app.showEmptyNest ? app.eggInNest : app.emptyNest, -60, -50, 120, 100);
	ctx.restore();

	if (app.collisionMessageTimer > 0 && app.state !== "finished") {
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

		if(app.score < 0) {
			ctx.fillStyle = "#ff0000";
		}
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
		ctx.fillText("of the happy things so that he can prepare his", app.width/2, app.height/7 + 70);
		ctx.fillText("nest before the elephant-bird hatches.", app.width/2, app.height/7 + 105);

		ctx.font = app.startButtonHeight + "px Courier";
		ctx.textAlign = "center";
		ctx.fillStyle = "#000080";
		ctx.fillText("Start!", app.width/2, app.height *.75, app.startButtonMaxWidth)
	}
	else if(app.state === "finished") {
		ctx.font = "italic 25px Courier";
		ctx.textAlign = "center";
		ctx.fillStyle = "#FFFF00";

		if(app.score < 0) {
			ctx.fillStyle = "#ff0000";
		}
		ctx.fillText("Final Score " + app.score, app.width/2, 40);

		ctx.fillStyle = "#000080";
		ctx.textAlign = "right";
		ctx.fillText("40 weeks!", app.width - 15, 40);

		//Draw a big happy elephant
		ctx.save();
			ctx.translate(app.width/7, app.height - 120);
			ctx.drawImage(app.horton.image, -120, -120, 240, 240);
		ctx.restore();

		//Because this will show across multiple phase timers, it just has its own boolean
		if(app.endingSettings.showBrokenEgg) {
			ctx.save();
				ctx.translate(app.width - 100, app.height - 65);
				ctx.drawImage(app.emptyHatchedEgg, -45, -37.5, 90, 75);
			ctx.restore();
		}

		//This can also span multiple phase timers
		if(app.endingSettings.elephantBirdSettings.show) {
			ctx.save();
				ctx.translate(app.endingSettings.elephantBirdSettings.finalXPosition, app.endingSettings.elephantBirdSettings.finalYPosition);
				ctx.drawImage(app.elephantBird, -app.endingSettings.elephantBirdSettings.size/2, -app.endingSettings.elephantBirdSettings.size/2, app.endingSettings.elephantBirdSettings.size, app.endingSettings.elephantBirdSettings.size);
			ctx.restore();
		}

		if(app.endingSettings.phaseThreeTimer > 0) {
			//Draw a thought bubble
			ctx.save();
				ctx.translate(app.width *.53, app.height *.3);
				ctx.drawImage(app.thoughtBubble, -500, -270, 900, 540);
			ctx.restore();

			ctx.font = "26px Courier";
			ctx.textAlign = "center";
			ctx.fillStyle = "#000080";
			ctx.fillText("I think it's hatching!", app.width/2, app.height/7 + 70);
		}
		//Show the elephant bird sitting in its hatched egg
		else if(app.endingSettings.phaseFiveTimer > 0) {
			ctx.save();
				ctx.translate(app.width - 100, app.height - 65);
				ctx.drawImage(app.lilHortonInEgg, -45, -37.5, 90, 75);
			ctx.restore();
		}
		//Fly up with the elephant bird
		else if(app.endingSettings.phaseSixTimer > 0) {
			var weight = app.endingSettings.phaseSixTimer/app.endingSettings.phaseSixLimit;
			var risingYPosition = app.height - app.endingSettings.elephantBirdSettings.risingWeight - 65;
			var yPosition = risingYPosition <= app.endingSettings.elephantBirdSettings.finalYPosition ? app.endingSettings.elephantBirdSettings.finalYPosition : risingYPosition;
			ctx.save();
				ctx.translate(app.endingSettings.elephantBirdSettings.finalXPosition, yPosition);
				ctx.drawImage(app.elephantBird, -(app.endingSettings.elephantBirdSettings.size/2)*weight, -(app.endingSettings.elephantBirdSettings.size/2)*weight, app.endingSettings.elephantBirdSettings.size*weight, app.endingSettings.elephantBirdSettings.size*weight);
			ctx.restore();
		}
		else if(app.endingSettings.phaseEightTimer > 0) {
			//Draw a thought bubble
			ctx.save();
				ctx.translate(app.width *.53, app.height *.3);
				ctx.drawImage(app.thoughtBubble, -500, -270, 900, 540);
			ctx.restore();

			ctx.font = "26px Courier";
			ctx.textAlign = "center";
			ctx.fillStyle = "#000080";
			ctx.fillText("Baby Horton coming November 2015!", app.width/2, app.height/7 + 70);

			roundRect(ctx, app.width/2-app.endingSettings.nextButton.maxWidth *.5, app.height *.75-app.endingSettings.nextButton.height*1.25, app.endingSettings.nextButton.maxWidth, app.endingSettings.nextButton.height*2, 10, true, true);

			ctx.font = app.endingSettings.nextButton.height + "px Courier";
			ctx.textAlign = "center";
			ctx.fillStyle = "#000080";
			ctx.fillText("Play again?", app.width/2, app.height *.75, app.endingSettings.nextButton.maxWidth);
		}
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
			fallingItem = app.items.spider;
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


function onMouseOrTouchMove(e) {
	if (app.state === 'play')
	{
		if(e.offsetX) {
			x = e.offsetX;
			y = e.offsetY;
		}
		else {
			var canvas = $('#canvas');
			x = e.pageX - canvas.offset().left;
			y = e.pageY - canvas.offset().top;
		}

		app.horton.pos.x = x;
	}
}

function onMouseDown(e) {

	var x = 0, y = 0;

	if(e.offsetX) {
		x = e.offsetX;
		y = e.offsetY;
	}
	else {
		var canvas = $('#canvas');
		x = e.pageX - canvas.offset().left;
		y = e.pageY - canvas.offset().top;
	}

	//The Start button
	if (app.state === 'pre-play')
	{
		var leftSide = app.width/2 - app.startButtonMaxWidth/2;
		var rightSide = app.width/2 + app.startButtonMaxWidth/2;
		var bottomSide = app.height*3/4 + app.startButtonHeight*1.25;
		var topSide = app.height*3/4 - app.startButtonHeight*1.25;

		if (x>=leftSide && x<=rightSide && y>=topSide && y<=bottomSide) {
			spawnItems(10);
			app.state = 'play';
		}

	}

	//The speaker button
	var speakerLeftSide = app.speakerSettings.xPos;
	var speakerRightSide = app.speakerSettings.xPos + app.speakerSettings.xSize;
	var speakerBottomSide = app.speakerSettings.yPos + app.speakerSettings.ySize;
	var speakerTopSide = app.speakerSettings.yPos;

	if (x>=speakerLeftSide && x<=speakerRightSide && y>=speakerTopSide && y<=speakerBottomSide) {
		var currentMusic;
		if(app.state !== "finished") {
			currentMusic = app.backgroundMusic;
		}
		else {
			if(app.endingSettings.playingFinalMusic) {
				currentMusic = app.finalMusic;
			}
			else {
				currentMusic = app.endingSequenceMusic;
			}
		}


		if(app.speakerSettings.on) {
			app.speakerSettings.on = false;
			currentMusic.pause();
		}
		else {
			app.speakerSettings.on = true;
			currentMusic.play();
		}
	}

	//The Next button at the end
	if(app.endingSettings.nextButton.ready) {
		var nleftSide = app.width/2 - app.endingSettings.nextButton.maxWidth/2;
		var nrightSide = app.width/2 + app.endingSettings.nextButton.maxWidth/2;
		var nbottomSide = app.height*3/4 + app.endingSettings.nextButton.height*1.25;
		var ntopSide = app.height*3/4 - app.endingSettings.nextButton.height*1.25;

		if (x>=nleftSide && x<=nrightSide && y>=ntopSide && y<=nbottomSide) {
			restartApp();
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