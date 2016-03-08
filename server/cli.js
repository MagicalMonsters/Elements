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
	
	'warriorSetPosition': function (gameId, warriorLabel, position ) {
		Games.update({_id: gameId, "players.userId":  Meteor.userId(), "players.warriors.label": warriorLabel}, {
             $push: {"players.warriors.$0.warriors.$1.position": position }
        });
	},
});
