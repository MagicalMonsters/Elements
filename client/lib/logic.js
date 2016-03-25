Logic = {};

Logic.calculateAttack = function (composition1, composition2){

	
	var arr1 = [
				[0.25, 0.25, 0.25, 0.25],
				[1, 0, 0, 0],
				[0, 1, 0, 0],
				[0, 0, 1, 0],
				[0, 0, 0, 1] ];
				
	var arr2 = [
				[0.25, 0.25, 0.25, 0.25],
				[0, 1, 0, 0],
				[0, 0, 1, 0],
				[0, 0, 0, 1],
				[1, 0, 0, 0] ];
	
	var powerDeduction = 2;
	
	var type1 = Warrior.type(composition1);
	var type2 = Warrior.type(composition2);
				
	var power1 = _.reduce(composition1, function(memo, num, index){ return memo + num*arr1[type1+1][index] - composition2[index]*arr2[type1+1][index]; }, 0);
	var power2 = _.reduce(composition2, function(memo, num, index){ return memo + num*arr1[type2+1][index] - composition1[index]*arr2[type2+1][index]; }, 0);
	
	var power = parseInt(Math.abs(power1-power2) / powerDeduction); // reducing the effect to half
	
	if(power1 == power2){
		return { "message": "It was a tie", "composition1" : composition1, "composition2" : composition2};
	}
	else if(power1 > power2){
		var elementNum = _.reduce(composition2, function(memo, num){ return num==0 ? memo : memo+1 ; }, 0)
		var newComp = _.map(composition2, function(num){ return Math.max(num - parseInt(power/elementNum), 0) });
		
		return { "message": "Attacker Win", "composition1" : composition1, "composition2" : newComp};
	}
	else{
		var elementNum = _.reduce(composition1, function(memo, num){ return num==0 ? memo : memo+1 ; }, 0)
		var newComp = _.map(composition1, function(num){ return Math.max(num - parseInt(power/elementNum), 0) });
		
		return { "message": "Defender Win", "composition1" : newComp, "composition2" : composition2};
	}
}

Logic.isMyTurn = function (gameId, userId){

	var game = Games.findOne({_id: gameId});
	var index;
	for(index = 0; index < game.players.length; index++){
		if(game.players[index].userId == userId){
			break;
		}
	}
	
	if(game.turn % game.players.length != index){
		return false;
	}
	
	return true;
}