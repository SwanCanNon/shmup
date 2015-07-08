
BasicGame.Game = function (game) {

};

BasicGame.Game.prototype = {
  //preload for necessary assets, preloader disabled during dev
  preload: function() {
    this.load.image('sea', 'assets/sea.png');
    this.load.image('bullet', 'assets/bullet.png');
    this.load.spritesheet('greenEnemy', 'assets/enemy.png', 32, 32);
    this.load.spritesheet('explosion', 'assets/explosion.png', 32, 32);
    this.load.spritesheet('player', 'assets/player.png', 64, 64)
    },

  create: function () {

    this.sea = this.add.tileSprite(0, 0, 800, 600, 'sea');

    this.player = this.add.sprite(400, 550, 'player');
    this.player.anchor.setTo(0.5, 0.5);
    this.player.animations.add('fly', [0, 1, 2 ], 20, true);
    this.player.play('fly');
    this.physics.enable(this.player, Phaser.Physics.ARCADE);
    this.player.speed = 300;
    this.player.body.collideWorldBounds = true;
    //reduce hitbox size, 20x20, centered a bit above actual center
    this.player.body.setSize(20, 20, 0, -5);

    /*this.enemy = this.add.sprite(400, 200, 'greenEnemy');
    this.enemy.animations.add('fly', [0, 1, 2 ], 20, true);
    this.enemy.play('fly');
    this.enemy.anchor.setTo(0.5, 0.5);
    this.physics.enable(this.enemy, Phaser.Physics.ARCADE);*/
    this.enemyPool = this.add.group();
    this.enemyPool.enableBody = true;
    this.enemyPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.enemyPool.createMultiple(50, 'greenEnemy');
    this.enemyPool.setAll('anchor.x', 0.5);
    this.enemyPool.setAll('anchor.y', 0.5);
    this.enemyPool.setAll('outOfBoundsKill', true);
    this.enemyPool.setAll('checkWorldBounds', true);
    this.enemyPool.forEach(function (enemy) {
      enemy.animations.add('fly', [0, 1, 2 ], 20, true);
    });

    this.nextEnemyAt = 0;
    this.enemyDelay = 1000;

    /*this.bullet = this.add.sprite(400, 300, 'bullet');
    this.bullet.anchor.setTo(0.5, 0.5);
    this.physics.enable(this.bullet, Phaser.Physics.ARCADE);
    this.bullet.body.velocity.y = -200;*/
    // this.bullets = [];
    // Add an empty sprite group to the game, replacement for array of bullets
    this.bulletPool = this.add.group();

    // Enable physics for bullet group
    this.bulletPool.enableBody = true;
    this.bulletPool.physicsBodyType = Phaser.Physics.ARCADE;

    // Add 100 bullet sprites to group
    // By default, uses first frame of sprite sheet and sets initial state as non existing
    this.bulletPool.createMultiple(100, 'bullet');

    // Sets anchors for all bullets
    this.bulletPool.setAll('anchor.x', 0.5);
    this.bulletPool.setAll('anchor.y', 0.5);

    // Automatically kill bullets when they leave bounds
    this.bulletPool.setAll('outOfBoundsKill', true);
    this.bulletPool.setAll('checkWorldBounds', true);

    this.nextShotAt = 0;
    this.shotDelay = 100;

    this.cursors = this.input.keyboard.createCursorKeys();

    //Instructions screen - this should eventually be the contents of a "help" section
    this.instructions = this.add.text( 400, 500, 
      'Use Arrow Keys to Move, Press Z to Fire\n' + 
      'Tapping/clicking does both',
      { font: '20px monospace', fill: '#fff', align: 'center'}
    ); 
    this.instructions.anchor.setTo(0.5, 0.5);
    this.instExpire = this.time.now + 10000;

  },

  update: function () {
    //  Honestly, just about anything could go here. It's YOUR game after all. Eat your heart out!
    this.sea.tilePosition.y += 0.2;
    //this.bullet.y -= 1;
    /*this.physics.arcade.overlap(
      this.bullet, this.enemy, this.enemyHit, null, this);*/
/*    for (var i = 0; i < this.bullets.length; i++) {
      this.physics.arcade.overlap(
        this.bullets[i], this.enemy, this.enemyHit, null, this
        );
    }*/

    this.physics.arcade.overlap(
      // this.bulletPool. this.enemy, this.enemyHit, null, this
      this.bulletPool, this.enemyPool, this.enemyHit, null, this
    );

    this.physics.arcade.overlap(
      this.player, this.enemyPool, this.playerHit, null, this
    );

    //Random enemy spawns
    if (this.nextEnemyAt <  this.time.now && this.enemyPool.countDead() > 0) {
      this.nextEnemyAt = this.time.now + this.enemyDelay;
      var enemy = this.enemyPool.getFirstExists(false);
      //spawn at random location at the top of the screen
      enemy.reset(this.rnd.integerInRange(20, 780), 0);
      //randomize speed
      enemy.body.velocity.y = this.rnd.integerInRange(30, 60);
      enemy.play('fly');
    }

    this.player.body.velocity.x = 0;
    this.player.body.velocity.y = 0;

    if (this.cursors.left.isDown) {
      this.player.body.velocity.x = -this.player.speed;
    } else if (this.cursors.right.isDown) {
      this.player.body.velocity.x = this.player.speed;
    }

    if (this.cursors.up.isDown) {
      this.player.body.velocity.y = -this.player.speed;
    } else if (this.cursors.down.isDown) {
      this.player.body.velocity.y = this.player.speed;
    }

    if(this.input.activePointer.isDown) {
    //if (this.input.activePointer.isDown && 
    //  this.physics.arcade.distanceToPointer(this.player) > 15) {
      this.physics.arcade.moveToPointer(this.player, this.player.speed);
    }

    if (this.input.keyboard.isDown(Phaser.Keyboard.Z) ||
      this.input.activePointer.isDown) {
      this.fire();
    }

    if (this.instructions.exists && this.time.now > this.instExpire) {
      this.instructions.destroy();
    }
    
  },

  render: function() {
    //this.game.debug.body(this.bullet);
    //this.game.debug.body(this.enemy);
    this.game.debug.body(this.player);


  },

  playerHit: function (player, enemy) {
    enemy.kill();
    var explosion = this.add.sprite(player.x, player.y, 'explosion');
    explosion.anchor.setTo(0.5, 0.5);
    explosion.animations.add('boom');
    explosion.play('boom', 15, false, true);
    player.kill();
  },

  enemyHit: function (bullet, enemy) {
    bullet.kill();
    enemy.kill();
    var explosion =  this.add.sprite(enemy.x, enemy.y, 'explosion');
    explosion.anchor.setTo(0.5, 0.5);
    explosion.animations.add('boom');
    explosion.play('boom', 15, false, true);
  },

  quitGame: function (pointer) {

    //  Here you should destroy anything you no longer need.
    //  Stop music, delete sprites, purge caches, free resources, all that good stuff.

    //  Then let's go back to the main menu.
    this.state.start('MainMenu');

  },

  fire: function() {

    // if (this.nextShotAt > this.time.now) {
    if (!this.player.alive || this.nextShotAt > this.time.now) {
      return;
    }
    
    this.nextShotAt = this.time.now + this.shotDelay;

    /*var bullet = this.add.sprite(this.player.x, this.player.y - 20, 'bullet');
    bullet.anchor.setTo(0.5, 0.5);
    this.physics.enable(bullet, Phaser.Physics.ARCADE);
    bullet.body.velocity.y = -500;
    this.bullets.push(bullet);*/

    // Find first dead bullet in pool
    var bullet = this.bulletPool.getFirstExists(false);

    // Bring sprite back for use, place in new location
    bullet.reset(this.player.x, this.player.y - 20);

    bullet.body.velocity.y = -500;
  },

};
