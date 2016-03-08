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

    for (var player in game.players) {
        if (player != undefined && player.warriors != undefined) {
            for (var warrior in player.warriors) {
                if (warrior.position == index) {
                    return false;
                }
            }
        }
    }
    return true;
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
    coordination = coordination.split(",");
    var boardCellIndex = parseInt(coordination[1]) + parseInt(coordination[0])*game.boardSize;
    if (!validate(game, boardCellIndex)) {
        return "Not a valid position";
    }

    Meteor.call("createWarrior", gameId, boardCellIndex, elems);
}

function move(gameId, label, direction) {
    var game = Games.findOne({_id: gameId});
    var playerWarriors = _.find(game.players, function (player) {
        return player._id == Meteor.userId();
    }).warriors;

    // get the warrior with the specified label
    var warrior = _.find(playerWarriors, function (warrior) {
        return warrior.label == label;
    });

    if (warrior == undefined) {
        return "No warrior with this label.";
    }
    var directions = [[0,-1], [0,1], [-1,0], [1,0]];
    var directionLetters = ['l', 'r', 'u', 'd'];
    var indexOf = _.indexOf(directionLetters, direction);
    if (indexOf == -1) {
        return "Invalid direction.";
    }
    var r = warrior.position / game.boardSize;
    var c = warrior.position % game.boardSize;
    
    var newR = r + directions[indexOf][0];
    var newC = c + directions[indexOf][1];

    if (newR < 0 || newR >= game.boardSize || newC < 0 || newC >= game.boardSize) {
        return "Cannot move to that direction. (out of bound)";
    }

    var newPosition = newR*game.boardSize + newC;
    if (game.board[newPosition] == 0) {
        return "Cannot move to that direction. (empty)";
    }

    // see if another warrior is in that position

    var anotherWarrior = _.find(playerWarriors, function (warrior){
        return warrior.position == newPosition;
    });

    if (anotherWarrior != undefined) {
        return "You have a warrior in that position.";
    }

    for (player in game.players) {
        for (warrior in player.warriors) {
            if (warrior.position == newPosition) {
                // TODO: should attack
                // and should return
            }
        }
    }

    // move
}
