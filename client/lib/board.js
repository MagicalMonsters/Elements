Board = {};

Board.cellType = function ( game , position ){

	if( position < 0 || position >= game.boardSize*game.boardSize || game.board[position] == 0) {
        return { "type": "wall"};
    } 
	
	var warriors = _.flatten(_.map(game.players, function (player) { return player.warriors }));
	var warrior = _.find(warriors, function(warrior){ return warrior.position == position } );
	
	if( !(_.isUndefined(warrior))){
		return { "type": "warrior" , "warrior": warrior };
	}
	
    return { "type": "empty"};
}

Board.directionOfCell = function ( game , position , direction){

	var directions = [[0,-1], [0,1], [-1,0], [1,0]];
    var directionLetters = ['l', 'r', 'u', 'd'];
	
    var indexOf = _.indexOf(directionLetters, direction);
	
	if (indexOf == -1) {
		return  -100;
    }
	
	var newPosition = position + (directions[indexOf][0] * game.boardSize) + directions[indexOf][1];

    return newPosition;
	
}