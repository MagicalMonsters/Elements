Command = {};

Command.parse = function(gameId, command, callback) {
    if (!callback) {
        callback = function (error){};
    }
    if (!Logic.isMyTurn(gameId, Meteor.userId())) {
        callback("This is not your turn!");
        return;
    }
    if (_.isEmpty(command)) {
        callback("Empty command!");
        return;
    }
    var tokens = command.split(" ");
    if (_.isEmpty(tokens)) {
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
        Command.merge(gameId, tokens[1], tokens[2], callback);
    } else if (action == "end") {
        Command.endTurn(gameId, callback);
    } else {
        callback("unknown command!");
    }
};

Command.create = function (gameId, elements, coordinationString, callback) {
    var elems = Element.elementsFromString(elements);
    var boardCellIndex = Board.coordinationStringToPosition(gameId, coordinationString);
    
    var error = Logic.isValidCreate(gameId, elems, boardCellIndex);
    if (error) {
        callback(error);
        return;
    }

    Meteor.call("warriorCreate", gameId, boardCellIndex, elems, function (error, result) {
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

    if (!opponentWarrior) {
        // we can move the warrior
        warrior.position = cellToMove;
    }

    var lock = 1;
    Meteor.call("warriorUpdate", gameId, Meteor.userId(), warrior, function (error, result) {
        if (opponentWarrior) {
            lock++;
            var ownerId = Board.findIdOfOwnerOfWarrior(gameId, cellToMove);
            Meteor.call("warriorUpdate", gameId, ownerId, opponentWarrior, function (error, result) {
                lock--;
                if (lock == 0) {
                    callback();
                }
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

Command.merge = function (gameId, label, direction, callback) {
    var warrior = Warrior.fetchOwnWarrior(gameId, label);
    var cellToMove = Board.directionOfCell(gameId, warrior.position, direction);

    var error = Logic.canMerge(gameId, warrior, cellToMove);
    if (error) {
        callback(error);
        return;
    }

    // merge cost
    warrior.composition[3]--;

    var destWarrior = Board.cellType(gameId, cellToMove).warrior;
    for (var i = 0; i < warrior.composition.length; i++) {
        destWarrior.composition[i] += warrior.composition[i];
        destWarrior.backpack[i] += warrior.backpack[i];
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