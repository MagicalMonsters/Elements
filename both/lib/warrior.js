Warrior = {/* Air, Earth, Fire, Water */};

Warrior.createOne = function (position, elems, label) {
    return {
        position: position,
        composition: elems,
        backpack: [0, 0, 0, 0],
        moves: 1,
        label: label,
    };
};

Warrior.air = function (warrior) {return getElem(warrior, 0)};
Warrior.earth = function (warrior) {return getElem(warrior, 1)};
Warrior.fire = function (warrior) {return getElem(warrior, 2)};
Warrior.water = function (warrior) {return getElem(warrior, 3)};

function getElem(warrior, type) {
    return warrior.elems[type];
}

Warrior.type = function (composition) {
    var max = _.max(composition);
    var cou = 0;
    var index = -1;
    for (var i = 0; i < composition.length; i++) {
        if (composition[i] >= max) {
            cou++;
            index = i;
        }
    }

    if (cou != 1) {
        return -1;
    }
    return index;
};

Warrior.color = function (warrior) {
    if (!warrior) {
        return undefined;
    }
    var colors = ['white', 'LightSkyBlue', 'Peru', 'Red', 'DodgerBlue'];
    var res = Warrior.type(warrior.composition);
    res++;
    return colors[res];
};

Warrior.fetchOwnWarrior = function (gameId, label) {
    var playerWarriors = Warrior.fetchWarriors(gameId, Meteor.userId());

    return _.find(playerWarriors, function (warrior) {
        return warrior.label == label;
    });
};

Warrior.canMove = function (warrior) {
    if (warrior.moves == 0) {
        return true;
    }

    if (Warrior.air(warrior) > 0) {
        return true;
    }

    return false;
};

Warrior.fetchWarriors = function (gameId, userId) {
    var game = Games.findOne({_id: gameId});
    var playerWarriors = _.find(game.players, function (player) {
        return player.userId == userId;
    }).warriors;
    return playerWarriors;
};

Warrior.isDead = function (warrior) {
    return Element.sumOfElements(warrior.composition) === 0;
};

