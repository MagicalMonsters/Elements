Log = {};

Log.current = function (gameId, message) {
    Log.user(gameId, Meteor.userId(), message);
};

Log.user = function (gameId, userId, message) {
    var log = Logs.findOne({gameId: gameId, userId: userId});

    var newText = appendMessage(log.text, message);

    Logs.update({_id: log._id}, {
        $set: {text: newText}
    });
};

Log.game = function (gameId, message) {
    var logCursors = Logs.find({gameId: gameId});

    logCursors.forEach(function (log) {
        var newText = appendMessage(log.text, message);
        Logs.update({_id: log._id}, {
            $set: {text: newText}
        });
    });
}

function appendMessage(text, message) {
    if (text !== "") {
        message += "\n";
    }
    var now = new Date();
    message = "[" + now.getUTCHours() + ":" + now.getUTCMinutes() + ":" + now.getUTCSeconds() + "] " + message;
    return message + text;
}