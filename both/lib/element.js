Element = {};

Element.elementsFromString = function (elemsString) {
    var elems = elemsString.split(",");
    return _(elems).map(function (elem) {
        return parseInt(elem);
    });
}

Element.sumOfElements = function (elems) {
    return sum = _(elems).reduce(function (memo, num) {
        return memo + num;
    }, 0);
}