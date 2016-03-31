Template.cli.helpers({
    isMyTurn: function () {
        return (Logic.isMyTurn(this.gameId, Meteor.userId())) ? "enabled" : "disabled";
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
        var command = tpl.$('input[name=command]').val();
        submit(this.gameId, command, e);
    },

    'submit form#end_turn': function (e, tpl) {
        submit(this.gameId, "end", e);
    }
});

function submit(gameId, command, e) {
    e.preventDefault();
    var inProgress = Session.get("inProgress");
    if (inProgress == undefined) {
        Session.set("inProgress", 0);
    }
    if (inProgress != 0) {
        return;
    }
    var log = parse(gameId, command);
    Session.set("log", log);
}

function parse(gameId, command) {
    if(!Logic.isMyTurn(gameId, Meteor.userId())){
        return "This is not your turn";
    }
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
        return add(gameId, tokens[1], tokens[2]);    
    } else if (action == "split") {
		return spliting(gameId, tokens[1], tokens[2], tokens[3]);
    } else if (action == "merge") {
		return merging(gameId, tokens[1], tokens[2]);
    }else if (action == "end") {
        Session.set("inProgress", Session.get("inProgress") + 1);
        Meteor.call("endTurn", gameId , Meteor.userId(), function (error, result) {
            Session.set("inProgress", Session.get("inProgress") - 1);
        });
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

	var warriors = Warrior.getWarriors(gameId, Meteor.userId());
	
	if(warriors.length > 0){
		return "You can't create more than one warrior";
	}
	
    if (sum != 20) {
        return "The sum should be 20";
    }
    
    
	if(!Logic.isFirstRound(gameId)){
		return "You can create only at first turn";
	}

    // TODO: should remove this 
    var game = Games.findOne({_id: gameId});

    coordination = coordination.split(",");
    var boardCellIndex = parseInt(coordination[1]) + parseInt(coordination[0]) * game.boardSize;
	
	if( Board.cellType(game, boardCellIndex).type != "empty" ) {
		return "Not a valid position";
	}
    Session.set("inProgress", Session.get("inProgress") + 1);
    Meteor.call("createWarrior", gameId, Meteor.userId(), boardCellIndex, elems, function (error, result) {
        Session.set("inProgress", Session.get("inProgress") - 1);
    });
}

function move(gameId, label, direction) {

    var game = Games.findOne({_id: gameId});
	
	if(game.turn < game.players.length){
		return "You can't move at first turn";
	}
	
	var warrior = Warrior.getWarrior(gameId, Meteor.userId(), label);

    if (warrior == undefined) {
        return "No warrior with this label.";
    }
	
	if(!canMove(warrior)){
		return "You can't move any more in this turn";
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
        Session.set("inProgress", Session.get("inProgress") + 1);
		Meteor.call("warriorActs", gameId, Meteor.userId() , warrior.label, function (error, result) {
            Session.set("inProgress", Session.get("inProgress") - 1);
        });
        Session.set("inProgress", Session.get("inProgress") + 1);
		Meteor.call("warriorSetPosition", gameId, Meteor.userId(), warrior.label, cellToMove, function (error, result) {
            Session.set("inProgress", Session.get("inProgress") - 1);
        });
	}
	else{
	
		otherWarrior = cellType.warrior;
		if(!(_.isUndefined(_.find(Warrior.getWarriors(gameId,Meteor.userId()), function (warrior) { return warrior.position == otherWarrior.position;})))){
			return "Cannot move to that direction. (your warrior)";
		}
		else{
            Session.set("inProgress", Session.get("inProgress") + 1);
			Meteor.call("warriorActs", gameId, Meteor.userId() , warrior.label, function (error, result) {
                Session.set("inProgress", Session.get("inProgress") - 1);
            });
			return attack(gameId, warrior, otherWarrior);
		}
	}
}

function attack(gameId, warrior1, warrior2){

	var result = Logic.calculateAttack(warrior1.composition, warrior2.composition);
	
	var otherId = Warrior.getOwner(gameId,warrior2.position);
	
	if( _.reduce(result.composition2, function(memo, num){ return memo + num; }, 0) == 0 ){ // Defender died
		
		var newPos = warrior2.position;
		var newbackpack = warrior2.backpack;
		newbackpack = _.map(newbackpack, function(num, index){ return num + warrior1.backpack[index]; });
        Session.set("inProgress", Session.get("inProgress") + 1);
		Meteor.call("deleteWarrior", gameId, otherId, warrior2.label, function (error, result) {
            Session.set("inProgress", Session.get("inProgress") - 1);
        });
        Session.set("inProgress", Session.get("inProgress") + 1);
		Meteor.call("warriorSetPosition", gameId, warrior1.label, newPos, function (error, result) {
            Session.set("inProgress", Session.get("inProgress") - 1);
        });
        Session.set("inProgress", Session.get("inProgress") + 1);
		Meteor.call("warriorSetComposition", gameId, Meteor.userId() , warrior1.label, result.composition1,
            false, newbackpack, function (error, result) {
                Session.set("inProgress", Session.get("inProgress") - 1);
            });
	}
	else if( _.reduce(result.composition1, function(memo, num){ return memo + num; }, 0) == 0 ){ //Attacker died
        Session.set("inProgress", Session.get("inProgress") + 1);
		Meteor.call("deleteWarrior", gameId, Meteor.userId(), warrior1.label, function (error, result) {
            Session.set("inProgress", Session.get("inProgress") - 1);
        });
        Session.set("inProgress", Session.get("inProgress") + 1);
		Meteor.call("warriorSetComposition", gameId, otherId,
            warrior2.label, result.composition2, function (error, result) {
            Session.set("inProgress", Session.get("inProgress") - 1);
        });
	}
	else {
        Session.set("inProgress", Session.get("inProgress") + 1);
		Meteor.call("warriorSetComposition", gameId, Meteor.userId() ,warrior1.label,
            result.composition1, function (error, result) {
            Session.set("inProgress", Session.get("inProgress") - 1);
        });
        Session.set("inProgress", Session.get("inProgress") + 1);
		Meteor.call("warriorSetComposition", gameId, otherId ,warrior2.label,
            result.composition2, function (error, result) {
            Session.set("inProgress", Session.get("inProgress") - 1);
        });
	}
	
	return result.message;
}

