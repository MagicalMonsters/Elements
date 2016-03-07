Warrior = {};

Warrior.type = function(composition){
	var max = _.max(composition);
	var cou = 0;
	var index = -1;
	for(int i=0;i<composition.size();i++){
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