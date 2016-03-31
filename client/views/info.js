Template.info.helpers({
    warriors: function () {
        var warriors = Warrior.fetchWarriors(this.gameId, Meteor.userId());
        return _.map(warriors, function(warrior) {
            return {
                label: warrior.label,
                composition: warrior.composition.join(','),
                backpack: warrior.backpack.join(','),
                color: Warrior.color(warrior),
                canNotMove: !Warrior.canMove(warrior),
                turnsToReincarnation: warrior.turnsToReincarnation,
            };
        });
    }
});
