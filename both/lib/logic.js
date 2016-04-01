Logic = {};

Logic.calculateAndApplyAttack = function (gameId, warrior, cellToMove) {
    
};

Logic.calculateAttack = function (composition1, composition2) {

    var arr1 = [
        [0.25, 0.25, 0.25, 0.25],
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]];

    var arr2 = [
        [0.25, 0.25, 0.25, 0.25],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
        [1, 0, 0, 0]];

    var powerDeduction = 2;

    var type1 = Warrior.type(composition1);
    var type2 = Warrior.type(composition2);

    var power1 = _.reduce(composition1, function (memo, num, index) {
        return memo + num * arr1[type1 + 1][index] - composition2[index] * arr2[type1 + 1][index];
    }, 0);
    var power2 = _.reduce(composition2, function (memo, num, index) {
        return memo + num * arr1[type2 + 1][index] - composition1[index] * arr2[type2 + 1][index];
    }, 0);

    var power = parseInt(Math.abs(power1 - power2) / powerDeduction); // reducing the effect to half

    if (power1 == power2) {
        return {"message": "It was a tie", "composition1": composition1, "composition2": composition2};
    }
    else if (power1 > power2) {
        var elementNum = _.reduce(composition2, function (memo, num) {
            return num == 0 ? memo : memo + 1;
        }, 0);
        var newComp = _.map(composition2, function (num) {
            return Math.max(num - parseInt(power / elementNum), 0)
        });

        return {"message": "Attacker Win", "composition1": composition1, "composition2": newComp};
    }
    else {
        var elementNum = _.reduce(composition1, function (memo, num) {
            return num == 0 ? memo : memo + 1;
        }, 0);
        var newComp = _.map(composition1, function (num) {
            return Math.max(num - parseInt(power / elementNum), 0)
        });

        return {"message": "Defender Win", "composition1": newComp, "composition2": composition2};
    }
};

Logic.isMyTurn = function (gameId, userId) {
    var game = Games.findOne({_id: gameId});
    var index;
    for (index = 0; index < game.players.length; index++) {
        if (game.players[index].userId == userId) {
            break;
        }
    }

    if (game.turn % game.players.length != index) {
        return false;
    }

    return true;
};

Logic.isFirstRound = function (gameId) {
    var game = Games.findOne({_id: gameId});
    return game.turn < game.players.length;
};

Logic.isValidCreate = function (gameId, elems, boardCellIndex) {
    var sum = Element.sumOfElements(elems);
    var warriors = Warrior.fetchWarriors(gameId, Meteor.userId());

    if (warriors.length != 0) {
        return "You can't create more than one warrior!";
    }

    if (sum != 20) {
        return "The sum of elements should be 20!";
    }

    if (!Logic.isFirstRound(gameId)) {
        return "You can only create at the first turn!";
    }

    if (Board.cellType(gameId, boardCellIndex).type != "empty") {
        return "Not a valid position!";
    }

    return undefined;
};

Logic.isValidMove = function (gameId, warrior, cellToMove) {
    if (Logic.isFirstRound(gameId)) {
        return "You can't move at first turn!";
    }

    if (warrior == undefined) {
        return "No warrior with this label!";
    }

    if (!Warrior.canMove(warrior)) {
        return "You can't move any more in this turn!";
    }

    if (cellToMove < -50) {
        return "Invalid direction!";
    }

    var cellType = Board.cellType(gameId, cellToMove);

    if (cellType.type == "wall") {
        return "Cannot move to that direction it is a wall!";
    } else if (cellType.type == "empty") {
        return undefined;
    } else {
        var otherWarrior = cellType.warrior;
        if (!(_.isUndefined(_.find(Warrior.fetchWarriors(gameId, Meteor.userId()), function (warrior) {
                return warrior.position == otherWarrior.position;
            })))) {
            return "Cannot move to that direction, another one of your warriors is there!";
        }
        else {
            if (Warrior.fire(warrior) == 0) {
                return "Your warrior doesn't have enough fire to attack!";
            }
            return undefined;
        }
    }
};

Logic.isMoveAttack = function (gameId, warrior, cellToMove) {
    var cellType = Board.cellType(gameId, cellToMove);
    if (cellType.type == "empty") {
        return false;
    }
    return true;
};

