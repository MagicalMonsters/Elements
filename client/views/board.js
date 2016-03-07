Template.board.helpers({

	board : function () {
		var gameID = Session.get("gameId");
		var data = Games.findOne({_id: gameID});
		
		var bs = data.boardSize;
		var board  = [];
		var row = [];
		var colors = ["black","red","green","blue","white"];
		
		
		for(var i = 0; i < bs; i++) {
			for(var j = 0; j < bs; j++ ){
				var playerID = -1;
				var warriorType = -1;
				var warriorLabel = "";
				for(var k = 0; k < data.players.size() ; k++){
					var index = _.find(data.players[k].warriors, function(warrior){ return warrior.position == i*bs + j } );
					if(index != undefined){
						playerID = k;
						warriorLabel = data.players[k].warriors[index].label;
						var composition = data.players[k].warriors[index].composition;
						warriorType = Warrior.type(composition);
						break;
					}
				}
				row.push({ "color" : colors[data.board[i*bs + j]] , "playerClass" : "player"+playerID , "warriorClass" : "warrior"+warriorType , "lable" = warriorLabel });
			}
			board.push({ "row" : row });
			row = [];
		}
		
		return board;
	}

});
