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
			showLeaderboard : false,
			showSubmitButton : false,
			elephantBirdSettings : {
				show : false,
				risingWeight : 0
			},
			nextButton : {
				height : 20,
				maxWidth : 140,
				ready : false
			},
			playAgainButton : {
				height : 20,
				maxWidth : 160,
				ready : false
			},
			submitScoreButton : {
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
			phaseEightTimer : 0		//the 'leaderboard' phase
		}

	};
}

//Start the magic
function startApp(submitScoreUrl, getLeadersUrl)
{
	//This is information from the server
	app.submitScoreUrl = submitScoreUrl;
	app.getLeadersUrl = getLeadersUrl;

	//Fetch the latest high scores
	$.ajax({
		url : app.getLeadersUrl,
		type : 'GET',
		success : function(data) {
			app.leaders = data;
		},
		error : function(request,error) {
			alert("An error happened getting the high scores. Go tell David H! Make haste!");
		}
	});

	//Get canvas and drawing context
	app.canvas = document.getElementById('canvas');
	app.ctx = app.canvas.getContext('2d');

	//For convenience because width and height are accessed so often
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

	//List of all animated objects
	app.objects = [];

	spawnHorton();

	//Event listeners
	app.canvas.addEventListener('mousemove', onMouseOrTouchMove, false);
	app.canvas.addEventListener('touchmove', onMouseOrTouchMove, false);
	app.canvas.addEventListener('keydown', onKeyDown, false);
	app.canvas.addEventListener('mousedown', onMouseDown, false);

	//Kick off animation loop
	window.requestAnimationFrame(frameUpdate);

}

//For when they hit the "Play Again" button. Reset everything.
function restartApp() {
	$(".leaderboard-container").hide();
	$(".highScoreName").html("");
	$(".highScore").html("");
	app.finalMusic.pause();
	var submitScoreUrl = app.submitScoreUrl;
	var getLeadersUrl = app.getLeadersUrl;
	app = createApp();
	startApp(submitScoreUrl, getLeadersUrl);
}

//This instantiates each falling item with all the settings that define it
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

//Utility function for getting an image from the webapp resources
function createImage(filename) {
	var image = new Image();
	image.src = "resources/images/" + filename;
	return image;
}

//Utility function for getting an audio file from the webapp resources
function createAudio(filename) {
	var audio = new Audio();
	audio.src = "resources/audio/" + filename;
	return audio;
}

//Makes it so an audio file is setup to repeat when it is playing
function makeAudioRepeat(audio) {
	audio.addEventListener('ended', function() {
		this.currentTime = 0;
		this.play();
	}, false);
}

