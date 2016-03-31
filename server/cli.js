Meteor.methods({
    'createWarrior': function (gameId, position, elems) {
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

    'warriorSetPosition': function (gameId, warriorLabel, position) {
        var warriors = Warrior.fetchWarriors(gameId, Meteor.userId());
        for (var i = 0; i < warriors.length; i++) {
            if (warriors[i].label == warriorLabel) {
                warriors[i].position = position;
                break;
            }
        }

        Games.update({_id: gameId, "players.userId": Meteor.userId()}, {
            $set: {"players.$.warriors": warriors}
        });
    },

    'warriorActs': function (gameId, userId, warriorLabel) {
        var warriors = Warrior.fetchWarriors(gameId, userId);

        for (var i = 0; i < warriors.length; i++) {
            if (warriors[i].label == warriorLabel) {
                warriors[i].moves++;
                break;
            }
        }

        Games.update({_id: gameId, "players.userId": userId}, {
            $set: {"players.$.warriors": warriors}
        });
    },

    'warriorSetComposition': function (gameId, userId, warriorLabel, composition,
                                       resetReincarnation = false, newBackpack = []) {
        var warriors = Warrior.fetchWarriors(gameId, userId);

        for (var i = 0; i < warriors.length; i++) {
            if (warriors[i].label == warriorLabel) {
                warriors[i].composition = composition;
                if (newBackpack.length == 4) {
                    warriors[i].backpack = newBackpack;
                }
                if (resetReincarnation) {
                    warriors[i].turnsToReincarnation = 6;
                    warriors[i].canSplit = true;
                }
                break;
            }
        }

        Games.update({_id: gameId, "players.userId": userId}, {
            $set: {"players.$.warriors": warriors}
        });
    },

    'deleteWarrior': function (gameId, userId, warriorLabel) {

        var warriors = Warrior.fetchWarriors(gameId, userId);
        var warriorIndex;
        for (var i = 0; i < warriors.length; i++) {
            if (warriors[i].label == warriorLabel) {
                warriorIndex = i;
            }
        }
        warriors.splice(warriorIndex, 1);
        Games.update({_id: gameId, "players.userId": userId}, {
            $set: {"players.$.warriors": warriors}
        });
    },

    'endTurn': function (gameId, userId) {

        var warriors = Warrior.fetchWarriors(gameId, userId);

        // TODO: should get rid of this
        var game = Games.findOne({_id:gameId});
        for (var i = 0; i < warriors.length; i++) {
            warriors[i].backpack[game.board[warriors[i].position] - 1] += 1;
            warriors[i].turnsToReincarnation = Math.max(warriors[i].turnsToReincarnation - 1, 0);
            warriors[i].moves = 0;
            warriors[i].canSplit = false;
        }

        Games.update({_id: gameId, "players.userId": userId}, {
            $set: {"players.$.warriors": warriors}
        });

        Games.update({_id: gameId}, {
            $inc: {turn: 1}
        });
    },
});
