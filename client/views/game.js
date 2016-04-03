Template.game.helpers({
    name: function () {
        return Games.findOne({_id: this.gameId}).name;
    },
    canJoin: function () {
        var game = Games.findOne({_id: this.gameId});
        return (Meteor.userId() != game.owner.userId) && (game.turn == -1) && _.find(game.players, function (player) {
                return player.userId == Meteor.userId();
            }) == undefined;
    },
    canStart: function () {
        var game = Games.findOne({_id: this.gameId});
        return (Meteor.userId() == game.owner.userId) && (game.turn == -1);
    },
    isStarted: function () {
        return Games.findOne({_id: this.gameId}).turn >= 0;
    },
});

function createBoard(bs) {

    var board = [];
    var active = Math.floor((bs - 1) / 2);
    for (var i = 0; i < bs; i++) {
        for (var j = 0; j < bs; j++) {
            if (j < Math.abs(active) || j >= bs - Math.abs(active)) {
                board.push(0);
            }
            else {
                board.push(Math.floor(Math.random() * 4.0) + 1);
            }
        }
        if (i != bs/2 -1) {
            active--;
        }
    }

    return board;
}

Template.game.events({
    'click a#join-btn': function (e, tpl) {
        e.preventDefault();
        Games.update({_id: this.gameId}, {
            $addToSet: {
                players: {
                    userName: Meteor.user().username,
                    userId: Meteor.userId(),
                    warriors: [],
                }
            }
        });
    },

    'click a#leave-btn': function (e, tpl) {
        e.preventDefault();
        Games.update({_id: this.gameId}, {
            $pull: {
                players: {
                    userId: Meteor.userId(),
                }
            }
        });
    },

    'click a#start-btn': function (e, tpl) {
        e.preventDefault();
        Games.update({_id: this.gameId}, {
            $set: {
                turn: 0,
                boardSize: 8,
                board: createBoard(8)
            }
        });

        var game = Games.findOne({_id: this.gameId});
        for (var i = 0; i < game.players.length; i++) {
            Logs.insert({
                gameId: this.gameId,
                userId: game.players[i].userId,
                text: "",
            });
        }
        Log.game(this.gameId, "Game started.");
    }
})
