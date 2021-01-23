/**
 * @author       @jvalen <javiervalenciaromero@gmail.com>
 * @copyright    2015 Javier Valencia Romero
 */

import Phaser from "phaser";

export default class extends Phaser.State {
  preload() {
    this.load.image("preloader", "./assets/images/intro_jFace.png");
  }

  create() {
    this.game.input.maxPointers = 1;

    if (this.game.device.desktop) {
      this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
      this.scale.pageAlignHorizontally = true;
      this.scale.pageAlignVertically = true;
    } else {
      this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
      this.scale.pageAlignHorizontally = true;
      this.scale.pageAlignVertically = true;
      this.scale.refresh();

      this.scale.forceOrientation(false, true);
      this.scale.setResizeCallback(this.gameResized, this);
      this.scale.enterIncorrectOrientation.add(
        this.enterIncorrectOrientation,
        this
      );
      this.scale.leaveIncorrectOrientation.add(
        this.leaveIncorrectOrientation,
        this
      );
    }
    this.game.state.start("PreLoader");
  }

  gameResized(width, height) {}

  enterIncorrectOrientation() {
    this.game.orientated = false;
    document.getElementById("orientation").style.display = "block";
  }

  leaveIncorrectOrientation() {
    this.game.orientated = true;
    document.getElementById("orientation").style.display = "none";
  }
}
