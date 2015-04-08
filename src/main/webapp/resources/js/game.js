var app = {
	
	score : 0,
	difficulty : 0,
	
	state : 'pre-play',
	
	hitScreenShakeTimer : 0,
	
	SCREEN_SHAKE_MAX_TIME : 0.5,

	keyboard_dx : 20,

	startButtonMaxWidth : 250,
	startButtonHeight : 20

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
	
	//	load some images we'll use later
	app.shipImage = new Image();
	app.shipImage.src = "resources/images/ship.png";

	//Bad guys
	app.cauldronImage = new Image();
    app.cauldronImage.src = "resources/images/cauldron.png";
    app.kangarooImage = new Image();
    app.kangarooImage.src = "resources/images/kangaroo.png";
    app.trappersImage = new Image();
    app.trappersImage.src = "resources/images/trappers.png";
    app.wickershamImage = new Image();
    app.wickershamImage.src = "resources/images/wickersham.png";

    //Good guys
    app.bananasImage = new Image();
    app.bananasImage.src = "resources/images/bananas.png";
    app.beezlenutsImage = new Image();
    app.beezlenutsImage.src = "resources/images/beezlenuts.png";
    app.cloverImage = new Image();
    app.cloverImage.src = "resources/images/clover.png";
    app.gnomesImage = new Image();
    app.gnomesImage.src = "resources/images/gnomes.png";

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
	
	//	start up with one hero and randomly placed rocks
	spawnHorton();
	spawnManyItems();

	app.canvas.addEventListener('mousemove', onMouseOrTouchMove, false);
	app.canvas.addEventListener('touchmove', onMouseOrTouchMove, false);
	app.canvas.addEventListener('keydown', onKeyDown, false);
	app.canvas.addEventListener('mousedown', onMouseDown, false);
	
	drawScene();

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
		app.difficulty += dt;
		app.score = Math.floor(app.difficulty * 10);
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
	
	//	object updating (movement, rotation, etc.)
	for (var i = app.objects.length - 1; i >= 0; i--)
	{
		var o = app.objects[i];
		
		if (o.roll)	//	update roll/orientation
		{
			o.angle += o.roll * dt;
		}
		
		if (o.type === 'rock')
		{
			if (o.speed)
			{
				o.pos.y += o.speed * dt;	//	move rock down the screen
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
				var dx = app.hero.pos.x - o.pos.x;
				var dy = app.hero.pos.y - o.pos.y;
				var dist = Math.sqrt(dx*dx + dy*dy);	//	distance formula
				
				//	this should be some other non-hardcoded distance check value,
				//	but it'll need to be fine-tuned anyway for game feel
				if (dist < 50)
				{
					app.hitScreenShakeTimer = 0.1;	//	start screen shake effect timer
					
					app.hitSound.play();
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
	
	//	screen shake
	if (app.hitScreenShakeTimer > 0)
	{
		ctx.translate(Math.random() * 20 - 5, Math.random() * 20 - 5);
	}
	
	//	draw objects
	for (var i = 0; i < app.objects.length; i++)
	{
		var o = app.objects[i];
		
		//	don't draw hero outside of normal play state
		if (o.type === 'hero' && app.state !== 'play')
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
		ctx.textAlign = "right";
		ctx.fillStyle = "#FFFF00";
		
		ctx.fillText("Score " + app.score, app.width/2, 40);
	}
	else if(app.state === 'pre-play') {
		ctx.font = "30px Calibri";
		ctx.textAlign = "center";
		ctx.fillStyle = "#FFFF00";
		ctx.fillText("Horton is hatching an egg! Help him", app.width/2, app.height/4 + 35);
		ctx.fillText("catch the things he needs to prepare his", app.width/2, app.height/4 + 70);
		ctx.fillText("nest before the egg hatches in November 2015.", app.width/2, app.height/4 + 105);


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

//	Spawn a single rock
function spawnItem()
{

    var itemTypeSelection = Math.random();
    var itemImage;
    //Bad guys
    if(itemTypeSelection >= 0 && itemTypeSelection < 0.15) {
        itemImage = app.kangarooImage;
    }
    else if(itemTypeSelection >= 0.15 && itemTypeSelection < 0.3) {
        itemImage = app.cauldronImage;
    }
    else if(itemTypeSelection >= 0.3 && itemTypeSelection < 0.4) {
        itemImage = app.wickershamImage;
    }
    else if(itemTypeSelection >= 0.4 && itemTypeSelection < 0.5) {
        itemImage = app.trappersImage;
    }
    //Good guys
    else if(itemTypeSelection >= 0.5 && itemTypeSelection < 0.65) {
        itemImage = app.bananasImage;
    }
    else if(itemTypeSelection >= 0.65 && itemTypeSelection < 0.8) {
        itemImage = app.beezlenutsImage;
    }
    else if(itemTypeSelection >= 0.8 && itemTypeSelection < 0.9) {
        itemImage = app.cloverImage;
    }
    else {
        itemImage = app.gnomesImage;
    }

	var rollRange = Math.PI * 2;
	var rock = {
		type : 'rock',
		pos : {x:Math.random() * app.width, y:Math.random() * -app.height},
		angle : Math.random() * Math.PI,
		roll : Math.random() * rollRange - rollRange/2,
		size : 120,
		image : itemImage,
		speed : 150 + 25 * app.difficulty
	};
	app.objects.push(rock);
}

//	Spawn all the rocks at the start
function spawnManyItems()
{
	for (var i = 0; i < 10; i++)
	{
		spawnItem();
	}
}


function spawnHorton()
{
	app.hero = {
		type : 'hero',
		pos : {x:400, y: app.height - 30},
		angle : 0,
		size : 60,
		image : app.shipImage
	};
	app.objects.push(app.hero);
}

function onKeyDown(event) {

    if(app.state === 'play') {
        switch (event.keyCode) {
            case 37:  /* Left arrow was pressed */
                if (app.hero.pos.x - app.keyboard_dx > 0) {
                    app.hero.pos.x -= app.keyboard_dx;
                }
                break;
            case 39:  /* Right arrow was pressed */
                if (app.hero.pos.x + app.keyboard_dx < app.width) {
                    app.hero.pos.x += app.keyboard_dx;
                }
                break;
        }
    }
}


function onMouseOrTouchMove(event) {
	if (app.state === 'play')
	{
		app.hero.pos.x = event.pageX;
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
