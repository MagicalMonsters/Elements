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

    var airSpent = 0;
    // update the composition based on move
    if (warrior.moves != 0) {
        // air cost
        warrior.composition[0]--;
        airSpent += 1;

    } else {
        warrior.moves++;
    }

    var opponentWarrior = null;
    var ownerId = Board.findIdOfOwnerOfWarrior(gameId, cellToMove);
    if (Logic.isMoveAttack(gameId, warrior, cellToMove)) {
        // fire cost
        warrior.composition[2]--;
        Log.current(gameId, "You spent 1 fire and " + airSpent + " air for the attack.");
        opponentWarrior = Logic.calculateAndApplyAttack(gameId, warrior, cellToMove);
    } else {
        Log.current(gameId, "You spent " + airSpent + " air for the move.");
    }

    if (!opponentWarrior || Element.sumOfElements(opponentWarrior.composition) == 0) {
        // we can move the warrior
        warrior.position = cellToMove;
        Log.current(gameId, "Congrats! You kill the warrior and replaced it.");
    }

    Meteor.call("warriorUpdate", gameId, Meteor.userId(), warrior, function (error, result) {
        if (opponentWarrior) {
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

    Log.current(gameId, "You spent 1 earth and added from your backpack to your composition.");

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

    Log.current(gameId, "You spent 1 water and split your warrior.");

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

    if (shouldAddBackback) {
        Log.current(gameId, "You spent 1 water and merged two warriors completely with their backpacks.");
    } else {
        Log.current(gameId, "You spent 1 water and merged some composition of two warriors.");
    }

    Meteor.call("warriorUpdate", gameId, Meteor.userId(), warrior, function () {
        Meteor.call("warriorUpdate", gameId, Meteor.userId(), destWarrior, function () {
            callback();
        });
    });
};

Command.endTurn = function (gameId, callback) {
    Log.current(gameId, "You finished your turn.");
    Meteor.call("warriorEndTurn", gameId, function () {
        Log.game(gameId, "Now it is " + Logic.currentTurnPlayerName(gameId) + "'s turn.");
        callback();
    });
};