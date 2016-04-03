Template.cli.helpers({
    isMyTurn: function () {
        return (Logic.isMyTurn(this.gameId, Meteor.userId())) ? "enabled" : "disabled";
    },
    message: function () {
        return Session.get("log");
    },
    color: function () {
        return Session.get("log") == "success" ? "green" : "red";
    },

    log: function () {
        return Logs.findOne({gameId: this.gameId, userId: Meteor.userId()}).text;
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

var inProgress = false;

function submit(gameId, command, e) {
    e.preventDefault();
    if (inProgress != 0) {
        return;
    }
    Session.set("log", "");
    Command.parse(gameId, command, function (error) {
        if (!error) {
            error = "success";
        } else {
            Log.current(gameId, error);
        }
        Session.set("log", error);
        inProgress = false;
    });
}