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
        var game  = Games.findOne({_id: gameId});
		var warriors = _.find(game.players, function(player){return player.userId == Meteor.userId();}).warriors;
        
		for(var i=0;i<warriors.length;i++){
			if(warriors[i].label == warriorLabel){
				warriors[i].position = position;
				break;
			}
		}
		
		Games.update({_id: gameId, "players.userId":  Meteor.userId()}, {
             $set: {"players.$.warriors": warriors}
        });
	},
});
