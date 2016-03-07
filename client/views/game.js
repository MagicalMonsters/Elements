Template.game.helpers({
    name: function () {
        return Games.findOne({_id : this.gameId}).name;
    }
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
    }
})
