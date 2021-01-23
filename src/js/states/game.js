/**
 * @author       @jvalen <javiervalenciaromero@gmail.com>
 * @copyright    2015 Javier Valencia Romero
 */

import Phaser from "phaser";
import {
  getLocalItem,
  saveLocalItem,
  shuffle,
  getRandomInt,
  findChild,
} from "../util";
import Character from "../character";
import Item from "../item";
import StatsUpdateItem from "../statsUpdateItem";

export default class extends Phaser.State {
  create() {
    //Setup data
    this.confData = JSON.parse(this.game.cache.getText("conf"));
    this.ITEM_WIDTH = this.confData.items.width;
    this.locale = "en";

    //For debugging purpose
    //this.game.time.advancedTiming = true;

    //General resets
    this.gameOverFlag = false;
    this.uiBlocked = false;
    this.jumpTimer = 0;
    this.jumping = false;
    this.decreaseStatAmount = this.confData.decreaseStatAmount;

    //Game physics
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.game.physics.arcade.gravity.y = this.confData.physics.gravity;

    if (this.game.world.bounds.height === this.game.height) {
      this.newWorldBoundaries = {
        width: this.game.world.bounds.width,
        height:
          this.game.world.bounds.height - this.game.world.bounds.height / 4,
      };

      //Reduce world y axis boundaries
      this.game.world.setBounds(
        0,
        0,
        this.newWorldBoundaries.width,
        this.newWorldBoundaries.height
      );
    }

    //Background
    this.background = this.game.add.sprite(0, 0, "roomKid");
    this.background.inputEnabled = true;
    this.background.events.onInputDown.add(this.walkTo, this);

    //Panel Image
    this.panelTimeImage = this.game.add.sprite(0, 0, "panelTime");

    //Time counter
    this.timeCounter = this.game.add.text(265, 32, "0", {
      font: "12px Arial",
      fill: "#ffffff",
      align: "center",
    });
    this.timeCounter.anchor.setTo(0.5, 0.5);
    this.timeCounter.count = 0;

    //Time highscore
    var highscoreData = getLocalItem("highscore");
    if (!highscoreData) {
      highscoreData = 0;
      saveLocalItem("highscore", 0);
    }
    this.highscore = this.game.add.text(85, 32, "0", {
      font: "12px Arial",
      fill: "#ffffff",
      align: "center",
    });
    this.highscore.anchor.setTo(0.5, 0.5);
    this.highscore.setText(highscoreData);

    //Sounds
    this.sounds = {
      kidLevelMusic: this.game.add.audio("kidLevelMusic"),
      gameover: this.game.add.audio("gameover"),
    };

    //Characters
    this.characters = this.game.add.group();
    this.character = new Character(
      this.game,
      {
        x: 0,
        y: 0,
      },
      this.confData.character
    );
    this.characters.add(this.character);
    this.character.enableClick();
    this.newWorldBoundaries["floorHeight"] =
      this.newWorldBoundaries.height - this.character.height;

    //Item pool
    this.itemsGroup = this.add.group();
    this.itemsGroup.enableBody = true;

    //Create UI
    this.createUi();

    //Init music
    this.sounds.kidLevelMusic.play("", 0, 0.2, true);

    //Decrease the stats every n seconds
    this.statsDecreaser = this.game.time.create(false);
    this.statsDecreaser.loop(Phaser.Timer.SECOND, this.reduceProperties, this);
    this.statsDecreaser.start();

    this.timerTimeUpdate = this.game.time.create(false);
    this.timerTimeUpdate.loop(
      Phaser.Timer.SECOND,
      this.updateTimeCounter,
      this
    );
    this.timerTimeUpdate.start();

    //Throw Rocks Timer
    this.rockIntervalTime =
      Phaser.Timer.SECOND * this.confData.timers.rockInterval;
    this.timerThrowRock = this.game.time.events.loop(
      this.rockIntervalTime,
      this.throwRock,
      this
    );
    this.timerThrowRock.timer.start();

    //Load cloth changing events
    this.clothChangeTimeArray = this.confData.timers.clothChangeArray;
    this.costumeAvailableArray = this.confData.costumes.availabilityArray;
    this.totalHeadCostumes = this.confData.costumes.headAmount;
    this.totalBodyCostumes = this.confData.costumes.bodyAmount;
    this.costumeAvailableArray = shuffle(this.costumeAvailableArray);

    //Create stage events
    this.costumeAvailableArray.forEach(function (elem, index) {
      this.timerTimeUpdate.add(
        Phaser.Timer.SECOND * this.clothChangeTimeArray[index],
        function () {
          var self = this,
            callback = function (e) {
              var randomBoost = {
                health: getRandomInt(
                  self.confData.points.boost.health.min,
                  self.confData.points.boost.health.max
                ),
                fun: getRandomInt(
                  self.confData.points.boost.fun.min,
                  self.confData.points.boost.fun.max
                ),
                nutrition: getRandomInt(
                  self.confData.points.boost.nutrition.min,
                  self.confData.points.boost.nutrition.max
                ),
              };

              self.character.updateClothing(e.part, e.id);

              //Increase rock frecuency
              self.rockIntervalTime -=
                self.rockIntervalTime / self.confData.rockFrecuencyDivisor;
              self.timerThrowRock.delay = self.rockIntervalTime;

              self.refreshStats(randomBoost);
            };
          this.character.showAura(callback, elem);
        },
        this
      );
    }, this);

    //Create last stage events
    this.timerTimeUpdate.add(
      Phaser.Timer.SECOND *
        this.clothChangeTimeArray[this.clothChangeTimeArray.length - 1],
      function () {
        var self = this,
          callback = function (e) {
            self.character.updateClothing(e.part, e.id);
          };
        this.character.showAura(callback, {
          part: "body",
          id: this.totalBodyCostumes,
        });
        this.character.showAura(callback, {
          part: "head",
          id: this.totalHeadCostumes,
        });
      },
      this
    );
  }

