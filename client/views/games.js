Template.games.helpers({
    notStaredGames: function () {
        return Games.find({
            $and: [
                {$or: [
                    {players: {$size: 1}}, 
                    {players: {$size: 2}}, 
                    {players: {$size: 3}}
                ]}, 
                {turn: -1}
            ]
        });
    },
	myGames: function () {
		return Games.find({
			$and: [
                {players: {
					$elemMatch: {
						userId: Meteor.userId()
					}
				}}, 
                {turn: { $gt: -1 }}
            ]
		});
	},
    isCreatingGame: function () {
        return Session.get("isCreatingGame");
    }
});

Template.games.events({
    'click a.create': function (e, tpl) {
        e.preventDefault();
        Session.set('isCreatingGame', true);
    },

    'click a.cancel': function (e, tpl) {
        e.preventDefault();
        Session.set('isCreatingGame', false);
    },

    'submit form.create-game': function (e, tpl) {
        e.preventDefault();
        var gameName = tpl.$('input[name=name]').val();
        Games.insert({
            createdAt: new Date(),
            name: gameName, 
            turn: -1, 
            owner: {
                userName: Meteor.user().username,
                userId: Meteor.userId()
            },
            players:[{
                userName: Meteor.user().username,
                userId: Meteor.userId(),
                warriors: []
            }],
        });
        Session.set('isCreatingGame', false);
    }
});


Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
});
