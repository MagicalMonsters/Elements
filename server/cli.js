Meteor.methods({
    'warriorCreate': function (gameId, position, elems) {
        var warriors = Warrior.fetchWarriors(gameId, Meteor.userId());
        var l = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (var i = 0; i < l.length; i++) {
            if (_.isUndefined(_.find(warriors, function (warrior) {
                    return warrior.label == l[i];
                }))) {
                break;
            }
        }

        warriors.push(Warrior.createOne(position, elems, l[i]));

        Games.update({_id: gameId, "players.userId": Meteor.userId()}, {
            $set: {"players.$.warriors": warriors}
        });
    },

    'warriorUpdate': function (gameId, userId, warrior) {
        var warriors = Warrior.fetchWarriors(gameId, userId);

        // check and delete if the composition is totally empty otherwise update
        if (warrior.composition[0] + warrior.composition[1] + warrior.composition[2] + warrior.composition[3] == 0) {
            var warriorIndex;
            for (var i = 0; i < warriors.length; i++) {
                if (warriors[i].label == warrior.label) {
                    warriorIndex = i;
                }
            }
            warriors.splice(warriorIndex, 1);
        } else {
            for (var i = 0; i < warriors.length; i++) {
                if (warriors[i].label == warrior.label) {
                    warriors[i] = warrior;
                    break;
                }
            }
        }
        Games.update({_id: gameId, "players.userId": userId}, {
            $set: {"players.$.warriors": warriors}
        });
    },

    'warriorEndTurn': function (gameId) {
        var warriors = Warrior.fetchWarriors(gameId, Meteor.userId());

        // TODO: should get rid of this
        var game = Games.findOne({_id:gameId});
        for (var i = 0; i < warriors.length; i++) {
            warriors[i].backpack[game.board[warriors[i].position] - 1] += 1;
            warriors[i].moves = 0;
        }

        Games.update({_id: gameId, "players.userId": Meteor.userId()}, {
            $set: {"players.$.warriors": warriors}
        });

        Games.update({_id: gameId}, {
            $inc: {turn: 1}
        });
    },
});