  update() {
    //Check for collisions between items and character
    this.itemsGroup.forEachAlive(function (item) {
      this.game.physics.arcade.overlap(
        this.character,
        item,
        function () {
          //Update stats and kill the item
          if (item.frame != this.confData.items.rock.rockItemId) {
            //Regular item
            item.kill();
            this.character.head.animations.play("eat");
            this.clearSelection();
            this.uiBlocked = false;
          } else {
            //Rock item
            item.kill(true);
            this.character.head.animations.play("annoyed");
          }
          this.refreshStats(item.customParams);
        },
        null,
        this
      );
    }, this);

    //Check if character jump is finished
    if (this.jumping) {
      if (this.character.body.y >= this.newWorldBoundaries.floorHeight) {
        this.jumping = false;
        this.uiBlocked = false;
        this.clearSelection();
      }
    }
  }

  render() {
    //Render FPS
    //this.game.debug.text(this.game.time.fps || '--', 5, 20, "#00ff00");
  }

  /**
   * Update time counter
   */
  updateTimeCounter() {
    this.timeCounter.count++;
    this.timeCounter.setText(this.timeCounter.count);
  }

  /**
   * Throw item from the top
   * @param {number} spriteType
   * @param {object} currentProperties
   * @param {object} event
   */
  throwItem(spriteType, currentProperties, event) {
    var item = this.itemsGroup.getFirstExists(false),
      positionY = -this.ITEM_WIDTH,
      randomXposition = getRandomInt(
        this.ITEM_WIDTH,
        this.game.world.width - this.ITEM_WIDTH
      ),
      properties = {
        gravity: this.confData.items.gravity,
        maxSpeed: this.confData.items.maxVelocity,
        statsImpact: currentProperties,
        spriteType: spriteType,
      };

    //Item pool: create an item if there are no dead items to reuse
    if (!item) {
      item = new Item(
        this.game,
        {
          x: randomXposition,
          y: positionY,
        },
        properties
      );
      this.itemsGroup.add(item);
    } else {
      //reset position
      item.reset(
        {
          x: randomXposition,
          y: positionY,
        },
        properties
      );
    }

    this.walkTo(this.background, null, { x: randomXposition, y: positionY });
  }
  /**
   * Throw dangerous item
   */
  throwRock() {
    var item = this.itemsGroup.getFirstExists(false),
      positionX =
        Math.random() < 0.5
          ? this.ITEM_WIDTH
          : this.newWorldBoundaries.width - this.ITEM_WIDTH + 1,
      randomYposition = getRandomInt(
        this.ITEM_WIDTH,
        this.game.world.height / 2
      ),
      currentProperties = {
        health: getRandomInt(
          this.confData.items.rock.impact.min,
          this.confData.items.rock.impact.max
        ),
        fun: getRandomInt(
          this.confData.items.rock.impact.min,
          this.confData.items.rock.impact.max
        ),
        nutrition: getRandomInt(
          this.confData.items.rock.impact.min,
          this.confData.items.rock.impact.max
        ),
      },
      spriteType = this.confData.items.rock.rockItemId,
      velocity = {
        x:
          positionX === this.ITEM_WIDTH
            ? this.confData.items.rock.velocity.x.min
            : this.confData.items.rock.velocity.x.max,
        y: this.confData.items.rock.velocity.x.min,
      },
      properties = {
        gravity: this.confData.items.gravity,
        maxSpeed: this.confData.items.maxVelocity,
        statsImpact: currentProperties,
        spriteType: spriteType,
      };

    if (!item) {
      item = new Item(
        this.game,
        {
          x: positionX,
          y: randomYposition,
        },
        properties
      );
      this.itemsGroup.add(item);
    } else {
      //reset position
      item.reset(
        {
          x: positionX,
          y: randomYposition,
        },
        properties
      );
    }

    item.setThrowProperties(velocity);
  }
  /**
   * Create an StatsUpdateItem object
   * @param {object} position
   * @param {number} amount
   * @param {boolean} positive
   */
  showStatsUpdateInfo(position, amount, positive) {
    var statsUpdateItem = this.statsUpdateInfoGroup.getFirstExists(false);

    //statsUpdateItem pool: create an StatsUpdateItem if there are no dead items to reuse
    if (!statsUpdateItem) {
      statsUpdateItem = new StatsUpdateItem(
        this.game,
        { x: position.x, y: position.y },
        amount,
        positive
      );
      this.statsUpdateInfoGroup.add(statsUpdateItem);
    } else {
      //reset position
      statsUpdateItem.reset({ x: position.x, y: position.y }, amount, positive);
    }
  }
  /**
   * Play level music
   * @param {object} position
   * @param {number} amount
   * @param {boolean} positive
   */
  playLevelMusic() {
    this.sounds.kidLevelMusic.play("", 0, 1, true);
  }
  /**
   * Create UI
   */
  createUi() {
    var buttonsData = this.confData.buttons,
      screenButtonSize = this.game.width / buttonsData.sizeDivisor,
      buttonsCollection = buttonsData.info.collection,
      buttonArrayInfo = [],
      currentButton,
      currentXpos;

    //Setup buttons
    for (var i = 0; i < buttonsCollection.length; i++) {
      //Main properties
      currentButton = {
        name: buttonsCollection[i].name,
        spritesheet: buttonsCollection[i].spritesheet,
        y: this.game.height + buttonsCollection[i].offsetY,
        frame: buttonsCollection[i].frame,
        type: buttonsCollection[i].type,
        customParams: buttonsCollection[i].customParams,
      };

      //Button x position
      if (buttonsCollection[i].order === 1) {
        currentButton["x"] = screenButtonSize / 2;
      } else if (buttonsCollection[i].order === buttonsCollection[i].length) {
        currentButton["x"] = this.game.width - screenButtonSize / 2;
      } else {
        currentButton["x"] =
          screenButtonSize * buttonsCollection[i].order - screenButtonSize / 2;
      }

      buttonArrayInfo.push(currentButton);
    }

    //Create button items
    this.buttons = [];

    for (var i = 0; i < buttonArrayInfo.length; i++) {
      var currentItem = buttonArrayInfo[i];

      this[currentItem.name] = this.game.add.sprite(
        currentItem.x,
        currentItem.y,
        currentItem.spritesheet
      );
      this[currentItem.name].frame = currentItem.frame;
      this[currentItem.name].type = currentItem.type;
      this[currentItem.name].anchor.setTo(0.5);
      this[currentItem.name].inputEnabled = true;
      this[currentItem.name].customParams = currentItem.customParams;
      this[currentItem.name].events.onInputDown.add(this.selectOption, this);
      this.buttons.push(this[currentItem.name]);
    }

    //Nothing is selected
    this.selectedItem = null;

    //Stat fields
    var labelCount = 3,
      labelPortion = this.world.width / labelCount,
      position1 = 0 + labelPortion / 2,
      position2 = labelPortion + labelPortion / 2,
      position3 = labelPortion * 2 + labelPortion / 2;

    //Labels of property counters
    this.healthLabel = this.game.add.bitmapText(
      position1,
      70,
      "minecraftia",
      this.confData.text[this.locale].health,
      16
    );
    this.healthLabel.position.x =
      this.healthLabel.position.x - this.healthLabel.textWidth / 2;

    this.funLabel = this.game.add.bitmapText(
      position2,
      70,
      "minecraftia",
      this.confData.text[this.locale].fun,
      16
    );
    this.funLabel.position.x =
      this.funLabel.position.x - this.funLabel.textWidth / 2;

    this.nutritionLabel = this.game.add.bitmapText(
      position3,
      70,
      "minecraftia",
      this.confData.text[this.locale].nutrition,
      16
    );
    this.nutritionLabel.position.x =
      this.nutritionLabel.position.x - this.nutritionLabel.textWidth / 2;

    //Character property counters
    this.healthCounter = this.game.add.bitmapText(
      position1,
      100,
      "minecraftia",
      "00",
      35
    );
    this.healthCounter.position.x =
      this.healthCounter.position.x - this.healthCounter.textWidth / 2;

    this.funCounter = this.game.add.bitmapText(
      position2,
      100,
      "minecraftia",
      "00",
      35
    );
    this.funCounter.position.x =
      this.funCounter.position.x - this.funCounter.textWidth / 2;

    this.nutritionCounter = this.game.add.bitmapText(
      position3,
      100,
      "minecraftia",
      "00",
      35
    );
    this.nutritionCounter.position.x =
      this.nutritionCounter.position.x - this.nutritionCounter.textWidth / 2;

    //statUpdateItem pool
    this.statsUpdateInfoGroup = this.add.group();

    this.refreshStats();
  }
  /**
   * Release the action of the button clicked
   * @param {Phaser.Sprite} sprite
   * @param {object} event
   */
  selectOption(sprite, event) {
    if (!this.uiBlocked) {
      this.uiBlocked = true;

      //Set the button active
      this.clearSelection();
      sprite.alpha = 0.6;
      sprite.y += 5;
      sprite.clicked = true;

      this.selectedItem = sprite;

      //Action depends of the button touched
      switch (sprite.type) {
        case 0:
        case 1:
        case 2:
          this.throwItem(sprite.type, this.selectedItem.customParams, event);
          break;
        case 3:
          this.character.animations.play("jump");
          this.character.body.velocity.y = this.confData.physics.jump.velocity.y;
          this.jumping = true;
          this.refreshStats(this.selectedItem.customParams);
          break;
      }
    }
  }
  /**
   * Reduce stats by fixed value
   */
  reduceProperties() {
    this.character.customParams.health -= this.decreaseStatAmount;
    this.character.customParams.fun -= this.decreaseStatAmount;
    this.character.customParams.nutrition -= this.decreaseStatAmount;
    this.refreshStats();
  }
  /**
   * Release the button touched
   */
  clearSelection() {
    this.buttons.forEach(function (element) {
      if (element.clicked) {
        element.alpha = 1;
        element.y -= 5;
        element.clicked = false;
      }
    });

    this.selectedItem = null;
  }
  /**
   * Update stats on screen
   * @param {object} properties
   */
  refreshStats(properties) {
    if (!!properties) {
      var characterProperty;

      //Update character properties
      for (characterProperty in properties) {
        if (properties.hasOwnProperty(characterProperty)) {
          var x = 0,
            y = 20;

          this.character.customParams[characterProperty] +=
            properties[characterProperty];

          switch (characterProperty) {
            case "health":
              x = this.healthCounter.x + this.healthCounter.width / 2;
              y += this.healthCounter.y + this.healthCounter.height;
              break;
            case "fun":
              x = this.funCounter.x + this.funCounter.width / 2;
              y += this.funCounter.y + this.funCounter.height;
              break;
            case "nutrition":
              x = this.nutritionCounter.x + this.nutritionCounter.width / 2;
              y += this.nutritionCounter.y + this.nutritionCounter.height;
              break;
            default:
          }

          this.showStatsUpdateInfo(
            { x: x, y: y },
            properties[characterProperty],
            properties[characterProperty] > 0
          );
        }
      }
    }

    var messages = {
      reason: "",
      tryAgain: "",
    };

    if (
      this.character.customParams.health <= 0 ||
      this.character.customParams.fun <= 0 ||
      this.character.customParams.nutrition <= 0
    ) {
      //Gameover
      if (this.character.customParams.health <= 0) {
        this.character.customParams.health = 0;
        messages.reason = this.confData.text[this.locale].sick;
      }
      if (this.character.customParams.fun <= 0) {
        this.character.customParams.fun = 0;
        messages.reason = this.confData.text[this.locale].bored;
      }
      if (this.character.customParams.nutrition <= 0) {
        this.character.customParams.nutrition = 0;
        messages.reason = this.confData.text[this.locale].hungry;
      }

      messages.tryAgain = this.confData.text[
        this.locale
      ].tryAgain.toUpperCase();

      //Update highscore if necessary
      if (this.timeCounter.count > getLocalItem("highscore")) {
        saveLocalItem("highscore", this.timeCounter.count);
      }

      //this.game.state.start('mainMenu', true, false, messages);
      this.gameOver(messages);
    } else {
      //Set counter boundaries
      for (var currentPropertyReset in this.character.customParams) {
        if (this.character.customParams[currentPropertyReset] > 100) {
          this.character.customParams[currentPropertyReset] = 100;
        }
      }

      //Alerts
      for (var currentProperty in this.character.customParams) {
        if (this.character.customParams.hasOwnProperty(currentProperty)) {
          var tintColor = 0xffffff;
          if (
            this.character.customParams[currentProperty] <
            this.confData.redAlertLimit
          ) {
            tintColor = 0xff0000;
          }

          switch (currentProperty) {
            case "health":
              this.healthCounter.tint = tintColor;
              break;
            case "fun":
              this.funCounter.tint = tintColor;
              break;
            case "nutrition":
              this.nutritionCounter.tint = tintColor;
              break;
          }
        }
      }
    }

    //Update stats
    this.healthCounter.setText(this.character.customParams.health.toString());
    this.funCounter.setText(this.character.customParams.fun.toString());
    this.nutritionCounter.setText(
      this.character.customParams.nutrition.toString()
    );
  }
  /**
   * Character moves to a touched position
   * @param {Phaser.Sprite} sprite
   * @param {object} pointer
   * @param {object} targetPosition
   */
  walkTo(sprite, pointer, targetPosition) {
    var head = findChild(this.character, "headHero"),
      x,
      y;

    if (!!targetPosition) {
      //Walk to an item
      x = targetPosition.x;
      y = targetPosition.y;
    } else {
      //Walk to touch position
      x = pointer.x;
      y = pointer.y;
    }

    if (x < this.character.x) {
      //Go left
      this.character.scale.x = 1;
      head.scale.x = -1;
    } else {
      //Go right
      this.character.scale.x = -1;
      head.scale.x = -1;
    }

    //Character animation
    this.character.animations.play("walk");

    //Move the character towards the cursor
    var characterMov = this.game.add.tween(this.character);
    characterMov.to({ x: x }, this.confData.physics.walk.speed);
    characterMov.onComplete.add(function () {
      //Stop animation and set stopped frame
      this.character.animations.stop();
      this.character.restartAnimation("walk");
    }, this);

    characterMov.start();
  }
  /**
   * The game ends and show game over screen
   * @param {object} messages
   */
  gameOver(messages) {
    if (!this.gameOverFlag) {
      var gameOverPanelTween;

      //Resets
      this.gameOverFlag = true;
      this.statsDecreaser.stop();
      this.timerTimeUpdate.stop();
      this.timerThrowRock.timer.stop();
      this.character.stopSounds();

      //Game over background layer
      this.bgLayer = this.add.bitmapData(this.game.width, this.game.height);
      this.bgLayer.ctx.fillStyle = "#000";
      this.bgLayer.ctx.fillRect(0, 0, this.game.width, this.game.height);

      //sprite for bgLayer
      this.gameOverPanel = this.add.sprite(0, 0, this.bgLayer);
      this.gameOverPanel.alpha = 0;

      gameOverPanelTween = this.game.add
        .tween(this.gameOverPanel)
        .to({ alpha: 0.8 }, 300, Phaser.Easing.Linear.None, true);

      gameOverPanelTween.onComplete.add(function () {
        var highscoreData = getLocalItem("highscore"),
          highscore = !!highscoreData ? highscoreData : "0",
          halfWidth = this.game.width / 2,
          halfHeight = this.game.height / 2,
          gameOverText,
          reasonText,
          scoreLabel,
          scoreCounter,
          creditsText,
          topLabel,
          topCounter,
          retryButton,
          tweetButton,
          fbButton,
          clothCombinationText,
          clothCombinationLabel,
          combinationName = this.character.giveMeName(),
          gameOverItemsGroup = this.game.add.group(),
          characterInfo = this.character.shareCharacterInfo(),
          sharedHeadSprite,
          sharedBodySprite;

        //Kill character
        this.character.kill();
        //Draw shared type character body
        sharedBodySprite = this.game.add.sprite(
          halfWidth / 2,
          280,
          characterInfo.body.spriteName
        );
        sharedBodySprite.anchor.setTo(0.5);
        sharedBodySprite.frame = characterInfo.body.spriteFrame;

        //Draw shared type character head
        sharedHeadSprite = this.game.add.sprite(
          0,
          -75,
          characterInfo.head.spriteName
        );
        sharedHeadSprite.anchor.setTo(0.5);
        sharedHeadSprite.frame = characterInfo.head.spriteFrame;

        sharedBodySprite.addChild(sharedHeadSprite);

        //Result texts
        gameOverItemsGroup.y = this.game.height;
        gameOverText = this.add.bitmapText(
          halfWidth,
          60,
          "minecraftia",
          this.confData.text[this.locale].gameOver.toUpperCase(),
          50
        );
        gameOverText.anchor.setTo(0.5);

        reasonText = this.add.bitmapText(
          halfWidth,
          120,
          "minecraftia",
          messages.reason,
          30
        );
        reasonText.anchor.setTo(0.5);

        scoreLabel = this.game.add.bitmapText(
          halfWidth + halfWidth / 4,
          170,
          "minecraftia",
          this.confData.text[this.locale].score.toUpperCase(),
          20
        );
        scoreLabel.anchor.setTo(0.5);
        scoreLabel.tint = 0x6785bc;

        scoreCounter = this.add.bitmapText(
          halfWidth + halfWidth / 4,
          210,
          "minecraftia",
          this.timeCounter.count + " sg",
          40
        );
        scoreCounter.anchor.setTo(0.5);

        topLabel = this.add.bitmapText(
          halfWidth + halfWidth / 4,
          260,
          "minecraftia",
          this.confData.text[this.locale].top.toUpperCase(),
          20
        );
        topLabel.anchor.setTo(0.5);
        topLabel.tint = 0x6785bc;

        topCounter = this.add.bitmapText(
          halfWidth + halfWidth / 4,
          300,
          "minecraftia",
          highscore + " sg",
          40
        );
        topCounter.anchor.setTo(0.5);

        clothCombinationLabel = this.add.bitmapText(
          halfWidth,
          355,
          "minecraftia",
          this.confData.text[this.locale].youHaveGot,
          15
        );
        clothCombinationLabel.anchor.setTo(0.5);

        clothCombinationText = this.add.bitmapText(
          halfWidth,
          385,
          "minecraftia",
          combinationName,
          20
        );
        clothCombinationText.anchor.setTo(0.5);
        clothCombinationText.tint = 0x6785bc;

        retryButton = this.game.add.button(
          halfWidth,
          470,
          "button-retry",
          this.restart,
          this,
          0,
          0,
          1,
          0
        );
        retryButton.anchor.setTo(0.5);

        tweetButton = this.game.add.button(
          this.game.width / 2 - 48,
          570,
          "button-twitter",
          function () {
            this.tweetScore(this.timeCounter.count, combinationName);
          },
          this,
          0,
          0,
          0,
          0
        );
        tweetButton.anchor.setTo(0.5);

        fbButton = this.game.add.button(
          this.game.width / 2 + 48,
          570,
          "button-fb",
          function () {
            this.fbScore(this.timeCounter.count, combinationName);
          },
          this,
          0,
          0,
          0,
          0
        );
        fbButton.anchor.setTo(0.5);

        //Credits
        creditsText = this.add.bitmapText(
          0,
          this.game.height - 20,
          "minecraftia",
          "By @jvalen",
          10
        );
        creditsText.align = "left";
        creditsText.x = this.game.width - creditsText.textWidth - 10;
        creditsText.inputEnabled = true;
        creditsText.events.onInputDown.add(function () {
          var url = "http://www.jvrpath.com";
          window.open(url, "_blank");
        }, this);

        gameOverItemsGroup.add(gameOverText);
        gameOverItemsGroup.add(reasonText);
        gameOverItemsGroup.add(scoreLabel);
        gameOverItemsGroup.add(scoreCounter);
        gameOverItemsGroup.add(topLabel);
        gameOverItemsGroup.add(topCounter);
        gameOverItemsGroup.add(clothCombinationLabel);
        gameOverItemsGroup.add(clothCombinationText);
        gameOverItemsGroup.add(retryButton);
        gameOverItemsGroup.add(sharedBodySprite);
        gameOverItemsGroup.add(tweetButton);
        gameOverItemsGroup.add(fbButton);
        gameOverItemsGroup.add(creditsText);

        this.game.add
          .tween(gameOverItemsGroup.position)
          .to({ y: 0 }, 1000, Phaser.Easing.Back.InOut, true);
      }, this);

      //Stop music
      this.sounds.kidLevelMusic.stop();
      this.sounds.gameover.play("", 0, 1, false);
      gameOverPanelTween.start();
    }
  }
  /**
   * Restart game properties
   */
  restart() {
    //Reset and restart the game
    this.timerTimeUpdate.stop();
    this.jumping = false;
    this.uiBlocked = false;
    this.clearSelection();

    this.game.state.start("Game");
  }
  tweetScore(score, name) {
    //Tweet score
    //share score on twitter
    var twitterUrl = "http://twitter.com/home?status=",
      tweetTxt =
        this.confData.text[this.locale].itsA +
        " " +
        name +
        "!! " +
        this.confData.text[this.locale].takingCareDuring +
        " " +
        score +
        " sg!!. " +
        this.confData.text[this.locale].playAt +
        ": " +
        this.confData.url +
        " " +
        this.confData.hashTag,
      finaltweet = twitterUrl + encodeURIComponent(tweetTxt);
    window.open(finaltweet, "_blank");
  }
  fbScore(score, name) {
    //Share score on fb
    var fbUrl = "https://www.facebook.com/dialog/feed?",
      fbAppId = 661693680633052,
      subtitle = encodeURIComponent(
        this.confData.text[this.locale].score + ": " + score + " sg"
      ),
      message = encodeURIComponent(
        this.confData.text[this.locale].itsA +
          " " +
          name +
          "!! " +
          this.confData.text[this.locale].takingCareDuring +
          " " +
          score +
          " sg!!"
      ),
      url = encodeURIComponent(this.confData.url),
      fbParams =
        "app_id=" +
        fbAppId +
        "&" +
        "display=popup&" +
        "caption=" +
        subtitle +
        "&" +
        "description=" +
        message +
        "&" +
        "link=" +
        url +
        "&" +
        "redirect_uri=" +
        this.confData.url,
      finalFb = fbUrl + fbParams;
    window.open(finalFb, "_blank");
  }
}
