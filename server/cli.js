Meteor.methods({
    'createWarrior': function (gameId, position, elems) {
        Games.update({_id: gameId, "players.userId": Meteor.userId()}, {
             $set: {"players.$.warriors": [{
                                            position: position,
                                            composition: elems,
                                            backpack: [0,0,0,0],
                                            turnsToReincarnation: 6,
                                            moves: 0,
                                            label: 'A',
                                            }]
             }
        });
    },
	
	'warriorSetPosition': function (gameId, warriorLabel, position) {
        var game  = Games.findOne({_id: gameId, "players.userId": Meteor.userId()});
        console.log("game:" + game);
        if (_.isUndefined(game)) {
            return;
        }

        var player = _.find(game.players, function(player){return player._id == Meteor.userId();});
        if (_.isUndefined(player)) {
            return;
        }
        console.log("here");
        var warriors = player.warriors;
        var index = _.indexOf(warriors, function(warrior){return wrrior.label == warriorLabel;});
        warriors[index].position = position;
		Games.update({_id: gameId, "players.userId":  Meteor.userId()}, {
             $set: {"players.$.warriors": warriors}
        });
        console.log("there");
	},
});
