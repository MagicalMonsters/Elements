Board = {};

Board.cellType = function (gameId, position) {
    var game = Games.findOne({_id: gameId});
    if (position < 0 || position >= game.boardSize * game.boardSize || game.board[position] == 0) {
        return {"type": "wall"};
    }

    var warriors = _.flatten(_.map(game.players, function (player) {
        return player.warriors
    }));
    var warrior = _.find(warriors, function (warrior) {
        return warrior.position == position
    });

    if (!(_.isUndefined(warrior))) {
        return {"type": "warrior", "warrior": warrior};
    }

    return {"type": "empty"};
};

Board.cellColor = function (type) {
    if (type == undefined || type < 0 || type > 4) {
        return undefined;
    }
    var cellColors = ["Black", "LightBlue", "SaddleBrown", "DarkRed", "DarkBlue"];
    return cellColors[type];
};

Board.directionOfCell = function (gameId, position, direction) {
    var game = Games.findOne({_id: gameId});
    var directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    var directionLetters = ['l', 'r', 'u', 'd'];

    var indexOf = _.indexOf(directionLetters, direction);

    if (indexOf == -1) {
        return -100;
    }

    var newPosition = position + (directions[indexOf][0] * game.boardSize) + directions[indexOf][1];

    return newPosition;

};


Board.findIdOfOwnerOfWarrior = function (gameId, position) {
    var game = Games.findOne({_id: gameId});
    for (var i = 0; i < game.players.length; i++) {
        var Id = game.players[i].userId;
        if (!(_.isUndefined(_.find(game.players[i].warriors, function (warrior) {
                return warrior.position == position;
            })))) {
            return Id;
        }
    }
};

Board.playerColor = function (index) {
    if (index == undefined || index < 0 || index > 4) {
        return undefined;
    }

    var playerColors = ["SpringGreen", "Chartreuse", "DarkKhaki", "DarkSlateGray"];
    return playerColors[index];
};

Board.coordinationStringToPosition = function (gameId, coordinationString) {
    var game = Games.findOne({_id: gameId});

    var coordination = coordinationString.split(",");
    var boardCellIndex = parseInt(coordination[1]) + parseInt(coordination[0]) * game.boardSize;
    return boardCellIndex;
}