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
	
	var warrior = Warrior.getWarrior(gameId, Meteor.userId(), label);

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
	}
	else{
	
		otherWarrior = cellType.warrior;
		if(!(_.isUndefined(_.find(Warrior.getWarriors(gameId,Meteor.userId()), function (warrior) { return warrior.position == otherWarrior.position;})))){
			return "Cannot move to that direction. (your warrior)";
		}
		else{
			return attack(gameId, warrior, otherWarrior);
		}
	}
}

function attack(gameId, warrior1, warrior2){

	var result = Logic.calculateAttack(warrior1.composition, warrior2.composition);
	
	var otherId = Warrior.getOwner(gameId,warrior2.position);
	
	Meteor.call("warriorSetComposition", gameId, Meteor.userId() , warrior1.label, result.composition1);
	Meteor.call("warriorSetComposition", gameId, otherId , warrior2.label, result.composition2);
	
	if( _.reduce(result.composition2, function(memo, num){ return memo + num; }, 0) == 0 ){ // Defender died
		
		Meteor.call("deleteWarrior", gameId, otherId, warrior2.label);
		Meteor.call("warriorSetPosition", gameId, warrior1.label, warrior2.position);
	}
	if( _.reduce(result.composition1, function(memo, num){ return memo + num; }, 0) == 0 ){ //Attacker died
		Meteor.call("deleteWarrior", gameId, Meteor.userId(), warrior1.label);
	}
	
	return result.message;
}

function end(gameId){
	
	var game = Games.findOne({_id: gameId});
	var index;
	for(index = 0; index < game.players.length; index++){
		if(game.players[index].userId == Meteor.userId()){
			break;
		}
	}
	
	if(game.turn % game.players.length != index){
		return "This is not your turn";
	}
	
	Meteor.call("endTurn", gameId , Meteor.userId() , game.turn+1);
}
