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
    var warrior = _.find(playerWarriors, function (warrior) {
        return warrior.label == label;
    });

	return warrior;
}
