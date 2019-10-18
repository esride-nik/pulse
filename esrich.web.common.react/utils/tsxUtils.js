var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function cssMapToString(cssMap, additionalClasses) {
        var str = '';
        for (var prop in cssMap) {
            if (cssMap[prop])
                str += " " + prop;
        }
        return str.trim() + ' ' + (additionalClasses ? additionalClasses : '');
    }
    exports.cssMapToString = cssMapToString;
    function keyForObject(o) {
        if (o instanceof Object) {
            var k = o;
            if (!k.__react_key__) {
                k.__react_key__ = "K_" + getUUID();
            }
            return k.__react_key__;
        }
        return null;
    }
    exports.keyForObject = keyForObject;
    function getUUID() {
        var crypto = window.crypto || window.msCrypto;
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, function (c) {
            return (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16);
        });
    }
    exports.getUUID = getUUID;
    /**
     * Automaticly stop-propagates the given handler
     * @param handler
     * @param target
     * @param args
     */
    function preventBubble(handler, target) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        return function (e) {
            e.stopPropagation();
            // handler.apply(target, [...args, e])
            handler.bind(target).apply(void 0, __spreadArrays(args, [e]));
        };
    }
    exports.preventBubble = preventBubble;
});
//# sourceMappingURL=tsxUtils.js.map