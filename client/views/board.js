Template.board.helpers({
    board: function () {
        var gameID = this.gameId;
        var data = Games.findOne({_id: gameID});

        var bs = data.boardSize;
        var board = [];
        var row = [];

        for (var i = 0; i < bs; i++) {
            for (var j = 0; j < bs; j++) {
                var playerId = -1;
                var warriorLabel = "";

                for (var k = 0; k < data.players.length; k++) {
                    var warrior = _.find(data.players[k].warriors, function (warrior) {
                        return warrior.position == i * bs + j
                    });
                    if (!(_.isUndefined(warrior))) {
                        playerId = k;
                        warriorLabel = warrior.label;
                        break;
                    }
                }


                row.push({
                    hasWarrior: (playerId != -1),
                    color: Board.cellColor(data.board[i * bs + j]),
                    playerColor: Board.playerColor(playerId),
                    warriorColor: Warrior.color(warrior),
                    label: warriorLabel,
                });
            }
            board.push({row: row});
            row = [];
        }

        return board;
    }
});
