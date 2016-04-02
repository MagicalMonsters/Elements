Template.cli.helpers({
    isMyTurn: function () {
        return (Logic.isMyTurn(this.gameId, Meteor.userId())) ? "enabled" : "disabled";
    },
    log: function () {
        return Session.get("log");
    },
    color: function () {
        return Session.get("log") == "success" ? "green" : "red";
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
    Session.set("log", "");
    Session.set("inProgress", Session.get("inProgress") + 1);
    Command.parse(gameId, command, function (error) {
        if (!error) {
            error = "success";
        }
        Session.set("log", error);
        Session.set("inProgress", Session.get("inProgress") - 1);
    });
}

function add(gameId, label, elements) {
    var game = Games.findOne({_id: gameId});
    var elems = Element.elementsFromString(elements);
    var warrior = Warrior.fetchOwnWarrior(gameId, label);
    if (warrior == undefined) {
        return "No warrior with this label.";
    }
    var newBackpack = warrior.backpack;
    if (warrior.turnsToReincarnation > 0) {
        return "You can't reincarnat yet";
    }
    for (var i = 0; i < elems.length; i++) {
        if (elems[i] > warrior.backpack[i]) {
            return "This is more than what you have in backpack";
        }
        newBackpack[i] -= elems[i];
        elems[i] += warrior.composition[i];
    }

    Session.set("inProgress", Session.get("inProgress") + 1);
    Meteor.call("warriorSetComposition", gameId, Meteor.userId(), label, elems, true,
        newBackpack, function (error, result) {
            Session.set("inProgress", Session.get("inProgress") - 1);
        });
}

function spliting(gameId, label, elements, direction) {
    var game = Games.findOne({_id: gameId});

    var elems = Element.elementsFromString(elements);

    var warrior = Warrior.fetchOwnWarrior(gameId, label);

    if (warrior == undefined) {
        return "No warrior with this label";
    }

    if (!warrior.canSplit) {
        return "you can't split yet";
    }

    var newComp = warrior.composition;

    for (var i = 0; i < elems.length; i++) {
        if (elems[i] > warrior.composition[i]) {
            return "This is more than what you have in composition";
        }
        newComp[i] -= elems[i];
    }

    var cellToMove = Board.directionOfCell(gameId, warrior.position, direction);

    if (cellToMove < -50) {
        return "Invalid direction";
    }

    var cellType = Board.cellType(gameId, cellToMove);

    if (cellType.type != "empty") {
        return "You can't move to that direction";
    }

    if (_.reduce(elems, function (memo, num) {
            return memo + num;
        }, 0) != 0) {
        Session.set("inProgress", Session.get("inProgress") + 1);
        Meteor.call("createWarrior", gameId, cellToMove, elems, function (error, result) {
            Session.set("inProgress", Session.get("inProgress") - 1);
        });
    }

    if (_.reduce(newComp, function (memo, num) {
            return memo + num;
        }, 0) == 0) {
        Session.set("inProgress", Session.get("inProgress") + 1);
        Meteor.call("deleteWarrior", gameId, Meteor.userId(), label, function (error, result) {
            Session.set("inProgress", Session.get("inProgress") - 1);
        });
    }
    else {
        Session.set("inProgress", Session.get("inProgress") + 1);
        Meteor.call("warriorSetComposition", gameId, Meteor.userId(), label, newComp, function (error, result) {
            Session.set("inProgress", Session.get("inProgress") - 1);
        });
    }
}

function merging(gameId, label, direction) {
    var game = Games.findOne({_id: gameId});

    var warrior = Warrior.fetchOwnWarrior(gameId, label);

    if (warrior == undefined) {
        return "No warrior with this label";
    }

    if (!warrior.canSplit) {
        return "you can't merge yet";
    }

    var comp = warrior.composition;

    var cellToMove = Board.directionOfCell(gameId, warrior.position, direction);

    if (cellToMove < -50) {
        return "Invalid direction";
    }

    var cellType = Board.cellType(gameId, cellToMove);

    if (cellType.type != "warrior") {
        return "There is no warrior at that direction";
    }
    else if (Board.findIdOfOwnerOfWarrior(gameId, cellType.warrior.position) != Meteor.userId()) {
        return "You can only merge with your own warriors";
    }

    newComp = _.map(cellType.warrior.composition, function (num, index) {
        return num + comp[index]
    });

    Session.set("inProgress", Session.get("inProgress") + 1);
    Meteor.call("warriorSetComposition", gameId, Meteor.userId(), cellType.warrior.label, newComp, function (error, result) {
        Session.set("inProgress", Session.get("inProgress") - 1);
    });
    Session.set("inProgress", Session.get("inProgress") + 1);
    Meteor.call("deleteWarrior", gameId, Meteor.userId(), warrior.label, function (error, result) {
        Session.set("inProgress", Session.get("inProgress") - 1);
    });
}