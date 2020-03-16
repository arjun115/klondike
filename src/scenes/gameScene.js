import SolitaireController from "../controller/solitaireController";
import PlayGround from "../group/playGround";
import Button from "../component/Button";

export default class GameScene extends Phaser.Scene {
  controller = null;
  playGround = null;
  btn_new = null;
  btn_options = null;
  btn_how_to = null;
  btn_undo = null;

  new_text = null;
  options_text = null;
  how_to_text = null;
  undo_text = null;

  optionsPopUpGroup = null;
  howToPopUpGroup = null;
  finishPopUpGroup = null
  timer = null;
  counter = 0;
  points = 0;
  popUpIsOpen = false;

  score_img = null
  time_img = null

  // popUp = null;
  // tranpsBg = null;

  // btn_exit = null;
  // btn_big_one = null;
  // btn_big_three = null;

  // one_card_text = null;
  // three_cards_text = null;

  constructor() {
    super({
      key: "game"
    });
  }

  create() {
    let {
      type
    } = this.scene.settings.data;

    this.cameras.main.setBackgroundColor('#ffffff')

    this.btn_new = new Button(this, 372 - 310, 78, "button_three_card");
    this.btn_new.setOrigin(0.5);
    this.btn_new.onClick.add(this.btnNewClicked, this);

    this.btn_turn_1 = new Button(this, 492 - 310, 78, "turn_1");
    this.btn_turn_1.setOrigin(0.5);
    this.btn_turn_1.onClick.add(() => this.game.customOptions.openGame(1), this);

    this.btn_turn_3 = new Button(this, 612 - 310, 78, "turn_3");
    this.btn_turn_3.setOrigin(0.5);
    this.btn_turn_3.onClick.add(() => this.game.customOptions.openGame(3), this);

    this.btn_new = new Button(this, 372 - 310, 78, "button_three_card");
    this.btn_new.setOrigin(0.5);
    this.btn_new.onClick.add(this.btnNewClicked, this);

    this.btn_how_to = new Button(this, 1414 - 310 + 22, 78, "button_how_to");
    this.btn_how_to.setOrigin(0.5);
    this.btn_how_to.onClick.add(() => {
      this.game.customOptions.onHowTo()
    }, this)

    this.btn_undo = new Button(this, 1534 - 310 + 22, 78, "button_undo");
    this.btn_undo.onClick.add(() => this.controller.undo());
    this.btn_undo.setOrigin(0.5);

    this.score_img = this.add.image(923 - 310, 69, 'score')
    this.score_img.setOrigin(.5)

    this.time_img = this.add.image(1100 - 310, 69, 'time')
    this.time_img.setOrigin(.5)


    this.points_text = this.add.text(975 - 310, 69, "0", {
      fontFamily: "Titillium Web",
      fontStyle: 'bold',
      fontSize: "28px",
      color: "#000000",
      align: 'left'
    });
    this.points_text.setOrigin(0, 0.5);

    this.time_text = this.add.text(1145 - 310, 69, "00:00", {
      fontFamily: "Titillium Web",
      fontStyle: 'bold',
      fontSize: "28px",
      color: "#000000",
      align: 'left'
    });
    this.time_text.setOrigin(0, 0.5);

    this.timer = this.time.addEvent({
      delay: 1000,
      callback: () => this.count(),
      loop: true
    });

    this.onPlayClick(type);

    this.controller.onChangePoints.add(this.changePointsText, this)
    this.controller.finishGame.add(() => {
      this.popUpIsOpen = true;
      // this.bg.setInteractive()
      // this.bg.on("pointerdown", () => {
      //   this.popUpIsOpen = false;
      //   this.points = 0
      //   this.counter = 0
      //   this.scene.restart({
      //     type: this.scene.settings.data.type
      //   });
      // }, this)
      for (let cardId in this.playGround.deckMap) {
        // let card = this.playGround.deckMap[cardId]
        // card
        this.playGround.deckMap[cardId].on("pointerdown", () => {
          this.popUpIsOpen = false;
          this.points = 0
          this.counter = 0
          this.scene.restart({
            type: this.scene.settings.data.type
          });
        });
        this.physics.world.enable(this.playGround.deckMap[cardId])
        this.playGround.deckMap[cardId].body.setVelocity(0 + Math.random() * 100, 200 + Math.random() * 400).setBounce(1, 1).setCollideWorldBounds(true);
      }

      // this.finishGamePopUp()
    }, this)

  }

  count() {
    if (!this.popUpIsOpen) this.counter++;

    this.time_text.setText(`${this.timeParser(this.counter)}`);
  }

  timeParser(seconds = 1) {
    let min = window.Math.floor(seconds / 60);
    min = min < 10 ? "0" + min : min;
    let sec = seconds % 60;
    sec = sec < 10 ? "0" + sec : sec;
    return `${min}:${sec}`;
  }

  onPlayClick(type) {
    this.controller = new SolitaireController(type || 1);
    this.playGround = new PlayGround(this, this.controller);
  }

  btnNewClicked() {
    this.points = 0
    this.counter = 0
    this.scene.restart({
      type: this.scene.settings.data.type
    });
  }


  changePointsText(change) {
    this.points = this.points + change < 0 ? 0 : this.points + change
    this.points_text.setText(`${this.points}`)
  }

  finishGamePopUp() {
    this.popUpIsOpen = true
    this.finishPopUpGroup = this.add.group();
    let tranpsBg = new Button(this, 960 - 310, 540, "tranps_bg");
    tranpsBg.setInteractive();
    tranpsBg.setDepth(10000)

    let popUp = this.finishPopUpGroup.create(960 - 310, 540, "pop_up");
    popUp.setOrigin(0.5);
    popUp.setInteractive();

    let winText = this.add.text(
      960 - 310,
      540,
      `CONGRATULATIONS\n You complete the game !!\nSCORE: ${this.points}`, {
        fontFamily: "Titillium Web",
        fontSize: "20px",
        color: "#ffffff",
        align: "center",
        wordWrap: {
          width: popUp.width - 20,
          useAdvancedWrap: false
        }
      }
    );
    winText.setStroke("#ffffff", 1);
    winText.setOrigin(0.5);

    this.finishPopUpGroup.add(winText)

    tranpsBg.onClick.add(() => {
      this.popUpIsOpen = false
      this.finishPopUpGroup.clear(this);
      this.points = 0
      this.counter = 0
      this.scene.restart({
        type: this.scene.settings.data.type
      });
    }, this);
    this.finishPopUpGroup.children.entries.forEach(entry => {
      entry.setDepth(10001)
    })
  }

  update() {
    this.playGround._sort()
  }
}