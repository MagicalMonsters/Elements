Logic = {};

Logic.calculateAndApplyAttack = function (gameId, warrior, cellToMove) {
    var opponentWarrior = Board.cellType(gameId, cellToMove).warrior;

    var playerTotal = Element.sumOfElements(warrior.composition);
    var opponentTotal = Element.sumOfElements(opponentWarrior.composition);

    var delta = Math.abs(playerTotal - opponentTotal);

    var opponentName = Board.findNameOfOwnerOfWarrior(gameId, cellToMove);
    // Log.current(gameId, "You attacked warrior " + opponentWarrior.label +
    //     " of " + opponentName +  " , playerTotal is: " + playerTotal);

    // assume that warrior is winner
    var winnerWarrior = warrior;
    var loserWarrior = opponentWarrior;

    if (playerTotal < opponentTotal) {
        var temp = winnerWarrior;
        winnerWarrior = loserWarrior;
        loserWarrior = temp;
    }


    var winnerName = Board.findNameOfOwnerOfWarrior(gameId, winnerWarrior.position);
    var winnerId = Board.findIdOfOwnerOfWarrior(gameId, winnerWarrior.position);
    var loserName = Board.findNameOfOwnerOfWarrior(gameId, loserWarrior.position);
    var loserId = Board.findIdOfOwnerOfWarrior(gameId, loserWarrior.position);

    // inform the loser
    Log.user(gameId, loserId, "You lost to warrior " + winnerWarrior.label + " of " + winnerName +
        ".\n Her total was " + Element.sumOfElements(winnerWarrior.composition) +
        " and yours was " + Element.sumOfElements(loserWarrior.composition) + ".");

    // inform the winner
    Log.user(gameId, winnerId, "You won the attack to warrior " + loserWarrior.label + " of " + loserName +
        ".\n Your total was " + Element.sumOfElements(loserWarrior.composition) + ".");

    // all the calculation is based on winner and loser
    loserWarrior.composition = Logic.reduceComposition(loserWarrior.composition, delta);
    if (Warrior.isDead(loserWarrior)) {
        // should add the backpack
        for (var i = 0; i < loserWarrior.backpack.length; i++) {
            winnerWarrior.backpack[i] += loserWarrior.backpack[i];
        }
    }

    // we should return the new composition of opponent regardless of the result
    return opponentWarrior;
};

Logic.reduceComposition = function (composition, delta) {

    // loser Dominant type - deltaTotal
    // next max

    do {
        var maxIndex = Element.maxElementIndex(composition);
        if (maxIndex == -1) {
            // all empty
            break;
        }
        composition[maxIndex] -= delta;
        delta = -Math.min(composition[maxIndex], 0);
        composition[maxIndex] = Math.max(composition[maxIndex], 0);
    } while (delta > 0);

    return composition;
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

Logic.currentTurnPlayerName = function (gameId) {
    var game = Games.findOne({_id: gameId});
    var index = game.turn % game.players.length;
    return game.players[index].userName;
}

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

Logic.canSplit = function (gameId, warrior, cellToMove, elems) {
    if (Logic.isFirstRound(gameId)) {
        return "You can't split at first turn!";
    }

    if (warrior == undefined) {
        return "No warrior with this label!";
    }

    if (cellToMove < -50) {
        return "Invalid direction!";
    }

    if (Warrior.water(warrior) == 0) {
        return "You don't have enough water to do the split!";
    }

    if (Element.sumOfElements(warrior.composition) - Element.sumOfElements(elems) < 2) {
        return "You can not completely destroy one warrior in splitting!";
    }

    for (var i = 0; i < warrior.composition.length; i++) {
        if (elems[i] > warrior.composition[i] || (i == 3 && elems[i] == warrior.composition[i])) {
            return "You don't have this much resource! \n remember to leave 1 water as the cost!";
        }
    }

    var cellType = Board.cellType(gameId, cellToMove);
    if (cellType.type != "empty") {
        return "You can only split to an empty cell!";
    }
    return undefined;
};

Logic.canMerge = function (gameId, warrior, cellToMove, elems) {
    if (Logic.isFirstRound(gameId)) {
        return "You can't merge at first turn!";
    }

    if (!warrior) {
        return "No warrior with this label!";
    }

    if (cellToMove < -50) {
        return "Invalid direction!";
    }

    if (Warrior.water(warrior) == 0) {
        return "You don't have enough water to do the merge!";
    }

    var cellType = Board.cellType(gameId, cellToMove);

    if (cellType.type != "warrior" ||
        Board.findIdOfOwnerOfWarrior(gameId, cellType.warrior.position) != Meteor.userId()) {
        return "You can only merge with your own warrior!";
    }

    for (var i = 0; i < warrior.composition.length; i++) {
        if (elems[i] > warrior.composition[i] || (i == 3 && elems[i] == warrior.composition[i])) {
            return "You don't have this much resource! \n remember to leave 1 water as the cost!";
        }
    }

    return undefined;
}

Logic.canAdd = function (gameId, warrior, elems) {
    if (Logic.isFirstRound(gameId)) {
        return "You can't add at first turn!";
    }

    if (!warrior) {
        return "No warrior with this label!";
    }

    if (Warrior.earth(warrior) == 0) {
        return "You don't have enough earth to make the addition!";
    }

    for (var i = 0; i < warrior.backpack.length; i++) {
        if (elems[i] > warrior.backpack[i]) {
            return "You don't have this much in your backpack!";
        }
    }

    return undefined;
};

Logic.isMoveAttack = function (gameId, warrior, cellToMove) {
    var cellType = Board.cellType(gameId, cellToMove);
    if (cellType.type == "empty") {
        return false;
    }
    return true;
};

