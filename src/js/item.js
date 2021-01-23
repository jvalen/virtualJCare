/**
 * @author       @jvalen <javiervalenciaromero@gmail.com>
 * @copyright    2015 Javier Valencia Romero
 */

/**
 * Item class
 * @param {object} game Phaser.Game
 * @param {object} position
 * @param {object} properties
 * @constructor
 * @extends {Phaser.Sprite}
 */
let Item = function (game, position, properties) {
  Phaser.Sprite.call(this, game, position.x, position.y, "items");

  //Location
  this.x = position.x;
  this.y = position.y;
  this.anchor.setTo(0.5);

  //Sprite Type
  /*
		0: Chocolate
		1: Fruit
		2: Medicine
		3: skipRope
		4: Rock
	*/
  this.frame = properties.spriteType;

  //Item properties
  this.customParams = properties.statsImpact;

  //Physics
  game.physics.enable(this, Phaser.Physics.ARCADE);
  this.body.collideWorldBounds = true;
  this.body.gravity.y = properties.gravity;
  this.body.maxVelocity.y = properties.maxSpeed;

  //Explosion emitter
  this.explosionEmitter = game.add.emitter(this.x, this.y, 10);

  //Explosion sounds
  this.explosionSound = game.add.audio("hit");

  //Rotate item
  this.rotateTween;
};
Item.prototype = Object.create(Phaser.Sprite.prototype);
Item.prototype.constructor = Item;

/**
 * Reset Item features
 * @param {object} position
 * @param {object} properties
 * @param {object} properties
 */
Item.prototype.reset = function (position, properties) {
  Phaser.Sprite.prototype.reset.call(this, position.x, position.y);
  if (!!this.rotateTween) {
    this.rotateTween.pause();
  }
  this.angle = 0;
  this.customParams = properties.statsImpact;
  this.frame = properties.spriteType;
  this.body.collideWorldBounds = true;
  this.outOfBoundsKill = false;
};

/**
 * Set Item to be thrown
 * @param {object} velocity
 */
Item.prototype.setThrowProperties = function (velocity) {
  this.body.collideWorldBounds = false;
  this.checkWorldBounds = true;
  this.outOfBoundsKill = true;
  this.body.velocity.setTo(velocity.x, velocity.y);
  if (!this.rotateTween) {
    this.rotateTween = this.game.add
      .tween(this)
      .to({ angle: 359 }, 1000, Phaser.Easing.Linear.None, true, null, -1);
  } else {
    this.rotateTween.start();
  }
};

/**
 * Set Item to be thrown
 * @param {boolean} explode
 */
Item.prototype.kill = function (explode) {
  Phaser.Sprite.prototype.kill.call(this);
  if (explode) {
    this.explosionSound.play("", 0, 1, false);
    this.explosionEmitter.x = this.x;
    this.explosionEmitter.y = this.y;
    this.explosionEmitter.makeParticles("auraParticle");
    this.explosionEmitter.minParticleSpeed.setTo(-200, -200);
    this.explosionEmitter.maxParticleSpeed.setTo(200, 200);
    this.explosionEmitter.gravity = 0;
    this.explosionEmitter.start(true, 100, null, 10);
  }
};

export default Item;
