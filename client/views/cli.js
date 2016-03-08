Template.cli.helpers({
    isMyTurn: function () {
        var gameId = this.gameId;
        var game = Games.findOne({_id: gameId});
        var myIndex = _.findIndex(game.players, function (player){
            return player.userId == Meteor.userId();
        });
        return (myIndex == game.turn) ? "enabled" : "disabled";
    },
    log: function () {
        return Session.get("log") ? Session.get("log") : "Success";
    },
    color: function () {
        return Session.get("log") ? "red" : "green";
    }
});

Template.cli.events({
    'submit form#cli_form': function (e, tpl) {
        e.preventDefault();
        var command = tpl.$('input[name=command]').val();
        console.log(command);
        var log = parse(this.gameId, command);
        Session.set("log",log);
    }
});

function parse(gameId, command) {
    if (_.isEmpty(command)) {
        return "";
    }
    var tokens = command.split(" ");
    if (_.isEmpty(tokens)) {
        return "";
    }
    var action = tokens[0].toLowerCase();
    if (action == "create") {
        return create(gameId, tokens[1], tokens[2]);
    } else if (action == "move") {
        return move(gameId, tokens[1], tokens[2]);
    } else if (action == "add") {
        return add(gameId, tokens[1]);    
    } else if (action == "split") {
        return split(gameId, tokens[1], tokens[2]);
    } else if (action == "end") {
        return end(gameId);
    } else {
        return "unknown command!";
    }
}

function validate(game, index) {
    if(game.board[index] == 0) {
        return false;
    } 

    var warriors = _(_(game.players).map(function (player){
            return player.warriors;
    })).flatten();

    return _(warriors).find(function (warrior){return warrior.position == index}) == undefined;
}

function create(gameId, elements, coordination) {
    var elems = elements.split(",");
    elems = _(elems).map(function (elem) {
        return parseInt(elem);
    });
    var sum = _(elems).reduce(function (memo, num) {
        return memo + num;
    }, 0);
    if (sum != 2000) {
        return "The sum should be 2000";
    }
    
    var game = Games.findOne({_id: gameId});
    var boardCellIndex = coordination[0] + coordination[1]*game.boardSize;
    if (!validate(game, boardCellIndex)) {
        return "Not a valid position";
    }

    Game.update({_id: gameId, "players.userId": Meteor.userId()}, 
                {
                    $set: {"players.$.warriors": [{
                        position: index,
                        composition: elems,
                        backpack: [0,0,0,0],
                        turnsToReincarnation: 5,
                        moves: 0,
                        label: 'A',
                    }]}
                }
               );
               
}
