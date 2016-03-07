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
				row.push({ "color" : colors[data.board[i*bs + j]] });
			}
			board.push({ "row" : row });
			row = [];
		}
		
		return board;
	}

});
