Template.game.helpers({
    name: function () {
        return Games.findOne({_id : this.gameId}).name;
    },
    isOwner: function () {
        var owner = Games.findOne({_id: this.gameId}).owner;
        return Meteor.userId() == owner.userId;
    },
});

function createBoard(bs){

	var board = [];
	for(var i = 0;i<bs ;i++){
		for(var j = 0;j<bs ; j++){
			board.push(Math.floor(Math.random()*4.0));
		}
	}
	
	return board;
}

Template.game.events({
    'click a#join-btn': function (e, tpl) {
        e.preventDefault();
        Games.update({_id : this.gameId}, {
            $addToSet: {players: 
                    {
                    userName: Meteor.user().username,
                    userId: Meteor.userId(),
                }
            }
        });
    },
	
	'click a#leave-btn': function (e, tpl) {
        e.preventDefault();
        Games.update({_id : this.gameId}, {
            $pull: {players: 
                    {
                    userName: Meteor.user().username,
                    userId: Meteor.userId(),
                }
            }
        });
    },
	
	'click a#start-btn': function (e, tpl) {
		e.preventDefault();
		Games.update({_id : this.gameId}, {
			$set: {
				turn: 0,
				boardSize: 7, 
				board: createBoard(7)
			}
		});
		
		Session.set('gameId', this.gameId);
	}
})
