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
	
	'warriorSetComposition': function(gameId , userId , warriorLabel, composition){
		var game  = Games.findOne({_id: gameId});
		var warriors = _.find(game.players, function(player){return player.userId == userId;}).warriors;
        
		for(var i=0;i<warriors.length;i++){
			if(warriors[i].label == warriorLabel){
				warriors[i].composition = composition;
				break;
			}
		}
		
		Games.update({_id: gameId, "players.userId":  userId}, {
             $set: {"players.$.warriors": warriors}
        });
	},
	
	'deleteWarrior': function (gameId , userId , warriorLabel) {

        var game = Games.findOne({_id: gameId});
        var warriors = _.find(game.players, function (player) {return player.userId == userId;}).warriors;
        var newWarriors = _.select(warriors, function (warrior){return warrior.lable != warriorLabel;});

        Games.update({_id: gameId, "players.userId": userId}, {
             $set: {"players.$.warriors": newWarriors}
        });
    },
	
	'endTurn' : function (gameId, userId ,turn){
	
		var game  = Games.findOne({_id: gameId});
		var warriors = _.find(game.players, function(player){return player.userId == userId;}).warriors;
        
		for(var i=0;i<warriors.length;i++){
			warriors[i].backpack[ game.board[warriors[i].position] - 1 ] += 100;
		}
		
		Games.update({_id: gameId, "players.userId":  userId}, {
             $set: {"players.$.warriors": warriors}
        });
	
		Games.update({_id: gameId}, {
            $set: {"turn": turn }
        });
	}
});
