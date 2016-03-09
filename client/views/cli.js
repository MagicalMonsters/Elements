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
	
	if( Board.cellType(game, boardCellIndex).type != "empty" ) {
		return "Not a valid position";
	}

    Meteor.call("createWarrior", gameId, boardCellIndex, elems);
}

function move(gameId, label, direction) {
    var game = Games.findOne({_id: gameId});
    var playerWarriors = _.find(game.players, function (player) {
        return player.userId == Meteor.userId();
    }).warriors;

    // get the warrior with the specified label
    var warrior = _.find(playerWarriors, function (warrior) {
        return warrior.label == label;
    });

    if (warrior == undefined) {
        return "No warrior with this label.";
    }
    
	var cellToMove = Board.directionOfCell(game, warrior.position, direction);
	
	if( cellToMove < -50 ) {
		return "Invalid direction";
	}
	
	var cellType = Board.cellType(game, cellToMove);
	
	if(cellType.type == "wall"){
		return "Cannot move to that direction. (wall)";
	}
	else if(cellType.type == "empty"){
		
		Meteor.call("warriorSetPosition", gameId, warrior.label, cellToMove);
		return "You moved";
	}
	else{
	
		otherWarrior = cellType.warrior;
		if(!(_.isUndefined(_.find(playerWarriors, function (warrior) { return warrior.position == otherWarrior.position;}))){
			return "Cannot move to that direction. (your warrior)";
		}
		else{
			return "Should attack";
		}
	}
}
