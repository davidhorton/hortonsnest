var app = {
	
	score : 0,
	difficulty : 0,
	
	state : 'pre-play',
	
	hitScreenShakeTimer : 0,
	SCREEN_SHAKE_MAX_TIME : 0.5,

	collisionMessageTimer : 0,
	COLLISION_MESSAGE_MAX_TIME : 1.5,

	keyboard_dx : 20,

	startButtonMaxWidth : 250,
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
	spawnManyItems();

	app.canvas.addEventListener('mousemove', onMouseOrTouchMove, false);
	app.canvas.addEventListener('touchmove', onMouseOrTouchMove, false);
	app.canvas.addEventListener('keydown', onKeyDown, false);
	app.canvas.addEventListener('mousedown', onMouseDown, false);
	
	drawScene();

}

function createItems() {
	app.items = {
		bottle : {
			type : "bottle",
			image : createImage("bottle.png"),
			points : 50,
			messageText : "Baby Bottle",
			goodGuy : true
		},
		bananas : {
			type : "bananas",
			image : createImage("bananas.png"),
			points : 50,
			messageText : "Bananas",
			goodGuy : true
		},
		gnome : {
			type : "gnome",
			image : createImage("gnome.png"),
			points : 50,
			messageText : "Garden Gnome",
			goodGuy : true
		},
		ducky : {
			type : "ducky",
			image : createImage("ducky.png"),
			points : 50,
			messageText : "Rubber Ducky",
			goodGuy : true
		},
		strawberry : {
			type : "strawberry",
			image : createImage("strawberry.png"),
			points : 50,
			messageText : "Strawberry",
			goodGuy : true
		},
		teddy : {
			type : "teddy",
			image : createImage("teddy.png"),
			points : 50,
			messageText : "Teddy Bear",
			goodGuy : true
		},
		kangaroo : {
			type : "kangaroo",
			image : createImage("kangaroo.png"),
			points : -50,
			messageText : "Nasty Kangaroo",
			goodGuy : false
		},
		leopard : {
			type : "leopard",
			image : createImage("leopard.png"),
			points : -50,
			messageText : "Leopard",
			goodGuy : false
		},
		ostrich : {
			type : "ostrich",
			image : createImage("ostrich.png"),
			points : -50,
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
			points : -50,
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
	
	//	difficulty and score
	if (app.state === 'play')
	{
		app.difficulty += dt/8;
		app.score += Math.floor(dt * 80);
	}

	incrementPregnancyCounter(dt);
	//Bump up (no pun intended!) the difficulty for the final stretch
	if(app.pregnancyCounter.weeks >= 36 && !app.inFinalStretch) {
		app.difficulty += dt*1000;
		app.inFinalStretch = true;
	}
	if(app.pregnancyCounter.weeks == 40) {
		app.state = "finished."
	}

	//	update screen shake timer, if there is one running
	if (app.hitScreenShakeTimer > 0)
	{
		app.hitScreenShakeTimer += dt;
		if (app.hitScreenShakeTimer > app.SCREEN_SHAKE_MAX_TIME)
		{
			app.hitScreenShakeTimer = 0;
		}
	}

	//	update collision message timer, if there is one running
	if (app.collisionMessageTimer > 0)
	{
		app.collisionMessageTimer += dt;
		if (app.collisionMessageTimer > app.COLLISION_MESSAGE_MAX_TIME)
		{
			app.collisionMessageTimer = 0;
		}
	}
	
	//	object updating (movement, rotation, etc.)
	for (var i = app.objects.length - 1; i >= 0; i--)
	{
		var o = app.objects[i];
		
		if (o.roll)	//	update roll/orientation
		{
			o.angle += o.roll * dt;
		}
		
		if (o.type !== 'horton')
		{
			if (o.speed)
			{
				o.pos.y += o.speed * dt;	//	move item down the screen
			}
			
			if (o.pos.y - o.size > app.height)	//	off bottom?
			{
				//	remove and respawn at top
				app.objects.splice(i, 1);
				spawnItem();
			}
			
			//	collision check
			if (app.state === 'play')
			{
				var dx = app.horton.pos.x - o.pos.x;
				var dy = app.horton.pos.y - o.pos.y;
				var dist = Math.sqrt(dx*dx + dy*dy);	//	distance formula
				
				//	this should be some other non-hardcoded distance check value,
				//	but it'll need to be fine-tuned anyway for game feel
				if (dist < 50)
				{
					//	remove and respawn at top
					app.objects.splice(i, 1);
					spawnItem();

					app.collisionMessageTimer = 0.1;
					app.collisionMessage = {
						message : o.msg + "  " + (o.goodGuy ? "+" : "") + o.points,
						good : o.goodGuy
					};

					app.score += o.points;

					if(!o.goodGuy) {
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

	if (app.collisionMessageTimer > 0) {
		ctx.font = "italic 20px Calibri";
		ctx.textAlign = "center";
		if(app.collisionMessage.good) {
			ctx.fillStyle = "#32cd32";
		}
		else {
			ctx.fillStyle = "#ff0000";
		}

		ctx.fillText(app.collisionMessage.message, app.width/2, 70);
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
			ctx.drawImage(o.image, -o.size/2, -o.size/2, o.size, o.size);
		ctx.restore();
	}
	
	//	done with all game world drawing - restore old ctx state
	ctx.restore();
	
	//	show score, depending on game state
	if (app.state === 'play')
	{
		ctx.font = "italic 25px Calibri";
		ctx.textAlign = "center";
		ctx.fillStyle = "#FFFF00";
		
		ctx.fillText("Score " + app.score, app.width/2, 40);

		ctx.textAlign = "right";
		ctx.fillText(app.pregnancyCounter.weeks + " " + (app.pregnancyCounter.weeks == 1 ? "week" : "weeks")
			+ " and " + app.pregnancyCounter.days + " " + (app.pregnancyCounter.days == 1 ? "day" : "days"), app.width - 15, 40);
	}
	else if(app.state === 'pre-play') {
		ctx.font = "30px Calibri";
		ctx.textAlign = "center";
		ctx.fillStyle = "#FFFF00";
		ctx.fillText("Horton is hatching an egg! Help him", app.width/2, app.height/5 + 35);
		ctx.fillText("catch the things he needs to prepare his", app.width/2, app.height/5 + 70);
		ctx.fillText("nest before the egg hatches in November 2015.", app.width/2, app.height/5 + 105);


		ctx.font = app.startButtonHeight + "px Calibri";
		ctx.textAlign = "center";
		ctx.fillStyle = "#FFFF00";
		ctx.fillText("Click to get down to business!", app.width/2, app.height*3/4, app.startButtonMaxWidth)
	}
	else {
		ctx.font = "italic 130px Calibri";
		ctx.textAlign = "center";
		ctx.fillStyle = "#FFFF00";
		
		ctx.fillText("Final Score " + app.score, app.width/2, app.height/2);
	}
}


function spawnItem()
{

    var itemTypeSelection = Math.random();
    //var itemImage;
	//var type;
	//var points;
	//var goodGuy;

	var fallingItem;
    //Good guys
    if(itemTypeSelection >= 0 && itemTypeSelection < 0.1) {
        fallingItem = app.items.bananas;
    }
    else if(itemTypeSelection >= 0.1 && itemTypeSelection < 0.2) {
		fallingItem = app.items.bottle;
    }
    else if(itemTypeSelection >= 0.2 && itemTypeSelection < 0.3) {
		fallingItem = app.items.ducky;
    }
	else if(itemTypeSelection >= 0.3 && itemTypeSelection < 0.4) {
		fallingItem = app.items.gnome;
	}
    else if(itemTypeSelection >= 0.4 && itemTypeSelection < 0.5) {
		fallingItem = app.items.strawberry;
    }
	else if(itemTypeSelection >= 0.5 && itemTypeSelection < 0.6) {
		fallingItem = app.items.teddy;
	}
    //Bad guys
    else if(itemTypeSelection >= 0.6 && itemTypeSelection < 0.68) {
		fallingItem = app.items.kangaroo;
    }
    else if(itemTypeSelection >= 0.68 && itemTypeSelection < 0.76) {
		fallingItem = app.items.leopard;
    }
    else if(itemTypeSelection >= 0.76 && itemTypeSelection < 0.84) {
		fallingItem = app.items.monkey;
    }
	else if(itemTypeSelection >= 0.84 && itemTypeSelection < 0.92) {
		fallingItem = app.items.ostrich;
	}
    else {
		fallingItem = app.items.snake;
    }

	var rollRange = Math.PI * 2;
	var item = {
		type : fallingItem.type,
		pos : {x:Math.random() * app.width, y:Math.random() * -app.height},
		angle : Math.random() * Math.PI,
		roll : Math.random() * rollRange - rollRange/2,
		size : 120,
		image : fallingItem.image,
		speed : 150 + 25 * app.difficulty,
		points : fallingItem.points,
		goodGuy : fallingItem.goodGuy,
		msg : fallingItem.messageText
	};
	app.objects.push(item);
}

//	Spawn all the falling items at the start
function spawnManyItems()
{
	for (var i = 0; i < 10; i++)
	{
		spawnItem();
	}
}


function spawnHorton()
{
	app.horton = {
		type : 'horton',
		pos : {x:400, y: app.height - 30},
		angle : 0,
		size : 60,
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
		app.pregnancyCounter.weeks++;
		app.pregnancyCounter.days = 0;
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
			//	kick off our animation loop
			window.requestAnimationFrame(frameUpdate);
			app.state = 'play';
		}

	}
}
