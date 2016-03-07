Template.game.helpers({
    name: function () {
        return Games.findOne({_id : this.gameId}).name;
    },
    isOwner: function () {
        var owner = Games.findOne({_id: this.gameId}).owner;
        return Meteor.userId() == owner.userId;
    },
});

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
    }
})
