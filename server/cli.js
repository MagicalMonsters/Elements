Meteor.methods({
    'createWarrior': function (gameId, position, elems) {
		
		var game  = Games.findOne({_id: gameId});
		var l = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		var warriors = _.find(game.players, function(player){return player.userId == Meteor.userId();}).warriors;
		var i;
		for(i = 0;i<l.length;i++){
			if(_.isUndefined(_.find(warriors, function(warrior){return warrior.label == l[i];} )) ){
				break;
			}
		}
		
		warriors.push({
                        position: position,
                        composition: elems,
                        backpack: [0,0,0,0],
                        turnsToReincarnation: 6,
                        moves: 0,
                        label: l[i],
						canSplit: false,
                        });
		
		Games.update({_id: gameId, "players.userId": Meteor.userId()}, {
             $set: {"players.$.warriors": warriors}
        });
    },
	
	'warriorSetPosition': function (gameId, userId, warriorLabel, position) {
        var game  = Games.findOne({_id: gameId});
		var warriors = _.find(game.players, function(player){return player.userId == userId;}).warriors;
        
		for(var i=0;i<warriors.length;i++){
			if(warriors[i].label == warriorLabel){
				warriors[i].position = position;
				break;
			}
		}
		
		Games.update({_id: gameId, "players.userId": userId}, {
             $set: {"players.$.warriors": warriors}
        });
	},
	
	'warriorActs': function (gameId, userId, warriorLabel){
		var game  = Games.findOne({_id: gameId});
		var warriors = _.find(game.players, function(player){return player.userId == userId;}).warriors;
        
		for(var i=0;i<warriors.length;i++){
			if(warriors[i].label == warriorLabel){
				warriors[i].moves++;
				break;
			}
		}
		
		Games.update({_id: gameId, "players.userId":  userId}, {
             $set: {"players.$.warriors": warriors}
        });
	},
	
	'warriorSetComposition': function (gameId , userId , warriorLabel, composition , resetReincarnation = false , newBackpack = []){
		var game  = Games.findOne({_id: gameId});
		var warriors = _.find(game.players, function(player){return player.userId == userId;}).warriors;
        
		for(var i=0;i<warriors.length;i++){
			if(warriors[i].label == warriorLabel){
				warriors[i].composition = composition;
				if(resetReincarnation){
					warriors[i].turnsToReincarnation = 7;
					warriors[i].backpack = newBackpack;
					warriors[i].canSplit = true;
				}
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
			warriors[i].turnsToReincarnation = Math.max(warriors[i].turnsToReincarnation - 1 , 0);
			warriors[i].moves = 0;
			warriors[i].canSplit = false;
		}
		
		Games.update({_id: gameId, "players.userId":  userId}, {
             $set: {"players.$.warriors": warriors}
        });
	
		Games.update({_id: gameId}, {
            $set: {"turn": game.turn+1 }
        });
	},
});
