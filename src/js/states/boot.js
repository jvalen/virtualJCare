/**
* @author       @jvalen <javiervalenciaromero@gmail.com>
* @copyright    2015 Javier Valencia Romero
*/

(function () {
  'use strict';

  function Boot() {}

  Boot.prototype = {
    preload: function () {
      this.load.image('preloader', 'assets/images/intro_jFace.png');
    },

    create: function () {
      this.game.input.maxPointers = 1;

      if (this.game.device.desktop) {
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;
      } else {
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;
        this.scale.setScreenSize(true);

        this.scale.forceOrientation(false, true);
        this.scale.setResizeCallback(this.gameResized, this);
        this.scale.enterIncorrectOrientation.add(
            this.enterIncorrectOrientation,
            this);
        this.scale.leaveIncorrectOrientation.add(
            this.leaveIncorrectOrientation,
            this);
      }
      this.game.state.start('preloader');
    },
    gameResized: function (width, height) {

    },
    enterIncorrectOrientation: function () {
        this.game.orientated = false;
        document.getElementById('orientation').style.display = 'block';
    },
    leaveIncorrectOrientation: function () {
        this.game.orientated = true;
        document.getElementById('orientation').style.display = 'none';
    }
  };

  window['virtualJCare'] = window['virtualJCare'] || {};
  window['virtualJCare'].Boot = Boot;

}());
