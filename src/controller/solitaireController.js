import {
  Signal
} from "signals"

export default class SolitaireController {
  gameType = null;

  onChange = new Signal();
  onChangePoints = new Signal();
  finishGame = new Signal();

  appliedEvents = [];
  stock = [];
  waste = [];

  foundations = {
    f1: [],
    f2: [],
    f3: [],
    f4: []
  };
  tableau = {
    t1: [],
    t2: [],
    t3: [],
    t4: [],
    t5: [],
    t6: [],
    t7: []
  };

  constructor(type) {
    this.gameType = type;
    window.controller = this
  }

  fakePrepare(deck) {
    for (let card of deck) {
      this.stock.push({
        id: card.id,
        number: card.number,
        color: card.color,
        flipped: card.flipped
      });
    }
    this._shuffleDeck();
    let events = [];
    let flipEvents = [];
    while (this.stock.length) {
      for (let j = 1; j <= 4; j++) {
        let card = this.stock.pop();
        this.foundations[`f${j}`].push(card);
        flipEvents.push({
          card,
          flip: {
            flipped: false,
            prev: card.flipped
          }
        });
        card.flipped = false;
        events.push({
          card,
          move: {
            field: "foundations",
            number: j,
            order: 0,
            from: {}
          }
        });
      }
    }

    this._applyEvents(events, true);
    setTimeout(() => {
      this._applyEvents(flipEvents, true);
    }, 300);
  }
  prepare(deck) {
    for (let card of deck) {
      this.stock.push({
        id: card.id,
        number: card.number,
        color: card.color,
        flipped: card.flipped
      });
    }
    this._shuffleDeck();

    let events = [];
    let flipEvents = [];

    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < i + 1; j++) {
        let card = this.stock.pop();
        this.tableau[`t${i + 1}`].push(card);
        if (j == i) {
          flipEvents.push({
            card,
            flip: {
              flipped: false,
              prev: card.flipped
            }
          });

          card.flipped = false;
        }
        events.push({
          card,
          move: {
            field: "tableau",
            number: i + 1,
            order: j,
            from: {}
          }
        });
      }
    }

    this._applyEvents(events, true);
    setTimeout(() => {
      this._applyEvents(flipEvents, true);
    }, 300);
  }

  checkPossibleMove(cardId) {
    if (cardId) {
      this._checkPossibleMove(cardId)
      this._checkPossibleMove(null)
    } else {
      while (this._checkPossibleMove(cardId)) {}
    }
  }

  _checkPossibleMove(cardId = null) {
    if (cardId) {
      let {
        card,
        field,
        fieldName,
        fieldNumber,
        cardOrder
      } = this._getCardInfo(cardId)
      console.log(card.flipped, cardOrder < field.length - 1);
      console.log(cardOrder, field.length - 1);


      if (card.flipped || cardOrder < field.length - 1) return
      for (let key in this.foundations) {
        let foundationsList = this.foundations[key];
        for (let foundationCard of foundationsList) {
          if (foundationCard.number + 1 == card.number && foundationCard.color == card.color) {
            let to = {
              fieldName: "foundations",
              fieldNumber: card.color + 1,
              order: 0,
            }
            let from = {
              fieldName: fieldName,
              fieldNumber: fieldNumber,
              cardOrder: cardOrder,
              field: field
            }
            this._dispatchMoveEvents(card, to, from)
            return true
          }
        }
      }
      return false
    }

    let move = (cId) => {
      let {
        card,
        field,
        fieldName,
        fieldNumber,
        cardOrder
      } = this._getCardInfo(cId)

      let to = {
        fieldName: "foundations",
        fieldNumber: card.color + 1,
        order: 0,
      }
      let from = {
        fieldName: fieldName,
        fieldNumber: fieldNumber,
        cardOrder: cardOrder,
        field: field
      }
      this._dispatchMoveEvents(card, to, from)
    }

    for (let key in this.tableau) {
      let lastCard = this.tableau[key][this.tableau[key].length - 1]
      if (lastCard) {
        if (lastCard.number == 1) {
          move(lastCard.id)
          return true
        }
      }
    }

    if (this.waste[this.waste.length - 1]) {
      if (this.waste[this.waste.length - 1].number == 1) {
        move(this.waste[this.waste.length - 1].id)
        return true
      }
    }
    return false
  }

  _dispatchMoveEvents(card, to, from) {
    let events = []
    let movingCard
    if (from.fieldName == 'tableau')
      movingCard = this[`${from.fieldName}`][`t${from.fieldNumber}`].pop()
    else movingCard = this[`${from.fieldName}`].pop()

    this[`${to.fieldName}`][`f${to.fieldNumber}`].push(movingCard)

    events.push({
      card,
      move: {
        field: to.fieldName,
        number: to.fieldNumber,
        order: 0,
        from: {
          field: from.fieldName,
          number: from.fieldNumber,
          order: from.cardOrder
        }
      }
    })
    if (from.field[from.field.length - 1]) {
      events.push({
        card: from.field[from.field.length - 1],
        flip: {
          flipped: false,
          prev: from.field[from.field.length - 1].flipped
        }
      });
      this.onChangePoints.dispatch(5)
      from.field[from.field.length - 1].flipped = false;
    }
    this._applyEvents(events);
    return
  }

  undo() {
    if (!this.appliedEvents.length) return;

    this.onChangePoints.dispatch(-5)
    let undoEvents = this.appliedEvents.pop();
    let moveEvents = [];
    let flipEvents = [];
    let events = [];

    let moveTypes = []
    for (let event of undoEvents.reverse()) {
      if (event.move) {
        moveTypes.push(`${event.move.field}-${event.move.number}`)
        moveEvents.push(event);
      } else if (event.flip) {
        flipEvents.push(event);
      }
    }

    if (moveEvents.length > 1 && moveEvents.length < 14) {
      let uniqueTypes = new Set(moveTypes)
      if (uniqueTypes.size > 1) {
        let groupedMoves = {}
        for (let event of moveEvents) {
          if (!groupedMoves[`${event.move.field}-${event.move.number}`]) {
            groupedMoves[`${event.move.field}-${event.move.number}`] = []
          }
          groupedMoves[`${event.move.field}-${event.move.number}`].push(event)
        }
        if (groupedMoves['stock-1']) {
          groupedMoves['stock-1'] = groupedMoves['stock-1'].reverse()
        }
        for (let group in groupedMoves) {
          groupedMoves[group].forEach(event => events.push(this._undoExactMove(event)))
        }
      } else {
        events.push(...this._undoMultiMove(moveEvents));
      }
    } else {
      for (let event of moveEvents) {
        events.push(this._undoMove(event));
      }
    }

    for (let event of flipEvents) {
      events.push(this._undoFlip(event));
    }
    this.onChange.dispatch(events);
  }

  _undoMove(event) {
    let {
      card,
      move: {
        from
      }
    } = event;
    let currentList = this._getField(event.move.field, event.move.number);
    let undoList = this._getField(
      event.move.from.field,
      event.move.from.number
    );
    let undoCard = currentList.pop();
    undoList.push(undoCard);
    return {
      card,
      move: from
    };
  }

  _undoMultiMove(events) {
    let undoEvents = [];
    for (let event of events) {
      let {
        card,
        move: {
          from
        }
      } = event;
      undoEvents.push({
        card,
        move: from
      });
    }

    // fix controller status
    let event = events[0];
    let currentList = this._getField(event.move.field, event.move.number);
    let undoList = this._getField(
      event.move.from.field,
      event.move.from.number
    );
    let tempCardList = currentList.splice(
      currentList.length - events.length,
      events.length
    );
    undoList.push(...tempCardList);

    return undoEvents;
  }

  _undoExactMove(event) {
    let {
      card,
      move: {
        from
      }
    } = event;
    let currentList = this._getField(event.move.field, event.move.number);
    let undoList = this._getField(
      event.move.from.field,
      event.move.from.number
    );

    let moveIndex = null
    for (let [index, c] of currentList.entries()) {
      if (card.id === c.id) {
        moveIndex = index
      }
    }
    let tempCard = currentList.splice(moveIndex, 1)
    undoList.push(...tempCard)

    return {
      card,
      move: from
    }
  }

  _undoFlip(event) {
    let {
      card,
      flip: {
        prev
      }
    } = event;
    card.flipped = prev;
    return {
      card,
      flip: {
        flipped: prev
      }
    };
  }

  _getField(fieldName, fieldNumber) {
    let field = this[fieldName];
    if (fieldName === "tableau" || fieldName === "foundations") {
      field = field[fieldName.charAt(0) + fieldNumber];
    }
    return field;
  }

  canDrag(id) {
    for (let card of this.stock) {
      if (card.id === id) return false;
    }
    for (let [index, card] of this.waste.entries()) {
      if (card.id === id && index !== this.waste.length - 1) {
        return false;
      }
    }

    for (let key in this.tableau) {
      let tableauList = this.tableau[key];
      for (let card of tableauList) {
        if (card.id === id) {
          if (card.flipped) {
            return false;
          }
        }
      }
    }
    return true;
  }

  canPlace(id, field, number) {
    let holderKey = field.charAt(0) + number;
    let cardList = this[field][holderKey];
    if (field === "foundations")
      return this._canPlaceFoundations(this._getCardInfo(id), cardList, number);
    if (field === "tableau")
      return this._canPlaceTableau(this._getCardInfo(id), cardList, number);
    return false;
  }

  emptyDeck() {
    if (!this.waste.length) return false
    let events = [];
    let order = 0;
    while (this.waste.length !== 0) {
      let card = this.waste.pop();
      this.stock.push(card);
      events.push({
        card,
        move: {
          field: "stock",
          number: 1,
          order,
          from: {
            field: "waste",
            number: 1,
            order: this.waste.length
          }
        }
      });
      events.push({
        card,
        flip: {
          flipped: true,
          prev: card.flipped
        }
      });
      card.flipped = true;
      order++;
    }
    this._applyEvents(events);
  }

  canOpen(cardId) {
    let info = this._getCardInfo(cardId);
    if (info["fieldName"] !== "stock") return false;
    if (this.gameType === 3) return this._openThree(info);
    let card = this.stock.pop();
    this.waste.push(card);
    let events = [];
    events.push({
      card,
      move: {
        field: "waste",
        number: 1,
        order: this.waste.length,
        from: {
          field: "stock",
          number: info.fieldNumber,
          order: info.cardOrder
        }
      }
    });
    events.push({
      card,
      flip: {
        flipped: false,
        prev: card.flipped
      }
    });
    card.flipped = false;
    this._applyEvents(events);
    return true;
  }

  _openThree(info) {
    let events = [];

    if (this.waste.length) {
      let oldWaste = this.waste.splice(0, this.waste.length);
      for (let [index, card] of oldWaste.entries()) {
        events.push({
          card,
          move: {
            field: "stock",
            number: 1,
            order: 0,
            from: {
              field: "waste",
              number: 1,
              order: index
            }
          }
        });
        // events.push({ card, flip: { flipped: true, prev: card.flipped } });
        events.push({
          card,
          flip: {
            flipped: true,
            prev: false
          }
        })
        card.flipped = true
        this.stock.unshift(card);
      }
    }

    for (let i = 0; i < Math.min(this.stock.length, 3); i++) {
      let card = this.stock.pop();
      this.waste.push(card);
      events.push({
        card,
        move: {
          field: "waste",
          number: 1,
          order: i,
          from: {
            field: "stock",
            number: 1,
            order: this.stock.length
          }
        }
      });

      events.push({
        card,
        flip: {
          flipped: false,
          prev: card.flipped
        }
      });
      card.flipped = false
    }

    this._applyEvents(events);
    return true;
  }

  getTableauArray(id) {
    let list = [];
    for (let key in this.tableau) {
      let collectable = false;
      for (let [index, card] of this.tableau[key].entries()) {
        if (id === card.id) {
          collectable = true;
        }
        if (collectable) {
          list.push(card);
        }
      }
    }
    return list;
  }

  _canPlaceFoundations(cardInfo, cardList, fieldNumber) {
    let {
      card,
      field,
      fieldName
    } = cardInfo;
    let placed = false;
    if (cardList.length) {
      let last = cardList[cardList.length - 1];
      if (last.number + 1 === card.number && last.color === card.color) {
        let temp = field.pop();
        cardList.push(temp);
        placed = true;
      }
    } else if (card.number === 1) {
      if (card.color + 1 == fieldNumber) {
        let temp = field.pop();
        cardList.push(temp);
        placed = true;
      }
    }
    if (placed) {
      let events = [];
      events.push({
        card,
        move: {
          field: "foundations",
          number: fieldNumber,
          order: 0,
          from: {
            field: fieldName,
            number: cardInfo.fieldNumber,
            order: cardInfo.cardOrder
          }
        }
      });
      if (field[field.length - 1]) {
        events.push({
          card: field[field.length - 1],
          flip: {
            flipped: false,
            prev: field[field.length - 1].flipped
          }
        });
        this.onChangePoints.dispatch(5)
        field[field.length - 1].flipped = false;
      }

      this._applyEvents(events);
      // this._checkFinish();
      if (fieldName != 'foundations')
        this.onChangePoints.dispatch(10)
    }

    return placed;
  }

  _canPlaceTableau(cardInfo, cardList, fieldNumber) {
    let {
      card,
      field,
      fieldKey,
      fieldName
    } = cardInfo;
    // WASTE
    if (fieldName === "waste" || fieldName === "foundations") {
      let lastCard = cardList[cardList.length - 1] || null;
      if (lastCard) {
        let condition =
          card.number + 1 === lastCard.number &&
          card.color % 2 !== lastCard.color % 2;
        if (!condition) return false;
      } else {
        let condition = card.number === 13;
        if (!condition) return false;
      }
      let tempCardInfo = this._getCardInfo(field[field.length - 1].id);
      let tempCard = field.pop();
      cardList.push(tempCard);
      this._applyEvents([{
        card: tempCard,
        move: {
          field: "tableau",
          number: fieldNumber,
          order: cardList.length - 1,
          from: {
            field: fieldName,
            number: tempCardInfo.fieldNumber,
            order: tempCardInfo.cardOrder
          }
        }
      }]);
      if (fieldName === 'waste') this.onChangePoints.dispatch(5)
      else if (fieldName === "foundations") this.onChangePoints.dispatch(-15)

      return true;
    }
    // WASTE

    if (fieldName === "tableau") {
      // card || field -> cardList
      let lastCard = cardList[cardList.length - 1] || null;
      if (lastCard) {
        let condition =
          card.number + 1 === lastCard.number &&
          card.color % 2 !== lastCard.color % 2;
        if (!condition) return false;
      } else {
        let condition = card.number === 13;
        if (!condition) return false;
      }
      let collectable = false;
      let movingList = [];
      let removeIds = [];
      for (let [index, fieldCard] of field.entries()) {
        if (card.id === fieldCard.id) {
          collectable = true;
        }
        if (collectable) {
          movingList.push(fieldCard);
          removeIds.push(index);
        }
      }
      field.splice(removeIds[0], removeIds.length);
      let events = [];
      movingList.forEach((movingCard, index) => {
        cardList.push(movingCard);
        events.push({
          card: movingCard,
          move: {
            field: "tableau",
            number: fieldNumber,
            order: cardList.length - 1,
            from: {
              field: fieldName,
              number: cardInfo.fieldNumber,
              order: removeIds[index]
            }
          }
        });
      });
      let lastFieldCard = field[field.length - 1] || null;
      if (lastFieldCard) {
        if (lastFieldCard.flipped) {
          events.push({
            card: lastFieldCard,
            flip: {
              flipped: false,
              prev: lastFieldCard.flipped
            }
          });
          this.onChangePoints.dispatch(5)
          lastFieldCard.flipped = false;
        }
      }
      this._applyEvents(events);
      return true;
    }

    return false;
  }

  _getCardInfo(id) {
    for (let [index, card] of this.stock.entries()) {
      if (card.id === id)
        return {
          card,
          field: this.stock,
          fieldName: "stock",
          fieldKey: null,
          fieldNumber: 1,
          cardOrder: index
        };
    }
    for (let [index, card] of this.waste.entries()) {
      if (card.id === id)
        return {
          card,
          field: this.waste,
          fieldName: "waste",
          fieldKey: null,
          fieldNumber: 1,
          cardOrder: index
        };
    }
    for (let key in this.foundations) {
      for (let [index, card] of this.foundations[key].entries()) {
        if (card.id === id)
          return {
            card,
            field: this.foundations[key],
            fieldName: "foundations",
            fieldKey: key,
            fieldNumber: parseInt(key.charAt(1), 10),
            cardOrder: index
          };
      }
    }
    for (let key in this.tableau) {
      for (let [index, card] of this.tableau[key].entries()) {
        if (card.id === id)
          return {
            card,
            field: this.tableau[key],
            fieldName: "tableau",
            fieldKey: key,
            fieldNumber: parseInt(key.charAt(1), 10),
            cardOrder: index
          };
      }
    }
    return null;
  }

  _shuffleDeck() {
    for (let i = 0; i < this.stock.length; i++) {
      let randomCard = Math.round(Math.random() * (this.stock.length - 1));
      let temp = this.stock[i];
      this.stock[i] = this.stock[randomCard];
      this.stock[randomCard] = temp;
    }
  }

  _applyEvents(eventList, ignore) {
    if (!ignore) {
      this.appliedEvents.push(eventList);
    }
    this.onChange.dispatch(eventList);
  }

  _checkFinish() {
    let finished = 0
    for (let holder in this.foundations) {
      if (this.foundations[holder].length == 13) finished++
    }
    if (finished == 4) this.finishGame.dispatch()
  }
}