function canMove(warrior){

	if(warrior.moves < 1){
		return true;
	}
	return false;
}

function add(gameId, label, elements){
	var game = Games.findOne({_id: gameId});
	var elems = elements.split(",");
	elems = _(elems).map(function (elem) {
        return parseInt(elem);
    });
	var warrior = Warrior.getWarrior(gameId, Meteor.userId(), label);
	if (warrior == undefined) {
        return "No warrior with this label.";
    }
	var newBackpack = warrior.backpack;
	if(warrior.turnsToReincarnation > 0){
		return "You can't reincarnat yet";
	}
	for(var i = 0;i<elems.length;i++){
		if(elems[i] > warrior.backpack[i]){
			return "This is more than what you have in backpack";
		}
		newBackpack[i] -= elems[i];
		elems[i] += warrior.composition[i];
	}

    Session.set("inProgress", Session.get("inProgress") + 1);
	Meteor.call("warriorSetComposition", gameId, Meteor.userId() ,label, elems,true ,
        newBackpack, function (error, result) {
        Session.set("inProgress", Session.get("inProgress") - 1);
    });
}

function spliting(gameId, label, elements, direction){
	var game = Games.findOne({_id: gameId});
	
	var elems = elements.split(",");
	elems = _(elems).map(function (elem) {
        return parseInt(elem);
    });
	
	var warrior = Warrior.getWarrior(gameId, Meteor.userId(), label);

    if (warrior == undefined) {
        return "No warrior with this label";
    }
	
	if( !warrior.canSplit ) {
		return "you can't split yet";
	}
	
	var newComp = warrior.composition;
	
	for(var i = 0;i<elems.length;i++){
		if(elems[i] > warrior.composition[i]){
			return "This is more than what you have in composition";
		}
		newComp[i] -= elems[i];
	}
    
	var cellToMove = Board.directionOfCell(game, warrior.position, direction);
	
	if( cellToMove < -50 ) {
		return "Invalid direction";
	}
	
	var cellType = Board.cellType(game, cellToMove);
	
	if(cellType.type != "empty"){
		return "You can't move to that direction";
	}
	
	if(_.reduce(elems, function(memo, num){ return memo + num; }, 0) != 0 ){
        Session.set("inProgress", Session.get("inProgress") + 1);
		Meteor.call("createWarrior", gameId, Meteor.userId(), cellToMove, elems, function (error, result) {
            Session.set("inProgress", Session.get("inProgress") - 1);
        });
	}
	
	if( _.reduce(newComp, function(memo, num){ return memo + num; }, 0) == 0 ){
        Session.set("inProgress", Session.get("inProgress") + 1);
		Meteor.call("deleteWarrior", gameId, Meteor.userId(), label, function (error, result) {
            Session.set("inProgress", Session.get("inProgress") - 1);
        });
	}
	else{
        Session.set("inProgress", Session.get("inProgress") + 1);
		Meteor.call("warriorSetComposition", gameId, Meteor.userId() , label, newComp, function (error, result) {
            Session.set("inProgress", Session.get("inProgress") - 1);
        });
	}
}

function merging(gameId, label, direction){
	var game = Games.findOne({_id: gameId});
	
	var warrior = Warrior.getWarrior(gameId, Meteor.userId(), label);

    if (warrior == undefined) {
        return "No warrior with this label";
    }
	
	if( !warrior.canSplit ) {
		return "you can't merge yet";
	}
	
	var comp = warrior.composition;
    
	var cellToMove = Board.directionOfCell(game, warrior.position, direction);
	
	if( cellToMove < -50 ) {
		return "Invalid direction";
	}
	
	var cellType = Board.cellType(game, cellToMove);
	
	if(cellType.type != "warrior"){
		return "There is no warrior at that direction";
	}
	else if(Warrior.getOwner(gameId, cellType.warrior.position) != Meteor.userId() ){
		return "You can only merge with your own warriors";
	}
	
	newComp = _.map(cellType.warrior.composition , function (num, index){ return num + comp[index]} );
	
	Session.set("inProgress", Session.get("inProgress") + 1);
	Meteor.call("warriorSetComposition", gameId, Meteor.userId() , cellType.warrior.label, newComp, function (error, result) {
        Session.set("inProgress", Session.get("inProgress") - 1);
    });
	Session.set("inProgress", Session.get("inProgress") + 1);
	Meteor.call("deleteWarrior", gameId, Meteor.userId(), warrior.label, function (error, result) {
        Session.set("inProgress", Session.get("inProgress") - 1);
    });
}