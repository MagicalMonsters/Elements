Element = {};

Element.elementsFromString = function (elemsString) {
    var elems = elemsString.split(",");
    return _(elems).map(function (elem) {
        return parseInt(elem);
    });
};

Element.sumOfElements = function (elems) {
    return sum = _(elems).reduce(function (memo, num) {
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