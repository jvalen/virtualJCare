/**
 * @author       @jvalen <javiervalenciaromero@gmail.com>
 * @copyright    2015 Javier Valencia Romero
 */

/**
 * StatsUpdateItem class
 * @param {object} game Phaser.Game
 * @param {object} position
 * @param {number} amount
 * @param {boolean} positive
 * @constructor
 * @extends {Phaser.Text}
 */
let StatsUpdateItem = function (game, position, amount, positive) {
  var style = {
      font: "25px Arial",
      fill: positive ? "#24FF00" : "#CA1515",
    },
    text = (positive ? "+" : "") + "" + amount;

  Phaser.Text.call(this, game, position.x, position.y, text, style);

  //Location
  this.anchor.setTo(0.5);

  //StatsUpdateItem properties
  this.amount = amount;
  this.positive = positive;

  //Set up tweens
  game.add
    .tween(this)
    .to({ y: position.y + 50 }, 1500, Phaser.Easing.Linear.None, true);
  game.add.tween(this).to({ alpha: 0 }, 1500, Phaser.Easing.Linear.None, true);
};
StatsUpdateItem.prototype = Object.create(Phaser.Text.prototype);
StatsUpdateItem.prototype.constructor = StatsUpdateItem;

/**
 * Reset object
 * @param {object} position
 * @param {number} amount
 * @param {boolean} positive
 */
StatsUpdateItem.prototype.reset = function (position, amount, positive) {
  Phaser.Text.prototype.reset.call(this, position.x, position.y);
  this.amount = amount;
  this.positive = positive;
};

export default StatsUpdateItem;
