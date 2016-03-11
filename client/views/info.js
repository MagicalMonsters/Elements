Template.info.helpers({
    warriors: function () {
        var game = Games.findOne({_id: this.gameId});
        var warriors = _.find(game.players, function(player) {return player.userId==Meteor.userId();}).warriors;
        return _.map(warriors, function(warrior) {
            return {
                label: warrior.label,
                composition: warrior.composition.join(','),
                backpack: warrior.backpack.join(','),
                color: Warrior.color(warrior.composition),
            };
        });

    }
});
