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

    // `ToObject` abstract operation
    // https://tc39.github.io/ecma262/#sec-toobject
    var toObject = function (argument) {
        return Object(requireObjectCoercible(argument));
    };

    // `IsArray` abstract operation
    // https://tc39.github.io/ecma262/#sec-isarray
    var isArray = Array.isArray || function isArray(arg) {
        return classofRaw(arg) == 'Array';
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

    var WellKnownSymbolsStore = shared('wks');
    var Symbol$1 = global_1.Symbol;
    var createWellKnownSymbol = useSymbolAsUid ? Symbol$1 : uid;

    var wellKnownSymbol = function (name) {
        if (!has(WellKnownSymbolsStore, name)) {
            if (nativeSymbol && has(Symbol$1, name)) WellKnownSymbolsStore[name] = Symbol$1[name];
            else WellKnownSymbolsStore[name] = createWellKnownSymbol('Symbol.' + name);
        } return WellKnownSymbolsStore[name];
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

    var $filter = arrayIteration.filter;

    var HAS_SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('filter');
    // Edge 14- issue
    var USES_TO_LENGTH = HAS_SPECIES_SUPPORT && !fails(function () {
        [].filter.call({ length: -1, 0: 1 }, function (it) { throw it; });
    });

    // `Array.prototype.filter` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.filter
    // with adding support of @@species
    _export({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT || !USES_TO_LENGTH }, {
        filter: function filter(callbackfn /* , thisArg */) {
            return $filter(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
        }
    });

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

    var nativeJoin = [].join;

    var ES3_STRINGS = indexedObject != Object;
    var SLOPPY_METHOD = sloppyArrayMethod('join', ',');

    // `Array.prototype.join` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.join
    _export({ target: 'Array', proto: true, forced: ES3_STRINGS || SLOPPY_METHOD }, {
        join: function join(separator) {
            return nativeJoin.call(toIndexedObject(this), separator === undefined ? ',' : separator);
        }
    });

    var createProperty = function (object, key, value) {
        var propertyKey = toPrimitive(key);
        if (propertyKey in object) objectDefineProperty.f(object, propertyKey, createPropertyDescriptor(0, value));
        else object[propertyKey] = value;
    };

    var SPECIES$2 = wellKnownSymbol('species');
    var nativeSlice = [].slice;
    var max$1 = Math.max;

    // `Array.prototype.slice` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.slice
    // fallback for not array-like ES3 strings and DOM objects
    _export({ target: 'Array', proto: true, forced: !arrayMethodHasSpeciesSupport('slice') }, {
        slice: function slice(start, end) {
            var O = toIndexedObject(this);
            var length = toLength(O.length);
            var k = toAbsoluteIndex(start, length);
            var fin = toAbsoluteIndex(end === undefined ? length : end, length);
            // inline `ArraySpeciesCreate` for usage native `Array#slice` where it's possible
            var Constructor, result, n;
            if (isArray(O)) {
                Constructor = O.constructor;
                // cross-realm fallback
                if (typeof Constructor == 'function' && (Constructor === Array || isArray(Constructor.prototype))) {
                    Constructor = undefined;
                } else if (isObject(Constructor)) {
                    Constructor = Constructor[SPECIES$2];
                    if (Constructor === null) Constructor = undefined;
                }
                if (Constructor === Array || Constructor === undefined) {
                    return nativeSlice.call(O, k, fin);
                }
            }
            result = new (Constructor === undefined ? Array : Constructor)(max$1(fin - k, 0));
            for (n = 0; k < fin; k++, n++) if (k in O) createProperty(result, n, O[k]);
            result.length = n;
            return result;
        }
    });

    var test = [];
    var nativeSort = test.sort;

    // IE8-
    var FAILS_ON_UNDEFINED = fails(function () {
        test.sort(undefined);
    });
    // V8 bug
    var FAILS_ON_NULL = fails(function () {
        test.sort(null);
    });
    // Old WebKit
    var SLOPPY_METHOD$1 = sloppyArrayMethod('sort');

    var FORCED = FAILS_ON_UNDEFINED || !FAILS_ON_NULL || SLOPPY_METHOD$1;

    // `Array.prototype.sort` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.sort
    _export({ target: 'Array', proto: true, forced: FORCED }, {
        sort: function sort(comparefn) {
            return comparefn === undefined
                ? nativeSort.call(toObject(this))
                : nativeSort.call(toObject(this), aFunction$1(comparefn));
        }
    });

    var defineProperty = objectDefineProperty.f;

    var FunctionPrototype = Function.prototype;
    var FunctionPrototypeToString = FunctionPrototype.toString;
    var nameRE = /^\s*function ([^ (]*)/;
    var NAME = 'name';

    // Function instances `.name` property
    // https://tc39.github.io/ecma262/#sec-function-instances-name
    if (descriptors && !(NAME in FunctionPrototype)) {
        defineProperty(FunctionPrototype, NAME, {
            configurable: true,
            get: function () {
                try {
                    return FunctionPrototypeToString.call(this).match(nameRE)[1];
                } catch (error) {
                    return '';
                }
            }
        });
    }

    var nativeAssign = Object.assign;
    var defineProperty$1 = Object.defineProperty;

    // `Object.assign` method
    // https://tc39.github.io/ecma262/#sec-object.assign
    var objectAssign = !nativeAssign || fails(function () {
        // should have correct order of operations (Edge bug)
        if (descriptors && nativeAssign({ b: 1 }, nativeAssign(defineProperty$1({}, 'a', {
            enumerable: true,
            get: function () {
                defineProperty$1(this, 'b', {
                    value: 3,
                    enumerable: false
                });
            }
        }), { b: 2 })).b !== 1) return true;
        // should work with symbols and should have deterministic property order (V8 bug)
        var A = {};
        var B = {};
        // eslint-disable-next-line no-undef
        var symbol = Symbol();
        var alphabet = 'abcdefghijklmnopqrst';
        A[symbol] = 7;
        alphabet.split('').forEach(function (chr) { B[chr] = chr; });
        return nativeAssign({}, A)[symbol] != 7 || objectKeys(nativeAssign({}, B)).join('') != alphabet;
    }) ? function assign(target, source) { // eslint-disable-line no-unused-vars
        var T = toObject(target);
        var argumentsLength = arguments.length;
        var index = 1;
        var getOwnPropertySymbols = objectGetOwnPropertySymbols.f;
        var propertyIsEnumerable = objectPropertyIsEnumerable.f;
        while (argumentsLength > index) {
            var S = indexedObject(arguments[index++]);
            var keys = getOwnPropertySymbols ? objectKeys(S).concat(getOwnPropertySymbols(S)) : objectKeys(S);
            var length = keys.length;
            var j = 0;
            var key;
            while (length > j) {
                key = keys[j++];
                if (!descriptors || propertyIsEnumerable.call(S, key)) T[key] = S[key];
            }
        } return T;
    } : nativeAssign;

    // `Object.assign` method
    // https://tc39.github.io/ecma262/#sec-object.assign
    _export({ target: 'Object', stat: true, forced: Object.assign !== objectAssign }, {
        assign: objectAssign
    });

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

    var SPECIES$3 = wellKnownSymbol('species');

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
                re.constructor[SPECIES$3] = function () { return re; };
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

    // `String.prototype.{ codePointAt, at }` methods implementation
    var createMethod$2 = function (CONVERT_TO_STRING) {
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
        codeAt: createMethod$2(false),
        // `String.prototype.at` method
        // https://github.com/mathiasbynens/String.prototype.at
        charAt: createMethod$2(true)
    };

    var charAt = stringMultibyte.charAt;

    // `AdvanceStringIndex` abstract operation
    // https://tc39.github.io/ecma262/#sec-advancestringindex
    var advanceStringIndex = function (S, index, unicode) {
        return index + (unicode ? charAt(S, index).length : 1);
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

    var max$2 = Math.max;
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
                    var position = max$2(min$2(toInteger(result.index), S.length), 0);
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

    var $forEach = arrayIteration.forEach;

    // `Array.prototype.forEach` method implementation
    // https://tc39.github.io/ecma262/#sec-array.prototype.foreach
    var arrayForEach = sloppyArrayMethod('forEach') ? function forEach(callbackfn /* , thisArg */) {
        return $forEach(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    } : [].forEach;

    for (var COLLECTION_NAME in domIterables) {
        var Collection = global_1[COLLECTION_NAME];
        var CollectionPrototype = Collection && Collection.prototype;
        // some Chrome versions have non-configurable methods on DOMTokenList
        if (CollectionPrototype && CollectionPrototype.forEach !== arrayForEach) try {
            createNonEnumerableProperty(CollectionPrototype, 'forEach', arrayForEach);
        } catch (error) {
            CollectionPrototype.forEach = arrayForEach;
        }
    }

    function _typeof(obj) {
        if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
            _typeof = function (obj) {
                return typeof obj;
            };
        } else {
            _typeof = function (obj) {
                return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
            };
        }

        return _typeof(obj);
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

    /**
     * @author: Yura Knoxville
     * @version: v1.1.0
     */

    var initBodyCaller; // it only does '%s', and return '' when arguments are undefined

    var sprintf = function sprintf(str) {
        var args = arguments;
        var flag = true;
        var i = 1;
        str = str.replace(/%s/g, function () {
            var arg = args[i++];

            if (typeof arg === 'undefined') {
                flag = false;
                return '';
            }

            return arg;
        });
        return flag ? str : '';
    };

    var groupBy = function groupBy(array, f) {
        var tmpGroups = {};
        array.forEach(function (o) {
            var groups = f(o);
            tmpGroups[groups] = tmpGroups[groups] || [];
            tmpGroups[groups].push(o);
        });
        return tmpGroups;
    };

    $.extend($.fn.bootstrapTable.defaults, {
        groupBy: false,
        groupByField: '',
        groupByFormatter: undefined
    });
    var Utils = $.fn.bootstrapTable.utils;
    var BootstrapTable = $.fn.bootstrapTable.Constructor;
    var _initSort = BootstrapTable.prototype.initSort;
    var _initBody = BootstrapTable.prototype.initBody;
    var _updateSelected = BootstrapTable.prototype.updateSelected;

    BootstrapTable.prototype.initSort = function () {
        var _this = this;

        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        _initSort.apply(this, Array.prototype.slice.apply(args));

        var that = this;
        this.tableGroups = [];

        if (this.options.groupBy && this.options.groupByField !== '') {
            if (this.options.sortName !== this.options.groupByField) {
                if (this.options.customSort) {
                    Utils.calculateObjectValue(this.options, this.options.customSort, [this.options.sortName, this.options.sortOrder, this.data]);
                } else {
                    this.data.sort(function (a, b) {
                        var groupByFields = _this.getGroupByFields();

                        var fieldValuesA = [];
                        var fieldValuesB = [];
                        $.each(groupByFields, function (i, field) {
                            fieldValuesA.push(a[field]);
                            fieldValuesB.push(b[field]);
                        });
                        a = fieldValuesA.join();
                        b = fieldValuesB.join();
                        return a.localeCompare(b, undefined, {
                            numeric: true
                        });
                    });
                }
            }

            var groups = groupBy(that.data, function (item) {
                var groupByFields = _this.getGroupByFields();

                var groupValues = [];
                $.each(groupByFields, function (i, field) {
                    groupValues.push(item[field]);
                });
                return groupValues.join(', ');
            });
            var index = 0;
            $.each(groups, function (key, value) {
                _this.tableGroups.push({
                    id: index,
                    name: key,
                    data: value
                });

                value.forEach(function (item) {
                    if (!item._data) {
                        item._data = {};
                    }

                    item._data['parent-index'] = index;
                });
                index++;
            });
        }
    };

    BootstrapTable.prototype.initBody = function () {
        initBodyCaller = true;

        for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
        }

        _initBody.apply(this, Array.prototype.slice.apply(args));

        if (this.options.groupBy && this.options.groupByField !== '') {
            var that = this;
            var checkBox = false;
            var visibleColumns = 0;
            this.columns.forEach(function (column) {
                if (column.checkbox) {
                    checkBox = true;
                } else {
                    if (column.visible) {
                        visibleColumns += 1;
                    }
                }
            });

            if (this.options.detailView && !this.options.cardView) {
                visibleColumns += 1;
            }

            this.tableGroups.forEach(function (item) {
                var html = [];
                html.push(sprintf('<tr class="info groupBy expanded" data-group-index="%s">', item.id));

                if (that.options.detailView && !that.options.cardView) {
                    html.push('<td class="detail"></td>');
                }

                if (checkBox) {
                    html.push('<td class="bs-checkbox">', '<input name="btSelectGroup" type="checkbox" />', '</td>');
                }

                var formattedValue = item.name;

                if (typeof that.options.groupByFormatter === 'function') {
                    formattedValue = that.options.groupByFormatter(item.name, item.id, item.data);
                }

                html.push('<td', sprintf(' colspan="%s"', visibleColumns), '>', formattedValue, '</td>');
                html.push('</tr>');
                that.$body.find("tr[data-parent-index=".concat(item.id, "]:first")).before($(html.join('')));
            });
            this.$selectGroup = [];
            this.$body.find('[name="btSelectGroup"]').each(function () {
                var self = $(this);
                that.$selectGroup.push({
                    group: self,
                    item: that.$selectItem.filter(function () {
                        return $(this).closest('tr').data('parent-index') === self.closest('tr').data('group-index');
                    })
                });
            });
            this.$container.off('click', '.groupBy').on('click', '.groupBy', function () {
                $(this).toggleClass('expanded');
                that.$body.find("tr[data-parent-index=".concat($(this).closest('tr').data('group-index'), "]")).toggleClass('hidden');
            });
            this.$container.off('click', '[name="btSelectGroup"]').on('click', '[name="btSelectGroup"]', function (event) {
                event.stopImmediatePropagation();
                var self = $(this);
                var checked = self.prop('checked');
                that[checked ? 'checkGroup' : 'uncheckGroup']($(this).closest('tr').data('group-index'));
            });
        }

        initBodyCaller = false;
        this.updateSelected();
    };

    BootstrapTable.prototype.updateSelected = function () {
        if (!initBodyCaller) {
            for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                args[_key3] = arguments[_key3];
            }

            _updateSelected.apply(this, Array.prototype.slice.apply(args));

            if (this.options.groupBy && this.options.groupByField !== '') {
                this.$selectGroup.forEach(function (item) {
                    var checkGroup = item.item.filter(':enabled').length === item.item.filter(':enabled').filter(':checked').length;
                    item.group.prop('checked', checkGroup);
                });
            }
        }
    };

    BootstrapTable.prototype.checkGroup = function (index) {
        this.checkGroup_(index, true);
    };

    BootstrapTable.prototype.uncheckGroup = function (index) {
        this.checkGroup_(index, false);
    };

    BootstrapTable.prototype.checkGroup_ = function (index, checked) {
        var rowsBefore = this.getSelections();

        var filter = function filter() {
            return $(this).closest('tr').data('parent-index') === index;
        };

        this.$selectItem.filter(filter).prop('checked', checked);
        this.updateRows();
        this.updateSelected();
        var rowsAfter = this.getSelections();

        if (checked) {
            this.trigger('check-all', rowsAfter, rowsBefore);
            return;
        }

        this.trigger('uncheck-all', rowsAfter, rowsBefore);
    };

    BootstrapTable.prototype.getGroupByFields = function () {
        var groupByFields = this.options.groupByField;

        if (!$.isArray(this.options.groupByField)) {
            groupByFields = [this.options.groupByField];
        }

        return groupByFields;
    };

    $.BootstrapTable =
        /*#__PURE__*/
        function (_$$BootstrapTable) {
            _inherits(_class, _$$BootstrapTable);

            function _class() {
                _classCallCheck(this, _class);

                return _possibleConstructorReturn(this, _getPrototypeOf(_class).apply(this, arguments));
            }

            _createClass(_class, [{
                key: "scrollTo",
                value: function scrollTo(params) {
                    if (this.options.groupBy) {
                        var options = {
                            unit: 'px',
                            value: 0
                        };

                        if (_typeof(params) === 'object') {
                            options = Object.assign(options, params);
                        }

                        if (options.unit === 'rows') {
                            var scrollTo = 0;
                            this.$body.find("> tr:lt(".concat(options.value, ")")).each(function (i, el) {
                                scrollTo += $(el).outerHeight(true);
                            });
                            var $targetColumn = this.$body.find("> tr:not(.groupBy):eq(".concat(options.value, ")"));
                            $targetColumn.prevAll('.groupBy').each(function (i, el) {
                                scrollTo += $(el).outerHeight(true);
                            });
                            this.$tableBody.scrollTop(scrollTo);
                            return;
                        }
                    }

                    _get(_getPrototypeOf(_class.prototype), "scrollTo", this).call(this, params);
                }
            }]);

            return _class;
        }($.BootstrapTable);
})));