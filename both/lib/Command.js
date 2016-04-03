Command = {};

Command.parse = function(gameId, command, callback) {
    if (!callback) {
        callback = function (error){};
        Log.current(gameId, "callback function is not set!");
    }
    if (!Logic.isMyTurn(gameId, Meteor.userId())) {
        callback("This is not your turn!");
        return;
    }
    if (!command || _.isEmpty(command)) {
        callback("Invalid command!");
        return;
    }
    var tokens = command.split(" ");
    if (!tokens || _.isEmpty(tokens) || tokens.length < 1) {
        callback("Malformed command!");
        return;
    }
    var action = tokens[0].toLowerCase();

    if (action == "create") {
        Command.create(gameId, tokens[1], tokens[2], callback);
    } else if (action == "move") {
        Command.move(gameId, tokens[1], tokens[2], callback);
    } else if (action == "add") {
        Command.add(gameId, tokens[1], tokens[2], callback);
    } else if (action == "split") {
        Command.split(gameId, tokens[1], tokens[2], tokens[3], callback);
    } else if (action == "merge") {
        Command.merge(gameId, tokens[1], tokens[2], tokens[3], callback);
    } else if (action == "end") {
        Command.endTurn(gameId, callback);
    } else {
        callback("Unknown command!");
    }
};

Command.create = function (gameId, elements, coordinationString, callback) {
    if (!elements || _.isEmpty(elements) ||
        !coordinationString || _.isEmpty(coordinationString)) {
        callback("Not enough arguments!");
        return;
    }
    var elems = Element.elementsFromString(elements);
    if (!elems) {
        callback("Invalid composition!");
        return;
    }
    var boardCellIndex = Board.coordinationStringToPosition(gameId, coordinationString);
    // TODO: add more guards for coordinationStringToPosition

    var error = Logic.isValidCreate(gameId, elems, boardCellIndex);
    if (error) {
        callback(error);
        return;
    }

    Meteor.call("warriorCreate", gameId, boardCellIndex, elems, function (error, result) {
        Log.current(gameId, "Created a warrior with elements:[" + elems.toString() + "]");
        callback();
    });
};

Command.move = function (gameId, label, direction, callback) {
    var warrior = Warrior.fetchOwnWarrior(gameId, label);
    var cellToMove = Board.directionOfCell(gameId, warrior.position, direction);
    
    var error = Logic.isValidMove(gameId, warrior, cellToMove);
    if (error) {
        callback(error);
        return;
    }
    
    // update the composition based on move
    if (warrior.moves != 0) {
        // air cost
        warrior.composition[0]--;
    } else {
        warrior.moves++;
    }

    var opponentWarrior = null;
    if (Logic.isMoveAttack(gameId, warrior, cellToMove)) {
        // fire cost
        warrior.composition[2]--;
        opponentWarrior = Logic.calculateAndApplyAttack(gameId, warrior, cellToMove);
    }

    if (!opponentWarrior || Element.sumOfElements(opponentWarrior.composition) == 0) {
        // we can move the warrior
        warrior.position = cellToMove;
    }

    Meteor.call("warriorUpdate", gameId, Meteor.userId(), warrior, function (error, result) {
        if (opponentWarrior) {
            var ownerId = Board.findIdOfOwnerOfWarrior(gameId, cellToMove);
            Meteor.call("warriorUpdate", gameId, ownerId, opponentWarrior, function (error, result) {
                    callback();
            });
        } else {
            callback();
        }
    });
};

Command.add = function (gameId, label, elements, callback) {
    var elems = Element.elementsFromString(elements);
    var warrior = Warrior.fetchOwnWarrior(gameId, label);

    var error = Logic.canAdd(gameId, warrior, elems);
    if (error) {
        callback(error);
        return;
    }

    // cost of add
    warrior.composition[1]--;

    for (var i = 0; i < warrior.composition.length; i++) {
        warrior.composition[i] += elems[i];
        warrior.backpack[i] -= elems[i];
    }

    Meteor.call("warriorUpdate", gameId, Meteor.userId(), warrior, function () {
        callback();
    });
};

Command.split = function (gameId, label, elements, direction, callback) {
    var elems = Element.elementsFromString(elements);
    var warrior = Warrior.fetchOwnWarrior(gameId, label);
    var cellToMove = Board.directionOfCell(gameId, warrior.position, direction);
    
    var error = Logic.canSplit(gameId, warrior, cellToMove, elems);
    if (error) {
        callback(error);
        return;
    }

    // water cost for split
    warrior.composition[3]--;

    for (var i = 0; i < warrior.composition.length; i++) {
        warrior.composition[i] -= elems[i];
    }

    Meteor.call("warriorCreate", gameId, cellToMove, elems, function (error, result) {
        Meteor.call("warriorUpdate", gameId, Meteor.userId(), warrior, function () {
            callback();
        });
    });
};

Command.merge = function (gameId, label, elements, direction, callback) {
    var elems = Element.elementsFromString(elements);
    var warrior = Warrior.fetchOwnWarrior(gameId, label);
    var cellToMove = Board.directionOfCell(gameId, warrior.position, direction);

    var error = Logic.canMerge(gameId, warrior, cellToMove, elems);
    if (error) {
        callback(error);
        return;
    }

    // merge cost
    warrior.composition[3]--;

    var shouldAddBackback = (Element.sumOfElements(warrior.composition) - Element.sumOfElements(elems) == 0);
    var destWarrior = Board.cellType(gameId, cellToMove).warrior;
    for (var i = 0; i < warrior.composition.length; i++) {
        destWarrior.composition[i] += warrior.composition[i];
        if (shouldAddBackback) {
            destWarrior.backpack[i] += warrior.backpack[i];
        }
        warrior.composition[i] = 0;
    }

    Meteor.call("warriorUpdate", gameId, Meteor.userId(), warrior, function () {
        Meteor.call("warriorUpdate", gameId, Meteor.userId(), destWarrior, function () {
            callback();
        });
    });
};

Command.endTurn = function (gameId, callback) {
    Meteor.call("warriorEndTurn", gameId, function () {
        callback();
    });
};