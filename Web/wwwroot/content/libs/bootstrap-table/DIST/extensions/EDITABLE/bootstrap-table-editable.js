(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('jquery')) :
        typeof define === 'function' && define.amd ? define(['jquery'], factory) :
            (global = global || self, factory(global.jQuery));
}(this, (function ($) {
    'use strict';

    $ = $ && Object.prototype.hasOwnProperty.call($, 'default') ? $['default'] : $;

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, module) {
        return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var check = function (it) {
        return it && it.Math == Math && it;
    };

    // https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
    var global_1 =
        // eslint-disable-next-line no-undef
        check(typeof globalThis == 'object' && globalThis) ||
        check(typeof window == 'object' && window) ||
        check(typeof self == 'object' && self) ||
        check(typeof commonjsGlobal == 'object' && commonjsGlobal) ||
        // eslint-disable-next-line no-new-func
        Function('return this')();

    var fails = function (exec) {
        try {
            return !!exec();
        } catch (error) {
            return true;
        }
    };

    // Thank's IE8 for his funny defineProperty
    var descriptors = !fails(function () {
        return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
    });

    var nativePropertyIsEnumerable = {}.propertyIsEnumerable;
    var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

    // Nashorn ~ JDK8 bug
    var NASHORN_BUG = getOwnPropertyDescriptor && !nativePropertyIsEnumerable.call({ 1: 2 }, 1);

    // `Object.prototype.propertyIsEnumerable` method implementation
    // https://tc39.github.io/ecma262/#sec-object.prototype.propertyisenumerable
    var f = NASHORN_BUG ? function propertyIsEnumerable(V) {
        var descriptor = getOwnPropertyDescriptor(this, V);
        return !!descriptor && descriptor.enumerable;
    } : nativePropertyIsEnumerable;

    var objectPropertyIsEnumerable = {
        f: f
    };

    var createPropertyDescriptor = function (bitmap, value) {
        return {
            enumerable: !(bitmap & 1),
            configurable: !(bitmap & 2),
            writable: !(bitmap & 4),
            value: value
        };
    };

    var toString = {}.toString;

    var classofRaw = function (it) {
        return toString.call(it).slice(8, -1);
    };

    var split = ''.split;

    // fallback for non-array-like ES3 and non-enumerable old V8 strings
    var indexedObject = fails(function () {
        // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
        // eslint-disable-next-line no-prototype-builtins
        return !Object('z').propertyIsEnumerable(0);
    }) ? function (it) {
        return classofRaw(it) == 'String' ? split.call(it, '') : Object(it);
    } : Object;

    // `RequireObjectCoercible` abstract operation
    // https://tc39.github.io/ecma262/#sec-requireobjectcoercible
    var requireObjectCoercible = function (it) {
        if (it == undefined) throw TypeError("Can't call method on " + it);
        return it;
    };

    // toObject with fallback for non-array-like ES3 strings

    var toIndexedObject = function (it) {
        return indexedObject(requireObjectCoercible(it));
    };

    var isObject = function (it) {
        return typeof it === 'object' ? it !== null : typeof it === 'function';
    };

    // `ToPrimitive` abstract operation
    // https://tc39.github.io/ecma262/#sec-toprimitive
    // instead of the ES6 spec version, we didn't implement @@toPrimitive case
    // and the second argument - flag - preferred type is a string
    var toPrimitive = function (input, PREFERRED_STRING) {
        if (!isObject(input)) return input;
        var fn, val;
        if (PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
        if (typeof (fn = input.valueOf) == 'function' && !isObject(val = fn.call(input))) return val;
        if (!PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
        throw TypeError("Can't convert object to primitive value");
    };

    var hasOwnProperty = {}.hasOwnProperty;

    var has = function (it, key) {
        return hasOwnProperty.call(it, key);
    };

    var document$1 = global_1.document;
    // typeof document.createElement is 'object' in old IE
    var EXISTS = isObject(document$1) && isObject(document$1.createElement);

    var documentCreateElement = function (it) {
        return EXISTS ? document$1.createElement(it) : {};
    };

    // Thank's IE8 for his funny defineProperty
    var ie8DomDefine = !descriptors && !fails(function () {
        return Object.defineProperty(documentCreateElement('div'), 'a', {
            get: function () { return 7; }
        }).a != 7;
    });

    var nativeGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

    // `Object.getOwnPropertyDescriptor` method
    // https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptor
    var f$1 = descriptors ? nativeGetOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
        O = toIndexedObject(O);
        P = toPrimitive(P, true);
        if (ie8DomDefine) try {
            return nativeGetOwnPropertyDescriptor(O, P);
        } catch (error) { /* empty */ }
        if (has(O, P)) return createPropertyDescriptor(!objectPropertyIsEnumerable.f.call(O, P), O[P]);
    };

    var objectGetOwnPropertyDescriptor = {
        f: f$1
    };

    var anObject = function (it) {
        if (!isObject(it)) {
            throw TypeError(String(it) + ' is not an object');
        } return it;
    };

    var nativeDefineProperty = Object.defineProperty;

    // `Object.defineProperty` method
    // https://tc39.github.io/ecma262/#sec-object.defineproperty
    var f$2 = descriptors ? nativeDefineProperty : function defineProperty(O, P, Attributes) {
        anObject(O);
        P = toPrimitive(P, true);
        anObject(Attributes);
        if (ie8DomDefine) try {
            return nativeDefineProperty(O, P, Attributes);
        } catch (error) { /* empty */ }
        if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported');
        if ('value' in Attributes) O[P] = Attributes.value;
        return O;
    };

    var objectDefineProperty = {
        f: f$2
    };

    var createNonEnumerableProperty = descriptors ? function (object, key, value) {
        return objectDefineProperty.f(object, key, createPropertyDescriptor(1, value));
    } : function (object, key, value) {
        object[key] = value;
        return object;
    };

    var setGlobal = function (key, value) {
        try {
            createNonEnumerableProperty(global_1, key, value);
        } catch (error) {
            global_1[key] = value;
        } return value;
    };

    var SHARED = '__core-js_shared__';
    var store = global_1[SHARED] || setGlobal(SHARED, {});

    var sharedStore = store;

    var functionToString = Function.toString;

    // this helper broken in `3.4.1-3.4.4`, so we can't use `shared` helper
    if (typeof sharedStore.inspectSource != 'function') {
        sharedStore.inspectSource = function (it) {
            return functionToString.call(it);
        };
    }

    var inspectSource = sharedStore.inspectSource;

    var WeakMap = global_1.WeakMap;

    var nativeWeakMap = typeof WeakMap === 'function' && /native code/.test(inspectSource(WeakMap));

    var shared = createCommonjsModule(function (module) {
        (module.exports = function (key, value) {
            return sharedStore[key] || (sharedStore[key] = value !== undefined ? value : {});
        })('versions', []).push({
            version: '3.6.0',
            mode: 'global',
            copyright: '© 2019 Denis Pushkarev (zloirock.ru)'
        });
    });

    var id = 0;
    var postfix = Math.random();

    var uid = function (key) {
        return 'Symbol(' + String(key === undefined ? '' : key) + ')_' + (++id + postfix).toString(36);
    };

    var keys = shared('keys');

    var sharedKey = function (key) {
        return keys[key] || (keys[key] = uid(key));
    };

    var hiddenKeys = {};

    var WeakMap$1 = global_1.WeakMap;
    var set, get, has$1;

    var enforce = function (it) {
        return has$1(it) ? get(it) : set(it, {});
    };

    var getterFor = function (TYPE) {
        return function (it) {
            var state;
            if (!isObject(it) || (state = get(it)).type !== TYPE) {
                throw TypeError('Incompatible receiver, ' + TYPE + ' required');
            } return state;
        };
    };

    if (nativeWeakMap) {
        var store$1 = new WeakMap$1();
        var wmget = store$1.get;
        var wmhas = store$1.has;
        var wmset = store$1.set;
        set = function (it, metadata) {
            wmset.call(store$1, it, metadata);
            return metadata;
        };
        get = function (it) {
            return wmget.call(store$1, it) || {};
        };
        has$1 = function (it) {
            return wmhas.call(store$1, it);
        };
    } else {
        var STATE = sharedKey('state');
        hiddenKeys[STATE] = true;
        set = function (it, metadata) {
            createNonEnumerableProperty(it, STATE, metadata);
            return metadata;
        };
        get = function (it) {
            return has(it, STATE) ? it[STATE] : {};
        };
        has$1 = function (it) {
            return has(it, STATE);
        };
    }

    var internalState = {
        set: set,
        get: get,
        has: has$1,
        enforce: enforce,
        getterFor: getterFor
    };

    var redefine = createCommonjsModule(function (module) {
        var getInternalState = internalState.get;
        var enforceInternalState = internalState.enforce;
        var TEMPLATE = String(String).split('String');

        (module.exports = function (O, key, value, options) {
            var unsafe = options ? !!options.unsafe : false;
            var simple = options ? !!options.enumerable : false;
            var noTargetGet = options ? !!options.noTargetGet : false;
            if (typeof value == 'function') {
                if (typeof key == 'string' && !has(value, 'name')) createNonEnumerableProperty(value, 'name', key);
                enforceInternalState(value).source = TEMPLATE.join(typeof key == 'string' ? key : '');
            }
            if (O === global_1) {
                if (simple) O[key] = value;
                else setGlobal(key, value);
                return;
            } else if (!unsafe) {
                delete O[key];
            } else if (!noTargetGet && O[key]) {
                simple = true;
            }
            if (simple) O[key] = value;
            else createNonEnumerableProperty(O, key, value);
            // add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
        })(Function.prototype, 'toString', function toString() {
            return typeof this == 'function' && getInternalState(this).source || inspectSource(this);
        });
    });

    var path = global_1;

    var aFunction = function (variable) {
        return typeof variable == 'function' ? variable : undefined;
    };

    var getBuiltIn = function (namespace, method) {
        return arguments.length < 2 ? aFunction(path[namespace]) || aFunction(global_1[namespace])
            : path[namespace] && path[namespace][method] || global_1[namespace] && global_1[namespace][method];
    };

    var ceil = Math.ceil;
    var floor = Math.floor;

    // `ToInteger` abstract operation
    // https://tc39.github.io/ecma262/#sec-tointeger
    var toInteger = function (argument) {
        return isNaN(argument = +argument) ? 0 : (argument > 0 ? floor : ceil)(argument);
    };

    var min = Math.min;

    // `ToLength` abstract operation
    // https://tc39.github.io/ecma262/#sec-tolength
    var toLength = function (argument) {
        return argument > 0 ? min(toInteger(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
    };

    var max = Math.max;
    var min$1 = Math.min;

    // Helper for a popular repeating case of the spec:
    // Let integer be ? ToInteger(index).
    // If integer < 0, let result be max((length + integer), 0); else let result be min(integer, length).
    var toAbsoluteIndex = function (index, length) {
        var integer = toInteger(index);
        return integer < 0 ? max(integer + length, 0) : min$1(integer, length);
    };

    // `Array.prototype.{ indexOf, includes }` methods implementation
    var createMethod = function (IS_INCLUDES) {
        return function ($this, el, fromIndex) {
            var O = toIndexedObject($this);
            var length = toLength(O.length);
            var index = toAbsoluteIndex(fromIndex, length);
            var value;
            // Array#includes uses SameValueZero equality algorithm
            // eslint-disable-next-line no-self-compare
            if (IS_INCLUDES && el != el) while (length > index) {
                value = O[index++];
                // eslint-disable-next-line no-self-compare
                if (value != value) return true;
                // Array#indexOf ignores holes, Array#includes - not
            } else for (; length > index; index++) {
                if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
            } return !IS_INCLUDES && -1;
        };
    };

    var arrayIncludes = {
        // `Array.prototype.includes` method
        // https://tc39.github.io/ecma262/#sec-array.prototype.includes
        includes: createMethod(true),
        // `Array.prototype.indexOf` method
        // https://tc39.github.io/ecma262/#sec-array.prototype.indexof
        indexOf: createMethod(false)
    };

    var indexOf = arrayIncludes.indexOf;

    var objectKeysInternal = function (object, names) {
        var O = toIndexedObject(object);
        var i = 0;
        var result = [];
        var key;
        for (key in O) !has(hiddenKeys, key) && has(O, key) && result.push(key);
        // Don't enum bug & hidden keys
        while (names.length > i) if (has(O, key = names[i++])) {
            ~indexOf(result, key) || result.push(key);
        }
        return result;
    };

    // IE8- don't enum bug keys
    var enumBugKeys = [
        'constructor',
        'hasOwnProperty',
        'isPrototypeOf',
        'propertyIsEnumerable',
        'toLocaleString',
        'toString',
        'valueOf'
    ];

    var hiddenKeys$1 = enumBugKeys.concat('length', 'prototype');

    // `Object.getOwnPropertyNames` method
    // https://tc39.github.io/ecma262/#sec-object.getownpropertynames
    var f$3 = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
        return objectKeysInternal(O, hiddenKeys$1);
    };

    var objectGetOwnPropertyNames = {
        f: f$3
    };

    var f$4 = Object.getOwnPropertySymbols;

    var objectGetOwnPropertySymbols = {
        f: f$4
    };

    // all object keys, includes non-enumerable and symbols
    var ownKeys = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
        var keys = objectGetOwnPropertyNames.f(anObject(it));
        var getOwnPropertySymbols = objectGetOwnPropertySymbols.f;
        return getOwnPropertySymbols ? keys.concat(getOwnPropertySymbols(it)) : keys;
    };

    var copyConstructorProperties = function (target, source) {
        var keys = ownKeys(source);
        var defineProperty = objectDefineProperty.f;
        var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f;
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (!has(target, key)) defineProperty(target, key, getOwnPropertyDescriptor(source, key));
        }
    };

    var replacement = /#|\.prototype\./;

    var isForced = function (feature, detection) {
        var value = data[normalize(feature)];
        return value == POLYFILL ? true
            : value == NATIVE ? false
                : typeof detection == 'function' ? fails(detection)
                    : !!detection;
    };

    var normalize = isForced.normalize = function (string) {
        return String(string).replace(replacement, '.').toLowerCase();
    };

    var data = isForced.data = {};
    var NATIVE = isForced.NATIVE = 'N';
    var POLYFILL = isForced.POLYFILL = 'P';

    var isForced_1 = isForced;

    var getOwnPropertyDescriptor$1 = objectGetOwnPropertyDescriptor.f;

    /*
      options.target      - name of the target object
      options.global      - target is the global object
      options.stat        - export as static methods of target
      options.proto       - export as prototype methods of target
      options.real        - real prototype method for the `pure` version
      options.forced      - export even if the native feature is available
      options.bind        - bind methods to the target, required for the `pure` version
      options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
      options.unsafe      - use the simple assignment of property instead of delete + defineProperty
      options.sham        - add a flag to not completely full polyfills
      options.enumerable  - export as enumerable property
      options.noTargetGet - prevent calling a getter on target
    */
    var _export = function (options, source) {
        var TARGET = options.target;
        var GLOBAL = options.global;
        var STATIC = options.stat;
        var FORCED, target, key, targetProperty, sourceProperty, descriptor;
        if (GLOBAL) {
            target = global_1;
        } else if (STATIC) {
            target = global_1[TARGET] || setGlobal(TARGET, {});
        } else {
            target = (global_1[TARGET] || {}).prototype;
        }
        if (target) for (key in source) {
            sourceProperty = source[key];
            if (options.noTargetGet) {
                descriptor = getOwnPropertyDescriptor$1(target, key);
                targetProperty = descriptor && descriptor.value;
            } else targetProperty = target[key];
            FORCED = isForced_1(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
            // contained in target
            if (!FORCED && targetProperty !== undefined) {
                if (typeof sourceProperty === typeof targetProperty) continue;
                copyConstructorProperties(sourceProperty, targetProperty);
            }
            // add a flag to not completely full polyfills
            if (options.sham || (targetProperty && targetProperty.sham)) {
                createNonEnumerableProperty(sourceProperty, 'sham', true);
            }
            // extend global
            redefine(target, key, sourceProperty, options);
        }
    };

    var nativeSymbol = !!Object.getOwnPropertySymbols && !fails(function () {
        // Chrome 38 Symbol has incorrect toString conversion
        // eslint-disable-next-line no-undef
        return !String(Symbol());
    });

    var useSymbolAsUid = nativeSymbol
        // eslint-disable-next-line no-undef
        && !Symbol.sham
        // eslint-disable-next-line no-undef
        && typeof Symbol() == 'symbol';

    // `IsArray` abstract operation
    // https://tc39.github.io/ecma262/#sec-isarray
    var isArray = Array.isArray || function isArray(arg) {
        return classofRaw(arg) == 'Array';
    };

    // `ToObject` abstract operation
    // https://tc39.github.io/ecma262/#sec-toobject
    var toObject = function (argument) {
        return Object(requireObjectCoercible(argument));
    };

    // `Object.keys` method
    // https://tc39.github.io/ecma262/#sec-object.keys
    var objectKeys = Object.keys || function keys(O) {
        return objectKeysInternal(O, enumBugKeys);
    };

    // `Object.defineProperties` method
    // https://tc39.github.io/ecma262/#sec-object.defineproperties
    var objectDefineProperties = descriptors ? Object.defineProperties : function defineProperties(O, Properties) {
        anObject(O);
        var keys = objectKeys(Properties);
        var length = keys.length;
        var index = 0;
        var key;
        while (length > index) objectDefineProperty.f(O, key = keys[index++], Properties[key]);
        return O;
    };

    var html = getBuiltIn('document', 'documentElement');

    var GT = '>';
    var LT = '<';
    var PROTOTYPE = 'prototype';
    var SCRIPT = 'script';
    var IE_PROTO = sharedKey('IE_PROTO');

    var EmptyConstructor = function () { /* empty */ };

    var scriptTag = function (content) {
        return LT + SCRIPT + GT + content + LT + '/' + SCRIPT + GT;
    };

    // Create object with fake `null` prototype: use ActiveX Object with cleared prototype
    var NullProtoObjectViaActiveX = function (activeXDocument) {
        activeXDocument.write(scriptTag(''));
        activeXDocument.close();
        var temp = activeXDocument.parentWindow.Object;
        activeXDocument = null; // avoid memory leak
        return temp;
    };

    // Create object with fake `null` prototype: use iframe Object with cleared prototype
    var NullProtoObjectViaIFrame = function () {
        // Thrash, waste and sodomy: IE GC bug
        var iframe = documentCreateElement('iframe');
        var JS = 'java' + SCRIPT + ':';
        var iframeDocument;
        iframe.style.display = 'none';
        html.appendChild(iframe);
        // https://github.com/zloirock/core-js/issues/475
        iframe.src = String(JS);
        iframeDocument = iframe.contentWindow.document;
        iframeDocument.open();
        iframeDocument.write(scriptTag('document.F=Object'));
        iframeDocument.close();
        return iframeDocument.F;
    };

    // Check for document.domain and active x support
    // No need to use active x approach when document.domain is not set
    // see https://github.com/es-shims/es5-shim/issues/150
    // variation of https://github.com/kitcambridge/es5-shim/commit/4f738ac066346
    // avoid IE GC bug
    var activeXDocument;
    var NullProtoObject = function () {
        try {
            /* global ActiveXObject */
            activeXDocument = document.domain && new ActiveXObject('htmlfile');
        } catch (error) { /* ignore */ }
        NullProtoObject = activeXDocument ? NullProtoObjectViaActiveX(activeXDocument) : NullProtoObjectViaIFrame();
        var length = enumBugKeys.length;
        while (length--) delete NullProtoObject[PROTOTYPE][enumBugKeys[length]];
        return NullProtoObject();
    };

    hiddenKeys[IE_PROTO] = true;

    // `Object.create` method
    // https://tc39.github.io/ecma262/#sec-object.create
    var objectCreate = Object.create || function create(O, Properties) {
        var result;
        if (O !== null) {
            EmptyConstructor[PROTOTYPE] = anObject(O);
            result = new EmptyConstructor();
            EmptyConstructor[PROTOTYPE] = null;
            // add "__proto__" for Object.getPrototypeOf polyfill
            result[IE_PROTO] = O;
        } else result = NullProtoObject();
        return Properties === undefined ? result : objectDefineProperties(result, Properties);
    };

    var nativeGetOwnPropertyNames = objectGetOwnPropertyNames.f;

    var toString$1 = {}.toString;

    var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
        ? Object.getOwnPropertyNames(window) : [];

    var getWindowNames = function (it) {
        try {
            return nativeGetOwnPropertyNames(it);
        } catch (error) {
            return windowNames.slice();
        }
    };

    // fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
    var f$5 = function getOwnPropertyNames(it) {
        return windowNames && toString$1.call(it) == '[object Window]'
            ? getWindowNames(it)
            : nativeGetOwnPropertyNames(toIndexedObject(it));
    };

    var objectGetOwnPropertyNamesExternal = {
        f: f$5
    };

    var WellKnownSymbolsStore = shared('wks');
    var Symbol$1 = global_1.Symbol;
    var createWellKnownSymbol = useSymbolAsUid ? Symbol$1 : uid;

    var wellKnownSymbol = function (name) {
        if (!has(WellKnownSymbolsStore, name)) {
            if (nativeSymbol && has(Symbol$1, name)) WellKnownSymbolsStore[name] = Symbol$1[name];
            else WellKnownSymbolsStore[name] = createWellKnownSymbol('Symbol.' + name);
        } return WellKnownSymbolsStore[name];
    };

    var f$6 = wellKnownSymbol;

    var wrappedWellKnownSymbol = {
        f: f$6
    };

    var defineProperty = objectDefineProperty.f;

    var defineWellKnownSymbol = function (NAME) {
        var Symbol = path.Symbol || (path.Symbol = {});
        if (!has(Symbol, NAME)) defineProperty(Symbol, NAME, {
            value: wrappedWellKnownSymbol.f(NAME)
        });
    };

    var defineProperty$1 = objectDefineProperty.f;

    var TO_STRING_TAG = wellKnownSymbol('toStringTag');

    var setToStringTag = function (it, TAG, STATIC) {
        if (it && !has(it = STATIC ? it : it.prototype, TO_STRING_TAG)) {
            defineProperty$1(it, TO_STRING_TAG, { configurable: true, value: TAG });
        }
    };

    var aFunction$1 = function (it) {
        if (typeof it != 'function') {
            throw TypeError(String(it) + ' is not a function');
        } return it;
    };

    // optional / simple context binding
    var bindContext = function (fn, that, length) {
        aFunction$1(fn);
        if (that === undefined) return fn;
        switch (length) {
            case 0: return function () {
                return fn.call(that);
            };
            case 1: return function (a) {
                return fn.call(that, a);
            };
            case 2: return function (a, b) {
                return fn.call(that, a, b);
            };
            case 3: return function (a, b, c) {
                return fn.call(that, a, b, c);
            };
        }
        return function (/* ...args */) {
            return fn.apply(that, arguments);
        };
    };

    var SPECIES = wellKnownSymbol('species');

    // `ArraySpeciesCreate` abstract operation
    // https://tc39.github.io/ecma262/#sec-arrayspeciescreate
    var arraySpeciesCreate = function (originalArray, length) {
        var C;
        if (isArray(originalArray)) {
            C = originalArray.constructor;
            // cross-realm fallback
            if (typeof C == 'function' && (C === Array || isArray(C.prototype))) C = undefined;
            else if (isObject(C)) {
                C = C[SPECIES];
                if (C === null) C = undefined;
            }
        } return new (C === undefined ? Array : C)(length === 0 ? 0 : length);
    };

    var push = [].push;

    // `Array.prototype.{ forEach, map, filter, some, every, find, findIndex }` methods implementation
    var createMethod$1 = function (TYPE) {
        var IS_MAP = TYPE == 1;
        var IS_FILTER = TYPE == 2;
        var IS_SOME = TYPE == 3;
        var IS_EVERY = TYPE == 4;
        var IS_FIND_INDEX = TYPE == 6;
        var NO_HOLES = TYPE == 5 || IS_FIND_INDEX;
        return function ($this, callbackfn, that, specificCreate) {
            var O = toObject($this);
            var self = indexedObject(O);
            var boundFunction = bindContext(callbackfn, that, 3);
            var length = toLength(self.length);
            var index = 0;
            var create = specificCreate || arraySpeciesCreate;
            var target = IS_MAP ? create($this, length) : IS_FILTER ? create($this, 0) : undefined;
            var value, result;
            for (; length > index; index++) if (NO_HOLES || index in self) {
                value = self[index];
                result = boundFunction(value, index, O);
                if (TYPE) {
                    if (IS_MAP) target[index] = result; // map
                    else if (result) switch (TYPE) {
                        case 3: return true;              // some
                        case 5: return value;             // find
                        case 6: return index;             // findIndex
                        case 2: push.call(target, value); // filter
                    } else if (IS_EVERY) return false;  // every
                }
            }
            return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : target;
        };
    };

    var arrayIteration = {
        // `Array.prototype.forEach` method
        // https://tc39.github.io/ecma262/#sec-array.prototype.foreach
        forEach: createMethod$1(0),
        // `Array.prototype.map` method
        // https://tc39.github.io/ecma262/#sec-array.prototype.map
        map: createMethod$1(1),
        // `Array.prototype.filter` method
        // https://tc39.github.io/ecma262/#sec-array.prototype.filter
        filter: createMethod$1(2),
        // `Array.prototype.some` method
        // https://tc39.github.io/ecma262/#sec-array.prototype.some
        some: createMethod$1(3),
        // `Array.prototype.every` method
        // https://tc39.github.io/ecma262/#sec-array.prototype.every
        every: createMethod$1(4),
        // `Array.prototype.find` method
        // https://tc39.github.io/ecma262/#sec-array.prototype.find
        find: createMethod$1(5),
        // `Array.prototype.findIndex` method
        // https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
        findIndex: createMethod$1(6)
    };

    var $forEach = arrayIteration.forEach;

    var HIDDEN = sharedKey('hidden');
    var SYMBOL = 'Symbol';
    var PROTOTYPE$1 = 'prototype';
    var TO_PRIMITIVE = wellKnownSymbol('toPrimitive');
    var setInternalState = internalState.set;
    var getInternalState = internalState.getterFor(SYMBOL);
    var ObjectPrototype = Object[PROTOTYPE$1];
    var $Symbol = global_1.Symbol;
    var $stringify = getBuiltIn('JSON', 'stringify');
    var nativeGetOwnPropertyDescriptor$1 = objectGetOwnPropertyDescriptor.f;
    var nativeDefineProperty$1 = objectDefineProperty.f;
    var nativeGetOwnPropertyNames$1 = objectGetOwnPropertyNamesExternal.f;
    var nativePropertyIsEnumerable$1 = objectPropertyIsEnumerable.f;
    var AllSymbols = shared('symbols');
    var ObjectPrototypeSymbols = shared('op-symbols');
    var StringToSymbolRegistry = shared('string-to-symbol-registry');
    var SymbolToStringRegistry = shared('symbol-to-string-registry');
    var WellKnownSymbolsStore$1 = shared('wks');
    var QObject = global_1.QObject;
    // Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
    var USE_SETTER = !QObject || !QObject[PROTOTYPE$1] || !QObject[PROTOTYPE$1].findChild;

    // fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
    var setSymbolDescriptor = descriptors && fails(function () {
        return objectCreate(nativeDefineProperty$1({}, 'a', {
            get: function () { return nativeDefineProperty$1(this, 'a', { value: 7 }).a; }
        })).a != 7;
    }) ? function (O, P, Attributes) {
        var ObjectPrototypeDescriptor = nativeGetOwnPropertyDescriptor$1(ObjectPrototype, P);
        if (ObjectPrototypeDescriptor) delete ObjectPrototype[P];
        nativeDefineProperty$1(O, P, Attributes);
        if (ObjectPrototypeDescriptor && O !== ObjectPrototype) {
            nativeDefineProperty$1(ObjectPrototype, P, ObjectPrototypeDescriptor);
        }
    } : nativeDefineProperty$1;

    var wrap = function (tag, description) {
        var symbol = AllSymbols[tag] = objectCreate($Symbol[PROTOTYPE$1]);
        setInternalState(symbol, {
            type: SYMBOL,
            tag: tag,
            description: description
        });
        if (!descriptors) symbol.description = description;
        return symbol;
    };

    var isSymbol = nativeSymbol && typeof $Symbol.iterator == 'symbol' ? function (it) {
        return typeof it == 'symbol';
    } : function (it) {
        return Object(it) instanceof $Symbol;
    };

    var $defineProperty = function defineProperty(O, P, Attributes) {
        if (O === ObjectPrototype) $defineProperty(ObjectPrototypeSymbols, P, Attributes);
        anObject(O);
        var key = toPrimitive(P, true);
        anObject(Attributes);
        if (has(AllSymbols, key)) {
            if (!Attributes.enumerable) {
                if (!has(O, HIDDEN)) nativeDefineProperty$1(O, HIDDEN, createPropertyDescriptor(1, {}));
                O[HIDDEN][key] = true;
            } else {
                if (has(O, HIDDEN) && O[HIDDEN][key]) O[HIDDEN][key] = false;
                Attributes = objectCreate(Attributes, { enumerable: createPropertyDescriptor(0, false) });
            } return setSymbolDescriptor(O, key, Attributes);
        } return nativeDefineProperty$1(O, key, Attributes);
    };

    var $defineProperties = function defineProperties(O, Properties) {
        anObject(O);
        var properties = toIndexedObject(Properties);
        var keys = objectKeys(properties).concat($getOwnPropertySymbols(properties));
        $forEach(keys, function (key) {
            if (!descriptors || $propertyIsEnumerable.call(properties, key)) $defineProperty(O, key, properties[key]);
        });
        return O;
    };

    var $create = function create(O, Properties) {
        return Properties === undefined ? objectCreate(O) : $defineProperties(objectCreate(O), Properties);
    };

    var $propertyIsEnumerable = function propertyIsEnumerable(V) {
        var P = toPrimitive(V, true);
        var enumerable = nativePropertyIsEnumerable$1.call(this, P);
        if (this === ObjectPrototype && has(AllSymbols, P) && !has(ObjectPrototypeSymbols, P)) return false;
        return enumerable || !has(this, P) || !has(AllSymbols, P) || has(this, HIDDEN) && this[HIDDEN][P] ? enumerable : true;
    };

    var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(O, P) {
        var it = toIndexedObject(O);
        var key = toPrimitive(P, true);
        if (it === ObjectPrototype && has(AllSymbols, key) && !has(ObjectPrototypeSymbols, key)) return;
        var descriptor = nativeGetOwnPropertyDescriptor$1(it, key);
        if (descriptor && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key])) {
            descriptor.enumerable = true;
        }
        return descriptor;
    };

    var $getOwnPropertyNames = function getOwnPropertyNames(O) {
        var names = nativeGetOwnPropertyNames$1(toIndexedObject(O));
        var result = [];
        $forEach(names, function (key) {
            if (!has(AllSymbols, key) && !has(hiddenKeys, key)) result.push(key);
        });
        return result;
    };

    var $getOwnPropertySymbols = function getOwnPropertySymbols(O) {
        var IS_OBJECT_PROTOTYPE = O === ObjectPrototype;
        var names = nativeGetOwnPropertyNames$1(IS_OBJECT_PROTOTYPE ? ObjectPrototypeSymbols : toIndexedObject(O));
        var result = [];
        $forEach(names, function (key) {
            if (has(AllSymbols, key) && (!IS_OBJECT_PROTOTYPE || has(ObjectPrototype, key))) {
                result.push(AllSymbols[key]);
            }
        });
        return result;
    };

    // `Symbol` constructor
    // https://tc39.github.io/ecma262/#sec-symbol-constructor
    if (!nativeSymbol) {
        $Symbol = function Symbol() {
            if (this instanceof $Symbol) throw TypeError('Symbol is not a constructor');
            var description = !arguments.length || arguments[0] === undefined ? undefined : String(arguments[0]);
            var tag = uid(description);
            var setter = function (value) {
                if (this === ObjectPrototype) setter.call(ObjectPrototypeSymbols, value);
                if (has(this, HIDDEN) && has(this[HIDDEN], tag)) this[HIDDEN][tag] = false;
                setSymbolDescriptor(this, tag, createPropertyDescriptor(1, value));
            };
            if (descriptors && USE_SETTER) setSymbolDescriptor(ObjectPrototype, tag, { configurable: true, set: setter });
            return wrap(tag, description);
        };

        redefine($Symbol[PROTOTYPE$1], 'toString', function toString() {
            return getInternalState(this).tag;
        });

        objectPropertyIsEnumerable.f = $propertyIsEnumerable;
        objectDefineProperty.f = $defineProperty;
        objectGetOwnPropertyDescriptor.f = $getOwnPropertyDescriptor;
        objectGetOwnPropertyNames.f = objectGetOwnPropertyNamesExternal.f = $getOwnPropertyNames;
        objectGetOwnPropertySymbols.f = $getOwnPropertySymbols;

        if (descriptors) {
            // https://github.com/tc39/proposal-Symbol-description
            nativeDefineProperty$1($Symbol[PROTOTYPE$1], 'description', {
                configurable: true,
                get: function description() {
                    return getInternalState(this).description;
                }
            });
            {
                redefine(ObjectPrototype, 'propertyIsEnumerable', $propertyIsEnumerable, { unsafe: true });
            }
        }
    }

    if (!useSymbolAsUid) {
        wrappedWellKnownSymbol.f = function (name) {
            return wrap(wellKnownSymbol(name), name);
        };
    }

    _export({ global: true, wrap: true, forced: !nativeSymbol, sham: !nativeSymbol }, {
        Symbol: $Symbol
    });

    $forEach(objectKeys(WellKnownSymbolsStore$1), function (name) {
        defineWellKnownSymbol(name);
    });

    _export({ target: SYMBOL, stat: true, forced: !nativeSymbol }, {
        // `Symbol.for` method
        // https://tc39.github.io/ecma262/#sec-symbol.for
        'for': function (key) {
            var string = String(key);
            if (has(StringToSymbolRegistry, string)) return StringToSymbolRegistry[string];
            var symbol = $Symbol(string);
            StringToSymbolRegistry[string] = symbol;
            SymbolToStringRegistry[symbol] = string;
            return symbol;
        },
        // `Symbol.keyFor` method
        // https://tc39.github.io/ecma262/#sec-symbol.keyfor
        keyFor: function keyFor(sym) {
            if (!isSymbol(sym)) throw TypeError(sym + ' is not a symbol');
            if (has(SymbolToStringRegistry, sym)) return SymbolToStringRegistry[sym];
        },
        useSetter: function () { USE_SETTER = true; },
        useSimple: function () { USE_SETTER = false; }
    });

    _export({ target: 'Object', stat: true, forced: !nativeSymbol, sham: !descriptors }, {
        // `Object.create` method
        // https://tc39.github.io/ecma262/#sec-object.create
        create: $create,
        // `Object.defineProperty` method
        // https://tc39.github.io/ecma262/#sec-object.defineproperty
        defineProperty: $defineProperty,
        // `Object.defineProperties` method
        // https://tc39.github.io/ecma262/#sec-object.defineproperties
        defineProperties: $defineProperties,
        // `Object.getOwnPropertyDescriptor` method
        // https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptors
        getOwnPropertyDescriptor: $getOwnPropertyDescriptor
    });

    _export({ target: 'Object', stat: true, forced: !nativeSymbol }, {
        // `Object.getOwnPropertyNames` method
        // https://tc39.github.io/ecma262/#sec-object.getownpropertynames
        getOwnPropertyNames: $getOwnPropertyNames,
        // `Object.getOwnPropertySymbols` method
        // https://tc39.github.io/ecma262/#sec-object.getownpropertysymbols
        getOwnPropertySymbols: $getOwnPropertySymbols
    });

    // Chrome 38 and 39 `Object.getOwnPropertySymbols` fails on primitives
    // https://bugs.chromium.org/p/v8/issues/detail?id=3443
    _export({ target: 'Object', stat: true, forced: fails(function () { objectGetOwnPropertySymbols.f(1); }) }, {
        getOwnPropertySymbols: function getOwnPropertySymbols(it) {
            return objectGetOwnPropertySymbols.f(toObject(it));
        }
    });

    // `JSON.stringify` method behavior with symbols
    // https://tc39.github.io/ecma262/#sec-json.stringify
    if ($stringify) {
        var FORCED_JSON_STRINGIFY = !nativeSymbol || fails(function () {
            var symbol = $Symbol();
            // MS Edge converts symbol values to JSON as {}
            return $stringify([symbol]) != '[null]'
                // WebKit converts symbol values to JSON as null
                || $stringify({ a: symbol }) != '{}'
                // V8 throws on boxed symbols
                || $stringify(Object(symbol)) != '{}';
        });

        _export({ target: 'JSON', stat: true, forced: FORCED_JSON_STRINGIFY }, {
            // eslint-disable-next-line no-unused-vars
            stringify: function stringify(it, replacer, space) {
                var args = [it];
                var index = 1;
                var $replacer;
                while (arguments.length > index) args.push(arguments[index++]);
                $replacer = replacer;
                if (!isObject(replacer) && it === undefined || isSymbol(it)) return; // IE8 returns string on undefined
                if (!isArray(replacer)) replacer = function (key, value) {
                    if (typeof $replacer == 'function') value = $replacer.call(this, key, value);
                    if (!isSymbol(value)) return value;
                };
                args[1] = replacer;
                return $stringify.apply(null, args);
            }
        });
    }

    // `Symbol.prototype[@@toPrimitive]` method
    // https://tc39.github.io/ecma262/#sec-symbol.prototype-@@toprimitive
    if (!$Symbol[PROTOTYPE$1][TO_PRIMITIVE]) {
        createNonEnumerableProperty($Symbol[PROTOTYPE$1], TO_PRIMITIVE, $Symbol[PROTOTYPE$1].valueOf);
    }
    // `Symbol.prototype[@@toStringTag]` property
    // https://tc39.github.io/ecma262/#sec-symbol.prototype-@@tostringtag
    setToStringTag($Symbol, SYMBOL);

    hiddenKeys[HIDDEN] = true;

    var defineProperty$2 = objectDefineProperty.f;

    var NativeSymbol = global_1.Symbol;

    if (descriptors && typeof NativeSymbol == 'function' && (!('description' in NativeSymbol.prototype) ||
        // Safari 12 bug
        NativeSymbol().description !== undefined
    )) {
        var EmptyStringDescriptionStore = {};
        // wrap Symbol constructor for correct work with undefined description
        var SymbolWrapper = function Symbol() {
            var description = arguments.length < 1 || arguments[0] === undefined ? undefined : String(arguments[0]);
            var result = this instanceof SymbolWrapper
                ? new NativeSymbol(description)
                // in Edge 13, String(Symbol(undefined)) === 'Symbol(undefined)'
                : description === undefined ? NativeSymbol() : NativeSymbol(description);
            if (description === '') EmptyStringDescriptionStore[result] = true;
            return result;
        };
        copyConstructorProperties(SymbolWrapper, NativeSymbol);
        var symbolPrototype = SymbolWrapper.prototype = NativeSymbol.prototype;
        symbolPrototype.constructor = SymbolWrapper;

        var symbolToString = symbolPrototype.toString;
        var native = String(NativeSymbol('test')) == 'Symbol(test)';
        var regexp = /^Symbol\((.*)\)[^)]+$/;
        defineProperty$2(symbolPrototype, 'description', {
            configurable: true,
            get: function description() {
                var symbol = isObject(this) ? this.valueOf() : this;
                var string = symbolToString.call(symbol);
                if (has(EmptyStringDescriptionStore, symbol)) return '';
                var desc = native ? string.slice(7, -1) : string.replace(regexp, '$1');
                return desc === '' ? undefined : desc;
            }
        });

        _export({ global: true, forced: true }, {
            Symbol: SymbolWrapper
        });
    }

    // `Symbol.iterator` well-known symbol
    // https://tc39.github.io/ecma262/#sec-symbol.iterator
    defineWellKnownSymbol('iterator');

    var createProperty = function (object, key, value) {
        var propertyKey = toPrimitive(key);
        if (propertyKey in object) objectDefineProperty.f(object, propertyKey, createPropertyDescriptor(0, value));
        else object[propertyKey] = value;
    };

    var userAgent = getBuiltIn('navigator', 'userAgent') || '';

    var process = global_1.process;
    var versions = process && process.versions;
    var v8 = versions && versions.v8;
    var match, version;

    if (v8) {
        match = v8.split('.');
        version = match[0] + match[1];
    } else if (userAgent) {
        match = userAgent.match(/Edge\/(\d+)/);
        if (!match || match[1] >= 74) {
            match = userAgent.match(/Chrome\/(\d+)/);
            if (match) version = match[1];
        }
    }

    var v8Version = version && +version;

    var SPECIES$1 = wellKnownSymbol('species');

    var arrayMethodHasSpeciesSupport = function (METHOD_NAME) {
        // We can't use this feature detection in V8 since it causes
        // deoptimization and serious performance degradation
        // https://github.com/zloirock/core-js/issues/677
        return v8Version >= 51 || !fails(function () {
            var array = [];
            var constructor = array.constructor = {};
            constructor[SPECIES$1] = function () {
                return { foo: 1 };
            };
            return array[METHOD_NAME](Boolean).foo !== 1;
        });
    };

    var IS_CONCAT_SPREADABLE = wellKnownSymbol('isConcatSpreadable');
    var MAX_SAFE_INTEGER = 0x1FFFFFFFFFFFFF;
    var MAXIMUM_ALLOWED_INDEX_EXCEEDED = 'Maximum allowed index exceeded';

    // We can't use this feature detection in V8 since it causes
    // deoptimization and serious performance degradation
    // https://github.com/zloirock/core-js/issues/679
    var IS_CONCAT_SPREADABLE_SUPPORT = v8Version >= 51 || !fails(function () {
        var array = [];
        array[IS_CONCAT_SPREADABLE] = false;
        return array.concat()[0] !== array;
    });

    var SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('concat');

    var isConcatSpreadable = function (O) {
        if (!isObject(O)) return false;
        var spreadable = O[IS_CONCAT_SPREADABLE];
        return spreadable !== undefined ? !!spreadable : isArray(O);
    };

    var FORCED = !IS_CONCAT_SPREADABLE_SUPPORT || !SPECIES_SUPPORT;

    // `Array.prototype.concat` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.concat
    // with adding support of @@isConcatSpreadable and @@species
    _export({ target: 'Array', proto: true, forced: FORCED }, {
        concat: function concat(arg) { // eslint-disable-line no-unused-vars
            var O = toObject(this);
            var A = arraySpeciesCreate(O, 0);
            var n = 0;
            var i, k, length, len, E;
            for (i = -1, length = arguments.length; i < length; i++) {
                E = i === -1 ? O : arguments[i];
                if (isConcatSpreadable(E)) {
                    len = toLength(E.length);
                    if (n + len > MAX_SAFE_INTEGER) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
                    for (k = 0; k < len; k++, n++) if (k in E) createProperty(A, n, E[k]);
                } else {
                    if (n >= MAX_SAFE_INTEGER) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
                    createProperty(A, n++, E);
                }
            }
            A.length = n;
            return A;
        }
    });

    var UNSCOPABLES = wellKnownSymbol('unscopables');
    var ArrayPrototype = Array.prototype;

    // Array.prototype[@@unscopables]
    // https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
    if (ArrayPrototype[UNSCOPABLES] == undefined) {
        objectDefineProperty.f(ArrayPrototype, UNSCOPABLES, {
            configurable: true,
            value: objectCreate(null)
        });
    }

    // add a key to Array.prototype[@@unscopables]
    var addToUnscopables = function (key) {
        ArrayPrototype[UNSCOPABLES][key] = true;
    };

    var $find = arrayIteration.find;

    var FIND = 'find';
    var SKIPS_HOLES = true;

    // Shouldn't skip holes
    if (FIND in []) Array(1)[FIND](function () { SKIPS_HOLES = false; });

    // `Array.prototype.find` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.find
    _export({ target: 'Array', proto: true, forced: SKIPS_HOLES }, {
        find: function find(callbackfn /* , that = undefined */) {
            return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
        }
    });

    // https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
    addToUnscopables(FIND);

    var sloppyArrayMethod = function (METHOD_NAME, argument) {
        var method = [][METHOD_NAME];
        return !method || !fails(function () {
            // eslint-disable-next-line no-useless-call,no-throw-literal
            method.call(null, argument || function () { throw 1; }, 1);
        });
    };

    var $indexOf = arrayIncludes.indexOf;

    var nativeIndexOf = [].indexOf;

    var NEGATIVE_ZERO = !!nativeIndexOf && 1 / [1].indexOf(1, -0) < 0;
    var SLOPPY_METHOD = sloppyArrayMethod('indexOf');

    // `Array.prototype.indexOf` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.indexof
    _export({ target: 'Array', proto: true, forced: NEGATIVE_ZERO || SLOPPY_METHOD }, {
        indexOf: function indexOf(searchElement /* , fromIndex = 0 */) {
            return NEGATIVE_ZERO
                // convert -0 to +0
                ? nativeIndexOf.apply(this, arguments) || 0
                : $indexOf(this, searchElement, arguments.length > 1 ? arguments[1] : undefined);
        }
    });

    var correctPrototypeGetter = !fails(function () {
        function F() { /* empty */ }
        F.prototype.constructor = null;
        return Object.getPrototypeOf(new F()) !== F.prototype;
    });

    var IE_PROTO$1 = sharedKey('IE_PROTO');
    var ObjectPrototype$1 = Object.prototype;

    // `Object.getPrototypeOf` method
    // https://tc39.github.io/ecma262/#sec-object.getprototypeof
    var objectGetPrototypeOf = correctPrototypeGetter ? Object.getPrototypeOf : function (O) {
        O = toObject(O);
        if (has(O, IE_PROTO$1)) return O[IE_PROTO$1];
        if (typeof O.constructor == 'function' && O instanceof O.constructor) {
            return O.constructor.prototype;
        } return O instanceof Object ? ObjectPrototype$1 : null;
    };

    var ITERATOR = wellKnownSymbol('iterator');
    var BUGGY_SAFARI_ITERATORS = false;

    var returnThis = function () { return this; };

    // `%IteratorPrototype%` object
    // https://tc39.github.io/ecma262/#sec-%iteratorprototype%-object
    var IteratorPrototype, PrototypeOfArrayIteratorPrototype, arrayIterator;

    if ([].keys) {
        arrayIterator = [].keys();
        // Safari 8 has buggy iterators w/o `next`
        if (!('next' in arrayIterator)) BUGGY_SAFARI_ITERATORS = true;
        else {
            PrototypeOfArrayIteratorPrototype = objectGetPrototypeOf(objectGetPrototypeOf(arrayIterator));
            if (PrototypeOfArrayIteratorPrototype !== Object.prototype) IteratorPrototype = PrototypeOfArrayIteratorPrototype;
        }
    }

    if (IteratorPrototype == undefined) IteratorPrototype = {};

    // 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
    if (!has(IteratorPrototype, ITERATOR)) {
        createNonEnumerableProperty(IteratorPrototype, ITERATOR, returnThis);
    }

    var iteratorsCore = {
        IteratorPrototype: IteratorPrototype,
        BUGGY_SAFARI_ITERATORS: BUGGY_SAFARI_ITERATORS
    };

    var IteratorPrototype$1 = iteratorsCore.IteratorPrototype;

    var createIteratorConstructor = function (IteratorConstructor, NAME, next) {
        var TO_STRING_TAG = NAME + ' Iterator';
        IteratorConstructor.prototype = objectCreate(IteratorPrototype$1, { next: createPropertyDescriptor(1, next) });
        setToStringTag(IteratorConstructor, TO_STRING_TAG, false);
        return IteratorConstructor;
    };

    var aPossiblePrototype = function (it) {
        if (!isObject(it) && it !== null) {
            throw TypeError("Can't set " + String(it) + ' as a prototype');
        } return it;
    };

    // `Object.setPrototypeOf` method
    // https://tc39.github.io/ecma262/#sec-object.setprototypeof
    // Works with __proto__ only. Old v8 can't work with null proto objects.
    /* eslint-disable no-proto */
    var objectSetPrototypeOf = Object.setPrototypeOf || ('__proto__' in {} ? function () {
        var CORRECT_SETTER = false;
        var test = {};
        var setter;
        try {
            setter = Object.getOwnPropertyDescriptor(Object.prototype, '__proto__').set;
            setter.call(test, []);
            CORRECT_SETTER = test instanceof Array;
        } catch (error) { /* empty */ }
        return function setPrototypeOf(O, proto) {
            anObject(O);
            aPossiblePrototype(proto);
            if (CORRECT_SETTER) setter.call(O, proto);
            else O.__proto__ = proto;
            return O;
        };
    }() : undefined);

    var IteratorPrototype$2 = iteratorsCore.IteratorPrototype;
    var BUGGY_SAFARI_ITERATORS$1 = iteratorsCore.BUGGY_SAFARI_ITERATORS;
    var ITERATOR$1 = wellKnownSymbol('iterator');
    var KEYS = 'keys';
    var VALUES = 'values';
    var ENTRIES = 'entries';

    var returnThis$1 = function () { return this; };

    var defineIterator = function (Iterable, NAME, IteratorConstructor, next, DEFAULT, IS_SET, FORCED) {
        createIteratorConstructor(IteratorConstructor, NAME, next);

        var getIterationMethod = function (KIND) {
            if (KIND === DEFAULT && defaultIterator) return defaultIterator;
            if (!BUGGY_SAFARI_ITERATORS$1 && KIND in IterablePrototype) return IterablePrototype[KIND];
            switch (KIND) {
                case KEYS: return function keys() { return new IteratorConstructor(this, KIND); };
                case VALUES: return function values() { return new IteratorConstructor(this, KIND); };
                case ENTRIES: return function entries() { return new IteratorConstructor(this, KIND); };
            } return function () { return new IteratorConstructor(this); };
        };

        var TO_STRING_TAG = NAME + ' Iterator';
        var INCORRECT_VALUES_NAME = false;
        var IterablePrototype = Iterable.prototype;
        var nativeIterator = IterablePrototype[ITERATOR$1]
            || IterablePrototype['@@iterator']
            || DEFAULT && IterablePrototype[DEFAULT];
        var defaultIterator = !BUGGY_SAFARI_ITERATORS$1 && nativeIterator || getIterationMethod(DEFAULT);
        var anyNativeIterator = NAME == 'Array' ? IterablePrototype.entries || nativeIterator : nativeIterator;
        var CurrentIteratorPrototype, methods, KEY;

        // fix native
        if (anyNativeIterator) {
            CurrentIteratorPrototype = objectGetPrototypeOf(anyNativeIterator.call(new Iterable()));
            if (IteratorPrototype$2 !== Object.prototype && CurrentIteratorPrototype.next) {
                if (objectGetPrototypeOf(CurrentIteratorPrototype) !== IteratorPrototype$2) {
                    if (objectSetPrototypeOf) {
                        objectSetPrototypeOf(CurrentIteratorPrototype, IteratorPrototype$2);
                    } else if (typeof CurrentIteratorPrototype[ITERATOR$1] != 'function') {
                        createNonEnumerableProperty(CurrentIteratorPrototype, ITERATOR$1, returnThis$1);
                    }
                }
                // Set @@toStringTag to native iterators
                setToStringTag(CurrentIteratorPrototype, TO_STRING_TAG, true);
            }
        }

        // fix Array#{values, @@iterator}.name in V8 / FF
        if (DEFAULT == VALUES && nativeIterator && nativeIterator.name !== VALUES) {
            INCORRECT_VALUES_NAME = true;
            defaultIterator = function values() { return nativeIterator.call(this); };
        }

        // define iterator
        if (IterablePrototype[ITERATOR$1] !== defaultIterator) {
            createNonEnumerableProperty(IterablePrototype, ITERATOR$1, defaultIterator);
        }

        // export additional methods
        if (DEFAULT) {
            methods = {
                values: getIterationMethod(VALUES),
                keys: IS_SET ? defaultIterator : getIterationMethod(KEYS),
                entries: getIterationMethod(ENTRIES)
            };
            if (FORCED) for (KEY in methods) {
                if (BUGGY_SAFARI_ITERATORS$1 || INCORRECT_VALUES_NAME || !(KEY in IterablePrototype)) {
                    redefine(IterablePrototype, KEY, methods[KEY]);
                }
            } else _export({ target: NAME, proto: true, forced: BUGGY_SAFARI_ITERATORS$1 || INCORRECT_VALUES_NAME }, methods);
        }

        return methods;
    };

    var ARRAY_ITERATOR = 'Array Iterator';
    var setInternalState$1 = internalState.set;
    var getInternalState$1 = internalState.getterFor(ARRAY_ITERATOR);

    // `Array.prototype.entries` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.entries
    // `Array.prototype.keys` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.keys
    // `Array.prototype.values` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.values
    // `Array.prototype[@@iterator]` method
    // https://tc39.github.io/ecma262/#sec-array.prototype-@@iterator
    // `CreateArrayIterator` internal method
    // https://tc39.github.io/ecma262/#sec-createarrayiterator
    var es_array_iterator = defineIterator(Array, 'Array', function (iterated, kind) {
        setInternalState$1(this, {
            type: ARRAY_ITERATOR,
            target: toIndexedObject(iterated), // target
            index: 0,                          // next index
            kind: kind                         // kind
        });
        // `%ArrayIteratorPrototype%.next` method
        // https://tc39.github.io/ecma262/#sec-%arrayiteratorprototype%.next
    }, function () {
        var state = getInternalState$1(this);
        var target = state.target;
        var kind = state.kind;
        var index = state.index++;
        if (!target || index >= target.length) {
            state.target = undefined;
            return { value: undefined, done: true };
        }
        if (kind == 'keys') return { value: index, done: false };
        if (kind == 'values') return { value: target[index], done: false };
        return { value: [index, target[index]], done: false };
    }, 'values');

    // https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
    addToUnscopables('keys');
    addToUnscopables('values');
    addToUnscopables('entries');

    var nativeJoin = [].join;

    var ES3_STRINGS = indexedObject != Object;
    var SLOPPY_METHOD$1 = sloppyArrayMethod('join', ',');

    // `Array.prototype.join` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.join
    _export({ target: 'Array', proto: true, forced: ES3_STRINGS || SLOPPY_METHOD$1 }, {
        join: function join(separator) {
            return nativeJoin.call(toIndexedObject(this), separator === undefined ? ',' : separator);
        }
    });

    var propertyIsEnumerable = objectPropertyIsEnumerable.f;

    // `Object.{ entries, values }` methods implementation
    var createMethod$2 = function (TO_ENTRIES) {
        return function (it) {
            var O = toIndexedObject(it);
            var keys = objectKeys(O);
            var length = keys.length;
            var i = 0;
            var result = [];
            var key;
            while (length > i) {
                key = keys[i++];
                if (!descriptors || propertyIsEnumerable.call(O, key)) {
                    result.push(TO_ENTRIES ? [key, O[key]] : O[key]);
                }
            }
            return result;
        };
    };

    var objectToArray = {
        // `Object.entries` method
        // https://tc39.github.io/ecma262/#sec-object.entries
        entries: createMethod$2(true),
        // `Object.values` method
        // https://tc39.github.io/ecma262/#sec-object.values
        values: createMethod$2(false)
    };

    var $entries = objectToArray.entries;

    // `Object.entries` method
    // https://tc39.github.io/ecma262/#sec-object.entries
    _export({ target: 'Object', stat: true }, {
        entries: function entries(O) {
            return $entries(O);
        }
    });

    var TO_STRING_TAG$1 = wellKnownSymbol('toStringTag');
    var test = {};

    test[TO_STRING_TAG$1] = 'z';

    var toStringTagSupport = String(test) === '[object z]';

    var TO_STRING_TAG$2 = wellKnownSymbol('toStringTag');
    // ES3 wrong here
    var CORRECT_ARGUMENTS = classofRaw(function () { return arguments; }()) == 'Arguments';

    // fallback for IE11 Script Access Denied error
    var tryGet = function (it, key) {
        try {
            return it[key];
        } catch (error) { /* empty */ }
    };

    // getting tag from ES6+ `Object.prototype.toString`
    var classof = toStringTagSupport ? classofRaw : function (it) {
        var O, tag, result;
        return it === undefined ? 'Undefined' : it === null ? 'Null'
            // @@toStringTag case
            : typeof (tag = tryGet(O = Object(it), TO_STRING_TAG$2)) == 'string' ? tag
                // builtinTag case
                : CORRECT_ARGUMENTS ? classofRaw(O)
                    // ES3 arguments fallback
                    : (result = classofRaw(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : result;
    };

    // `Object.prototype.toString` method implementation
    // https://tc39.github.io/ecma262/#sec-object.prototype.tostring
    var objectToString = toStringTagSupport ? {}.toString : function toString() {
        return '[object ' + classof(this) + ']';
    };

    // `Object.prototype.toString` method
    // https://tc39.github.io/ecma262/#sec-object.prototype.tostring
    if (!toStringTagSupport) {
        redefine(Object.prototype, 'toString', objectToString, { unsafe: true });
    }

    // `RegExp.prototype.flags` getter implementation
    // https://tc39.github.io/ecma262/#sec-get-regexp.prototype.flags
    var regexpFlags = function () {
        var that = anObject(this);
        var result = '';
        if (that.global) result += 'g';
        if (that.ignoreCase) result += 'i';
        if (that.multiline) result += 'm';
        if (that.dotAll) result += 's';
        if (that.unicode) result += 'u';
        if (that.sticky) result += 'y';
        return result;
    };

    // babel-minify transpiles RegExp('a', 'y') -> /a/y and it causes SyntaxError,
    // so we use an intermediate function.
    function RE(s, f) {
        return RegExp(s, f);
    }

    var UNSUPPORTED_Y = fails(function () {
        // babel-minify transpiles RegExp('a', 'y') -> /a/y and it causes SyntaxError
        var re = RE('a', 'y');
        re.lastIndex = 2;
        return re.exec('abcd') != null;
    });

    var BROKEN_CARET = fails(function () {
        // https://bugzilla.mozilla.org/show_bug.cgi?id=773687
        var re = RE('^r', 'gy');
        re.lastIndex = 2;
        return re.exec('str') != null;
    });

    var regexpStickyHelpers = {
        UNSUPPORTED_Y: UNSUPPORTED_Y,
        BROKEN_CARET: BROKEN_CARET
    };

    var nativeExec = RegExp.prototype.exec;
    // This always refers to the native implementation, because the
    // String#replace polyfill uses ./fix-regexp-well-known-symbol-logic.js,
    // which loads this file before patching the method.
    var nativeReplace = String.prototype.replace;

    var patchedExec = nativeExec;

    var UPDATES_LAST_INDEX_WRONG = (function () {
        var re1 = /a/;
        var re2 = /b*/g;
        nativeExec.call(re1, 'a');
        nativeExec.call(re2, 'a');
        return re1.lastIndex !== 0 || re2.lastIndex !== 0;
    })();

    var UNSUPPORTED_Y$1 = regexpStickyHelpers.UNSUPPORTED_Y || regexpStickyHelpers.BROKEN_CARET;

    // nonparticipating capturing group, copied from es5-shim's String#split patch.
    var NPCG_INCLUDED = /()??/.exec('')[1] !== undefined;

    var PATCH = UPDATES_LAST_INDEX_WRONG || NPCG_INCLUDED || UNSUPPORTED_Y$1;

    if (PATCH) {
        patchedExec = function exec(str) {
            var re = this;
            var lastIndex, reCopy, match, i;
            var sticky = UNSUPPORTED_Y$1 && re.sticky;
            var flags = regexpFlags.call(re);
            var source = re.source;
            var charsAdded = 0;
            var strCopy = str;

            if (sticky) {
                flags = flags.replace('y', '');
                if (flags.indexOf('g') === -1) {
                    flags += 'g';
                }

                strCopy = String(str).slice(re.lastIndex);
                // Support anchored sticky behavior.
                if (re.lastIndex > 0 && (!re.multiline || re.multiline && str[re.lastIndex - 1] !== '\n')) {
                    source = '(?: ' + source + ')';
                    strCopy = ' ' + strCopy;
                    charsAdded++;
                }
                // ^(? + rx + ) is needed, in combination with some str slicing, to
                // simulate the 'y' flag.
                reCopy = new RegExp('^(?:' + source + ')', flags);
            }

            if (NPCG_INCLUDED) {
                reCopy = new RegExp('^' + source + '$(?!\\s)', flags);
            }
            if (UPDATES_LAST_INDEX_WRONG) lastIndex = re.lastIndex;

            match = nativeExec.call(sticky ? reCopy : re, strCopy);

            if (sticky) {
                if (match) {
                    match.input = match.input.slice(charsAdded);
                    match[0] = match[0].slice(charsAdded);
                    match.index = re.lastIndex;
                    re.lastIndex += match[0].length;
                } else re.lastIndex = 0;
            } else if (UPDATES_LAST_INDEX_WRONG && match) {
                re.lastIndex = re.global ? match.index + match[0].length : lastIndex;
            }
            if (NPCG_INCLUDED && match && match.length > 1) {
                // Fix browsers whose `exec` methods don't consistently return `undefined`
                // for NPCG, like IE8. NOTE: This doesn' work for /(.?)?/
                nativeReplace.call(match[0], reCopy, function () {
                    for (i = 1; i < arguments.length - 2; i++) {
                        if (arguments[i] === undefined) match[i] = undefined;
                    }
                });
            }

            return match;
        };
    }

    var regexpExec = patchedExec;

    _export({ target: 'RegExp', proto: true, forced: /./.exec !== regexpExec }, {
        exec: regexpExec
    });

    // `String.prototype.{ codePointAt, at }` methods implementation
    var createMethod$3 = function (CONVERT_TO_STRING) {
        return function ($this, pos) {
            var S = String(requireObjectCoercible($this));
            var position = toInteger(pos);
            var size = S.length;
            var first, second;
            if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
            first = S.charCodeAt(position);
            return first < 0xD800 || first > 0xDBFF || position + 1 === size
                || (second = S.charCodeAt(position + 1)) < 0xDC00 || second > 0xDFFF
                ? CONVERT_TO_STRING ? S.charAt(position) : first
                : CONVERT_TO_STRING ? S.slice(position, position + 2) : (first - 0xD800 << 10) + (second - 0xDC00) + 0x10000;
        };
    };

    var stringMultibyte = {
        // `String.prototype.codePointAt` method
        // https://tc39.github.io/ecma262/#sec-string.prototype.codepointat
        codeAt: createMethod$3(false),
        // `String.prototype.at` method
        // https://github.com/mathiasbynens/String.prototype.at
        charAt: createMethod$3(true)
    };

    var charAt = stringMultibyte.charAt;

    var STRING_ITERATOR = 'String Iterator';
    var setInternalState$2 = internalState.set;
    var getInternalState$2 = internalState.getterFor(STRING_ITERATOR);

    // `String.prototype[@@iterator]` method
    // https://tc39.github.io/ecma262/#sec-string.prototype-@@iterator
    defineIterator(String, 'String', function (iterated) {
        setInternalState$2(this, {
            type: STRING_ITERATOR,
            string: String(iterated),
            index: 0
        });
        // `%StringIteratorPrototype%.next` method
        // https://tc39.github.io/ecma262/#sec-%stringiteratorprototype%.next
    }, function next() {
        var state = getInternalState$2(this);
        var string = state.string;
        var index = state.index;
        var point;
        if (index >= string.length) return { value: undefined, done: true };
        point = charAt(string, index);
        state.index += point.length;
        return { value: point, done: false };
    });

    var SPECIES$2 = wellKnownSymbol('species');

    var REPLACE_SUPPORTS_NAMED_GROUPS = !fails(function () {
        // #replace needs built-in support for named groups.
        // #match works fine because it just return the exec results, even if it has
        // a "grops" property.
        var re = /./;
        re.exec = function () {
            var result = [];
            result.groups = { a: '7' };
            return result;
        };
        return ''.replace(re, '$<a>') !== '7';
    });

    // IE <= 11 replaces $0 with the whole match, as if it was $&
    // https://stackoverflow.com/questions/6024666/getting-ie-to-replace-a-regex-with-the-literal-string-0
    var REPLACE_KEEPS_$0 = (function () {
        return 'a'.replace(/./, '$0') === '$0';
    })();

    // Chrome 51 has a buggy "split" implementation when RegExp#exec !== nativeExec
    // Weex JS has frozen built-in prototypes, so use try / catch wrapper
    var SPLIT_WORKS_WITH_OVERWRITTEN_EXEC = !fails(function () {
        var re = /(?:)/;
        var originalExec = re.exec;
        re.exec = function () { return originalExec.apply(this, arguments); };
        var result = 'ab'.split(re);
        return result.length !== 2 || result[0] !== 'a' || result[1] !== 'b';
    });

    var fixRegexpWellKnownSymbolLogic = function (KEY, length, exec, sham) {
        var SYMBOL = wellKnownSymbol(KEY);

        var DELEGATES_TO_SYMBOL = !fails(function () {
            // String methods call symbol-named RegEp methods
            var O = {};
            O[SYMBOL] = function () { return 7; };
            return ''[KEY](O) != 7;
        });

        var DELEGATES_TO_EXEC = DELEGATES_TO_SYMBOL && !fails(function () {
            // Symbol-named RegExp methods call .exec
            var execCalled = false;
            var re = /a/;

            if (KEY === 'split') {
                // We can't use real regex here since it causes deoptimization
                // and serious performance degradation in V8
                // https://github.com/zloirock/core-js/issues/306
                re = {};
                // RegExp[@@split] doesn't call the regex's exec method, but first creates
                // a new one. We need to return the patched regex when creating the new one.
                re.constructor = {};
                re.constructor[SPECIES$2] = function () { return re; };
                re.flags = '';
                re[SYMBOL] = /./[SYMBOL];
            }

            re.exec = function () { execCalled = true; return null; };

            re[SYMBOL]('');
            return !execCalled;
        });

        if (
            !DELEGATES_TO_SYMBOL ||
            !DELEGATES_TO_EXEC ||
            (KEY === 'replace' && !(REPLACE_SUPPORTS_NAMED_GROUPS && REPLACE_KEEPS_$0)) ||
            (KEY === 'split' && !SPLIT_WORKS_WITH_OVERWRITTEN_EXEC)
        ) {
            var nativeRegExpMethod = /./[SYMBOL];
            var methods = exec(SYMBOL, ''[KEY], function (nativeMethod, regexp, str, arg2, forceStringMethod) {
                if (regexp.exec === regexpExec) {
                    if (DELEGATES_TO_SYMBOL && !forceStringMethod) {
                        // The native String method already delegates to @@method (this
                        // polyfilled function), leasing to infinite recursion.
                        // We avoid it by directly calling the native @@method method.
                        return { done: true, value: nativeRegExpMethod.call(regexp, str, arg2) };
                    }
                    return { done: true, value: nativeMethod.call(str, regexp, arg2) };
                }
                return { done: false };
            }, { REPLACE_KEEPS_$0: REPLACE_KEEPS_$0 });
            var stringMethod = methods[0];
            var regexMethod = methods[1];

            redefine(String.prototype, KEY, stringMethod);
            redefine(RegExp.prototype, SYMBOL, length == 2
                // 21.2.5.8 RegExp.prototype[@@replace](string, replaceValue)
                // 21.2.5.11 RegExp.prototype[@@split](string, limit)
                ? function (string, arg) { return regexMethod.call(string, this, arg); }
                // 21.2.5.6 RegExp.prototype[@@match](string)
                // 21.2.5.9 RegExp.prototype[@@search](string)
                : function (string) { return regexMethod.call(string, this); }
            );
        }

        if (sham) createNonEnumerableProperty(RegExp.prototype[SYMBOL], 'sham', true);
    };

    var charAt$1 = stringMultibyte.charAt;

    // `AdvanceStringIndex` abstract operation
    // https://tc39.github.io/ecma262/#sec-advancestringindex
    var advanceStringIndex = function (S, index, unicode) {
        return index + (unicode ? charAt$1(S, index).length : 1);
    };

    // `RegExpExec` abstract operation
    // https://tc39.github.io/ecma262/#sec-regexpexec
    var regexpExecAbstract = function (R, S) {
        var exec = R.exec;
        if (typeof exec === 'function') {
            var result = exec.call(R, S);
            if (typeof result !== 'object') {
                throw TypeError('RegExp exec method returned something other than an Object or null');
            }
            return result;
        }

        if (classofRaw(R) !== 'RegExp') {
            throw TypeError('RegExp#exec called on incompatible receiver');
        }

        return regexpExec.call(R, S);
    };

    var max$1 = Math.max;
    var min$2 = Math.min;
    var floor$1 = Math.floor;
    var SUBSTITUTION_SYMBOLS = /\$([$&'`]|\d\d?|<[^>]*>)/g;
    var SUBSTITUTION_SYMBOLS_NO_NAMED = /\$([$&'`]|\d\d?)/g;

    var maybeToString = function (it) {
        return it === undefined ? it : String(it);
    };

    // @@replace logic
    fixRegexpWellKnownSymbolLogic('replace', 2, function (REPLACE, nativeReplace, maybeCallNative, reason) {
        return [
            // `String.prototype.replace` method
            // https://tc39.github.io/ecma262/#sec-string.prototype.replace
            function replace(searchValue, replaceValue) {
                var O = requireObjectCoercible(this);
                var replacer = searchValue == undefined ? undefined : searchValue[REPLACE];
                return replacer !== undefined
                    ? replacer.call(searchValue, O, replaceValue)
                    : nativeReplace.call(String(O), searchValue, replaceValue);
            },
            // `RegExp.prototype[@@replace]` method
            // https://tc39.github.io/ecma262/#sec-regexp.prototype-@@replace
            function (regexp, replaceValue) {
                if (reason.REPLACE_KEEPS_$0 || (typeof replaceValue === 'string' && replaceValue.indexOf('$0') === -1)) {
                    var res = maybeCallNative(nativeReplace, regexp, this, replaceValue);
                    if (res.done) return res.value;
                }

                var rx = anObject(regexp);
                var S = String(this);

                var functionalReplace = typeof replaceValue === 'function';
                if (!functionalReplace) replaceValue = String(replaceValue);

                var global = rx.global;
                if (global) {
                    var fullUnicode = rx.unicode;
                    rx.lastIndex = 0;
                }
                var results = [];
                while (true) {
                    var result = regexpExecAbstract(rx, S);
                    if (result === null) break;

                    results.push(result);
                    if (!global) break;

                    var matchStr = String(result[0]);
                    if (matchStr === '') rx.lastIndex = advanceStringIndex(S, toLength(rx.lastIndex), fullUnicode);
                }

                var accumulatedResult = '';
                var nextSourcePosition = 0;
                for (var i = 0; i < results.length; i++) {
                    result = results[i];

                    var matched = String(result[0]);
                    var position = max$1(min$2(toInteger(result.index), S.length), 0);
                    var captures = [];
                    // NOTE: This is equivalent to
                    //   captures = result.slice(1).map(maybeToString)
                    // but for some reason `nativeSlice.call(result, 1, result.length)` (called in
                    // the slice polyfill when slicing native arrays) "doesn't work" in safari 9 and
                    // causes a crash (https://pastebin.com/N21QzeQA) when trying to debug it.
                    for (var j = 1; j < result.length; j++) captures.push(maybeToString(result[j]));
                    var namedCaptures = result.groups;
                    if (functionalReplace) {
                        var replacerArgs = [matched].concat(captures, position, S);
                        if (namedCaptures !== undefined) replacerArgs.push(namedCaptures);
                        var replacement = String(replaceValue.apply(undefined, replacerArgs));
                    } else {
                        replacement = getSubstitution(matched, S, position, captures, namedCaptures, replaceValue);
                    }
                    if (position >= nextSourcePosition) {
                        accumulatedResult += S.slice(nextSourcePosition, position) + replacement;
                        nextSourcePosition = position + matched.length;
                    }
                }
                return accumulatedResult + S.slice(nextSourcePosition);
            }
        ];

        // https://tc39.github.io/ecma262/#sec-getsubstitution
        function getSubstitution(matched, str, position, captures, namedCaptures, replacement) {
            var tailPos = position + matched.length;
            var m = captures.length;
            var symbols = SUBSTITUTION_SYMBOLS_NO_NAMED;
            if (namedCaptures !== undefined) {
                namedCaptures = toObject(namedCaptures);
                symbols = SUBSTITUTION_SYMBOLS;
            }
            return nativeReplace.call(replacement, symbols, function (match, ch) {
                var capture;
                switch (ch.charAt(0)) {
                    case '$': return '$';
                    case '&': return matched;
                    case '`': return str.slice(0, position);
                    case "'": return str.slice(tailPos);
                    case '<':
                        capture = namedCaptures[ch.slice(1, -1)];
                        break;
                    default: // \d\d?
                        var n = +ch;
                        if (n === 0) return match;
                        if (n > m) {
                            var f = floor$1(n / 10);
                            if (f === 0) return match;
                            if (f <= m) return captures[f - 1] === undefined ? ch.charAt(1) : captures[f - 1] + ch.charAt(1);
                            return match;
                        }
                        capture = captures[n - 1];
                }
                return capture === undefined ? '' : capture;
            });
        }
    });

    // iterable DOM collections
    // flag - `iterable` interface - 'entries', 'keys', 'values', 'forEach' methods
    var domIterables = {
        CSSRuleList: 0,
        CSSStyleDeclaration: 0,
        CSSValueList: 0,
        ClientRectList: 0,
        DOMRectList: 0,
        DOMStringList: 0,
        DOMTokenList: 1,
        DataTransferItemList: 0,
        FileList: 0,
        HTMLAllCollection: 0,
        HTMLCollection: 0,
        HTMLFormElement: 0,
        HTMLSelectElement: 0,
        MediaList: 0,
        MimeTypeArray: 0,
        NamedNodeMap: 0,
        NodeList: 1,
        PaintRequestList: 0,
        Plugin: 0,
        PluginArray: 0,
        SVGLengthList: 0,
        SVGNumberList: 0,
        SVGPathSegList: 0,
        SVGPointList: 0,
        SVGStringList: 0,
        SVGTransformList: 0,
        SourceBufferList: 0,
        StyleSheetList: 0,
        TextTrackCueList: 0,
        TextTrackList: 0,
        TouchList: 0
    };

    var ITERATOR$2 = wellKnownSymbol('iterator');
    var TO_STRING_TAG$3 = wellKnownSymbol('toStringTag');
    var ArrayValues = es_array_iterator.values;

    for (var COLLECTION_NAME in domIterables) {
        var Collection = global_1[COLLECTION_NAME];
        var CollectionPrototype = Collection && Collection.prototype;
        if (CollectionPrototype) {
            // some Chrome versions have non-configurable methods on DOMTokenList
            if (CollectionPrototype[ITERATOR$2] !== ArrayValues) try {
                createNonEnumerableProperty(CollectionPrototype, ITERATOR$2, ArrayValues);
            } catch (error) {
                CollectionPrototype[ITERATOR$2] = ArrayValues;
            }
            if (!CollectionPrototype[TO_STRING_TAG$3]) {
                createNonEnumerableProperty(CollectionPrototype, TO_STRING_TAG$3, COLLECTION_NAME);
            }
            if (domIterables[COLLECTION_NAME]) for (var METHOD_NAME in es_array_iterator) {
                // some Chrome versions have non-configurable methods on DOMTokenList
                if (CollectionPrototype[METHOD_NAME] !== es_array_iterator[METHOD_NAME]) try {
                    createNonEnumerableProperty(CollectionPrototype, METHOD_NAME, es_array_iterator[METHOD_NAME]);
                } catch (error) {
                    CollectionPrototype[METHOD_NAME] = es_array_iterator[METHOD_NAME];
                }
            }
        }
    }

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function _defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
        }
    }

    function _createClass(Constructor, protoProps, staticProps) {
        if (protoProps) _defineProperties(Constructor.prototype, protoProps);
        if (staticProps) _defineProperties(Constructor, staticProps);
        return Constructor;
    }

    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function");
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                writable: true,
                configurable: true
            }
        });
        if (superClass) _setPrototypeOf(subClass, superClass);
    }

    function _getPrototypeOf(o) {
        _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
            return o.__proto__ || Object.getPrototypeOf(o);
        };
        return _getPrototypeOf(o);
    }

    function _setPrototypeOf(o, p) {
        _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
            o.__proto__ = p;
            return o;
        };

        return _setPrototypeOf(o, p);
    }

    function _assertThisInitialized(self) {
        if (self === void 0) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return self;
    }

    function _possibleConstructorReturn(self, call) {
        if (call && (typeof call === "object" || typeof call === "function")) {
            return call;
        }

        return _assertThisInitialized(self);
    }

    function _superPropBase(object, property) {
        while (!Object.prototype.hasOwnProperty.call(object, property)) {
            object = _getPrototypeOf(object);
            if (object === null) break;
        }

        return object;
    }

    function _get(target, property, receiver) {
        if (typeof Reflect !== "undefined" && Reflect.get) {
            _get = Reflect.get;
        } else {
            _get = function _get(target, property, receiver) {
                var base = _superPropBase(target, property);

                if (!base) return;
                var desc = Object.getOwnPropertyDescriptor(base, property);

                if (desc.get) {
                    return desc.get.call(receiver);
                }

                return desc.value;
            };
        }

        return _get(target, property, receiver || target);
    }

    function _slicedToArray(arr, i) {
        return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
    }

    function _arrayWithHoles(arr) {
        if (Array.isArray(arr)) return arr;
    }

    function _iterableToArrayLimit(arr, i) {
        if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) {
            return;
        }

        var _arr = [];
        var _n = true;
        var _d = false;
        var _e = undefined;

        try {
            for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
                _arr.push(_s.value);

                if (i && _arr.length === i) break;
            }
        } catch (err) {
            _d = true;
            _e = err;
        } finally {
            try {
                if (!_n && _i["return"] != null) _i["return"]();
            } finally {
                if (_d) throw _e;
            }
        }

        return _arr;
    }

    function _nonIterableRest() {
        throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }

    /**
     * @author zhixin wen <wenzhixin2010@gmail.com>
     * extensions: https://github.com/vitalets/x-editable
     */

    var Utils = $.fn.bootstrapTable.utils;
    $.extend($.fn.bootstrapTable.defaults, {
        editable: true,
        onEditableInit: function onEditableInit() {
            return false;
        },
        onEditableSave: function onEditableSave(field, row, rowIndex, oldValue, $el) {
            return false;
        },
        onEditableShown: function onEditableShown(field, row, $el, editable) {
            return false;
        },
        onEditableHidden: function onEditableHidden(field, row, $el, reason) {
            return false;
        }
    });
    $.extend($.fn.bootstrapTable.columnDefaults, {
        alwaysUseFormatter: false
    });
    $.extend($.fn.bootstrapTable.Constructor.EVENTS, {
        'editable-init.bs.table': 'onEditableInit',
        'editable-save.bs.table': 'onEditableSave',
        'editable-shown.bs.table': 'onEditableShown',
        'editable-hidden.bs.table': 'onEditableHidden'
    });

    $.BootstrapTable =
        /*#__PURE__*/
        function (_$$BootstrapTable) {
            _inherits(_class, _$$BootstrapTable);

            function _class() {
                _classCallCheck(this, _class);

                return _possibleConstructorReturn(this, _getPrototypeOf(_class).apply(this, arguments));
            }

            _createClass(_class, [{
                key: "initTable",
                value: function initTable() {
                    var _this = this;

                    _get(_getPrototypeOf(_class.prototype), "initTable", this).call(this);

                    if (!this.options.editable) {
                        return;
                    }

                    this.editedCells = [];
                    $.each(this.columns, function (i, column) {
                        if (!column.editable) {
                            return;
                        }

                        var editableOptions = {};
                        var editableDataMarkup = [];
                        var editableDataPrefix = 'editable-';

                        var processDataOptions = function processDataOptions(key, value) {
                            // Replace camel case with dashes.
                            var dashKey = key.replace(/([A-Z])/g, function ($1) {
                                return "-".concat($1.toLowerCase());
                            });

                            if (dashKey.indexOf(editableDataPrefix) === 0) {
                                editableOptions[dashKey.replace(editableDataPrefix, 'data-')] = value;
                            }
                        };

                        $.each(_this.options, processDataOptions);

                        column.formatter = column.formatter || function (value) {
                            return value;
                        };

                        column._formatter = column._formatter ? column._formatter : column.formatter;

                        column.formatter = function (value, row, index) {
                            var result = Utils.calculateObjectValue(column, column._formatter, [value, row, index], value);
                            result = typeof result === 'undefined' || result === null ? _this.options.undefinedText : result;

                            if (_this.options.uniqueId !== undefined && !column.alwaysUseFormatter) {
                                var uniqueId = Utils.getItemField(row, _this.options.uniqueId, false);

                                if ($.inArray(column.field + uniqueId, _this.editedCells) !== -1) {
                                    result = value;
                                }
                            }

                            $.each(column, processDataOptions);
                            $.each(editableOptions, function (key, value) {
                                editableDataMarkup.push(" ".concat(key, "=\"").concat(value, "\""));
                            });
                            var noEditFormatter = false;
                            var editableOpts = Utils.calculateObjectValue(column, column.editable, [index, row], {});

                            if (editableOpts.hasOwnProperty('noEditFormatter')) {
                                noEditFormatter = editableOpts.noEditFormatter(value, row, index);
                            }

                            if (noEditFormatter === false) {
                                return "<a href=\"javascript:void(0)\"\n            data-name=\"".concat(column.field, "\"\n            data-pk=\"").concat(row[_this.options.idField], "\"\n            data-value=\"").concat(result, "\"\n            ").concat(editableDataMarkup.join(''), "></a>");
                            }

                            return noEditFormatter;
                        };
                    });
                }
            }, {
                key: "initBody",
                value: function initBody(fixedScroll) {
                    var _this2 = this;

                    _get(_getPrototypeOf(_class.prototype), "initBody", this).call(this, fixedScroll);

                    if (!this.options.editable) {
                        return;
                    }

                    $.each(this.columns, function (i, column) {
                        if (!column.editable) {
                            return;
                        }

                        var data = _this2.getData({
                            escape: true
                        });

                        var $field = _this2.$body.find("a[data-name=\"".concat(column.field, "\"]"));

                        $field.each(function (i, element) {
                            var $element = $(element);
                            var $tr = $element.closest('tr');
                            var index = $tr.data('index');
                            var row = data[index];
                            var editableOpts = Utils.calculateObjectValue(column, column.editable, [index, row, $element], {});
                            $element.editable(editableOpts);
                        });
                        $field.off('save').on('save', function (_ref, _ref2) {
                            var currentTarget = _ref.currentTarget;
                            var submitValue = _ref2.submitValue;
                            var $this = $(currentTarget);

                            var data = _this2.getData();

                            var rowIndex = $this.parents('tr[data-index]').data('index');
                            var row = data[rowIndex];
                            var oldValue = row[column.field];

                            if (_this2.options.uniqueId !== undefined && !column.alwaysUseFormatter) {
                                var uniqueId = Utils.getItemField(row, _this2.options.uniqueId, false);

                                if ($.inArray(column.field + uniqueId, _this2.editedCells) === -1) {
                                    _this2.editedCells.push(column.field + uniqueId);
                                }
                            }

                            submitValue = Utils.escapeHTML(submitValue);
                            $this.data('value', submitValue);
                            row[column.field] = submitValue;

                            _this2.trigger('editable-save', column.field, row, rowIndex, oldValue, $this);

                            _this2.initBody();
                        });
                        $field.off('shown').on('shown', function (_ref3, editable) {
                            var currentTarget = _ref3.currentTarget;
                            var $this = $(currentTarget);

                            var data = _this2.getData();

                            var rowIndex = $this.parents('tr[data-index]').data('index');
                            var row = data[rowIndex];

                            _this2.trigger('editable-shown', column.field, row, $this, editable);
                        });
                        $field.off('hidden').on('hidden', function (_ref4, reason) {
                            var currentTarget = _ref4.currentTarget;
                            var $this = $(currentTarget);

                            var data = _this2.getData();

                            var rowIndex = $this.parents('tr[data-index]').data('index');
                            var row = data[rowIndex];

                            _this2.trigger('editable-hidden', column.field, row, $this, reason);
                        });
                    });
                    this.trigger('editable-init');
                }
            }, {
                key: "getData",
                value: function getData(params) {
                    var data = _get(_getPrototypeOf(_class.prototype), "getData", this).call(this, params);

                    if (params && params.escape) {
                        var _iteratorNormalCompletion = true;
                        var _didIteratorError = false;
                        var _iteratorError = undefined;

                        try {
                            for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                var row = _step.value;

                                for (var _i = 0, _Object$entries = Object.entries(row); _i < _Object$entries.length; _i++) {
                                    var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
                                        key = _Object$entries$_i[0],
                                        value = _Object$entries$_i[1];

                                    row[key] = Utils.unescapeHTML(value);
                                }
                            }
                        } catch (err) {
                            _didIteratorError = true;
                            _iteratorError = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion && _iterator.return != null) {
                                    _iterator.return();
                                }
                            } finally {
                                if (_didIteratorError) {
                                    throw _iteratorError;
                                }
                            }
                        }
                    }

                    return data;
                }
            }]);

            return _class;
        }($.BootstrapTable);
})));