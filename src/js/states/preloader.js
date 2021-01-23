/**
 * @author       @jvalen <javiervalenciaromero@gmail.com>
 * @copyright    2015 Javier Valencia Romero
 */

import Phaser from "phaser";

export default class extends Phaser.State {
  init() {
    this.asset = null;
    this.ready = false;
  }

  preload() {
    var stamp = "?" + new Date().getTime();

    this.asset = this.add.sprite(
      this.game.world.bounds.width / 2,
      this.game.world.bounds.height / 2,
      "preloader"
    );
    this.asset.anchor.setTo(0.5, 0.5);

    this.load.onLoadComplete.addOnce(this.onLoadComplete, this);
    this.load.setPreloadSprite(this.asset);

    this.load.image("introFar", "./src/assets/images/intro_far.png");
    this.load.image("introMid", "./src/assets/images/intro_mid.png");
    this.load.image("introClose", "./src/assets/images/intro_close.png");
    this.load.image("introJFace", "./src/assets/images/intro_jFace.png");

    this.load.image("auraParticle", "./src/assets/images/aura-particle.png");

    this.load.spritesheet(
      "headHero",
      "./src/assets/sprites/head-sprite.png",
      80,
      80
    );
    this.load.spritesheet(
      "bodyHero",
      "./src/assets/sprites/body-sprite.png",
      80,
      80
    );
    this.load.spritesheet("items", "./src/assets/sprites/items.png", 50, 50);
    this.load.spritesheet(
      "buttons",
      "./src/assets/sprites/buttons.png",
      70,
      70
    );
    this.load.spritesheet(
      "button-retry",
      "./src/assets/sprites/button-retry.png",
      225,
      112
    );
    this.load.spritesheet(
      "button-fb",
      "./src/assets/images/facebook_button.png",
      64,
      64
    );
    this.load.spritesheet(
      "button-twitter",
      "./src/assets/images/twitter_button.png",
      64,
      64
    );

    this.load.image("roomKid", "./src/assets/images/roomKid.jpg");
    this.load.image("panelTime", "./src/assets/images/panel-time.png");

    this.game.load.audio("kidLevelMusic", [
      "./src/assets/sounds/kidLevel.ogg",
      "./src/assets/sounds/kidLevel.mp3",
    ]);
    this.game.load.audio("mainMenuMusic", [
      "./src/assets/sounds/mainMenu.ogg",
      "./src/assets/sounds/mainMenu.mp3",
    ]);
    this.game.load.audio("aura", [
      "./src/assets/sounds/aura.ogg",
      "./src/assets/sounds/aura.mp3",
    ]);
    this.game.load.audio("gameover", [
      "./src/assets/sounds/gameover.ogg",
      "./src/assets/sounds/gameover.mp3",
    ]);
    this.game.load.audio("explosion", [
      "./src/assets/sounds/explosion.ogg",
      "./src/assets/sounds/explosion.mp3",
    ]);
    this.game.load.audio("hit", [
      "./src/assets/sounds/hit.ogg",
      "./src/assets/sounds/hit.mp3",
    ]);

    //load level data
    this.load.text("conf", "./src/assets/data/conf.json" + stamp);

    //Load font
    this.load.bitmapFont(
      "minecraftia",
      "./src/assets/minecraftia.png",
      "./src/assets/minecraftia.xml"
    );
  }

  create() {
    this.asset.cropEnabled = false;
  }

  update() {
    if (
      !!this.ready &&
      this.cache.isSoundDecoded("kidLevelMusic") &&
      this.cache.isSoundDecoded("mainMenuMusic") &&
      this.cache.isSoundDecoded("aura") &&
      this.cache.isSoundDecoded("gameover") &&
      this.cache.isSoundDecoded("hit") &&
      this.cache.isSoundDecoded("explosion")
    ) {
      //We need to be sure that all the audio is decoded before go farther
      this.game.state.start("MainMenu");
    }
  }

  onLoadComplete() {
    this.ready = true;
  }
}
