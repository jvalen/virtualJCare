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

    this.load.image("introFar", "./assets/images/intro_far.png");
    this.load.image("introMid", "./assets/images/intro_mid.png");
    this.load.image("introClose", "./assets/images/intro_close.png");
    this.load.image("introJFace", "./assets/images/intro_jFace.png");

    this.load.image("auraParticle", "./assets/images/aura-particle.png");

    this.load.spritesheet(
      "headHero",
      "./assets/sprites/head-sprite.png",
      80,
      80
    );
    this.load.spritesheet(
      "bodyHero",
      "./assets/sprites/body-sprite.png",
      80,
      80
    );
    this.load.spritesheet("items", "./assets/sprites/items.png", 50, 50);
    this.load.spritesheet("buttons", "./assets/sprites/buttons.png", 70, 70);
    this.load.spritesheet(
      "button-retry",
      "./assets/sprites/button-retry.png",
      225,
      112
    );
    this.load.spritesheet(
      "button-fb",
      "./assets/images/facebook_button.png",
      64,
      64
    );
    this.load.spritesheet(
      "button-twitter",
      "./assets/images/twitter_button.png",
      64,
      64
    );

    this.load.image("roomKid", "./assets/images/roomKid.jpg");
    this.load.image("panelTime", "./assets/images/panel-time.png");

    this.game.load.audio("kidLevelMusic", [
      "./assets/sounds/kidLevel.ogg",
      "./assets/sounds/kidLevel.mp3",
    ]);
    this.game.load.audio("mainMenuMusic", [
      "./assets/sounds/mainMenu.ogg",
      "./assets/sounds/mainMenu.mp3",
    ]);
    this.game.load.audio("aura", [
      "./assets/sounds/aura.ogg",
      "./assets/sounds/aura.mp3",
    ]);
    this.game.load.audio("gameover", [
      "./assets/sounds/gameover.ogg",
      "./assets/sounds/gameover.mp3",
    ]);
    this.game.load.audio("explosion", [
      "./assets/sounds/explosion.ogg",
      "./assets/sounds/explosion.mp3",
    ]);
    this.game.load.audio("hit", [
      "./assets/sounds/hit.ogg",
      "./assets/sounds/hit.mp3",
    ]);

    //load level data
    this.load.text("conf", "./assets/data/conf.json" + stamp);

    //Load font
    this.load.bitmapFont(
      "minecraftia",
      "./assets/minecraftia.png",
      "./assets/minecraftia.xml"
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
