Template.board.helpers({

	getBoard : function () {
		var gameID = Session.get("gameId");
		var data = Games.findOne({_id: gameID});
		
		
	}

});
