/**
* @author       @jvalen <javiervalenciaromero@gmail.com>
* @copyright    2015 Javier Valencia Romero
*/

window.onload = function () {
  'use strict';

  var game,
      ns = window['virtualJCare'];

  game = new Phaser.Game(360, 640, Phaser.CANVAS);
  game.state.add('boot', ns.Boot);
  game.state.add('preloader', ns.Preloader);
  game.state.add('mainMenu', ns.MainMenu);
  game.state.add('game', ns.Game);

  game.state.start('boot');
};
