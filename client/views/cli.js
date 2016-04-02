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