Template.game.helpers({
    name: function () {
        return Games.findOne({_id : this.gameId}).name;
    }
});
