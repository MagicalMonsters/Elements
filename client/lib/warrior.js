Warrior = {};

Warrior.type = function(composition){
	var max = _.max(composition);
	var cou = 0;
	var index = -1;
	for(var i=0;i<composition.length;i++){
		if(composition[i] >= max){
			cou++;
			index = i;
		}
	}
	
	if (cou != 1){
		return -1;
	}
	return index;
}

Warrior.getWarrior = function(gameId , userid , label){

	var game = Games.findOne({_id: gameId});
    var playerWarriors = _.find(game.players, function (player) {
        return player.userId == userid;
    }).warriors;

    // get the warrior with the specified label
    return _.find(playerWarriors, function (warrior) {
        return warrior.label == label;
    });

}

Warrior.getWarriors = function(gameId, userid){
	var game = Games.findOne({_id: gameId});
    return _.find(game.players, function (player) {
        return player.userId == userid;
    }).warriors;
}

Warrior.getOwner = function(gameId , position){
	var game = Games.findOne({_id: gameId});
	for(var i = 0;i<game.players.length; i++){
		var Id = game.players[i].userId;
		if(!(_.isUndefined(_.find(game.players[i].warriors, function (warrior) {return warrior.position == position; })))){
			return Id;
		}
	}
}
