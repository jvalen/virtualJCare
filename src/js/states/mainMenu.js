/**
 * @author       @jvalen <javiervalenciaromero@gmail.com>
 * @copyright    2015 Javier Valencia Romero
 */

import Phaser from "phaser";

export default class extends Phaser.State {
  init() {
    this.titleTxt = null;
    this.startTxt = null;
    this.reasonTxt = null;
  }

  preload() {
    //Get config data
    this.confData = JSON.parse(this.game.cache.getText("conf"));
    this.locale = "en";

    //Turn on music
    this.mainMenuMusic = this.game.add.audio("mainMenuMusic");
    this.mainMenuMusic.play("", 0, 1, true);
  }
  init(messages) {
    this.messages = messages;
  }
  create() {
    var x = this.game.width / 2,
      y = this.game.height / 2;

    this.game.stage.backgroundColor = "#0c1b33";

    //Title screen text
    this.titleTxt = this.add.bitmapText(
      x,
      60,
      "minecraftia",
      this.confData.mainMenu.title,
      40
    );
    this.titleTxt.align = "center";
    this.titleTxt.x = this.game.width / 2 - this.titleTxt.textWidth / 2;

    y = this.titleTxt.y + this.titleTxt.height + 50;

    //Help me message text
    this.helpmeMessage = this.add.bitmapText(
      this.game.width,
      this.game.height - 250,
      "minecraftia",
      this.confData.text[this.locale].helpMessage,
      20
    );
    this.helpmeMessage.align = "left";
    this.helpmeMessage.tint = 0x46649c;
    var helpmeMessageTween = this.game.add.tween(this.helpmeMessage);
    helpmeMessageTween.to(
      { x: -this.helpmeMessage.width },
      this.confData.mainMenu.helpmeSpeed
    );

    //Parallax and intro setup
    this.levelFarSpeed = this.confData.mainMenu.levelFarSpeed;
    this.introFar = this.add.tileSprite(
      0,
      this.game.height - 250,
      this.game.world.width,
      256,
      "introFar"
    );
    this.introFar.autoScroll(-this.levelFarSpeed, 0);

    this.levelMidSpeed = this.confData.mainMenu.levelMidSpeed;
    this.introMid = this.add.tileSprite(
      0,
      this.game.height - 256,
      this.game.world.width,
      256,
      "introMid"
    );
    this.introMid.autoScroll(-this.levelMidSpeed, 0);

    this.levelCloseSpeed = this.confData.mainMenu.levelCloseSpeed;
    this.introClose = this.game.add.sprite(
      0,
      this.game.height - 256,
      "introClose"
    );
    var groundIntroTween = this.game.add.tween(this.introClose);
    groundIntroTween.to({ x: -100 }, this.levelCloseSpeed);
    groundIntroTween.start();

    //Credits
    this.creditsTxt = this.add.bitmapText(
      x,
      5,
      "minecraftia",
      "By @jvalen",
      10
    );
    this.creditsTxt.align = "left";
    this.creditsTxt.x = this.game.width - this.creditsTxt.textWidth - 10;
    this.creditsTxt.inputEnabled = true;
    this.creditsTxt.events.onInputDown.add(function () {
      var url = "http://www.jvrpath.com";
      window.open(url, "_blank");
    }, this);

    groundIntroTween.onComplete.add(function () {
      //Stop animation and set stopped frame
      helpmeMessageTween.start();
      this.startTxt = this.add.bitmapText(
        x,
        y,
        "minecraftia",
        "| " + this.confData.text[this.locale].touchScreen.toUpperCase() + " |",
        14
      );
      this.startTxt.align = "center";
      this.startTxt.x = this.game.width / 2 - this.startTxt.textWidth / 2;

      this.timerBlickTitle = this.game.time.create(false);
      this.timerBlickTitle.loop(500, this.updateBlinkTitleCounter, this);
      this.timerBlickTitle.start();

      this.input.onDown.add(this.onDown, this);
    }, this);
  }
  /**
   * Blinking text effect
   */
  updateBlinkTitleCounter() {
    if (this.startTxt.exists) {
      this.startTxt.kill();
    } else {
      this.startTxt.revive();
    }
  }
  update() {}
  /**
   * Behaviour when there is input done
   */
  onDown() {
    this.mainMenuMusic.stop();
    this.game.state.start("Game");
  }
}
