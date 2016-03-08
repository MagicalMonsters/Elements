Router.configure({
    layoutTemplate: 'layout'
});

Router.route('/', 'games');
Router.route('/games/:_id', {
    template: 'game',
    data: function () {
        return {
            gameId: this.params._id,
            game: {gameId: this.params._id},
        };
    }
});
