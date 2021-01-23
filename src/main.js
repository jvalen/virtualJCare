import "pixi";
import "p2";
import Phaser from "phaser";

import BootState from "./js/states/boot";
import PreLoaderState from "./js/states/preloader";
import MainMenuState from "./js/states/mainMenu";
import GameState from "./js/states/game";

import config from "./config";

class Game extends Phaser.Game {
  constructor() {
    const docElement = document.documentElement;
    const width =
      docElement.clientWidth > config.gameWidth
        ? config.gameWidth
        : docElement.clientWidth;
    const height =
      docElement.clientHeight > config.gameHeight
        ? config.gameHeight
        : docElement.clientHeight;

    super(width, height, Phaser.CANVAS, "content", null);

    this.state.add("Boot", BootState, false);
    this.state.add("PreLoader", PreLoaderState, false);
    this.state.add("MainMenu", MainMenuState, false);
    this.state.add("Game", GameState, false);

    this.state.start("Boot");
  }
}

window.game = new Game();