//This is the animation loop
function frameUpdate(timestamp)
{
	window.requestAnimationFrame(frameUpdate);

	//Delta time calculation
	if (!app.lastTime) {
		app.lastTime = timestamp;
	}
	var dt = (timestamp - app.lastTime)/1000;
	app.lastTime = timestamp;

	//Play sequence
	if (app.state === 'play') {

		//Increase the difficulty
		app.difficulty += dt / 8;

		//The pregnancy counter is what shows in the top right corner
		incrementPregnancyCounter(dt);

		//Bump up (no pun intended!) the difficulty for the final stretch
		if (app.pregnancyCounter.weeks >= 36 && !app.inFinalStretch) {
			app.difficulty += dt * 1000;
			app.inFinalStretch = true;
		}

		//Start the ending sequence once it reaches 40 weeks
		if (app.pregnancyCounter.weeks == 40) {
			app.state = "finished";
			app.endingSettings.phaseOneTimer = 0.1;
			app.hitScreenShakeTimer = 0;
			app.objects.length = 0;
		}

		//Update screen shake timer, if there is one running
		if (app.hitScreenShakeTimer > 0) {
			app.hitScreenShakeTimer += dt;
			if (app.hitScreenShakeTimer > app.SCREEN_SHAKE_MAX_TIME) {
				app.hitScreenShakeTimer = 0;
			}
		}

		//Update collision message timer, if there is one running
		if (app.collisionMessageTimer > 0) {
			app.collisionMessageTimer += dt;
			if (app.collisionMessageTimer > app.COLLISION_MESSAGE_MAX_TIME) {
				app.collisionMessageTimer = 0;
			}
		}

		//Object updating (movement, rotation, etc.)
		for (var i = app.objects.length - 1; i >= 0; i--) {
			var o = app.objects[i];

			//Update roll/orientation
			if (o.roll) {
				o.angle += o.roll * dt;
			}

			if (o.type !== 'horton') {
				if (o.speed) {
					o.pos.y += o.speed * dt;	//Move item down the screen
				}

				//If it's off the bottom, get rid of it and recreate it at the top
				if (o.pos.y - o.ySize > app.height) {
					//	remove and respawn at top
					app.objects.splice(i, 1);
					if(app.state === 'play') {
						spawnItem();
					}
				}

				//Collision check
				var dx = app.horton.pos.x - o.pos.x;
				var dy = app.horton.pos.y - o.pos.y;
				var dist = Math.sqrt(dx * dx + dy * dy);	//Use the distance formula

				//This assumes that Horton's xSize is the same as his ySize (i.e. he's roundish)
				if (dist < (app.horton.xSize * .6)) {
					//	remove and respawn at top
					app.objects.splice(i, 1);
					spawnItem();

					//Start the collision message timer
					app.collisionMessageTimer = 0.1;

					//Show the collision message different for good guys or bad guys
					app.collisionMessage = {
						message: o.msg + "  " + (o.goodGuy ? "+" : "") + o.points,
						good: o.goodGuy
					};

					//Change the score
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

	//Finished sequence
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

	//Re-draw everything once per update
	drawScene();
}

//Draw the whole scene with each update
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

	//Screen shake
	if (app.hitScreenShakeTimer > 0) {
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

		//Don't draw horton outside of normal play state
		if (o.type === 'horton' && app.state !== 'play')
			continue;

		//Draw object image, centered/rotated around its pos
		ctx.save();
			ctx.translate(o.pos.x, o.pos.y);
			ctx.rotate(o.angle);
			ctx.drawImage(o.image, -o.xSize/2, -o.ySize/2, o.xSize, o.ySize);
		ctx.restore();
	}

	//Done with all game world drawing - restore old ctx state
	ctx.restore();

	//Show score, depending on game state
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

		//This next section is to decide which phase we are in and to show the content specific to that phase
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
			if(!app.endingSettings.showLeaderboard) {
				//Draw a thought bubble
				ctx.save();
				ctx.translate(app.width * .53, app.height * .3);
				ctx.drawImage(app.thoughtBubble, -500, -270, 900, 540);
				ctx.restore();

				ctx.font = "26px Courier";
				ctx.textAlign = "center";
				ctx.fillStyle = "#000080";
				ctx.fillText("Baby Horton coming November 2015!", app.width / 2, app.height / 7 + 70);

				drawButton(app.endingSettings.nextButton.maxWidth, app.endingSettings.nextButton.height, "Next");
			}
			else {

				//Show the high score box
				roundRect(ctx, app.width *.28, 65, app.width *.44, app.height *.55, 10, true, true);

				//Show either the "Submit" button for the high scores or the "Play Again" button if they didn't make or already submitted
				if(app.endingSettings.showSubmitButton) {
					drawButton(app.endingSettings.submitScoreButton.maxWidth, app.endingSettings.submitScoreButton.height, "Submit");
				}
				else {
					drawButton(app.endingSettings.playAgainButton.maxWidth, app.endingSettings.playAgainButton.height, "Play again?");
				}
			}
		}
	}
}

function drawButton(btnWidth, btnHeight, text) {
	roundRect(app.ctx, app.width / 2 - btnWidth * .5, app.height * .75 - btnHeight * 1.25, btnWidth, btnHeight * 2, 10, true, true);
	app.ctx.font = btnHeight + "px Courier";
	app.ctx.textAlign = "center";
	app.ctx.fillStyle = "#000080";
	app.ctx.fillText(text, app.width / 2, app.height * .75, btnWidth);
}


function spawnItem() {

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


function spawnItems(numberOfItems) {
	for (var i = 0; i < numberOfItems; i++) {
		spawnItem();
	}
}


function spawnHorton() {
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
			case 37:  //Left arrow was pressed
				if (app.horton.pos.x - app.keyboard_dx > 0) {
					app.horton.pos.x -= app.keyboard_dx;
				}
				break;
			case 39:  //Right arrow was pressed
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

	//Get the x and y coordinates of the mouse click
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
		return;
	}

	//The Start button
	if(app.state === 'pre-play' && clickIsInsideButton(x, y, app.startButtonMaxWidth, app.startButtonHeight)) {
		spawnItems(10);
		app.state = 'play';
		return;
	}

	//The Next button at the end
	if(app.endingSettings.nextButton.ready && !app.endingSettings.showLeaderboard && clickIsInsideButton(x, y, app.endingSettings.nextButton.maxWidth, app.endingSettings.nextButton.height)) {
		app.endingSettings.showLeaderboard = true;
		populateLeaderboard()
		return;
	}

	//The submit button that shows if they made it to the high scores
	if(app.endingSettings.showSubmitButton && clickIsInsideButton(x, y, app.endingSettings.submitScoreButton.maxWidth, app.endingSettings.submitScoreButton.height)) {
		app.endingSettings.showSubmitButton = false;
		submitHighScore();
		return;
	}

	//The Play Again button at the end
	if(app.endingSettings.showLeaderboard && clickIsInsideButton(x, y, app.endingSettings.playAgainButton.maxWidth, app.endingSettings.playAgainButton.height)) {
		restartApp();
	}
}

function clickIsInsideButton(clickX, clickY, btnWidth, btnHeight) {
	var isInside = false;

	var leftSide = app.width/2 - btnWidth/2;
	var rightSide = app.width/2 + btnWidth/2;
	var bottomSide = app.height*3/4 + btnHeight*1.25;
	var topSide = app.height*3/4 - btnHeight*1.25;

	if (clickX >= leftSide && clickX <= rightSide && clickY >= topSide && clickY <= bottomSide) {
		isInside = true;
	}

	return isInside;
}

function submitHighScore() {
	var scoreRow = $("#scoreRow" + (app.newScorePosition));
	var enteredName = scoreRow.find(".highScoreName input").val();

	if(enteredName == null || enteredName == "") {
		enteredName = "Anonymous";
	}

	scoreRow.find(".highScoreName").html(enteredName);

	var newLeader = {
		name : enteredName,
		score : app.score
	};

	$.ajax({
		url : app.submitScoreUrl,
		type : 'POST',
		data : newLeader
	});
}

function populateLeaderboard() {
	if(typeof app.leaders !== "undefined") {
		app.newScorePosition = -1;
		for (var i = 0; i < app.leaders.length; i++) {
			if (app.score >= app.leaders[i]["score"]) {
				app.newScorePosition = i + 1;
				break;
			}
		}

		var scoreRowIndex = 0;
		for (var j = 0; j < app.leaders.length; j++) {
			scoreRowIndex++;
			var currentScoreRow = $("#scoreRow" + scoreRowIndex);
			//If this score row should be the new high score, we basically want to pretend this never happened and continue iterating over the leaders
			//(and that's because in the case of this being the last time we would iterate over the list the last one would get left off otherwise)
			if (scoreRowIndex == app.newScorePosition) {
				currentScoreRow.find(".highScoreName").html("<input type=\"text\" maxlength=\"20\"/>");
				currentScoreRow.find(".highScore").html(app.score);
				j--;
				continue;
			}
			currentScoreRow.find(".highScoreName").html(app.leaders[j]["name"]);
			currentScoreRow.find(".highScore").html(app.leaders[j]["score"]);
		}

		if (app.newScorePosition != -1) {
			app.endingSettings.showSubmitButton = true;
		}
		else if (app.newScorePosition == -1 && app.leaders.length < 10) {
			app.newScorePosition = app.leaders.length + 1;
			var scoreRow = $("#scoreRow" + app.newScorePosition);
			scoreRow.find(".highScoreName").html("<input type=\"text\"/>");
			scoreRow.find(".highScore").html(app.score);
			app.endingSettings.showSubmitButton = true;
		}

		$(".leaderboard-container").show();
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