//
//	Ridiculously amazing space asteroid avoidance demo game
//	Steve Taylor, Utah Code Camp 2015
//	Permission is granted to reuse this code for any purpose.
//	The images used in this game are not freely reuseable.
//		See http://www.wahoo.com/play/html5in45/
//

//	a single nice place to store settings and vars
var app = {
	
	score : 0,
	difficulty : 0,
	
	state : 'play',
	
	explosionTimer : 0,
	
	EXPLOSION_MAX_TIME : 2,

	keyboard_dx : 20
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
	
	app.rockImage = new Image();
	app.rockImage.src = "resources/images/rock.png";
	
	app.explosionImage = new Image();
	app.explosionImage.src = "resources/images/explosion.png";

	app.explosionSound = new Audio();
	app.explosionSound.src = "resources/audio/explosion.mp3";

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
	spawnManyRocks();
	
	//	track mouse movement
	app.canvas.addEventListener('mousemove', onMouseOrTouchMove, false);
	app.canvas.addEventListener('touchmove', onMouseOrTouchMove, false);
	app.canvas.addEventListener('keydown', onKeyDown, false);
	
	//	kick off our animation loop
	window.requestAnimationFrame(frameUpdate);
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
	
	//	update explosion timer, if there is one running
	if (app.explosionTimer > 0)
	{
		app.explosionTimer += dt;
		if (app.explosionTimer > app.EXPLOSION_MAX_TIME)
		{
			app.explosionTimer = 0;
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
				spawnRock();
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
					//console.log("HIT");
					app.state = 'end';
					
					app.explosionTimer = 0.1;	//	start explosion effect timer
					
					app.explosionSound.play();
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
	if (app.explosionTimer > 0)
	{
		ctx.translate(Math.random() * 40 - 20, Math.random() * 40 - 20);
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
			//ctx.fillStyle = "#FFFF00";
			//ctx.fillRect(o.pos.x, o.pos.y, o.size, o.size);
			ctx.drawImage(o.image, -o.size/2, -o.size/2, o.size, o.size);
		ctx.restore();
	}
	
	//	draw explosion if timer is running
	if (app.explosionTimer > 0)
	{
		var interp = app.explosionTimer/app.EXPLOSION_MAX_TIME;
		
		ctx.save();
			ctx.globalAlpha = (1 - interp);
			ctx.translate(app.hero.pos.x, app.hero.pos.y);
			ctx.rotate(interp * Math.PI);
			ctx.drawImage(app.explosionImage, -app.hero.size/2, -app.hero.size/2, 100, 100);
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
	} else {
		ctx.font = "italic 130px Calibri";
		ctx.textAlign = "center";
		ctx.fillStyle = "#FFFF00";
		
		ctx.fillText("Final Score " + app.score, app.width/2, app.height/2);
	}
}

//	Spawn a single rock
function spawnRock()
{
	var rollRange = Math.PI * 2;
	var rock = {
		type : 'rock',
		pos : {x:Math.random() * app.width, y:Math.random() * -app.height},
		angle : Math.random() * Math.PI,
		roll : Math.random() * rollRange - rollRange/2,
		size : 120,
		image : app.rockImage,
		speed : 150 + 25 * app.difficulty,
	};
	app.objects.push(rock);
};

//	Spawn all the rocks at the start
function spawnManyRocks()
{
	for (var i = 0; i < 10; i++)
	{
		spawnRock();
	}
};


function spawnHorton()
{
	app.hero = {
		type : 'hero',
		pos : {x:400, y: app.height - 30},
		angle : 0,
		size : 60,
		image : app.shipImage,
	};
	app.objects.push(app.hero);
};

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
};


function onMouseOrTouchMove(event) {
	if (app.state === 'play')
	{
		app.hero.pos.x = event.pageX;
	}
};
