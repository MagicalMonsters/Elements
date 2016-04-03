Element = {};

Element.elementsFromString = function (elemsString) {
    if (!elemsString || _.isEmpty(elemsString)) {
        return undefined;
    }
    var elems = elemsString.split(",");
    if (elems.length != 4) {
        return undefined;
    }
    var isCorrect = true;
    var ints = _(elems).map(function (elem) {
        var item = parseInt(elem);
        if (!_.isFinite(item) || item < 0) {
            isCorrect = false;
        }
        return item;
    });

    if (!isCorrect) {
        return undefined;
    }
    return ints;
};

Element.sumOfElements = function (elems) {
    return _.reduce(elems, function (memo, num) {
        return memo + num;
    }, 0);
};

Element.maxElementIndex = function (elems) {
    var maxValue = 0;
    var maxIndex = -1;
    for (var i = 0; i < elems.length; i++) {
        if (elems[i] > maxValue) {
            maxValue = elems[i];
            maxIndex = i;
        }
    }
    return maxIndex;
};