/* ../../libs/bem-core/node_modules/ym/modules.js begin */
/**
 * Modules
 *
 * Copyright (c) 2013 Filatov Dmitry (dfilatov@yandex-team.ru)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 * @version 0.1.0
 */

(function(global) {

var undef,

    DECL_STATES = {
        NOT_RESOLVED : 'NOT_RESOLVED',
        IN_RESOLVING : 'IN_RESOLVING',
        RESOLVED     : 'RESOLVED'
    },

    /**
     * Creates a new instance of modular system
     * @returns {Object}
     */
    create = function() {
        var curOptions = {
                trackCircularDependencies : true,
                allowMultipleDeclarations : true
            },

            modulesStorage = {},
            waitForNextTick = false,
            pendingRequires = [],

            /**
             * Defines module
             * @param {String} name
             * @param {String[]} [deps]
             * @param {Function} declFn
             */
            define = function(name, deps, declFn) {
                if(!declFn) {
                    declFn = deps;
                    deps = [];
                }

                var module = modulesStorage[name];
                if(!module) {
                    module = modulesStorage[name] = {
                        name : name,
                        decl : undef
                    };
                }

                module.decl = {
                    name       : name,
                    prev       : module.decl,
                    fn         : declFn,
                    state      : DECL_STATES.NOT_RESOLVED,
                    deps       : deps,
                    dependents : [],
                    exports    : undef
                };
            },

            /**
             * Requires modules
             * @param {String|String[]} modules
             * @param {Function} cb
             * @param {Function} [errorCb]
             */
            require = function(modules, cb, errorCb) {
                if(typeof modules === 'string') {
                    modules = [modules];
                }

                if(!waitForNextTick) {
                    waitForNextTick = true;
                    nextTick(onNextTick);
                }

                pendingRequires.push({
                    deps : modules,
                    cb   : function(exports, error) {
                        error?
                            (errorCb || onError)(error) :
                            cb.apply(global, exports);
                    }
                });
            },

            /**
             * Returns state of module
             * @param {String} name
             * @returns {String} state, possible values are NOT_DEFINED, NOT_RESOLVED, IN_RESOLVING, RESOLVED
             */
            getState = function(name) {
                var module = modulesStorage[name];
                return module?
                    DECL_STATES[module.decl.state] :
                    'NOT_DEFINED';
            },

            /**
             * Returns whether the module is defined
             * @param {String} name
             * @returns {Boolean}
             */
            isDefined = function(name) {
                return !!modulesStorage[name];
            },

            /**
             * Sets options
             * @param {Object} options
             */
            setOptions = function(options) {
                for(var name in options) {
                    if(options.hasOwnProperty(name)) {
                        curOptions[name] = options[name];
                    }
                }
            },

            onNextTick = function() {
                waitForNextTick = false;
                applyRequires();
            },

            applyRequires = function() {
                var requiresToProcess = pendingRequires,
                    i = 0, require;

                pendingRequires = [];

                while(require = requiresToProcess[i++]) {
                    requireDeps(null, require.deps, [], require.cb);
                }
            },

            requireDeps = function(fromDecl, deps, path, cb) {
                var unresolvedDepsCnt = deps.length;
                if(!unresolvedDepsCnt) {
                    cb([]);
                }

                var decls = [],
                    i = 0, len = unresolvedDepsCnt,
                    dep, decl;

                while(i < len) {
                    dep = deps[i++];
                    if(typeof dep === 'string') {
                        if(!modulesStorage[dep]) {
                            cb(null, buildModuleNotFoundError(dep, fromDecl));
                            return;
                        }

                        decl = modulesStorage[dep].decl;
                    }
                    else {
                        decl = dep;
                    }

                    if(decl.state === DECL_STATES.IN_RESOLVING &&
                            curOptions.trackCircularDependencies &&
                            isDependenceCircular(decl, path)) {
                        cb(null, buildCircularDependenceError(decl, path));
                        return;
                    }

                    decls.push(decl);

                    startDeclResolving(
                        decl,
                        path,
                        function(_, error) {
                            if(error) {
                                cb(null, error);
                                return;
                            }

                            if(!--unresolvedDepsCnt) {
                                var exports = [],
                                    i = 0, decl;
                                while(decl = decls[i++]) {
                                    exports.push(decl.exports);
                                }
                                cb(exports);
                            }
                        });
                }
            },

            startDeclResolving = function(decl, path, cb) {
                if(decl.state === DECL_STATES.RESOLVED) {
                    cb(decl.exports);
                    return;
                }
                else {
                    decl.dependents.push(cb);
                }

                if(decl.state === DECL_STATES.IN_RESOLVING) {
                    return;
                }

                if(decl.prev && !curOptions.allowMultipleDeclarations) {
                    provideError(decl, buildMultipleDeclarationError(decl));
                    return;
                }

                curOptions.trackCircularDependencies && (path = path.slice()).push(decl);

                var isProvided = false,
                    deps = decl.prev? decl.deps.concat([decl.prev]) : decl.deps;

                decl.state = DECL_STATES.IN_RESOLVING;
                requireDeps(
                    decl,
                    deps,
                    path,
                    function(depDeclsExports, error) {
                        if(error) {
                            provideError(decl, error);
                            return;
                        }

                        depDeclsExports.unshift(function(exports, error) {
                            if(isProvided) {
                                cb(null, buildDeclAreadyProvidedError(decl));
                                return;
                            }

                            isProvided = true;
                            error?
                                provideError(decl, error) :
                                provideDecl(decl, exports);
                        });

                        decl.fn.apply(
                            {
                                name   : decl.name,
                                deps   : decl.deps,
                                global : global
                            },
                            depDeclsExports);
                    });
            },

            provideDecl = function(decl, exports) {
                decl.exports = exports;
                decl.state = DECL_STATES.RESOLVED;

                var i = 0, dependent;
                while(dependent = decl.dependents[i++]) {
                    dependent(exports);
                }

                decl.dependents = undef;
            },

            provideError = function(decl, error) {
                decl.state = DECL_STATES.NOT_RESOLVED;

                var i = 0, dependent;
                while(dependent = decl.dependents[i++]) {
                    dependent(null, error);
                }

                decl.dependents = [];
            };

        return {
            create     : create,
            define     : define,
            require    : require,
            getState   : getState,
            isDefined  : isDefined,
            setOptions : setOptions
        };
    },

    onError = function(e) {
        nextTick(function() {
            throw e;
        });
    },

    buildModuleNotFoundError = function(name, decl) {
        return Error(decl?
            'Module "' + decl.name + '": can\'t resolve dependence "' + name + '"' :
            'Required module "' + name + '" can\'t be resolved');
    },

    buildCircularDependenceError = function(decl, path) {
        var strPath = [],
            i = 0, pathDecl;
        while(pathDecl = path[i++]) {
            strPath.push(pathDecl.name);
        }
        strPath.push(decl.name);

        return Error('Circular dependence has been detected: "' + strPath.join(' -> ') + '"');
    },

    buildDeclAreadyProvidedError = function(decl) {
        return Error('Declaration of module "' + decl.name + '" has already been provided');
    },

    buildMultipleDeclarationError = function(decl) {
        return Error('Multiple declarations of module "' + decl.name + '" have been detected');
    },

    isDependenceCircular = function(decl, path) {
        var i = 0, pathDecl;
        while(pathDecl = path[i++]) {
            if(decl === pathDecl) {
                return true;
            }
        }
        return false;
    },

    nextTick = (function() {
        var fns = [],
            enqueueFn = function(fn) {
                return fns.push(fn) === 1;
            },
            callFns = function() {
                var fnsToCall = fns, i = 0, len = fns.length;
                fns = [];
                while(i < len) {
                    fnsToCall[i++]();
                }
            };

        if(typeof process === 'object' && process.nextTick) { // nodejs
            return function(fn) {
                enqueueFn(fn) && process.nextTick(callFns);
            };
        }

        if(global.setImmediate) { // ie10
            return function(fn) {
                enqueueFn(fn) && global.setImmediate(callFns);
            };
        }

        if(global.postMessage && !global.opera) { // modern browsers
            var isPostMessageAsync = true;
            if(global.attachEvent) {
                var checkAsync = function() {
                        isPostMessageAsync = false;
                    };
                global.attachEvent('onmessage', checkAsync);
                global.postMessage('__checkAsync', '*');
                global.detachEvent('onmessage', checkAsync);
            }

            if(isPostMessageAsync) {
                var msg = '__modules' + (+new Date()),
                    onMessage = function(e) {
                        if(e.data === msg) {
                            e.stopPropagation && e.stopPropagation();
                            callFns();
                        }
                    };

                global.addEventListener?
                    global.addEventListener('message', onMessage, true) :
                    global.attachEvent('onmessage', onMessage);

                return function(fn) {
                    enqueueFn(fn) && global.postMessage(msg, '*');
                };
            }
        }

        var doc = global.document;
        if('onreadystatechange' in doc.createElement('script')) { // ie6-ie8
            var head = doc.getElementsByTagName('head')[0],
                createScript = function() {
                    var script = doc.createElement('script');
                    script.onreadystatechange = function() {
                        script.parentNode.removeChild(script);
                        script = script.onreadystatechange = null;
                        callFns();
                    };
                    head.appendChild(script);
                };

            return function(fn) {
                enqueueFn(fn) && createScript();
            };
        }

        return function(fn) { // old browsers
            enqueueFn(fn) && setTimeout(callFns, 0);
        };
    })();

if(typeof exports === 'object') {
    module.exports = create();
}
else {
    global.modules = create();
}

})(this);

/* ../../libs/bem-core/node_modules/ym/modules.js end */
;
/* ../../libs/bem-core/common.blocks/i-bem/i-bem.vanilla.js begin */
/**
 * @module i-bem
 */

modules.define(
    'i-bem',
    [
        'i-bem__internal',
        'inherit',
        'identify',
        'next-tick',
        'objects',
        'functions',
        'events'
    ],
    function(
        provide,
        INTERNAL,
        inherit,
        identify,
        nextTick,
        objects,
        functions,
        events) {

var undef,

    MOD_DELIM = INTERNAL.MOD_DELIM,
    ELEM_DELIM = INTERNAL.ELEM_DELIM,

    /**
     * Storage for block init functions
     * @private
     * @type Array
     */
    initFns = [],

    /**
     * Storage for block declarations (hash by block name)
     * @private
     * @type Object
     */
    blocks = {};

/**
 * Builds the name of the handler method for setting a modifier
 * @param {String} prefix
 * @param {String} modName Modifier name
 * @param {String} modVal Modifier value
 * @param {String} [elemName] Element name
 * @returns {String}
 */
function buildModFnName(prefix, modName, modVal, elemName) {
    return '__' + prefix +
        (elemName? '__elem_' + elemName : '') +
       '__mod' +
       (modName? '_' + modName : '') +
       (modVal? '_' + modVal : '');
}

/**
 * Transforms a hash of modifier handlers to methods
 * @param {String} prefix
 * @param {Object} modFns
 * @param {Object} props
 * @param {String} [elemName]
 */
function modFnsToProps(prefix, modFns, props, elemName) {
    if(functions.isFunction(modFns)) {
        props[buildModFnName(prefix, '*', '*', elemName)] = modFns;
    } else {
        var modName, modVal, modFn;
        for(modName in modFns) {
            if(modFns.hasOwnProperty(modName)) {
                modFn = modFns[modName];
                if(functions.isFunction(modFn)) {
                    props[buildModFnName(prefix, modName, '*', elemName)] = modFn;
                } else {
                    for(modVal in modFn) {
                        if(modFn.hasOwnProperty(modVal)) {
                            props[buildModFnName(prefix, modName, modVal, elemName)] = modFn[modVal];
                        }
                    }
                }
            }
        }
    }
}

function buildCheckMod(modName, modVal) {
    return modVal?
        Array.isArray(modVal)?
            function(block) {
                var i = 0, len = modVal.length;
                while(i < len)
                    if(block.hasMod(modName, modVal[i++]))
                        return true;
                return false;
            } :
            function(block) {
                return block.hasMod(modName, modVal);
            } :
        function(block) {
            return block.hasMod(modName);
        };
}

function convertModHandlersToMethods(props) {
    if(props.beforeSetMod) {
        modFnsToProps('before', props.beforeSetMod, props);
        delete props.beforeSetMod;
    }

    if(props.onSetMod) {
        modFnsToProps('after', props.onSetMod, props);
        delete props.onSetMod;
    }

    var elemName;
    if(props.beforeElemSetMod) {
        for(elemName in props.beforeElemSetMod) {
            if(props.beforeElemSetMod.hasOwnProperty(elemName)) {
                modFnsToProps('before', props.beforeElemSetMod[elemName], props, elemName);
            }
        }
        delete props.beforeElemSetMod;
    }

    if(props.onElemSetMod) {
        for(elemName in props.onElemSetMod) {
            if(props.onElemSetMod.hasOwnProperty(elemName)) {
                modFnsToProps('after', props.onElemSetMod[elemName], props, elemName);
            }
        }
        delete props.onElemSetMod;
    }
}

/**
 * @class BEM
 * @description Base block for creating BEM blocks
 * @augments events:Emitter
 * @exports
 */
var BEM = inherit(events.Emitter, /** @lends BEM.prototype */ {
    /**
     * @constructor
     * @private
     * @param {Object} mods Block modifiers
     * @param {Object} params Block parameters
     * @param {Boolean} [initImmediately=true]
     */
    __constructor : function(mods, params, initImmediately) {
        /**
         * Cache of block modifiers
         * @member {Object}
         * @private
         */
        this._modCache = mods || {};

        /**
         * Current modifiers in the stack
         * @member {Object}
         * @private
         */
        this._processingMods = {};

        /**
         * Block parameters, taking into account the defaults
         * @member {Object}
         * @readonly
         */
        this.params = objects.extend(this.getDefaultParams(), params);

        initImmediately !== false?
            this._init() :
            initFns.push(this._init, this);
    },

    /**
     * Initializes the block
     * @private
     */
    _init : function() {
        return this.setMod('js', 'inited');
    },

    /**
     * Adds an event handler
     * @param {String|Object} e Event type
     * @param {Object} [data] Additional data that the handler gets as e.data
     * @param {Function} fn Handler
     * @param {Object} [ctx] Handler context
     * @returns {BEM} this
     */
    on : function(e, data, fn, ctx) {
        if(typeof e === 'object' && (functions.isFunction(data) || functions.isFunction(fn))) { // mod change event
            e = this.__self._buildModEventName(e);
        }

        return this.__base.apply(this, arguments);
    },

    /**
     * Removes event handler or handlers
     * @param {String|Object} [e] Event type
     * @param {Function} [fn] Handler
     * @param {Object} [ctx] Handler context
     * @returns {BEM} this
     */
    un : function(e, fn, ctx) {
        if(typeof e === 'object' && functions.isFunction(fn)) { // mod change event
            e = this.__self._buildModEventName(e);
        }

        return this.__base.apply(this, arguments);
    },

    /**
     * Executes the block's event handlers and live event handlers
     * @protected
     * @param {String} e Event name
     * @param {Object} [data] Additional information
     * @returns {BEM} this
     */
    emit : function(e, data) {
        var isModJsEvent = false;
        if(typeof e === 'object' && !(e instanceof events.Event)) {
            isModJsEvent = e.modName === 'js';
            e = this.__self._buildModEventName(e);
        }

        if(isModJsEvent || this.hasMod('js', 'inited')) {
            this.__base(e = this._buildEvent(e), data);
            this._ctxEmit(e, data);
        }

        return this;
    },

    _ctxEmit : function(e, data) {
        this.__self.emit(e, data);
    },

    /**
     * Builds event
     * @private
     * @param {String|events:Event} e
     * @returns {events:Event}
     */
    _buildEvent : function(e) {
        typeof e === 'string'?
            e = new events.Event(e, this) :
            e.target || (e.target = this);

        return e;
    },

    /**
     * Checks whether a block or nested element has a modifier
     * @param {Object} [elem] Nested element
     * @param {String} modName Modifier name
     * @param {String|Boolean} [modVal] Modifier value. If defined and not of type String or Boolean, it is casted to String
     * @returns {Boolean}
     */
    hasMod : function(elem, modName, modVal) {
        var len = arguments.length,
            invert = false;

        if(len === 1) {
            modVal = '';
            modName = elem;
            elem = undef;
            invert = true;
        } else if(len === 2) {
            if(typeof elem === 'string') {
                modVal = modName;
                modName = elem;
                elem = undef;
            } else {
                modVal = '';
                invert = true;
            }
        }

        var typeModVal = typeof modVal;
        typeModVal === 'string' ||
            typeModVal === 'boolean' ||
            typeModVal === 'undefined' || (modVal = modVal.toString());

        var res = this.getMod(elem, modName) === modVal;
        return invert? !res : res;
    },

    /**
     * Returns the value of the modifier of the block/nested element
     * @param {Object} [elem] Nested element
     * @param {String} modName Modifier name
     * @returns {String} Modifier value
     */
    getMod : function(elem, modName) {
        var type = typeof elem;
        if(type === 'string' || type === 'undefined') { // elem either omitted or undefined
            modName = elem || modName;
            var modCache = this._modCache;
            return modName in modCache?
                modCache[modName] || '' :
                modCache[modName] = this._extractModVal(modName);
        }

        return this._getElemMod(modName, elem);
    },

    /**
     * Returns the value of the modifier of the nested element
     * @private
     * @param {String} modName Modifier name
     * @param {Object} elem Nested element
     * @param {Object} [elemName] Nested element name
     * @returns {String} Modifier value
     */
    _getElemMod : function(modName, elem, elemName) {
        return this._extractModVal(modName, elem, elemName);
    },

    /**
     * Returns values of modifiers of the block/nested element
     * @param {Object} [elem] Nested element
     * @param {String} [...modNames] Modifier names
     * @returns {Object} Hash of modifier values
     */
    getMods : function(elem) {
        var hasElem = elem && typeof elem !== 'string',
            modNames = [].slice.call(arguments, hasElem? 1 : 0),
            res = this._extractMods(modNames, hasElem? elem : undef);

        if(!hasElem) { // caching
            modNames.length?
                modNames.forEach(function(name) {
                    this._modCache[name] = res[name];
                }, this) :
                this._modCache = res;
        }

        return res;
    },

    /**
     * Sets the modifier for a block/nested element
     * @param {Object} [elem] Nested element
     * @param {String} modName Modifier name
     * @param {String|Boolean} [modVal=true] Modifier value. If not of type String or Boolean, it is casted to String
     * @returns {BEM} this
     */
    setMod : function(elem, modName, modVal) {
        if(typeof modVal === 'undefined') {
            if(typeof elem === 'string') { // if no elem
                modVal = typeof modName === 'undefined'?
                    true :  // e.g. setMod('focused')
                    modName; // e.g. setMod('js', 'inited')
                modName = elem;
                elem = undef;
            } else { // if elem
                modVal = true; // e.g. setMod(elem, 'focused')
            }
        }

        if(!elem || elem[0]) {
            if(modVal === false) {
                modVal = '';
            } else if(typeof modVal !== 'boolean') {
                modVal = modVal.toString();
            }

            var modId = (elem && elem[0]? identify(elem[0]) : '') + '_' + modName;

            if(this._processingMods[modId])
                return this;

            var elemName,
                curModVal = elem?
                    this._getElemMod(modName, elem, elemName = this.__self._extractElemNameFrom(elem)) :
                    this.getMod(modName);

            if(curModVal === modVal)
                return this;

            this._processingMods[modId] = true;

            var needSetMod = true,
                modFnParams = [modName, modVal, curModVal];

            elem && modFnParams.unshift(elem);

            var modVars = [['*', '*'], [modName, '*'], [modName, modVal]],
                prefixes = ['before', 'after'],
                i = 0, prefix, j, modVar;

            while(prefix = prefixes[i++]) {
                j = 0;
                while(modVar = modVars[j++]) {
                    if(this._callModFn(prefix, elemName, modVar[0], modVar[1], modFnParams) === false) {
                        needSetMod = false;
                        break;
                    }
                }

                if(!needSetMod) break;

                if(prefix === 'before') {
                    elem || (this._modCache[modName] = modVal); // cache only block mods
                    this._onSetMod(modName, modVal, curModVal, elem, elemName);
                }
            }

            this._processingMods[modId] = null;
            needSetMod && this._emitModChangeEvents(modName, modVal, curModVal, elem, elemName);
        }

        return this;
    },

    /**
     * Function after successfully changing the modifier of the block/nested element
     * @protected
     * @param {String} modName Modifier name
     * @param {String} modVal Modifier value
     * @param {String} oldModVal Old modifier value
     * @param {Object} [elem] Nested element
     * @param {String} [elemName] Element name
     */
    _onSetMod : function(modName, modVal, oldModVal, elem, elemName) {},

    _emitModChangeEvents : function(modName, modVal, oldModVal, elem, elemName) {
        var eventData = { modName : modName, modVal : modVal, oldModVal : oldModVal };
        elem && (eventData.elem = elem);
        this
            .emit({ modName : modName, modVal : '*', elem : elemName }, eventData)
            .emit({ modName : modName, modVal : modVal, elem : elemName }, eventData);
    },

    /**
     * Sets a modifier for a block/nested element, depending on conditions.
     * If the condition parameter is passed: when true, modVal1 is set; when false, modVal2 is set.
     * If the condition parameter is not passed: modVal1 is set if modVal2 was set, or vice versa.
     * @param {Object} [elem] Nested element
     * @param {String} modName Modifier name
     * @param {String} modVal1 First modifier value
     * @param {String} [modVal2] Second modifier value
     * @param {Boolean} [condition] Condition
     * @returns {BEM} this
     */
    toggleMod : function(elem, modName, modVal1, modVal2, condition) {
        if(typeof elem === 'string') { // if this is a block
            condition = modVal2;
            modVal2 = modVal1;
            modVal1 = modName;
            modName = elem;
            elem = undef;
        }

        if(typeof modVal1 === 'undefined') { // boolean mod
            modVal1 = true;
        }

        if(typeof modVal2 === 'undefined') {
            modVal2 = '';
        } else if(typeof modVal2 === 'boolean') {
            condition = modVal2;
            modVal2 = '';
        }

        var modVal = this.getMod(elem, modName);
        (modVal === modVal1 || modVal === modVal2) &&
            this.setMod(
                elem,
                modName,
                typeof condition === 'boolean'?
                    (condition? modVal1 : modVal2) :
                    this.hasMod(elem, modName, modVal1)? modVal2 : modVal1);

        return this;
    },

    /**
     * Removes a modifier from a block/nested element
     * @protected
     * @param {Object} [elem] Nested element
     * @param {String} modName Modifier name
     * @returns {BEM} this
     */
    delMod : function(elem, modName) {
        if(!modName) {
            modName = elem;
            elem = undef;
        }

        return this.setMod(elem, modName, '');
    },

    /**
     * Executes handlers for setting modifiers
     * @private
     * @param {String} prefix
     * @param {String} elemName Element name
     * @param {String} modName Modifier name
     * @param {String} modVal Modifier value
     * @param {Array} modFnParams Handler parameters
     */
    _callModFn : function(prefix, elemName, modName, modVal, modFnParams) {
        var modFnName = buildModFnName(prefix, modName, modVal, elemName);
        return this[modFnName]?
           this[modFnName].apply(this, modFnParams) :
           undef;
    },

    /**
     * Retrieves the value of the modifier
     * @private
     * @param {String} modName Modifier name
     * @param {Object} [elem] Element
     * @returns {String} Modifier value
     */
    _extractModVal : function(modName, elem) {
        return '';
    },

    /**
     * Retrieves name/value for a list of modifiers
     * @private
     * @param {Array} modNames Names of modifiers
     * @param {Object} [elem] Element
     * @returns {Object} Hash of modifier values by name
     */
    _extractMods : function(modNames, elem) {
        return {};
    },

    /**
     * Returns a block's default parameters
     * @protected
     * @returns {Object}
     */
    getDefaultParams : function() {
        return {};
    },

    /**
     * Deletes a block
     * @private
     */
    _destruct : function() {
        this.delMod('js');
    },

    /**
     * Executes given callback on next turn eventloop in block's context
     * @protected
     * @param {Function} fn callback
     * @returns {BEM} this
     */
    nextTick : function(fn) {
        var _this = this;
        nextTick(function() {
            _this.hasMod('js', 'inited') && fn.call(_this);
        });
        return this;
    }
}, /** @lends BEM */{

    _name : 'i-bem',

    /**
     * Storage for block declarations (hash by block name)
     * @type Object
     */
    blocks : blocks,

    /**
     * Declares blocks and creates a block class
     * @param {String|Object} decl Block name (simple syntax) or description
     * @param {String} decl.block|decl.name Block name
     * @param {String} [decl.baseBlock] Name of the parent block
     * @param {Array} [decl.baseMix] Mixed block names
     * @param {String} [decl.modName] Modifier name
     * @param {String|Array} [decl.modVal] Modifier value
     * @param {Object} [props] Methods
     * @param {Object} [staticProps] Static methods
     * @returns {Function}
     */
    decl : function(decl, props, staticProps) {
        // string as block
        typeof decl === 'string' && (decl = { block : decl });
        // inherit from itself
        if(arguments.length <= 2 &&
                typeof decl === 'object' &&
                (!decl || (typeof decl.block !== 'string' && typeof decl.modName !== 'string'))) {
            staticProps = props;
            props = decl;
            decl = {};
        }
        typeof decl.block === 'undefined' && (decl.block = this.getName());

        var baseBlock;
        if(typeof decl.baseBlock === 'undefined') {
            baseBlock = blocks[decl.block] || this;
        } else if(typeof decl.baseBlock === 'string') {
            baseBlock = blocks[decl.baseBlock];
            if(!baseBlock)
                throw('baseBlock "' + decl.baseBlock + '" for "' + decl.block + '" is undefined');
        } else {
            baseBlock = decl.baseBlock;
        }

        convertModHandlersToMethods(props || (props = {}));

        if(decl.modName) {
            var checkMod = buildCheckMod(decl.modName, decl.modVal);
            objects.each(props, function(prop, name) {
                functions.isFunction(prop) &&
                    (props[name] = function() {
                        var method;
                        if(checkMod(this)) {
                            method = prop;
                        } else {
                            var baseMethod = baseBlock.prototype[name];
                            baseMethod && baseMethod !== prop &&
                                (method = this.__base);
                        }
                        return method?
                            method.apply(this, arguments) :
                            undef;
                    });
            });
        }

        if(staticProps && typeof staticProps.live === 'boolean') {
            var live = staticProps.live;
            staticProps.live = function() {
                return live;
            };
        }

        var block, baseBlocks = baseBlock;
        if(decl.baseMix) {
            baseBlocks = [baseBlocks];
            decl.baseMix.forEach(function(mixedBlock) {
                if(!blocks[mixedBlock]) {
                    throw('mix block "' + mixedBlock + '" for "' + decl.block + '" is undefined');
                }
                baseBlocks.push(blocks[mixedBlock]);
            });
        }

        if(decl.block === baseBlock.getName()) {
            // makes a new "live" if the old one was already executed
            (block = inherit.self(baseBlocks, props, staticProps))._processLive(true);
        } else {
            (block = blocks[decl.block] = inherit(baseBlocks, props, staticProps))._name = decl.block;
            delete block._liveInitable;
        }

        return block;
    },

    declMix : function(block, props, staticProps) {
        convertModHandlersToMethods(props || (props = {}));
        return blocks[block] = inherit(props, staticProps);
    },

    /**
     * Processes a block's live properties
     * @private
     * @param {Boolean} [heedLive=false] Whether to take into account that the block already processed its live properties
     * @returns {Boolean} Whether the block is a live block
     */
    _processLive : function(heedLive) {
        return false;
    },

    /**
     * Factory method for creating an instance of the block named
     * @param {String|Object} block Block name or description
     * @param {Object} [params] Block parameters
     * @returns {BEM}
     */
    create : function(block, params) {
        typeof block === 'string' && (block = { block : block });

        return new blocks[block.block](block.mods, params);
    },

    /**
     * Returns the name of the current block
     * @returns {String}
     */
    getName : function() {
        return this._name;
    },

    /**
     * Adds an event handler
     * @param {String|Object} e Event type
     * @param {Object} [data] Additional data that the handler gets as e.data
     * @param {Function} fn Handler
     * @param {Object} [ctx] Handler context
     * @returns {Function} this
     */
    on : function(e, data, fn, ctx) {
        if(typeof e === 'object' && (functions.isFunction(data) || functions.isFunction(fn))) { // mod change event
            e = this._buildModEventName(e);
        }

        return this.__base.apply(this, arguments);
    },

    /**
     * Removes event handler or handlers
     * @param {String|Object} [e] Event type
     * @param {Function} [fn] Handler
     * @param {Object} [ctx] Handler context
     * @returns {Function} this
     */
    un : function(e, fn, ctx) {
        if(typeof e === 'object' && functions.isFunction(fn)) { // mod change event
            e = this._buildModEventName(e);
        }

        return this.__base.apply(this, arguments);
    },

    _buildModEventName : function(modEvent) {
        var res = MOD_DELIM + modEvent.modName + MOD_DELIM + (modEvent.modVal === false? '' : modEvent.modVal);
        modEvent.elem && (res = ELEM_DELIM + modEvent.elem + res);
        return res;
    },

    /**
     * Retrieves the name of an element nested in a block
     * @private
     * @param {Object} elem Nested element
     * @returns {String|undefined}
     */
    _extractElemNameFrom : function(elem) {},

    /**
     * Executes the block init functions
     * @private
     */
    _runInitFns : function() {
        if(initFns.length) {
            var fns = initFns,
                fn, i = 0;

            initFns = [];
            while(fn = fns[i]) {
                fn.call(fns[i + 1]);
                i += 2;
            }
        }
    }
});

provide(BEM);

});

/* ../../libs/bem-core/common.blocks/i-bem/i-bem.vanilla.js end */
;
/* ../../libs/bem-core/common.blocks/i-bem/__internal/i-bem__internal.vanilla.js begin */
/**
 * @module i-bem__internal
 */

modules.define('i-bem__internal', function(provide) {

var undef,
    /**
     * Separator for modifiers and their values
     * @const
     * @type String
     */
    MOD_DELIM = '_',

    /**
     * Separator between names of a block and a nested element
     * @const
     * @type String
     */
    ELEM_DELIM = '__',

    /**
     * Pattern for acceptable element and modifier names
     * @const
     * @type String
     */
    NAME_PATTERN = '[a-zA-Z0-9-]+';

function isSimple(obj) {
    var typeOf = typeof obj;
    return typeOf === 'string' || typeOf === 'number' || typeOf === 'boolean';
}

function buildModPostfix(modName, modVal) {
    var res = '';
    /* jshint eqnull: true */
    if(modVal != null && modVal !== false) {
        res += MOD_DELIM + modName;
        modVal !== true && (res += MOD_DELIM + modVal);
    }
    return res;
}

function buildBlockClass(name, modName, modVal) {
    return name + buildModPostfix(modName, modVal);
}

function buildElemClass(block, name, modName, modVal) {
    return buildBlockClass(block, undef, undef) +
        ELEM_DELIM + name +
        buildModPostfix(modName, modVal);
}

provide(/** @exports */{
    NAME_PATTERN : NAME_PATTERN,

    MOD_DELIM : MOD_DELIM,
    ELEM_DELIM : ELEM_DELIM,

    buildModPostfix : buildModPostfix,

    /**
     * Builds the class of a block or element with a modifier
     * @param {String} block Block name
     * @param {String} [elem] Element name
     * @param {String} [modName] Modifier name
     * @param {String|Number} [modVal] Modifier value
     * @returns {String} Class
     */
    buildClass : function(block, elem, modName, modVal) {
        if(isSimple(modName)) {
            if(!isSimple(modVal)) {
                modVal = modName;
                modName = elem;
                elem = undef;
            }
        } else if(typeof modName !== 'undefined') {
            modName = undef;
        } else if(elem && typeof elem !== 'string') {
            elem = undef;
        }

        if(!(elem || modName)) { // optimization for simple case
            return block;
        }

        return elem?
            buildElemClass(block, elem, modName, modVal) :
            buildBlockClass(block, modName, modVal);
    },

    /**
     * Builds full classes for a buffer or element with modifiers
     * @param {String} block Block name
     * @param {String} [elem] Element name
     * @param {Object} [mods] Modifiers
     * @returns {String} Class
     */
    buildClasses : function(block, elem, mods) {
        if(elem && typeof elem !== 'string') {
            mods = elem;
            elem = undef;
        }

        var res = elem?
            buildElemClass(block, elem, undef, undef) :
            buildBlockClass(block, undef, undef);

        if(mods) {
            for(var modName in mods) {
                if(mods.hasOwnProperty(modName) && mods[modName]) {
                    res += ' ' + (elem?
                        buildElemClass(block, elem, modName, mods[modName]) :
                        buildBlockClass(block, modName, mods[modName]));
                }
            }
        }

        return res;
    }
});

});

/* ../../libs/bem-core/common.blocks/i-bem/__internal/i-bem__internal.vanilla.js end */
;
/* ../../libs/bem-core/common.blocks/inherit/inherit.vanilla.js begin */
/**
 * @module inherit
 * @version 2.2.1
 * @author Filatov Dmitry <dfilatov@yandex-team.ru>
 * @description This module provides some syntax sugar for "class" declarations, constructors, mixins, "super" calls and static members.
 */

(function(global) {

var hasIntrospection = (function(){'_';}).toString().indexOf('_') > -1,
    emptyBase = function() {},
    hasOwnProperty = Object.prototype.hasOwnProperty,
    objCreate = Object.create || function(ptp) {
        var inheritance = function() {};
        inheritance.prototype = ptp;
        return new inheritance();
    },
    objKeys = Object.keys || function(obj) {
        var res = [];
        for(var i in obj) {
            hasOwnProperty.call(obj, i) && res.push(i);
        }
        return res;
    },
    extend = function(o1, o2) {
        for(var i in o2) {
            hasOwnProperty.call(o2, i) && (o1[i] = o2[i]);
        }

        return o1;
    },
    toStr = Object.prototype.toString,
    isArray = Array.isArray || function(obj) {
        return toStr.call(obj) === '[object Array]';
    },
    isFunction = function(obj) {
        return toStr.call(obj) === '[object Function]';
    },
    noOp = function() {},
    needCheckProps = true,
    testPropObj = { toString : '' };

for(var i in testPropObj) { // fucking ie hasn't toString, valueOf in for
    testPropObj.hasOwnProperty(i) && (needCheckProps = false);
}

var specProps = needCheckProps? ['toString', 'valueOf'] : null;

function getPropList(obj) {
    var res = objKeys(obj);
    if(needCheckProps) {
        var specProp, i = 0;
        while(specProp = specProps[i++]) {
            obj.hasOwnProperty(specProp) && res.push(specProp);
        }
    }

    return res;
}

function override(base, res, add) {
    var addList = getPropList(add),
        j = 0, len = addList.length,
        name, prop;
    while(j < len) {
        if((name = addList[j++]) === '__self') {
            continue;
        }
        prop = add[name];
        if(isFunction(prop) &&
                (!hasIntrospection || prop.toString().indexOf('.__base') > -1)) {
            res[name] = (function(name, prop) {
                var baseMethod = base[name]?
                        base[name] :
                        name === '__constructor'? // case of inheritance from plane function
                            res.__self.__parent :
                            noOp;
                return function() {
                    var baseSaved = this.__base;
                    this.__base = baseMethod;
                    var res = prop.apply(this, arguments);
                    this.__base = baseSaved;
                    return res;
                };
            })(name, prop);
        } else {
            res[name] = prop;
        }
    }
}

function applyMixins(mixins, res) {
    var i = 1, mixin;
    while(mixin = mixins[i++]) {
        res?
            isFunction(mixin)?
                inherit.self(res, mixin.prototype, mixin) :
                inherit.self(res, mixin) :
            res = isFunction(mixin)?
                inherit(mixins[0], mixin.prototype, mixin) :
                inherit(mixins[0], mixin);
    }
    return res || mixins[0];
}

/**
* Creates class
* @exports
* @param {Function|Array} [baseClass|baseClassAndMixins] class (or class and mixins) to inherit from
* @param {Object} prototypeFields
* @param {Object} [staticFields]
* @returns {Function} class
*/
function inherit() {
    var args = arguments,
        withMixins = isArray(args[0]),
        hasBase = withMixins || isFunction(args[0]),
        base = hasBase? withMixins? applyMixins(args[0]) : args[0] : emptyBase,
        props = args[hasBase? 1 : 0] || {},
        staticProps = args[hasBase? 2 : 1],
        res = props.__constructor || (hasBase && base.prototype.__constructor)?
            function() {
                return this.__constructor.apply(this, arguments);
            } :
            hasBase?
                function() {
                    return base.apply(this, arguments);
                } :
                function() {};

    if(!hasBase) {
        res.prototype = props;
        res.prototype.__self = res.prototype.constructor = res;
        return extend(res, staticProps);
    }

    extend(res, base);

    res.__parent = base;

    var basePtp = base.prototype,
        resPtp = res.prototype = objCreate(basePtp);

    resPtp.__self = resPtp.constructor = res;

    props && override(basePtp, resPtp, props);
    staticProps && override(base, res, staticProps);

    return res;
}

inherit.self = function() {
    var args = arguments,
        withMixins = isArray(args[0]),
        base = withMixins? applyMixins(args[0], args[0][0]) : args[0],
        props = args[1],
        staticProps = args[2],
        basePtp = base.prototype;

    props && override(basePtp, basePtp, props);
    staticProps && override(base, base, staticProps);

    return base;
};

var defineAsGlobal = true;
if(typeof exports === 'object') {
    module.exports = inherit;
    defineAsGlobal = false;
}

if(typeof modules === 'object') {
    modules.define('inherit', function(provide) {
        provide(inherit);
    });
    defineAsGlobal = false;
}

if(typeof define === 'function') {
    define(function(require, exports, module) {
        module.exports = inherit;
    });
    defineAsGlobal = false;
}

defineAsGlobal && (global.inherit = inherit);

})(this);

/* ../../libs/bem-core/common.blocks/inherit/inherit.vanilla.js end */
;
/* ../../libs/bem-core/common.blocks/identify/identify.vanilla.js begin */
/**
 * @module identify
 */

modules.define('identify', function(provide) {

var counter = 0,
    expando = '__' + (+new Date),
    get = function() {
        return 'uniq' + (++counter);
    };

provide(
    /**
     * Makes unique ID
     * @exports
     * @param {Object} obj Object that needs to be identified
     * @param {Boolean} [onlyGet=false] Return a unique value only if it had already been assigned before
     * @returns {String} ID
     */
    function(obj, onlyGet) {
        if(!obj) return get();

        var key = 'uniqueID' in obj? 'uniqueID' : expando; // Use when possible native uniqueID for elements in IE

        return onlyGet || key in obj?
            obj[key] :
            obj[key] = get();
    }
);

});

/* ../../libs/bem-core/common.blocks/identify/identify.vanilla.js end */
;
/* ../../libs/bem-core/common.blocks/next-tick/next-tick.vanilla.js begin */
/**
 * @module next-tick
 */

modules.define('next-tick', function(provide) {

/**
 * Executes given function on next tick.
 * @exports
 * @type Function
 * @param {Function} fn
 */

var global = this.global,
    fns = [],
    enqueueFn = function(fn) {
        return fns.push(fn) === 1;
    },
    callFns = function() {
        var fnsToCall = fns, i = 0, len = fns.length;
        fns = [];
        while(i < len) {
            fnsToCall[i++]();
        }
    };

    /* global process */
    if(typeof process === 'object' && process.nextTick) { // nodejs
        return provide(function(fn) {
            enqueueFn(fn) && process.nextTick(callFns);
        });
    }

    if(global.setImmediate) { // ie10
        return provide(function(fn) {
            enqueueFn(fn) && global.setImmediate(callFns);
        });
    }

    if(global.postMessage) { // modern browsers
        var isPostMessageAsync = true;
        if(global.attachEvent) {
            var checkAsync = function() {
                    isPostMessageAsync = false;
                };
            global.attachEvent('onmessage', checkAsync);
            global.postMessage('__checkAsync', '*');
            global.detachEvent('onmessage', checkAsync);
        }

        if(isPostMessageAsync) {
            var msg = '__nextTick' + (+new Date),
                onMessage = function(e) {
                    if(e.data === msg) {
                        e.stopPropagation && e.stopPropagation();
                        callFns();
                    }
                };

            global.addEventListener?
                global.addEventListener('message', onMessage, true) :
                global.attachEvent('onmessage', onMessage);

            return provide(function(fn) {
                enqueueFn(fn) && global.postMessage(msg, '*');
            });
        }
    }

    var doc = global.document;
    if('onreadystatechange' in doc.createElement('script')) { // ie6-ie8
        var head = doc.getElementsByTagName('head')[0],
            createScript = function() {
                var script = doc.createElement('script');
                script.onreadystatechange = function() {
                    script.parentNode.removeChild(script);
                    script = script.onreadystatechange = null;
                    callFns();
                };
                head.appendChild(script);
            };

        return provide(function(fn) {
            enqueueFn(fn) && createScript();
        });
    }

    provide(function(fn) { // old browsers
        enqueueFn(fn) && global.setTimeout(callFns, 0);
    });
});

/* ../../libs/bem-core/common.blocks/next-tick/next-tick.vanilla.js end */
;
/* ../../libs/bem-core/common.blocks/objects/objects.vanilla.js begin */
/**
 * @module objects
 * @description A set of helpers to work with JavaScript objects
 */

modules.define('objects', function(provide) {

var hasOwnProp = Object.prototype.hasOwnProperty;

provide(/** @exports */{
    /**
     * Extends a given target by
     * @param {Object} target object to extend
     * @param {Object} source
     * @returns {Object}
     */
    extend : function(target, source) {
        (typeof target !== 'object' || target === null) && (target = {});

        for(var i = 1, len = arguments.length; i < len; i++) {
            var obj = arguments[i];
            if(obj) {
                for(var key in obj) {
                    hasOwnProp.call(obj, key) && (target[key] = obj[key]);
                }
            }
        }

        return target;
    },

    /**
     * Check whether a given object is empty (contains no enumerable properties)
     * @param {Object} obj
     * @returns {Boolean}
     */
    isEmpty : function(obj) {
        for(var key in obj) {
            if(hasOwnProp.call(obj, key)) {
                return false;
            }
        }

        return true;
    },

    /**
     * Generic iterator function over object
     * @param {Object} obj object to iterate
     * @param {Function} fn callback
     * @param {Object} [ctx] callbacks's context
     */
    each : function(obj, fn, ctx) {
        for(var key in obj) {
            if(hasOwnProp.call(obj, key)) {
                ctx? fn.call(ctx, obj[key], key) : fn(obj[key], key);
            }
        }
    }
});

});

/* ../../libs/bem-core/common.blocks/objects/objects.vanilla.js end */
;
/* ../../libs/bem-core/common.blocks/functions/functions.vanilla.js begin */
/**
 * @module functions
 * @description A set of helpers to work with JavaScript functions
 */

modules.define('functions', function(provide) {

var toStr = Object.prototype.toString;

provide(/** @exports */{
    /**
     * Checks whether a given object is function
     * @param {*} obj
     * @returns {Boolean}
     */
    isFunction : function(obj) {
        return toStr.call(obj) === '[object Function]';
    },

    /**
     * Empty function
     */
    noop : function() {}
});

});

/* ../../libs/bem-core/common.blocks/functions/functions.vanilla.js end */
;
/* ../../libs/bem-core/common.blocks/events/events.vanilla.js begin */
/**
 * @module events
 */

modules.define(
    'events',
    ['identify', 'inherit', 'functions'],
    function(provide, identify, inherit, functions) {

var undef,
    storageExpando = '__' + (+new Date) + 'storage',
    getFnId = function(fn, ctx) {
        return identify(fn) + (ctx? identify(ctx) : '');
    },

    /**
     * @class Event
     * @exports events:Event
     */
    Event = inherit(/** @lends Event.prototype */{
        /**
         * @constructor
         * @param {String} type
         * @param {Object} target
         */
        __constructor : function(type, target) {
            /**
             * Type
             * @member {String} Event
             */
            this.type = type;

            /**
             * Target
             * @member {String} Event
             */
            this.target = target;

            /**
             * Result
             * @member {*}
             */
            this.result = undef;

            /**
             * Data
             * @member {*}
             */
            this.data = undef;

            this._isDefaultPrevented = false;
            this._isPropagationStopped = false;
        },

        /**
         * Prevents default action
         */
        preventDefault : function() {
            this._isDefaultPrevented = true;
        },

        /**
         * Returns whether is default action prevented
         * @returns {Boolean}
         */
        isDefaultPrevented : function() {
            return this._isDefaultPrevented;
        },

        /**
         * Stops propagation
         */
        stopPropagation : function() {
            this._isPropagationStopped = true;
        },

        /**
         * Returns whether is propagation stopped
         * @returns {Boolean}
         */
        isPropagationStopped : function() {
            return this._isPropagationStopped;
        }
    }),

    /**
     * @lends Emitter
     * @lends Emitter.prototype
     */
    EmitterProps = {
        /**
         * Adds an event handler
         * @param {String} e Event type
         * @param {Object} [data] Additional data that the handler gets as e.data
         * @param {Function} fn Handler
         * @param {Object} [ctx] Handler context
         * @returns {Emitter} this
         */
        on : function(e, data, fn, ctx, _special) {
            if(typeof e === 'string') {
                if(functions.isFunction(data)) {
                    ctx = fn;
                    fn = data;
                    data = undef;
                }

                var id = getFnId(fn, ctx),
                    storage = this[storageExpando] || (this[storageExpando] = {}),
                    eventTypes = e.split(' '), eventType,
                    i = 0, list, item,
                    eventStorage;

                while(eventType = eventTypes[i++]) {
                    eventStorage = storage[eventType] || (storage[eventType] = { ids : {}, list : {} });
                    if(!(id in eventStorage.ids)) {
                        list = eventStorage.list;
                        item = { fn : fn, data : data, ctx : ctx, special : _special };
                        if(list.last) {
                            list.last.next = item;
                            item.prev = list.last;
                        } else {
                            list.first = item;
                        }
                        eventStorage.ids[id] = list.last = item;
                    }
                }
            } else {
                for(var key in e) {
                    e.hasOwnProperty(key) && this.on(key, e[key], data, _special);
                }
            }

            return this;
        },

        /**
         * Adds a one time handler for the event.
         * Handler is executed only the next time the event is fired, after which it is removed.
         * @param {String} e Event type
         * @param {Object} [data] Additional data that the handler gets as e.data
         * @param {Function} fn Handler
         * @param {Object} [ctx] Handler context
         * @returns {Emitter} this
         */
        once : function(e, data, fn, ctx) {
            return this.on(e, data, fn, ctx, { once : true });
        },

        /**
         * Removes event handler or handlers
         * @param {String} [e] Event type
         * @param {Function} [fn] Handler
         * @param {Object} [ctx] Handler context
         * @returns {Emitter} this
         */
        un : function(e, fn, ctx) {
            if(typeof e === 'string' || typeof e === 'undefined') {
                var storage = this[storageExpando];
                if(storage) {
                    if(e) { // if event type was passed
                        var eventTypes = e.split(' '),
                            i = 0, eventStorage;
                        while(e = eventTypes[i++]) {
                            if(eventStorage = storage[e]) {
                                if(fn) {  // if specific handler was passed
                                    var id = getFnId(fn, ctx),
                                        ids = eventStorage.ids;
                                    if(id in ids) {
                                        var list = eventStorage.list,
                                            item = ids[id],
                                            prev = item.prev,
                                            next = item.next;

                                        if(prev) {
                                            prev.next = next;
                                        } else if(item === list.first) {
                                            list.first = next;
                                        }

                                        if(next) {
                                            next.prev = prev;
                                        } else if(item === list.last) {
                                            list.last = prev;
                                        }

                                        delete ids[id];
                                    }
                                } else {
                                    delete this[storageExpando][e];
                                }
                            }
                        }
                    } else {
                        delete this[storageExpando];
                    }
                }
            } else {
                for(var key in e) {
                    e.hasOwnProperty(key) && this.un(key, e[key], fn);
                }
            }

            return this;
        },

        /**
         * Fires event handlers
         * @param {String|events:Event} e Event
         * @param {Object} [data] Additional data
         * @returns {Emitter} this
         */
        emit : function(e, data) {
            var storage = this[storageExpando],
                eventInstantiated = false;

            if(storage) {
                var eventTypes = [typeof e === 'string'? e : e.type, '*'],
                    i = 0, eventType, eventStorage;
                while(eventType = eventTypes[i++]) {
                    if(eventStorage = storage[eventType]) {
                        var item = eventStorage.list.first,
                            lastItem = eventStorage.list.last,
                            res;
                        while(item) {
                            if(!eventInstantiated) { // instantiate Event only on demand
                                eventInstantiated = true;
                                typeof e === 'string' && (e = new Event(e));
                                e.target || (e.target = this);
                            }

                            e.data = item.data;
                            res = item.fn.apply(item.ctx || this, arguments);
                            if(typeof res !== 'undefined') {
                                e.result = res;
                                if(res === false) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }
                            }

                            item.special && item.special.once &&
                                this.un(e.type, item.fn, item.ctx);

                            if(item === lastItem) {
                                break;
                            }

                            item = item.next;
                        }
                    }
                }
            }

            return this;
        }
    },
    /**
     * @class Emitter
     * @exports events:Emitter
     */
    Emitter = inherit(
        EmitterProps,
        EmitterProps);

provide({
    Emitter : Emitter,
    Event : Event
});

});

/* ../../libs/bem-core/common.blocks/events/events.vanilla.js end */
;
/* ../../libs/bem-core/common.blocks/i-bem/__dom/i-bem__dom.js begin */
/**
 * @module i-bem__dom
 */

modules.define(
    'i-bem__dom',
    ['i-bem', 'i-bem__internal', 'identify', 'objects', 'functions', 'jquery', 'dom'],
    function(provide, BEM, INTERNAL, identify, objects, functions, $, dom) {

var undef,
    win = $(window),
    doc = $(document),

    /**
     * Storage for DOM elements by unique key
     * @type Object
     */
    uniqIdToDomElems = {},

    /**
     * Storage for blocks by unique key
     * @type Object
     */
    uniqIdToBlock = {},

    /**
     * Storage for DOM element's parent nodes
     * @type Object
     */
    domNodesToParents = {},

    /**
     * Storage for block parameters
     * @type Object
     */
    domElemToParams = {},

    /**
     * Storage for liveCtx event handlers
     * @type Object
     */
    liveEventCtxStorage = {},

    /**
     * Storage for liveClass event handlers
     * @type Object
     */
    liveClassEventStorage = {},

    blocks = BEM.blocks,

    BEM_CLASS = 'i-bem',
    BEM_SELECTOR = '.' + BEM_CLASS,
    BEM_PARAMS_ATTR = 'data-bem',

    NAME_PATTERN = INTERNAL.NAME_PATTERN,

    MOD_DELIM = INTERNAL.MOD_DELIM,
    ELEM_DELIM = INTERNAL.ELEM_DELIM,

    EXTRACT_MODS_RE = RegExp(
        '[^' + MOD_DELIM + ']' + MOD_DELIM + '(' + NAME_PATTERN + ')' +
        '(?:' + MOD_DELIM + '(' + NAME_PATTERN + '))?$'),

    buildModPostfix = INTERNAL.buildModPostfix,
    buildClass = INTERNAL.buildClass,

    reverse = Array.prototype.reverse;

/**
 * Initializes blocks on a DOM element
 * @param {jQuery} domElem DOM element
 * @param {String} uniqInitId ID of the "initialization wave"
 */
function initBlocks(domElem, uniqInitId) {
    var domNode = domElem[0],
        params = getParams(domNode),
        blockName;

    for(blockName in params)
        initBlock(
            blockName,
            domElem,
            processParams(params[blockName], blockName, uniqInitId));
}

/**
 * Initializes a specific block on a DOM element, or returns the existing block if it was already created
 * @param {String} blockName Block name
 * @param {jQuery} domElem DOM element
 * @param {Object} [params] Initialization parameters
 * @param {Boolean} [forceLive=false] Force live initialization
 * @param {Function} [callback] Handler to call after complete initialization
 */
function initBlock(blockName, domElem, params, forceLive, callback) {
    var domNode = domElem[0];

    params || (params = processParams(getBlockParams(domNode, blockName), blockName));

    var uniqId = params.uniqId,
        block = uniqIdToBlock[uniqId];

    if(block) {
        if(block.domElem.index(domNode) < 0) {
            block.domElem = block.domElem.add(domElem);
            objects.extend(block.params, params);
        }

        return block;
    }

    uniqIdToDomElems[uniqId] = uniqIdToDomElems[uniqId]?
        uniqIdToDomElems[uniqId].add(domElem) :
        domElem;

    var parentDomNode = domNode.parentNode;
    if(!parentDomNode || parentDomNode.nodeType === 11) { // jquery doesn't unique disconnected node
        $.unique(uniqIdToDomElems[uniqId]);
    }

    var blockClass = blocks[blockName] || DOM.decl(blockName, {}, { live : true }, true);
    if(!(blockClass._liveInitable = !!blockClass._processLive()) || forceLive || params.live === false) {
        forceLive && domElem.addClass(BEM_CLASS); // add css class for preventing memory leaks in further destructing

        block = new blockClass(uniqIdToDomElems[uniqId], params, !!forceLive);

        delete uniqIdToDomElems[uniqId];
        callback && callback.apply(block, Array.prototype.slice.call(arguments, 4));
        return block;
    }
}

/**
 * Processes and adds necessary block parameters
 * @param {Object} params Initialization parameters
 * @param {String} blockName Block name
 * @param {String} [uniqInitId] ID of the "initialization wave"
 */
function processParams(params, blockName, uniqInitId) {
    params.uniqId ||
        (params.uniqId = (params.id?
            blockName + '-id-' + params.id :
            identify()) + (uniqInitId || identify()));

    return params;
}

/**
 * Helper for searching for a DOM element using a selector inside the context, including the context itself
 * @param {jQuery} ctx Context
 * @param {String} selector CSS selector
 * @param {Boolean} [excludeSelf=false] Exclude context from search
 * @returns {jQuery}
 */
function findDomElem(ctx, selector, excludeSelf) {
    var res = ctx.find(selector);
    return excludeSelf?
       res :
       res.add(ctx.filter(selector));
}

/**
 * Returns parameters of a block's DOM element
 * @param {HTMLElement} domNode DOM node
 * @returns {Object}
 */
function getParams(domNode, blockName) {
    var uniqId = identify(domNode);
    return domElemToParams[uniqId] ||
        (domElemToParams[uniqId] = extractParams(domNode));
}

/**
 * Returns parameters of a block extracted from DOM node
 * @param {HTMLElement} domNode DOM node
 * @param {String} blockName
 * @returns {Object}
 */

function getBlockParams(domNode, blockName) {
    var params = getParams(domNode);
    return params[blockName] || (params[blockName] = {});
}

/**
 * Retrieves block parameters from a DOM element
 * @param {HTMLElement} domNode DOM node
 * @returns {Object}
 */
function extractParams(domNode) {
    var attrVal = domNode.getAttribute(BEM_PARAMS_ATTR);
    return attrVal? JSON.parse(attrVal) : {};
}

/**
 * Uncouple DOM node from the block. If this is the last node, then destroys the block.
 * @param {BEMDOM} block block
 * @param {HTMLElement} domNode DOM node
 */
function removeDomNodeFromBlock(block, domNode) {
    block.domElem.length === 1?
        block._destruct() :
        block.domElem = block.domElem.not(domNode);
}

/**
 * Fills DOM node's parent nodes to the storage
 * @param {jQuery} domElem
 */
function storeDomNodeParents(domElem) {
    domElem.each(function() {
        domNodesToParents[identify(this)] = this.parentNode;
    });
}

/**
 * Returns jQuery collection for provided HTML
 * @param {jQuery|String} html
 * @returns {jQuery}
 */
function getJqueryCollection(html) {
    return $(typeof html === 'string'? $.parseHTML(html, null, true) : html);
}

var DOM;

$(function() {

/**
 * @class BEMDOM
 * @description Base block for creating BEM blocks that have DOM representation
 * @exports
 */

DOM = BEM.decl('i-bem__dom',/** @lends BEMDOM.prototype */{
    /**
     * @constructor
     * @private
     * @param {jQuery} domElem DOM element that the block is created on
     * @param {Object} params Block parameters
     * @param {Boolean} [initImmediately=true]
     */
    __constructor : function(domElem, params, initImmediately) {
        /**
         * DOM elements of block
         * @member {jQuery}
         * @readonly
         */
        this.domElem = domElem;

        /**
         * Cache for names of events on DOM elements
         * @member {Object}
         * @private
         */
        this._eventNameCache = {};

        /**
         * Cache for elements
         * @member {Object}
         * @private
         */
        this._elemCache = {};

        /**
         * @member {String} Unique block ID
         * @private
         */
        this._uniqId = params.uniqId;

        uniqIdToBlock[this._uniqId] = this;

        /**
         * @member {Boolean} Flag for whether it's necessary to unbind from the document and window when destroying the block
         * @private
         */
        this._needSpecialUnbind = false;

        this.__base(null, params, initImmediately);
    },

    /**
     * Finds blocks inside the current block or its elements (including context)
     * @param {String|jQuery} [elem] Block element
     * @param {String|Object} block Name or description (block,modName,modVal) of the block to find
     * @returns {BEMDOM[]}
     */
    findBlocksInside : function(elem, block) {
        return this._findBlocks('find', elem, block);
    },

    /**
     * Finds the first block inside the current block or its elements (including context)
     * @param {String|jQuery} [elem] Block element
     * @param {String|Object} block Name or description (block,modName,modVal) of the block to find
     * @returns {BEMDOM}
     */
    findBlockInside : function(elem, block) {
        return this._findBlocks('find', elem, block, true);
    },

    /**
     * Finds blocks outside the current block or its elements (including context)
     * @param {String|jQuery} [elem] Block element
     * @param {String|Object} block Name or description (block,modName,modVal) of the block to find
     * @returns {BEMDOM[]}
     */
    findBlocksOutside : function(elem, block) {
        return this._findBlocks('parents', elem, block);
    },

    /**
     * Finds the first block outside the current block or its elements (including context)
     * @param {String|jQuery} [elem] Block element
     * @param {String|Object} block Name or description (block,modName,modVal) of the block to find
     * @returns {BEMDOM}
     */
    findBlockOutside : function(elem, block) {
        return this._findBlocks('closest', elem, block)[0] || null;
    },

    /**
     * Finds blocks on DOM elements of the current block or its elements
     * @param {String|jQuery} [elem] Block element
     * @param {String|Object} block Name or description (block,modName,modVal) of the block to find
     * @returns {BEMDOM[]}
     */
    findBlocksOn : function(elem, block) {
        return this._findBlocks('', elem, block);
    },

    /**
     * Finds the first block on DOM elements of the current block or its elements
     * @param {String|jQuery} [elem] Block element
     * @param {String|Object} block Name or description (block,modName,modVal) of the block to find
     * @returns {BEMDOM}
     */
    findBlockOn : function(elem, block) {
        return this._findBlocks('', elem, block, true);
    },

    _findBlocks : function(select, elem, block, onlyFirst) {
        if(!block) {
            block = elem;
            elem = undef;
        }

        var ctxElem = elem?
                (typeof elem === 'string'? this.findElem(elem) : elem) :
                this.domElem,
            isSimpleBlock = typeof block === 'string',
            blockName = isSimpleBlock? block : (block.block || block.blockName),
            selector = '.' +
                (isSimpleBlock?
                    buildClass(blockName) :
                    buildClass(blockName, block.modName, block.modVal)) +
                (onlyFirst? ':first' : ''),
            domElems = ctxElem.filter(selector);

        select && (domElems = domElems.add(ctxElem[select](selector)));

        if(onlyFirst) {
            return domElems[0]? initBlock(blockName, domElems.eq(0), undef, true)._init() : null;
        }

        var res = [],
            uniqIds = {};

        domElems.each(function(i, domElem) {
            var block = initBlock(blockName, $(domElem), undef, true)._init();
            if(!uniqIds[block._uniqId]) {
                uniqIds[block._uniqId] = true;
                res.push(block);
            }
        });

        return res;
    },

    /**
     * Adds an event handler for any DOM element
     * @protected
     * @param {jQuery} domElem DOM element where the event will be listened for
     * @param {String|Object} event Event name or event object
     * @param {Object} [data] Additional event data
     * @param {Function} fn Handler function, which will be executed in the block's context
     * @returns {BEMDOM} this
     */
    bindToDomElem : function(domElem, event, data, fn) {
        if(functions.isFunction(data)) {
            fn = data;
            data = undef;
        }

        fn?
            domElem.bind(
                this._buildEventName(event),
                data,
                $.proxy(fn, this)) :
            objects.each(event, function(fn, event) {
                this.bindToDomElem(domElem, event, data, fn);
            }, this);

        return this;
    },

    /**
     * Adds an event handler to the document
     * @protected
     * @param {String|Object} event Event name or event object
     * @param {Object} [data] Additional event data
     * @param {Function} fn Handler function, which will be executed in the block's context
     * @returns {BEMDOM} this
     */
    bindToDoc : function(event, data, fn) {
        this._needSpecialUnbind = true;
        return this.bindToDomElem(doc, event, data, fn);
    },

    /**
     * Adds an event handler to the window
     * @protected
     * @param {String|Object} event Event name or event object
     * @param {Object} [data] Additional event data
     * @param {Function} fn Handler function, which will be executed in the block's context
     * @returns {BEMDOM} this
     */
    bindToWin : function(event, data, fn) {
        this._needSpecialUnbind = true;
        return this.bindToDomElem(win, event, data, fn);
    },

    /**
     * Adds an event handler to the block's main DOM elements or its nested elements
     * @protected
     * @param {jQuery|String} [elem] Element
     * @param {String|Object} event Event name or event object
     * @param {Object} [data] Additional event data
     * @param {Function} fn Handler function, which will be executed in the block's context
     * @returns {BEMDOM} this
     */
    bindTo : function(elem, event, data, fn) {
        var len = arguments.length;
        if(len === 3) {
            if(functions.isFunction(data)) {
                fn = data;
                if(typeof event === 'object') {
                    data = event;
                    event = elem;
                    elem = this.domElem;
                }
            }
        } else if(len === 2) {
            if(functions.isFunction(event)) {
                fn = event;
                event = elem;
                elem = this.domElem;
            } else if(!(typeof elem === 'string' || elem instanceof $)) {
                data = event;
                event = elem;
                elem = this.domElem;
            }
        } else if(len === 1) {
            event = elem;
            elem = this.domElem;
        }

        typeof elem === 'string' && (elem = this.elem(elem));

        return this.bindToDomElem(elem, event, data, fn);
    },

    /**
     * Removes event handlers from any DOM element
     * @protected
     * @param {jQuery} domElem DOM element where the event was being listened for
     * @param {String|Object} event Event name or event object
     * @param {Function} [fn] Handler function
     * @returns {BEMDOM} this
     */
    unbindFromDomElem : function(domElem, event, fn) {
        if(typeof event === 'string') {
            event = this._buildEventName(event);
            fn?
                domElem.unbind(event, fn) :
                domElem.unbind(event);
        } else {
            objects.each(event, function(fn, event) {
                this.unbindFromDomElem(domElem, event, fn);
            }, this);
        }

        return this;
    },

    /**
     * Removes event handler from document
     * @protected
     * @param {String|Object} event Event name or event object
     * @param {Function} [fn] Handler function
     * @returns {BEMDOM} this
     */
    unbindFromDoc : function(event, fn) {
        return this.unbindFromDomElem(doc, event, fn);
    },

    /**
     * Removes event handler from window
     * @protected
     * @param {String|Object} event Event name or event object
     * @param {Function} [fn] Handler function
     * @returns {BEMDOM} this
     */
    unbindFromWin : function(event, fn) {
        return this.unbindFromDomElem(win, event, fn);
    },

    /**
     * Removes event handlers from the block's main DOM elements or its nested elements
     * @protected
     * @param {jQuery|String} [elem] Nested element
     * @param {String|Object} event Event name or event object
     * @param {Function} [fn] Handler function
     * @returns {BEMDOM} this
     */
    unbindFrom : function(elem, event, fn) {
        var argLen = arguments.length;
        if(argLen === 1) {
            event = elem;
            elem = this.domElem;
        } else if(argLen === 2 && functions.isFunction(event)) {
            fn = event;
            event = elem;
            elem = this.domElem;
        } else if(typeof elem === 'string') {
            elem = this.elem(elem);
        }

        return this.unbindFromDomElem(elem, event, fn);
    },

    /**
     * Builds a full name for an event
     * @private
     * @param {String} event Event name
     * @returns {String}
     */
    _buildEventName : function(event) {
        return event.indexOf(' ') > 1?
            event.split(' ').map(function(e) {
                return this._buildOneEventName(e);
            }, this).join(' ') :
            this._buildOneEventName(event);
    },

    /**
     * Builds a full name for a single event
     * @private
     * @param {String} event Event name
     * @returns {String}
     */
    _buildOneEventName : function(event) {
        var eventNameCache = this._eventNameCache;

        if(event in eventNameCache) return eventNameCache[event];

        var uniq = '.' + this._uniqId;

        if(event.indexOf('.') < 0) return eventNameCache[event] = event + uniq;

        var lego = '.bem_' + this.__self._name;

        return eventNameCache[event] = event.split('.').map(function(e, i) {
            return i === 0? e + lego : lego + '_' + e;
        }).join('') + uniq;
    },

    _ctxEmit : function(e, data) {
        this.__base.apply(this, arguments);

        var _this = this,
            storage = liveEventCtxStorage[_this.__self._buildCtxEventName(e.type)],
            ctxIds = {};

        storage && _this.domElem.each(function(_, ctx) {
            var counter = storage.counter;
            while(ctx && counter) {
                var ctxId = identify(ctx, true);
                if(ctxId) {
                    if(ctxIds[ctxId]) break;
                    var storageCtx = storage.ctxs[ctxId];
                    if(storageCtx) {
                        objects.each(storageCtx, function(handler) {
                            handler.fn.call(
                                handler.ctx || _this,
                                e,
                                data);
                        });
                        counter--;
                    }
                    ctxIds[ctxId] = true;
                }
                ctx = ctx.parentNode || domNodesToParents[ctxId];
            }
        });
    },

    /**
     * Sets a modifier for a block/nested element
     * @param {jQuery} [elem] Nested element
     * @param {String} modName Modifier name
     * @param {String} modVal Modifier value
     * @returns {BEMDOM} this
     */
    setMod : function(elem, modName, modVal) {
        if(elem && typeof modVal !== 'undefined' && elem.length > 1) {
            var _this = this;
            elem.each(function() {
                var item = $(this);
                item.__bemElemName = elem.__bemElemName;
                _this.setMod(item, modName, modVal);
            });
            return _this;
        }
        return this.__base(elem, modName, modVal);
    },

    /**
     * Retrieves modifier value from the DOM node's CSS class
     * @private
     * @param {String} modName Modifier name
     * @param {jQuery} [elem] Nested element
     * @param {String} [elemName] Name of the nested element
     * @returns {String} Modifier value
     */
    _extractModVal : function(modName, elem, elemName) {
        var domNode = (elem || this.domElem)[0],
            matches;

        domNode &&
            (matches = domNode.className
                .match(this.__self._buildModValRE(modName, elemName || elem)));

        return matches? matches[2] || true : '';
    },

    /**
     * Retrieves a name/value list of modifiers
     * @private
     * @param {Array} [modNames] Names of modifiers
     * @param {Object} [elem] Element
     * @returns {Object} Hash of modifier values by names
     */
    _extractMods : function(modNames, elem) {
        var res = {},
            extractAll = !modNames.length,
            countMatched = 0;

        ((elem || this.domElem)[0].className
            .match(this.__self._buildModValRE(
                '(' + (extractAll? NAME_PATTERN : modNames.join('|')) + ')',
                elem,
                'g')) || []).forEach(function(className) {
                    var matches = className.match(EXTRACT_MODS_RE);
                    res[matches[1]] = matches[2] || true;
                    ++countMatched;
                });

        // empty modifier values are not reflected in classes; they must be filled with empty values
        countMatched < modNames.length && modNames.forEach(function(modName) {
            modName in res || (res[modName] = '');
        });

        return res;
    },

    /**
     * Sets a modifier's CSS class for a block's DOM element or nested element
     * @private
     * @param {String} modName Modifier name
     * @param {String} modVal Modifier value
     * @param {String} oldModVal Old modifier value
     * @param {jQuery} [elem] Element
     * @param {String} [elemName] Element name
     */
    _onSetMod : function(modName, modVal, oldModVal, elem, elemName) {
        if(modName !== 'js' || modVal !== '') {
            var _self = this.__self,
                classPrefix = _self._buildModClassPrefix(modName, elemName),
                classRE = _self._buildModValRE(modName, elemName),
                needDel = modVal === '' || modVal === false;

            (elem || this.domElem).each(function() {
                var className = this.className,
                    modClassName = classPrefix;

                modVal !== true && (modClassName += MOD_DELIM + modVal);

                (oldModVal === true?
                    classRE.test(className) :
                    className.indexOf(classPrefix + MOD_DELIM) > -1)?
                        this.className = className.replace(
                            classRE,
                            (needDel? '' : '$1' + modClassName)) :
                        needDel || $(this).addClass(modClassName);
            });

            elemName && this
                .dropElemCache(elemName, modName, oldModVal)
                .dropElemCache(elemName, modName, modVal);
        }

        this.__base.apply(this, arguments);
    },

    /**
     * Finds elements nested in a block
     * @param {jQuery} [ctx=this.domElem] Element where search is being performed
     * @param {String} names Nested element name (or names separated by spaces)
     * @param {String} [modName] Modifier name
     * @param {String} [modVal] Modifier value
     * @param {Boolean} [strictMode=false]
     * @returns {jQuery} DOM elements
     */
    findElem : function(ctx, names, modName, modVal, strictMode) {
        if(typeof ctx === 'string') {
            strictMode = modVal;
            modVal = modName;
            modName = names;
            names = ctx;
            ctx = this.domElem;
        }

        if(typeof modName === 'boolean') {
            strictMode = modName;
            modName = undef;
        }

        var _self = this.__self,
            selector = '.' +
                names.split(' ').map(function(name) {
                    return _self.buildClass(name, modName, modVal);
                }).join(',.'),
            res = findDomElem(ctx, selector);

        return strictMode? this._filterFindElemResults(res) : res;
    },

    /**
     * Filters results of findElem helper execution in strict mode
     * @param {jQuery} res DOM elements
     * @returns {jQuery} DOM elements
     */
    _filterFindElemResults : function(res) {
        var blockSelector = this.buildSelector(),
            domElem = this.domElem;
        return res.filter(function() {
            return domElem.index($(this).closest(blockSelector)) > -1;
        });
    },

    /**
     * Finds elements nested in a block
     * @private
     * @param {String} name Nested element name
     * @param {String} [modName] Modifier name
     * @param {String|Boolean} [modVal] Modifier value
     * @returns {jQuery} DOM elements
     */
    _elem : function(name, modName, modVal) {
        var key = name + buildModPostfix(modName, modVal),
            res;

        if(!(res = this._elemCache[key])) {
            res = this._elemCache[key] = this.findElem(name, modName, modVal);
            res.__bemElemName = name;
        }

        return res;
    },

    /**
     * Lazy search for elements nested in a block (caches results)
     * @param {String} names Nested element name (or names separated by spaces)
     * @param {String} [modName] Modifier name
     * @param {String|Boolean} [modVal=true] Modifier value
     * @returns {jQuery} DOM elements
     */
    elem : function(names, modName, modVal) {
        if(arguments.length === 2) {
            modVal = true;
        }

        if(modName && typeof modName !== 'string') {
            modName.__bemElemName = names;
            return modName;
        }

        if(names.indexOf(' ') < 0) {
            return this._elem(names, modName, modVal);
        }

        var res = $([]);
        names.split(' ').forEach(function(name) {
            res = res.add(this._elem(name, modName, modVal));
        }, this);
        return res;
    },

    /**
     * Finds elements outside the context
     * @param {jQuery} ctx context
     * @param {String} elemName Element name
     * @returns {jQuery} DOM elements
     */
    closestElem : function(ctx, elemName) {
        return ctx.closest(this.buildSelector(elemName));
    },

    /**
     * Clearing the cache for elements
     * @protected
     * @param {String} [names] Nested element name (or names separated by spaces)
     * @param {String} [modName] Modifier name
     * @param {String} [modVal] Modifier value
     * @returns {BEMDOM} this
     */
    dropElemCache : function(names, modName, modVal) {
        if(names) {
            var modPostfix = buildModPostfix(modName, modVal);
            names.indexOf(' ') < 0?
                delete this._elemCache[names + modPostfix] :
                names.split(' ').forEach(function(name) {
                    delete this._elemCache[name + modPostfix];
                }, this);
        } else {
            this._elemCache = {};
        }

        return this;
    },

    /**
     * Retrieves parameters of a block element
     * @param {String|jQuery} elem Element
     * @returns {Object} Parameters
     */
    elemParams : function(elem) {
        var elemName;
        if(typeof elem === 'string') {
            elemName = elem;
            elem = this.elem(elem);
        } else {
            elemName = this.__self._extractElemNameFrom(elem);
        }

        return extractParams(elem[0])[this.__self.buildClass(elemName)] || {};
    },

    /**
     * Elemify given element
     * @param {jQuery} elem Element
     * @param {String} elemName Name
     * @returns {jQuery}
     */
    elemify : function(elem, elemName) {
        (elem = $(elem)).__bemElemName = elemName;
        return elem;
    },

    /**
     * Checks whether a DOM element is in a block
     * @protected
     * @param {jQuery} [ctx=this.domElem] Element where check is being performed
     * @param {jQuery} domElem DOM element
     * @returns {Boolean}
     */
    containsDomElem : function(ctx, domElem) {
        if(arguments.length === 1) {
            domElem = ctx;
            ctx = this.domElem;
        }

        return dom.contains(ctx, domElem);
    },

    /**
     * Builds a CSS selector corresponding to a block/element and modifier
     * @param {String} [elem] Element name
     * @param {String} [modName] Modifier name
     * @param {String} [modVal] Modifier value
     * @returns {String}
     */
    buildSelector : function(elem, modName, modVal) {
        return this.__self.buildSelector(elem, modName, modVal);
    },

    /**
     * Destructs a block
     * @private
     */
    _destruct : function() {
        var _this = this,
            _self = _this.__self;

        _this._needSpecialUnbind && _self.doc.add(_self.win).unbind('.' + _this._uniqId);

        _this.__base();

        delete uniqIdToBlock[_this.un()._uniqId];
    }

}, /** @lends BEMDOM */{

    /**
     * Scope
     * @type jQuery
     */
    scope : $('body'),

    /**
     * Document shortcut
     * @type jQuery
     */
    doc : doc,

    /**
     * Window shortcut
     * @type jQuery
     */
    win : win,

    /**
     * Processes a block's live properties
     * @private
     * @param {Boolean} [heedLive=false] Whether to take into account that the block already processed its live properties
     * @returns {Boolean} Whether the block is a live block
     */
    _processLive : function(heedLive) {
        var res = this._liveInitable;

        if('live' in this) {
            var noLive = typeof res === 'undefined';

            if(noLive ^ heedLive) { // should be opposite to each other
                res = this.live() !== false;

                var blockName = this.getName(),
                    origLive = this.live;

                this.live = function() {
                    return this.getName() === blockName?
                        res :
                        origLive.apply(this, arguments);
                };
            }
        }

        return res;
    },

    /**
     * Initializes blocks on a fragment of the DOM tree
     * @param {jQuery|String} [ctx=scope] Root DOM node
     * @returns {jQuery} ctx Initialization context
     */
    init : function(ctx) {
        if(typeof ctx === 'string') {
            ctx = $(ctx);
        } else if(!ctx) ctx = DOM.scope;

        var uniqInitId = identify();
        findDomElem(ctx, BEM_SELECTOR).each(function() {
            initBlocks($(this), uniqInitId);
        });

        this._runInitFns();

        return ctx;
    },

    /**
     * Destroys blocks on a fragment of the DOM tree
     * @param {jQuery} ctx Root DOM node
     * @param {Boolean} [excludeSelf=false] Exclude the main domElem
     */
    destruct : function(ctx, excludeSelf) {
        var _ctx;
        if(excludeSelf) {
            storeDomNodeParents(_ctx = ctx.children());
            ctx.empty();
        } else {
            storeDomNodeParents(_ctx = ctx);
            ctx.remove();
        }

        reverse.call(findDomElem(_ctx, BEM_SELECTOR)).each(function(_, domNode) {
            var params = getParams(domNode);
            objects.each(params, function(blockParams) {
                if(blockParams.uniqId) {
                    var block = uniqIdToBlock[blockParams.uniqId];
                    block?
                        removeDomNodeFromBlock(block, domNode) :
                        delete uniqIdToDomElems[blockParams.uniqId];
                }
            });
            delete domElemToParams[identify(domNode)];
        });

        // flush parent nodes storage that has been filled above
        domNodesToParents = {};
    },

    /**
     * Replaces a fragment of the DOM tree inside the context, destroying old blocks and intializing new ones
     * @param {jQuery} ctx Root DOM node
     * @param {jQuery|String} content New content
     * @returns {jQuery} Updated root DOM node
     */
    update : function(ctx, content) {
        this.destruct(ctx, true);
        return this.init(ctx.html(content));
    },

    /**
     * Changes a fragment of the DOM tree including the context and initializes blocks.
     * @param {jQuery} ctx Root DOM node
     * @param {jQuery|String} content Content to be added
     * @returns {jQuery} New content
     */
    replace : function(ctx, content) {
        var prev = ctx.prev(),
            parent = ctx.parent();

        content = getJqueryCollection(content);

        this.destruct(ctx);

        return this.init(prev.length?
            content.insertAfter(prev) :
            content.prependTo(parent));
    },

    /**
     * Adds a fragment of the DOM tree at the end of the context and initializes blocks
     * @param {jQuery} ctx Root DOM node
     * @param {jQuery|String} content Content to be added
     * @returns {jQuery} New content
     */
    append : function(ctx, content) {
        return this.init(getJqueryCollection(content).appendTo(ctx));
    },

    /**
     * Adds a fragment of the DOM tree at the beginning of the context and initializes blocks
     * @param {jQuery} ctx Root DOM node
     * @param {jQuery|String} content Content to be added
     * @returns {jQuery} New content
     */
    prepend : function(ctx, content) {
        return this.init(getJqueryCollection(content).prependTo(ctx));
    },

    /**
     * Adds a fragment of the DOM tree before the context and initializes blocks
     * @param {jQuery} ctx Contextual DOM node
     * @param {jQuery|String} content Content to be added
     * @returns {jQuery} New content
     */
    before : function(ctx, content) {
        return this.init(getJqueryCollection(content).insertBefore(ctx));
    },

    /**
     * Adds a fragment of the DOM tree after the context and initializes blocks
     * @param {jQuery} ctx Contextual DOM node
     * @param {jQuery|String} content Content to be added
     * @returns {jQuery} New content
     */
    after : function(ctx, content) {
        return this.init(getJqueryCollection(content).insertAfter(ctx));
    },

    /**
     * Builds a full name for a live event
     * @private
     * @param {String} e Event name
     * @returns {String}
     */
    _buildCtxEventName : function(e) {
        return this._name + ':' + e;
    },

    _liveClassBind : function(className, e, callback, invokeOnInit) {
        if(e.indexOf(' ') > -1) {
            e.split(' ').forEach(function(e) {
                this._liveClassBind(className, e, callback, invokeOnInit);
            }, this);
        } else {
            var storage = liveClassEventStorage[e],
                uniqId = identify(callback);

            if(!storage) {
                storage = liveClassEventStorage[e] = {};
                DOM.scope.bind(e, $.proxy(this._liveClassTrigger, this));
            }

            storage = storage[className] || (storage[className] = { uniqIds : {}, fns : [] });

            if(!(uniqId in storage.uniqIds)) {
                storage.fns.push({ uniqId : uniqId, fn : this._buildLiveEventFn(callback, invokeOnInit) });
                storage.uniqIds[uniqId] = storage.fns.length - 1;
            }
        }

        return this;
    },

    _liveClassUnbind : function(className, e, callback) {
        var storage = liveClassEventStorage[e];
        if(storage) {
            if(callback) {
                if(storage = storage[className]) {
                    var uniqId = identify(callback);
                    if(uniqId in storage.uniqIds) {
                        var i = storage.uniqIds[uniqId],
                            len = storage.fns.length - 1;
                        storage.fns.splice(i, 1);
                        while(i < len) storage.uniqIds[storage.fns[i++].uniqId] = i - 1;
                        delete storage.uniqIds[uniqId];
                    }
                }
            } else {
                delete storage[className];
            }
        }

        return this;
    },

    _liveClassTrigger : function(e) {
        var storage = liveClassEventStorage[e.type];
        if(storage) {
            var node = e.target, classNames = [];
            for(var className in storage) {
                classNames.push(className);
            }
            do {
                var nodeClassName = ' ' + node.className + ' ', i = 0;
                while(className = classNames[i++]) {
                    if(nodeClassName.indexOf(' ' + className + ' ') > -1) {
                        var j = 0, fns = storage[className].fns, fn, stopPropagationAndPreventDefault = false;
                        while(fn = fns[j++])
                            if(fn.fn.call($(node), e) === false) stopPropagationAndPreventDefault = true;

                        stopPropagationAndPreventDefault && e.preventDefault();
                        if(stopPropagationAndPreventDefault || e.isPropagationStopped()) return;

                        classNames.splice(--i, 1);
                    }
                }
            } while(classNames.length && (node = node.parentNode));
        }
    },

    _buildLiveEventFn : function(callback, invokeOnInit) {
        var _this = this;
        return function(e) {
            e.currentTarget = this;
            var args = [
                    _this._name,
                    $(this).closest(_this.buildSelector()),
                    undef,
                    true
                ],
                block = initBlock.apply(null, invokeOnInit? args.concat([callback, e]) : args);

            if(block && !invokeOnInit && callback)
                return callback.apply(block, arguments);
        };
    },

    /**
     * Helper for live initialization for an event on DOM elements of a block or its elements
     * @protected
     * @param {String} [elemName] Element name or names (separated by spaces)
     * @param {String} event Event name
     * @param {Function} [callback] Handler to call after successful initialization
     */
    liveInitOnEvent : function(elemName, event, callback) {
        return this.liveBindTo(elemName, event, callback, true);
    },

    /**
     * Helper for subscribing to live events on DOM elements of a block or its elements
     * @protected
     * @param {String|Object} [to] Description (object with modName, modVal, elem) or name of the element or elements (space-separated)
     * @param {String} event Event name
     * @param {Function} [callback] Handler
     */
    liveBindTo : function(to, event, callback, invokeOnInit) {
        if(!event || functions.isFunction(event)) {
            callback = event;
            event = to;
            to = undef;
        }

        if(!to || typeof to === 'string') {
            to = { elem : to };
        }

        if(to.elem && to.elem.indexOf(' ') > 0) {
            to.elem.split(' ').forEach(function(elem) {
                this._liveClassBind(
                    this.buildClass(elem, to.modName, to.modVal),
                    event,
                    callback,
                    invokeOnInit);
            }, this);
            return this;
        }

        return this._liveClassBind(
            this.buildClass(to.elem, to.modName, to.modVal),
            event,
            callback,
            invokeOnInit);
    },

    /**
     * Helper for unsubscribing from live events on DOM elements of a block or its elements
     * @protected
     * @param {String} [elem] Name of the element or elements (space-separated)
     * @param {String} event Event name
     * @param {Function} [callback] Handler
     */
    liveUnbindFrom : function(elem, event, callback) {

        if(!event || functions.isFunction(event)) {
            callback = event;
            event = elem;
            elem = undef;
        }

        if(elem && elem.indexOf(' ') > 1) {
            elem.split(' ').forEach(function(elem) {
                this._liveClassUnbind(
                    this.buildClass(elem),
                    event,
                    callback);
            }, this);
            return this;
        }

        return this._liveClassUnbind(
            this.buildClass(elem),
            event,
            callback);
    },

    /**
     * Helper for live initialization when a different block is initialized
     * @private
     * @param {String} event Event name
     * @param {String} blockName Name of the block that should trigger a reaction when initialized
     * @param {Function} callback Handler to be called after successful initialization in the new block's context
     * @param {String} findFnName Name of the method for searching
     */
    _liveInitOnBlockEvent : function(event, blockName, callback, findFnName) {
        var name = this._name;
        blocks[blockName].on(event, function(e) {
            var args = arguments,
                blocks = e.target[findFnName](name);

            callback && blocks.forEach(function(block) {
                callback.apply(block, args);
            });
        });
        return this;
    },

    /**
     * Helper for live initialization for a different block's event on the current block's DOM element
     * @protected
     * @param {String} event Event name
     * @param {String} blockName Name of the block that should trigger a reaction when initialized
     * @param {Function} callback Handler to be called after successful initialization in the new block's context
     */
    liveInitOnBlockEvent : function(event, blockName, callback) {
        return this._liveInitOnBlockEvent(event, blockName, callback, 'findBlocksOn');
    },

    /**
     * Helper for live initialization for a different block's event inside the current block
     * @protected
     * @param {String} event Event name
     * @param {String} blockName Name of the block that should trigger a reaction when initialized
     * @param {Function} [callback] Handler to be called after successful initialization in the new block's context
     */
    liveInitOnBlockInsideEvent : function(event, blockName, callback) {
        return this._liveInitOnBlockEvent(event, blockName, callback, 'findBlocksOutside');
    },

    /**
     * Adds a live event handler to a block, based on a specified element where the event will be listened for
     * @param {jQuery} [ctx] The element in which the event will be listened for
     * @param {String} e Event name
     * @param {Object} [data] Additional information that the handler gets as e.data
     * @param {Function} fn Handler
     * @param {Object} [fnCtx] Handler's context
     */
    on : function(ctx, e, data, fn, fnCtx) {
        return typeof ctx === 'object' && ctx.jquery?
            this._liveCtxBind(ctx, e, data, fn, fnCtx) :
            this.__base(ctx, e, data, fn);
    },

    /**
     * Removes the live event handler from a block, based on a specified element where the event was being listened for
     * @param {jQuery} [ctx] The element in which the event was being listened for
     * @param {String} e Event name
     * @param {Function} [fn] Handler
     * @param {Object} [fnCtx] Handler context
     */
    un : function(ctx, e, fn, fnCtx) {
        return typeof ctx === 'object' && ctx.jquery?
            this._liveCtxUnbind(ctx, e, fn, fnCtx) :
            this.__base(ctx, e, fn);
    },

    /**
     * Adds a live event handler to a block, based on a specified element where the event will be listened for
     * @private
     * @param {jQuery} ctx The element in which the event will be listened for
     * @param {String} e  Event name
     * @param {Object} [data] Additional information that the handler gets as e.data
     * @param {Function} fn Handler
     * @param {Object} [fnCtx] Handler context
     * @returns {BEMDOM} this
     */
    _liveCtxBind : function(ctx, e, data, fn, fnCtx) {
        if(typeof e === 'object') {
            if(functions.isFunction(data) || functions.isFunction(fn)) { // mod change event
                e = this._buildModEventName(e);
            } else {
                objects.each(e, function(fn, e) {
                    this._liveCtxBind(ctx, e, fn, data);
                }, this);
                return this;
            }
        }

        if(functions.isFunction(data)) {
            fnCtx = fn;
            fn = data;
            data = undef;
        }

        if(e.indexOf(' ') > -1) {
            e.split(' ').forEach(function(e) {
                this._liveCtxBind(ctx, e, data, fn, fnCtx);
            }, this);
        } else {
            var ctxE = this._buildCtxEventName(e),
                storage = liveEventCtxStorage[ctxE] ||
                    (liveEventCtxStorage[ctxE] = { counter : 0, ctxs : {} });

            ctx.each(function() {
                var ctxId = identify(this),
                    ctxStorage = storage.ctxs[ctxId];
                if(!ctxStorage) {
                    ctxStorage = storage.ctxs[ctxId] = {};
                    ++storage.counter;
                }
                ctxStorage[identify(fn) + (fnCtx? identify(fnCtx) : '')] = {
                    fn : fn,
                    data : data,
                    ctx : fnCtx
                };
            });
        }

        return this;
    },

    /**
     * Removes a live event handler from a block, based on a specified element where the event was being listened for
     * @private
     * @param {jQuery} ctx The element in which the event was being listened for
     * @param {String|Object} e Event name
     * @param {Function} [fn] Handler
     * @param {Object} [fnCtx] Handler context
     */
    _liveCtxUnbind : function(ctx, e, fn, fnCtx) {
        if(typeof e === 'object' && functions.isFunction(fn)) { // mod change event
            e = this._buildModEventName(e);
        }

        var storage = liveEventCtxStorage[e = this._buildCtxEventName(e)];

        if(storage) {
            ctx.each(function() {
                var ctxId = identify(this, true),
                    ctxStorage;
                if(ctxId && (ctxStorage = storage.ctxs[ctxId])) {
                    fn && delete ctxStorage[identify(fn) + (fnCtx? identify(fnCtx) : '')];
                    if(!fn || objects.isEmpty(ctxStorage)) {
                        storage.counter--;
                        delete storage.ctxs[ctxId];
                    }
                }
            });
            storage.counter || delete liveEventCtxStorage[e];
        }

        return this;
    },

    /**
     * Retrieves the name of an element nested in a block
     * @private
     * @param {jQuery} elem Nested element
     * @returns {String|undef}
     */
    _extractElemNameFrom : function(elem) {
        if(elem.__bemElemName) return elem.__bemElemName;

        var matches = elem[0].className.match(this._buildElemNameRE());
        return matches? matches[1] : undef;
    },

    /**
     * Builds a prefix for the CSS class of a DOM element or nested element of the block, based on modifier name
     * @private
     * @param {String} modName Modifier name
     * @param {jQuery|String} [elem] Element
     * @returns {String}
     */
    _buildModClassPrefix : function(modName, elem) {
        return this._name +
               (elem?
                   ELEM_DELIM + (typeof elem === 'string'? elem : this._extractElemNameFrom(elem)) :
                   '') +
               MOD_DELIM + modName;
    },

    /**
     * Builds a regular expression for extracting modifier values from a DOM element or nested element of a block
     * @private
     * @param {String} modName Modifier name
     * @param {jQuery|String} [elem] Element
     * @param {String} [quantifiers] Regular expression quantifiers
     * @returns {RegExp}
     */
    _buildModValRE : function(modName, elem, quantifiers) {
        return new RegExp(
            '(\\s|^)' +
            this._buildModClassPrefix(modName, elem) +
            '(?:' + MOD_DELIM + '(' + NAME_PATTERN + '))?(?=\\s|$)',
            quantifiers);
    },

    /**
     * Builds a regular expression for extracting names of elements nested in a block
     * @private
     * @returns {RegExp}
     */
    _buildElemNameRE : function() {
        return new RegExp(this._name + ELEM_DELIM + '(' + NAME_PATTERN + ')(?:\\s|$)');
    },

    /**
     * Builds a CSS class corresponding to the block/element and modifier
     * @param {String} [elem] Element name
     * @param {String} [modName] Modifier name
     * @param {String} [modVal] Modifier value
     * @returns {String}
     */
    buildClass : function(elem, modName, modVal) {
        return buildClass(this._name, elem, modName, modVal);
    },

    /**
     * Builds a CSS selector corresponding to the block/element and modifier
     * @param {String} [elem] Element name
     * @param {String} [modName] Modifier name
     * @param {String} [modVal] Modifier value
     * @returns {String}
     */
    buildSelector : function(elem, modName, modVal) {
        return '.' + this.buildClass(elem, modName, modVal);
    }
});

/**
 * Returns a block on a DOM element and initializes it if necessary
 * @param {String} blockName Block name
 * @param {Object} params Block parameters
 * @returns {BEMDOM}
 */
$.fn.bem = function(blockName, params) {
    return initBlock(blockName, this, params, true)._init();
};

provide(DOM);

});

});

(function() {

var origDefine = modules.define;

modules.define = function(name, deps, decl) {
    origDefine.apply(modules, arguments);

    name !== 'i-bem__dom_init' && arguments.length > 2 && ~deps.indexOf('i-bem__dom') &&
        modules.define('i-bem__dom_init', [name], function(provide, _, prev) {
            provide(prev);
        });
};

})();

/* ../../libs/bem-core/common.blocks/i-bem/__dom/i-bem__dom.js end */
;
/* ../../libs/bem-core/common.blocks/jquery/jquery.js begin */
/**
 * @module jquery
 * @description Provide jQuery (load if it does not exist).
 */

modules.define(
    'jquery',
    ['loader_type_js', 'jquery__config'],
    function(provide, loader, cfg) {

/* global jQuery */

function doProvide(preserveGlobal) {
    /**
     * @exports
     * @type Function
     */
    provide(preserveGlobal? jQuery : jQuery.noConflict(true));
}

typeof jQuery !== 'undefined'?
    doProvide(true) :
    loader(cfg.url, doProvide);
});

/* ../../libs/bem-core/common.blocks/jquery/jquery.js end */
;
/* ../../libs/bem-core/common.blocks/loader/_type/loader_type_js.js begin */
/**
 * @module loader_type_js
 * @description Load JS from external URL.
 */

modules.define('loader_type_js', function(provide) {

var loading = {},
    loaded = {},
    head = document.getElementsByTagName('head')[0],
    runCallbacks = function(path, type) {
        var cbs = loading[path], cb, i = 0;
        delete loading[path];
        while(cb = cbs[i++]) {
            cb[type] && cb[type]();
        }
    },
    onSuccess = function(path) {
        loaded[path] = true;
        runCallbacks(path, 'success');
    },
    onError = function(path) {
        runCallbacks(path, 'error');
    };

provide(
    /**
     * @exports
     * @param {String} path resource link
     * @param {Function} success to be called if the script succeeds
     * @param {Function} error to be called if the script fails
     */
    function(path, success, error) {
        if(loaded[path]) {
            success();
            return;
        }

        if(loading[path]) {
            loading[path].push({ success : success, error : error });
            return;
        }

        loading[path] = [{ success : success, error : error }];

        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.charset = 'utf-8';
        script.src = (location.protocol === 'file:' && !path.indexOf('//')? 'http:' : '') + path;

        if('onload' in script) {
            script.onload = function() {
                script.onload = script.onerror = null;
                onSuccess(path);
            };

            script.onerror = function() {
                script.onload = script.onerror = null;
                onError(path);
            };
        } else {
            script.onreadystatechange = function() {
                var readyState = this.readyState;
                if(readyState === 'loaded' || readyState === 'complete') {
                    script.onreadystatechange = null;
                    onSuccess(path);
                }
            };
        }

        head.insertBefore(script, head.lastChild);
    }
);

});

/* ../../libs/bem-core/common.blocks/loader/_type/loader_type_js.js end */
;
/* ../../libs/bem-core/common.blocks/jquery/__config/jquery__config.js begin */
/**
 * @module jquery__config
 * @description Configuration for jQuery
 */

modules.define('jquery__config', function(provide) {

provide(/** @exports */{
    /**
     * URL for loading jQuery if it does not exist
     */
    url : '//yastatic.net/jquery/2.1.3/jquery.min.js'
});

});

/* ../../libs/bem-core/common.blocks/jquery/__config/jquery__config.js end */
;
/* ../../libs/bem-core/desktop.blocks/jquery/__config/jquery__config.js begin */
/**
 * @module jquery__config
 * @description Configuration for jQuery
 */

modules.define(
    'jquery__config',
    ['ua', 'objects'],
    function(provide, ua, objects, base) {

provide(
    ua.msie && parseInt(ua.version, 10) < 9?
        objects.extend(
            base,
            {
                url : '//yastatic.net/jquery/1.11.2/jquery.min.js'
            }) :
        base);

});

/* ../../libs/bem-core/desktop.blocks/jquery/__config/jquery__config.js end */
;
/* ../../libs/bem-core/desktop.blocks/ua/ua.js begin */
/**
 * @module ua
 * @description Detect some user agent features (works like jQuery.browser in jQuery 1.8)
 * @see http://code.jquery.com/jquery-migrate-1.1.1.js
 */

modules.define('ua', function(provide) {

var ua = navigator.userAgent.toLowerCase(),
    match = /(chrome)[ \/]([\w.]+)/.exec(ua) ||
        /(webkit)[ \/]([\w.]+)/.exec(ua) ||
        /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
        /(msie) ([\w.]+)/.exec(ua) ||
        ua.indexOf('compatible') < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) ||
        [],
    matched = {
        browser : match[1] || '',
        version : match[2] || '0'
    },
    browser = {};

if(matched.browser) {
    browser[matched.browser] = true;
    browser.version = matched.version;
}

if(browser.chrome) {
    browser.webkit = true;
} else if(browser.webkit) {
    browser.safari = true;
}

/**
 * @exports
 * @type Object
 */
provide(browser);

});

/* ../../libs/bem-core/desktop.blocks/ua/ua.js end */
;
/* ../../libs/bem-core/common.blocks/dom/dom.js begin */
/**
 * @module dom
 * @description some DOM utils
 */

modules.define('dom', ['jquery'], function(provide, $) {

provide(/** @exports */{
    /**
     * Checks whether a DOM elem is in a context
     * @param {jQuery} ctx DOM elem where check is being performed
     * @param {jQuery} domElem DOM elem to check
     * @returns {Boolean}
     */
    contains : function(ctx, domElem) {
        var res = false;

        domElem.each(function() {
            var domNode = this;
            do {
                if(~ctx.index(domNode)) return !(res = true);
            } while(domNode = domNode.parentNode);

            return res;
        });

        return res;
    },

    /**
     * Returns current focused DOM elem in document
     * @returns {jQuery}
     */
    getFocused : function() {
        // "Error: Unspecified error." in iframe in IE9
        try { return $(document.activeElement); } catch(e) {}
    },

    /**
     * Checks whether a DOM element contains focus
     * @param {jQuery} domElem
     * @returns {Boolean}
     */
    containsFocus : function(domElem) {
        return this.contains(domElem, this.getFocused());
    },

    /**
    * Checks whether a browser currently can set focus on DOM elem
    * @param {jQuery} domElem
    * @returns {Boolean}
    */
    isFocusable : function(domElem) {
        var domNode = domElem[0];

        if(!domNode) return false;
        if(domNode.hasAttribute('tabindex')) return true;

        switch(domNode.tagName.toLowerCase()) {
            case 'iframe':
                return true;

            case 'input':
            case 'button':
            case 'textarea':
            case 'select':
                return !domNode.disabled;

            case 'a':
                return !!domNode.href;
        }

        return false;
    },

    /**
    * Checks whether a domElem is intended to edit text
    * @param {jQuery} domElem
    * @returns {Boolean}
    */
    isEditable : function(domElem) {
        var domNode = domElem[0];

        if(!domNode) return false;

        switch(domNode.tagName.toLowerCase()) {
            case 'input':
                var type = domNode.type;
                return (type === 'text' || type === 'password') && !domNode.disabled && !domNode.readOnly;

            case 'textarea':
                return !domNode.disabled && !domNode.readOnly;

            default:
                return domNode.contentEditable === 'true';
        }
    }
});

});

/* ../../libs/bem-core/common.blocks/dom/dom.js end */
;
/* ../../libs/bem-core/common.blocks/i-bem/__dom/_init/i-bem__dom_init.js begin */
/**
 * @module i-bem__dom_init
 */

modules.define('i-bem__dom_init', ['i-bem__dom'], function(provide, BEMDOM) {

provide(
    /**
     * Initializes blocks on a fragment of the DOM tree
     * @exports
     * @param {jQuery} [ctx=scope] Root DOM node
     * @returns {jQuery} ctx Initialization context
     */
    function(ctx) {
        return BEMDOM.init(ctx);
    });
});

/* ../../libs/bem-core/common.blocks/i-bem/__dom/_init/i-bem__dom_init.js end */
;
/* ../../libs/bem-core/common.blocks/i-bem/__dom/_init/i-bem__dom_init_auto.js begin */
/**
 * Auto initialization on DOM ready
 */

modules.require(
    ['i-bem__dom_init', 'jquery', 'next-tick'],
    function(init, $, nextTick) {

$(function() {
    nextTick(init);
});

});

/* ../../libs/bem-core/common.blocks/i-bem/__dom/_init/i-bem__dom_init_auto.js end */
;
/* ../../libs/bem-components/common.blocks/radio-group/radio-group.js begin */
/**
 * @module radio-group
 */

modules.define(
    'radio-group',
    ['i-bem__dom', 'jquery', 'dom', 'radio'],
    function(provide, BEMDOM, $, dom) {

var undef;
/**
 * @exports
 * @class radio-group
 * @bem
 */
provide(BEMDOM.decl(this.name, /** @lends radio-group.prototype */{
    beforeSetMod : {
        'focused' : {
            'true' : function() {
                return !this.hasMod('disabled');
            }
        }
    },

    onSetMod : {
        'js' : {
            'inited' : function() {
                this._checkedRadio = this.findBlockInside({
                    block : 'radio',
                    modName : 'checked',
                    modVal : true
                });

                this._inSetVal = false;
                this._val = this._checkedRadio? this._checkedRadio.getVal() : undef;
                this._radios = undef;
            }
        },

        'disabled' : function(modName, modVal) {
            this.getRadios().forEach(function(option) {
                option.setMod(modName, modVal);
            });
        },

        'focused' : {
            'true' : function() {
                if(dom.containsFocus(this.domElem)) return;

                var radios = this.getRadios(),
                    i = 0, radio;

                while(radio = radios[i++]) {
                    if(radio.setMod('focused').hasMod('focused')) { // we need to be sure that radio has got focus
                        return;
                    }
                }
            },

            '' : function() {
                var focusedRadio = this.findBlockInside({
                        block : 'radio',
                        modName : 'focused',
                        modVal : true
                    });

                focusedRadio && focusedRadio.delMod('focused');
            }
        }
    },

    /**
     * Returns control value
     * @returns {String}
     */
    getVal : function() {
        return this._val;
    },

    /**
     * Sets control value
     * @param {String} val value
     * @param {Object} [data] additional data
     * @returns {radio-group} this
     */
    setVal : function(val, data) {
        var isValUndef = val === undef;

        isValUndef || (val = String(val));

        if(this._val !== val) {
            if(isValUndef) {
                this._val = undef;
                this._checkedRadio.delMod('checked');
                this.emit('change', data);
            } else {
                var radio = this._getRadioByVal(val);
                if(radio) {
                    this._inSetVal = true;

                    this._val !== undef && this._getRadioByVal(this._val).delMod('checked');
                    this._val = radio.getVal();
                    radio.setMod('checked');

                    this._inSetVal = false;
                    this.emit('change', data);
                }
            }
        }

        return this;
    },

    /**
     * Returns name of control
     * @returns {String}
     */
    getName : function() {
        return this.getRadios()[0].getName();
    },

    /**
     * Returns options
     * @returns {radio[]}
     */
    getRadios : function() {
        return this._radios || (this._radios = this.findBlocksInside('radio'));
    },

    _getRadioByVal : function(val) {
        var radios = this.getRadios(),
            i = 0, option;

        while(option = radios[i++]) {
            if(option.getVal() === val) {
                return option;
            }
        }
    },

    _onRadioCheck : function(e) {
        var radioVal = (this._checkedRadio = e.target).getVal();
        if(!this._inSetVal) {
            if(this._val === radioVal) {
                // on block init value set in constructor, we need remove old checked and emit "change" event
                this.getRadios().forEach(function(radio) {
                    radio.getVal() !== radioVal && radio.delMod('checked');
                });
                this.emit('change');
            } else {
                this.setVal(radioVal);
            }
        }
    },

    _onRadioFocus : function(e) {
        this.setMod('focused', e.target.getMod('focused'));
    }
}, /** @lends radio-group */{
    live : function() {
        var ptp = this.prototype;
        this
            .liveInitOnBlockInsideEvent(
                { modName : 'checked', modVal : true },
                'radio',
                ptp._onRadioCheck)
            .liveInitOnBlockInsideEvent(
                { modName : 'focused', modVal : '*' },
                'radio',
                ptp._onRadioFocus);
    }
}));

});

/* ../../libs/bem-components/common.blocks/radio-group/radio-group.js end */
;
/* ../../libs/bem-components/common.blocks/radio/radio.js begin */
/**
 * @module radio
 */

modules.define(
    'radio',
    ['i-bem__dom', 'control'],
    function(provide, BEMDOM, Control) {

/**
 * @exports
 * @class radio
 * @augments control
 * @bem
 */
provide(BEMDOM.decl({ block : this.name, baseBlock : Control }, /** @lends radio.prototype */{
    onSetMod : {
        'checked' : function(modName, modVal) {
            this.elem('control').prop(modName, modVal);
        }
    },

    _onChange : function() {
        this.hasMod('disabled') || this.setMod('checked');
    }
}, /** @lends radio */{
    live : function() {
        this.liveBindTo('change', this.prototype._onChange);
        return this.__base.apply(this, arguments);
    }
}));

});

/* ../../libs/bem-components/common.blocks/radio/radio.js end */
;
/* ../../libs/bem-core/common.blocks/jquery/__event/_type/jquery__event_type_pointerclick.js begin */
/**
 * FastClick to jQuery module wrapper.
 * @see https://github.com/ftlabs/fastclick
 */
modules.define('jquery', function(provide, $) {

/**
 * FastClick: polyfill to remove click delays on browsers with touch UIs.
 *
 * @version 0.6.11
 * @copyright The Financial Times Limited [All Rights Reserved]
 * @license MIT License (see LICENSE.txt)
 */

/**
 * @class FastClick
 */

/**
 * Instantiate fast-clicking listeners on the specificed layer.
 *
 * @constructor
 * @param {Element} layer The layer to listen on
 */
function FastClick(layer) {
    'use strict';
    var oldOnClick, self = this;


    /**
     * Whether a click is currently being tracked.
     *
     * @type boolean
     */
    this.trackingClick = false;


    /**
     * Timestamp for when when click tracking started.
     *
     * @type number
     */
    this.trackingClickStart = 0;


    /**
     * The element being tracked for a click.
     *
     * @type EventTarget
     */
    this.targetElement = null;


    /**
     * X-coordinate of touch start event.
     *
     * @type number
     */
    this.touchStartX = 0;


    /**
     * Y-coordinate of touch start event.
     *
     * @type number
     */
    this.touchStartY = 0;


    /**
     * ID of the last touch, retrieved from Touch.identifier.
     *
     * @type number
     */
    this.lastTouchIdentifier = 0;


    /**
     * Touchmove boundary, beyond which a click will be cancelled.
     *
     * @type number
     */
    this.touchBoundary = 10;


    /**
     * The FastClick layer.
     *
     * @type Element
     */
    this.layer = layer;

    if (!layer || !layer.nodeType) {
        throw new TypeError('Layer must be a document node');
    }

    /** @type function() */
    this.onClick = function() { return FastClick.prototype.onClick.apply(self, arguments); };

    /** @type function() */
    this.onMouse = function() { return FastClick.prototype.onMouse.apply(self, arguments); };

    /** @type function() */
    this.onTouchStart = function() { return FastClick.prototype.onTouchStart.apply(self, arguments); };

    /** @type function() */
    this.onTouchMove = function() { return FastClick.prototype.onTouchMove.apply(self, arguments); };

    /** @type function() */
    this.onTouchEnd = function() { return FastClick.prototype.onTouchEnd.apply(self, arguments); };

    /** @type function() */
    this.onTouchCancel = function() { return FastClick.prototype.onTouchCancel.apply(self, arguments); };

    if (FastClick.notNeeded(layer)) {
        return;
    }

    // Set up event handlers as required
    if (this.deviceIsAndroid) {
        layer.addEventListener('mouseover', this.onMouse, true);
        layer.addEventListener('mousedown', this.onMouse, true);
        layer.addEventListener('mouseup', this.onMouse, true);
    }

    layer.addEventListener('click', this.onClick, true);
    layer.addEventListener('touchstart', this.onTouchStart, false);
    layer.addEventListener('touchmove', this.onTouchMove, false);
    layer.addEventListener('touchend', this.onTouchEnd, false);
    layer.addEventListener('touchcancel', this.onTouchCancel, false);

    // Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
    // which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
    // layer when they are cancelled.
    if (!Event.prototype.stopImmediatePropagation) {
        layer.removeEventListener = function(type, callback, capture) {
            var rmv = Node.prototype.removeEventListener;
            if (type === 'click') {
                rmv.call(layer, type, callback.hijacked || callback, capture);
            } else {
                rmv.call(layer, type, callback, capture);
            }
        };

        layer.addEventListener = function(type, callback, capture) {
            var adv = Node.prototype.addEventListener;
            if (type === 'click') {
                adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
                    if (!event.propagationStopped) {
                        callback(event);
                    }
                }), capture);
            } else {
                adv.call(layer, type, callback, capture);
            }
        };
    }

    // If a handler is already declared in the element's onclick attribute, it will be fired before
    // FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
    // adding it as listener.
    if (typeof layer.onclick === 'function') {

        // Android browser on at least 3.2 requires a new reference to the function in layer.onclick
        // - the old one won't work if passed to addEventListener directly.
        oldOnClick = layer.onclick;
        layer.addEventListener('click', function(event) {
            oldOnClick(event);
        }, false);
        layer.onclick = null;
    }
}


/**
 * Android requires exceptions.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0;


/**
 * iOS requires exceptions.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent);


/**
 * iOS 4 requires an exception for select elements.
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOS4 = FastClick.prototype.deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


/**
 * iOS 6.0(+?) requires the target element to be manually derived
 *
 * @type boolean
 */
FastClick.prototype.deviceIsIOSWithBadTarget = FastClick.prototype.deviceIsIOS && (/OS ([6-9]|\d{2})_\d/).test(navigator.userAgent);


/**
 * Determine whether a given element requires a native click.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element needs a native click
 */
FastClick.prototype.needsClick = function(target) {
    'use strict';
    switch (target.nodeName.toLowerCase()) {

    // Don't send a synthetic click to disabled inputs (issue #62)
    case 'button':
    case 'select':
    case 'textarea':
        if (target.disabled) {
            return true;
        }

        break;
    case 'input':

        // File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
        if ((this.deviceIsIOS && target.type === 'file') || target.disabled) {
            return true;
        }

        break;
    case 'label':
    case 'video':
        return true;
    }

    return (/\bneedsclick\b/).test(target.className);
};


/**
 * Determine whether a given element requires a call to focus to simulate click into element.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
 */
FastClick.prototype.needsFocus = function(target) {
    'use strict';
    switch (target.nodeName.toLowerCase()) {
    case 'textarea':
        return true;
    case 'select':
        return !this.deviceIsAndroid;
    case 'input':
        switch (target.type) {
        case 'button':
        case 'checkbox':
        case 'file':
        case 'image':
        case 'radio':
        case 'submit':
            return false;
        }

        // No point in attempting to focus disabled inputs
        return !target.disabled && !target.readOnly;
    default:
        return (/\bneedsfocus\b/).test(target.className);
    }
};


/**
 * Send a click event to the specified element.
 *
 * @param {EventTarget|Element} targetElement
 * @param {Event} event
 */
FastClick.prototype.sendClick = function(targetElement, event) {
    'use strict';
    var clickEvent, touch;

    // On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
    if (document.activeElement && document.activeElement !== targetElement) {
        document.activeElement.blur();
    }

    touch = event.changedTouches[0];

    // Synthesise a click event, with an extra attribute so it can be tracked
    clickEvent = document.createEvent('MouseEvents');
    clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
    clickEvent.forwardedTouchEvent = true;
    targetElement.dispatchEvent(clickEvent);
};

FastClick.prototype.determineEventType = function(targetElement) {
    'use strict';

    //Issue #159: Android Chrome Select Box does not open with a synthetic click event
    if (this.deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
        return 'mousedown';
    }

    return 'click';
};


/**
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.focus = function(targetElement) {
    'use strict';
    var length;

    // Issue #160: on iOS 7, some input elements (e.g. date datetime) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
    if (this.deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time') {
        length = targetElement.value.length;
        targetElement.setSelectionRange(length, length);
    } else {
        targetElement.focus();
    }
};


/**
 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
 *
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.updateScrollParent = function(targetElement) {
    'use strict';
    var scrollParent, parentElement;

    scrollParent = targetElement.fastClickScrollParent;

    // Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
    // target element was moved to another parent.
    if (!scrollParent || !scrollParent.contains(targetElement)) {
        parentElement = targetElement;
        do {
            if (parentElement.scrollHeight > parentElement.offsetHeight) {
                scrollParent = parentElement;
                targetElement.fastClickScrollParent = parentElement;
                break;
            }

            parentElement = parentElement.parentElement;
        } while (parentElement);
    }

    // Always update the scroll top tracker if possible.
    if (scrollParent) {
        scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
    }
};


/**
 * @param {EventTarget} targetElement
 * @returns {Element|EventTarget}
 */
FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {
    'use strict';

    // On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
    if (eventTarget.nodeType === Node.TEXT_NODE) {
        return eventTarget.parentNode;
    }

    return eventTarget;
};


/**
 * On touch start, record the position and scroll offset.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchStart = function(event) {
    'use strict';
    var targetElement, touch, selection;

    // Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
    if (event.targetTouches.length > 1) {
        return true;
    }

    targetElement = this.getTargetElementFromEventTarget(event.target);
    touch = event.targetTouches[0];

    if (this.deviceIsIOS) {

        // Only trusted events will deselect text on iOS (issue #49)
        selection = window.getSelection();
        if (selection.rangeCount && !selection.isCollapsed) {
            return true;
        }

        if (!this.deviceIsIOS4) {

            // Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
            // when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
            // with the same identifier as the touch event that previously triggered the click that triggered the alert.
            // Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
            // immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
            if (touch.identifier === this.lastTouchIdentifier) {
                event.preventDefault();
                return false;
            }

            this.lastTouchIdentifier = touch.identifier;

            // If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
            // 1) the user does a fling scroll on the scrollable layer
            // 2) the user stops the fling scroll with another tap
            // then the event.target of the last 'touchend' event will be the element that was under the user's finger
            // when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
            // is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
            this.updateScrollParent(targetElement);
        }
    }

    this.trackingClick = true;
    this.trackingClickStart = event.timeStamp;
    this.targetElement = targetElement;

    this.touchStartX = touch.pageX;
    this.touchStartY = touch.pageY;

    // Prevent phantom clicks on fast double-tap (issue #36)
    if ((event.timeStamp - this.lastClickTime) < 200) {
        event.preventDefault();
    }

    return true;
};


/**
 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.touchHasMoved = function(event) {
    'use strict';
    var touch = event.changedTouches[0], boundary = this.touchBoundary;

    if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
        return true;
    }

    return false;
};


/**
 * Update the last position.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchMove = function(event) {
    'use strict';
    if (!this.trackingClick) {
        return true;
    }

    // If the touch has moved, cancel the click tracking
    if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
        this.trackingClick = false;
        this.targetElement = null;
    }

    return true;
};


/**
 * Attempt to find the labelled control for the given label element.
 *
 * @param {EventTarget|HTMLLabelElement} labelElement
 * @returns {Element|null}
 */
FastClick.prototype.findControl = function(labelElement) {
    'use strict';

    // Fast path for newer browsers supporting the HTML5 control attribute
    if (labelElement.control !== undefined) {
        return labelElement.control;
    }

    // All browsers under test that support touch events also support the HTML5 htmlFor attribute
    if (labelElement.htmlFor) {
        return document.getElementById(labelElement.htmlFor);
    }

    // If no for attribute exists, attempt to retrieve the first labellable descendant element
    // the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
    return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
};


/**
 * On touch end, determine whether to send a click event at once.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchEnd = function(event) {
    'use strict';
    var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

    if (!this.trackingClick) {
        return true;
    }

    // Prevent phantom clicks on fast double-tap (issue #36)
    if ((event.timeStamp - this.lastClickTime) < 200) {
        this.cancelNextClick = true;
        return true;
    }

    // Reset to prevent wrong click cancel on input (issue #156).
    this.cancelNextClick = false;

    this.lastClickTime = event.timeStamp;

    trackingClickStart = this.trackingClickStart;
    this.trackingClick = false;
    this.trackingClickStart = 0;

    // On some iOS devices, the targetElement supplied with the event is invalid if the layer
    // is performing a transition or scroll, and has to be re-detected manually. Note that
    // for this to function correctly, it must be called *after* the event target is checked!
    // See issue #57; also filed as rdar://13048589 .
    if (this.deviceIsIOSWithBadTarget) {
        touch = event.changedTouches[0];

        // In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
        targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
        targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
    }

    targetTagName = targetElement.tagName.toLowerCase();
    if (targetTagName === 'label') {
        forElement = this.findControl(targetElement);
        if (forElement) {
            this.focus(targetElement);
            if (this.deviceIsAndroid) {
                return false;
            }

            targetElement = forElement;
        }
    } else if (this.needsFocus(targetElement)) {

        // Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
        // Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
        if ((event.timeStamp - trackingClickStart) > 100 || (this.deviceIsIOS && window.top !== window && targetTagName === 'input')) {
            this.targetElement = null;
            return false;
        }

        this.focus(targetElement);

        // Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
        if (!this.deviceIsIOS4 || targetTagName !== 'select') {
            this.targetElement = null;
            event.preventDefault();
        }

        return false;
    }

    if (this.deviceIsIOS && !this.deviceIsIOS4) {

        // Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
        // and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
        scrollParent = targetElement.fastClickScrollParent;
        if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
            return true;
        }
    }

    // Prevent the actual click from going though - unless the target node is marked as requiring
    // real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
    if (!this.needsClick(targetElement)) {
        event.preventDefault();
        this.sendClick(targetElement, event);
    }

    return false;
};


/**
 * On touch cancel, stop tracking the click.
 *
 * @returns {void}
 */
FastClick.prototype.onTouchCancel = function() {
    'use strict';
    this.trackingClick = false;
    this.targetElement = null;
};


/**
 * Determine mouse events which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onMouse = function(event) {
    'use strict';

    // If a target element was never set (because a touch event was never fired) allow the event
    if (!this.targetElement) {
        return true;
    }

    if (event.forwardedTouchEvent) {
        return true;
    }

    // Programmatically generated events targeting a specific element should be permitted
    if (!event.cancelable) {
        return true;
    }

    // Derive and check the target element to see whether the mouse event needs to be permitted;
    // unless explicitly enabled, prevent non-touch click events from triggering actions,
    // to prevent ghost/doubleclicks.
    if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

        // Prevent any user-added listeners declared on FastClick element from being fired.
        if (event.stopImmediatePropagation) {
            event.stopImmediatePropagation();
        } else {

            // Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
            event.propagationStopped = true;
        }

        // Cancel the event
        event.stopPropagation();
        event.preventDefault();

        return false;
    }

    // If the mouse event is permitted, return true for the action to go through.
    return true;
};


/**
 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
 * an actual click which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onClick = function(event) {
    'use strict';
    var permitted;

    // It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
    if (this.trackingClick) {
        this.targetElement = null;
        this.trackingClick = false;
        return true;
    }

    // Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
    if (event.target.type === 'submit' && event.detail === 0) {
        return true;
    }

    permitted = this.onMouse(event);

    // Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
    if (!permitted) {
        this.targetElement = null;
    }

    // If clicks are permitted, return true for the action to go through.
    return permitted;
};


/**
 * Remove all FastClick's event listeners.
 *
 * @returns {void}
 */
FastClick.prototype.destroy = function() {
    'use strict';
    var layer = this.layer;

    if (this.deviceIsAndroid) {
        layer.removeEventListener('mouseover', this.onMouse, true);
        layer.removeEventListener('mousedown', this.onMouse, true);
        layer.removeEventListener('mouseup', this.onMouse, true);
    }

    layer.removeEventListener('click', this.onClick, true);
    layer.removeEventListener('touchstart', this.onTouchStart, false);
    layer.removeEventListener('touchmove', this.onTouchMove, false);
    layer.removeEventListener('touchend', this.onTouchEnd, false);
    layer.removeEventListener('touchcancel', this.onTouchCancel, false);
};


/**
 * Check whether FastClick is needed.
 *
 * @param {Element} layer The layer to listen on
 */
FastClick.notNeeded = function(layer) {
    'use strict';
    var metaViewport;

    // Devices that don't support touch don't need FastClick
    if (typeof window.ontouchstart === 'undefined') {
        return true;
    }

    if ((/Chrome\/[0-9]+/).test(navigator.userAgent)) {

        // Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
        if (FastClick.prototype.deviceIsAndroid) {
            metaViewport = document.querySelector('meta[name=viewport]');
            if (metaViewport && metaViewport.content.indexOf('user-scalable=no') !== -1) {
                return true;
            }

        // Chrome desktop doesn't need FastClick (issue #15)
        } else {
            return true;
        }
    }

    // IE10 with -ms-touch-action: none, which disables double-tap-to-zoom (issue #97)
    if (layer.style.msTouchAction === 'none') {
        return true;
    }

    return false;
};


/**
 * Factory method for creating a FastClick object
 *
 * @param {Element} layer The layer to listen on
 */
FastClick.attach = function(layer) {
    'use strict';
    return new FastClick(layer);
};

var event = $.event.special.pointerclick = {
        setup : function() {
            $(this).on('click', event.handler);
        },

        teardown : function() {
            $(this).off('click', event.handler);
        },

        handler : function(e) {
            if(!e.button) {
                e.type = 'pointerclick';
                $.event.dispatch.apply(this, arguments);
                e.type = 'click';
            }
        }
    };

$(function() {
    FastClick.attach(document.body);
    provide($);
});

});

/* ../../libs/bem-core/common.blocks/jquery/__event/_type/jquery__event_type_pointerclick.js end */
;
/* ../../libs/bem-core/common.blocks/jquery/__event/_type/jquery__event_type_pointernative.js begin */
/*!
 * Basic pointer events polyfill
 */
;(function(global, factory) {

if(typeof modules === 'object' && modules.isDefined('jquery')) {
    modules.define('jquery', function(provide, $) {
        factory(this.global, $);
        provide($);
    });
} else if(typeof jQuery === 'function') {
    factory(global, jQuery);
}

}(this, function(window, $) {

// include "jquery-pointerevents.js"
/*!
 * Most of source code is taken from PointerEvents Polyfill
 * written by Polymer Team (https://github.com/Polymer/PointerEvents)
 * and licensed under the BSD License.
 */

var doc = document,
    USE_NATIVE_MAP = window.Map && window.Map.prototype.forEach,
    HAS_BITMAP_TYPE = window.MSPointerEvent && typeof window.MSPointerEvent.MSPOINTER_TYPE_MOUSE === 'number',
    POINTERS_FN = function() { return this.size },
    jqEvent = $.event;

// NOTE: Remove jQuery special fixes for pointerevents – we fix them ourself
delete jqEvent.special.pointerenter;
delete jqEvent.special.pointerleave;

/*!
 * Returns a snapshot of inEvent, with writable properties.
 *
 * @param {Event} event An event that contains properties to copy.
 * @returns {Object} An object containing shallow copies of `inEvent`'s
 *    properties.
 */
function cloneEvent(event) {
    var eventCopy = $.extend(new $.Event(), event);
    if(event.preventDefault) {
        eventCopy.preventDefault = function() {
            event.preventDefault();
        };
    }
    return eventCopy;
}

/*!
 * Dispatches the event to the target, taking event's bubbling into account.
 */
function dispatchEvent(event, target) {
    return event.bubbles?
        jqEvent.trigger(event, null, target) :
        jqEvent.dispatch.call(target, event);
}

var MOUSE_PROPS = {
        bubbles : false,
        cancelable : false,
        view : null,
        detail : null,
        screenX : 0,
        screenY : 0,
        clientX : 0,
        clientY : 0,
        ctrlKey : false,
        altKey : false,
        shiftKey : false,
        metaKey : false,
        button : 0,
        relatedTarget : null,
        pageX : 0,
        pageY : 0
    },
    mouseProps = Object.keys(MOUSE_PROPS),
    mousePropsLen = mouseProps.length,
    mouseDefaults = mouseProps.map(function(prop) { return MOUSE_PROPS[prop] });

/*!
 * Pointer event constructor
 *
 * @param {String} type
 * @param {Object} [params]
 * @returns {Event}
 * @constructor
 */
function PointerEvent(type, params) {
    params || (params = {});

    var e = $.Event(type);

    // define inherited MouseEvent properties
    for(var i = 0, p; i < mousePropsLen; i++) {
        p = mouseProps[i];
        e[p] = params[p] || mouseDefaults[i];
    }

    e.buttons = params.buttons || 0;

    // add x/y properties aliased to clientX/Y
    e.x = e.clientX;
    e.y = e.clientY;

    // Spec requires that pointers without pressure specified use 0.5 for down
    // state and 0 for up state.
    var pressure = 0;
    if(params.pressure) {
        pressure = params.pressure;
    } else {
        pressure = e.buttons? 0.5 : 0;
    }

    // define the properties of the PointerEvent interface
    e.pointerId = params.pointerId || 0;
    e.width = params.width || 0;
    e.height = params.height || 0;
    e.pressure = pressure;
    e.tiltX = params.tiltX || 0;
    e.tiltY = params.tiltY || 0;
    e.pointerType = params.pointerType || '';
    e.hwTimestamp = params.hwTimestamp || 0;
    e.isPrimary = params.isPrimary || false;

    // add some common jQuery properties
    e.which = typeof params.which === 'undefined'? 1 : params.which;

    return e;
}

/*!
 * Implements a map of pointer states
 * @returns {PointerMap}
 * @constructor
 */
function PointerMap() {
    if(USE_NATIVE_MAP) {
        var m = new Map();
        m.pointers = POINTERS_FN;
        return m;
    }

    this.keys = [];
    this.values = [];
}

PointerMap.prototype = {
    set : function(id, event) {
        var i = this.keys.indexOf(id);
        if(i > -1) {
            this.values[i] = event;
        } else {
            this.keys.push(id);
            this.values.push(event);
        }
    },

    has : function(id) {
        return this.keys.indexOf(id) > -1;
    },

    'delete' : function(id) {
        var i = this.keys.indexOf(id);
        if(i > -1) {
            this.keys.splice(i, 1);
            this.values.splice(i, 1);
        }
    },

    get : function(id) {
        var i = this.keys.indexOf(id);
        return this.values[i];
    },

    clear : function() {
        this.keys.length = 0;
        this.values.length = 0;
    },

    forEach : function(callback, ctx) {
        var keys = this.keys;
        this.values.forEach(function(v, i) {
            callback.call(ctx, v, keys[i], this);
        }, this);
    },

    pointers : function() {
        return this.keys.length;
    }
};

var pointermap = new PointerMap();

var dispatcher = {
    eventMap : {},
    eventSourceList : [],

    /*!
     * Add a new event source that will generate pointer events
     */
    registerSource : function(name, source) {
        var newEvents = source.events;
        if(newEvents) {
            newEvents.forEach(function(e) {
                source[e] && (this.eventMap[e] = function() { source[e].apply(source, arguments) });
            }, this);
            this.eventSourceList.push(source);
        }
    },

    register : function(element) {
        var len = this.eventSourceList.length;
        for(var i = 0, es; (i < len) && (es = this.eventSourceList[i]); i++) {
            // call eventsource register
            es.register.call(es, element);
        }
    },

    unregister : function(element) {
        var l = this.eventSourceList.length;
        for(var i = 0, es; (i < l) && (es = this.eventSourceList[i]); i++) {
            // call eventsource register
            es.unregister.call(es, element);
        }
    },

    down : function(event) {
        event.bubbles = true;
        this.fireEvent('pointerdown', event);
    },

    move : function(event) {
        event.bubbles = true;
        this.fireEvent('pointermove', event);
    },

    up : function(event) {
        event.bubbles = true;
        this.fireEvent('pointerup', event);
    },

    enter : function(event) {
        event.bubbles = false;
        this.fireEvent('pointerenter', event);
    },

    leave : function(event) {
        event.bubbles = false;
        this.fireEvent('pointerleave', event);
    },

    over : function(event) {
        event.bubbles = true;
        this.fireEvent('pointerover', event);
    },

    out : function(event) {
        event.bubbles = true;
        this.fireEvent('pointerout', event);
    },

    cancel : function(event) {
        event.bubbles = true;
        this.fireEvent('pointercancel', event);
    },

    leaveOut : function(event) {
        this.out(event);
        this.enterLeave(event, this.leave);
    },

    enterOver : function(event) {
        this.over(event);
        this.enterLeave(event, this.enter);
    },

    enterLeave : function(event, fn) {
        var target = event.target,
            relatedTarget = event.relatedTarget;

        if(!this.contains(target, relatedTarget)) {
            while(target && target !== relatedTarget) {
                event.target = target;
                fn.call(this, event);

                target = target.parentNode;
            }
        }
    },

    contains : function(target, relatedTarget) {
        return target === relatedTarget || $.contains(target, relatedTarget);
    },

    // LISTENER LOGIC
    eventHandler : function(e) {
        // This is used to prevent multiple dispatch of pointerevents from
        // platform events. This can happen when two elements in different scopes
        // are set up to create pointer events, which is relevant to Shadow DOM.
        if(e._handledByPE) {
            return;
        }

        var type = e.type, fn;
        (fn = this.eventMap && this.eventMap[type]) && fn(e);

        e._handledByPE = true;
    },

    /*!
     * Sets up event listeners
     */
    listen : function(target, events) {
        events.forEach(function(e) {
            this.addEvent(target, e);
        }, this);
    },

    /*!
     * Removes event listeners
     */
    unlisten : function(target, events) {
        events.forEach(function(e) {
            this.removeEvent(target, e);
        }, this);
    },

    addEvent : function(target, eventName) {
        $(target).on(eventName, boundHandler);
    },

    removeEvent : function(target, eventName) {
        $(target).off(eventName, boundHandler);
    },

    getTarget : function(event) {
        return event._target;
    },

    /*!
     * Creates a new Event of type `type`, based on the information in `event`
     */
    makeEvent : function(type, event) {
        var e = new PointerEvent(type, event);
        if(event.preventDefault) {
            e.preventDefault = event.preventDefault;
        }

        e._target = e._target || event.target;

        return e;
    },

    /*!
     * Dispatches the event to its target
     */
    dispatchEvent : function(event) {
        var target = this.getTarget(event);
        if(target) {
            if(!event.target) {
                event.target = target;
            }

            return dispatchEvent(event, target);
        }
    },

    /*!
     * Makes and dispatch an event in one call
     */
    fireEvent : function(type, event) {
        var e = this.makeEvent(type, event);
        return this.dispatchEvent(e);
    }
};

function boundHandler() {
    dispatcher.eventHandler.apply(dispatcher, arguments);
}

var CLICK_COUNT_TIMEOUT = 200,
    // Radius around touchend that swallows mouse events
    MOUSE_DEDUP_DIST = 25,
    MOUSE_POINTER_ID = 1,
    // This should be long enough to ignore compat mouse events made by touch
    TOUCH_DEDUP_TIMEOUT = 2500,
    // A distance for which touchmove should fire pointercancel event
    TOUCHMOVE_HYSTERESIS = 20;

// handler block for native mouse events
var mouseEvents = {
    POINTER_TYPE : 'mouse',
    events : [
        'mousedown',
        'mousemove',
        'mouseup',
        'mouseover',
        'mouseout'
    ],

    register : function(target) {
        dispatcher.listen(target, this.events);
    },

    unregister : function(target) {
        dispatcher.unlisten(target, this.events);
    },

    lastTouches : [],

    // collide with the global mouse listener
    isEventSimulatedFromTouch : function(event) {
        var lts = this.lastTouches,
            x = event.clientX,
            y = event.clientY;

        for(var i = 0, l = lts.length, t; i < l && (t = lts[i]); i++) {
            // simulated mouse events will be swallowed near a primary touchend
            var dx = Math.abs(x - t.x), dy = Math.abs(y - t.y);
            if(dx <= MOUSE_DEDUP_DIST && dy <= MOUSE_DEDUP_DIST) {
                return true;
            }
        }
    },

    prepareEvent : function(event) {
        var e = cloneEvent(event);
        e.pointerId = MOUSE_POINTER_ID;
        e.isPrimary = true;
        e.pointerType = this.POINTER_TYPE;
        return e;
    },

    mousedown : function(event) {
        if(!this.isEventSimulatedFromTouch(event)) {
            if(pointermap.has(MOUSE_POINTER_ID)) {
                // http://crbug/149091
                this.cancel(event);
            }

            pointermap.set(MOUSE_POINTER_ID, event);

            var e = this.prepareEvent(event);
            dispatcher.down(e);
        }
    },

    mousemove : function(event) {
        if(!this.isEventSimulatedFromTouch(event)) {
            var e = this.prepareEvent(event);
            dispatcher.move(e);
        }
    },

    mouseup : function(event) {
        if(!this.isEventSimulatedFromTouch(event)) {
            var p = pointermap.get(MOUSE_POINTER_ID);
            if(p && p.button === event.button) {
                var e = this.prepareEvent(event);
                dispatcher.up(e);
                this.cleanupMouse();
            }
        }
    },

    mouseover : function(event) {
        if(!this.isEventSimulatedFromTouch(event)) {
            var e = this.prepareEvent(event);
            dispatcher.enterOver(e);
        }
    },

    mouseout : function(event) {
        if(!this.isEventSimulatedFromTouch(event)) {
            var e = this.prepareEvent(event);
            dispatcher.leaveOut(e);
        }
    },

    cancel : function(inEvent) {
        var e = this.prepareEvent(inEvent);
        dispatcher.cancel(e);
        this.cleanupMouse();
    },

    cleanupMouse : function() {
        pointermap['delete'](MOUSE_POINTER_ID);
    }
};

var touchEvents = {
    events : [
        'touchstart',
        'touchmove',
        'touchend',
        'touchcancel'
    ],

    register : function(target) {
        dispatcher.listen(target, this.events);
    },

    unregister : function(target) {
        dispatcher.unlisten(target, this.events);
    },

    POINTER_TYPE : 'touch',
    clickCount : 0,
    resetId : null,
    firstTouch : null,

    isPrimaryTouch : function(touch) {
        return this.firstTouch === touch.identifier;
    },

    /*!
     * Sets primary touch if there no pointers, or the only pointer is the mouse
     */
    setPrimaryTouch : function(touch) {
        if(pointermap.pointers() === 0 ||
                (pointermap.pointers() === 1 && pointermap.has(MOUSE_POINTER_ID))) {
            this.firstTouch = touch.identifier;
            this.firstXY = { X : touch.clientX, Y : touch.clientY };
            this.scrolling = null;

            this.cancelResetClickCount();
        }
    },

    removePrimaryPointer : function(pointer) {
        if(pointer.isPrimary) {
            this.firstTouch = null;
            // TODO(@narqo): It seems that, flushing `firstXY` flag explicitly in `touchmove` handler is enough.
            // Original code from polymer doing `this.firstXY = null` on every `removePrimaryPointer` call, but looks
            // like it is harmful in some of our usecases.
            this.resetClickCount();
        }
    },

    resetClickCount : function() {
        var _this = this;
        this.resetId = setTimeout(function() {
            _this.clickCount = 0;
            _this.resetId = null;
        }, CLICK_COUNT_TIMEOUT);
    },

    cancelResetClickCount : function() {
        this.resetId && clearTimeout(this.resetId);
    },

    typeToButtons : function(type) {
        return type === 'touchstart' || type === 'touchmove'? 1 : 0;
    },

    findTarget : function(event) {
        // Currently we don't interested in shadow dom handling
        return doc.elementFromPoint(event.clientX, event.clientY);
    },

    touchToPointer : function(touch) {
        var cte = this.currentTouchEvent,
            e = cloneEvent(touch);

        // Spec specifies that pointerId 1 is reserved for Mouse.
        // Touch identifiers can start at 0.
        // Add 2 to the touch identifier for compatibility.
        e.pointerId = touch.identifier + 2;
        e.target = this.findTarget(e);
        e.bubbles = true;
        e.cancelable = true;
        e.detail = this.clickCount;
        e.button = 0;
        e.buttons = this.typeToButtons(cte.type);
        e.width = touch.webkitRadiusX || touch.radiusX || 0;
        e.height = touch.webkitRadiusY || touch.radiusY || 0;
        e.pressure = touch.mozPressure || touch.webkitForce || touch.force || 0.5;
        e.isPrimary = this.isPrimaryTouch(touch);
        e.pointerType = this.POINTER_TYPE;

        // forward touch preventDefaults
        var _this = this;
        e.preventDefault = function() {
            _this.scrolling = false;
            _this.firstXY = null;
            cte.preventDefault();
        };

        return e;
    },

    processTouches : function(event, fn) {
        var tl = event.originalEvent.changedTouches;
        this.currentTouchEvent = event;
        for(var i = 0, t; i < tl.length; i++) {
            t = tl[i];
            fn.call(this, this.touchToPointer(t));
        }
    },

    shouldScroll : function(touchEvent) {
        // return "true" for things to be much easier
        return true;
    },

    findTouch : function(touches, pointerId) {
        for(var i = 0, l = touches.length, t; i < l && (t = touches[i]); i++) {
            if(t.identifier === pointerId) {
                return true;
            }
        }
    },

    /*!
     * In some instances, a touchstart can happen without a touchend.
     * This leaves the pointermap in a broken state.
     * Therefore, on every touchstart, we remove the touches
     * that did not fire a touchend event.
     *
     * To keep state globally consistent, we fire a pointercancel
     * for this "abandoned" touch
     */
    vacuumTouches : function(touchEvent) {
        var touches = touchEvent.touches;
        // pointermap.pointers() should be less than length of touches here, as the touchstart has not
        // been processed yet.
        if(pointermap.pointers() >= touches.length) {
            var d = [];

            pointermap.forEach(function(pointer, pointerId) {
                // Never remove pointerId == 1, which is mouse.
                // Touch identifiers are 2 smaller than their pointerId, which is the
                // index in pointermap.
                if(pointerId === MOUSE_POINTER_ID || this.findTouch(touches, pointerId - 2)) return;
                d.push(pointer.outEvent);
            }, this);

            d.forEach(this.cancelOut, this);
        }
    },

    /*!
     * Prevents synth mouse events from creating pointer events
     */
    dedupSynthMouse : function(touchEvent) {
        var lts = mouseEvents.lastTouches,
            t = touchEvent.changedTouches[0];

        // only the primary finger will synth mouse events
        if(this.isPrimaryTouch(t)) {
            // remember x/y of last touch
            var lt = { x : t.clientX, y : t.clientY };
            lts.push(lt);

            setTimeout(function() {
                var i = lts.indexOf(lt);
                i > -1 && lts.splice(i, 1);
            }, TOUCH_DEDUP_TIMEOUT);
        }
    },

    touchstart : function(event) {
        var touchEvent = event.originalEvent;

        this.vacuumTouches(touchEvent);
        this.setPrimaryTouch(touchEvent.changedTouches[0]);
        this.dedupSynthMouse(touchEvent);

        if(!this.scrolling) {
            this.clickCount++;
            this.processTouches(event, this.overDown);
        }
    },

    touchmove : function(event) {
        var touchEvent = event.originalEvent;
        if(!this.scrolling) {
            if(this.scrolling === null && this.shouldScroll(touchEvent)) {
                this.scrolling = true;
            } else {
                event.preventDefault();
                this.processTouches(event, this.moveOverOut);
            }
        } else if(this.firstXY) {
            var firstXY = this.firstXY,
                touch = touchEvent.changedTouches[0],
                dx = touch.clientX - firstXY.X,
                dy = touch.clientY - firstXY.Y,
                dd = Math.sqrt(dx * dx + dy * dy);
            if(dd >= TOUCHMOVE_HYSTERESIS) {
                this.touchcancel(event);
                this.scrolling = true;
                this.firstXY = null;
            }
        }
    },

    touchend : function(event) {
        var touchEvent = event.originalEvent;
        this.dedupSynthMouse(touchEvent);
        this.processTouches(event, this.upOut);
    },

    touchcancel : function(event) {
        this.processTouches(event, this.cancelOut);
    },

    overDown : function(pEvent) {
        var target = pEvent.target;
        pointermap.set(pEvent.pointerId, {
            target : target,
            outTarget : target,
            outEvent : pEvent
        });
        dispatcher.over(pEvent);
        dispatcher.enter(pEvent);
        dispatcher.down(pEvent);
    },

    moveOverOut : function(pEvent) {
        var pointer = pointermap.get(pEvent.pointerId);

        // a finger drifted off the screen, ignore it
        if(!pointer) {
            return;
        }

        dispatcher.move(pEvent);

        var outEvent = pointer.outEvent,
            outTarget = pointer.outTarget;

        if(outEvent && outTarget !== pEvent.target) {
            pEvent.relatedTarget = outTarget;
            outEvent.relatedTarget = pEvent.target;
            // recover from retargeting by shadow
            outEvent.target = outTarget;

            if(pEvent.target) {
                dispatcher.leaveOut(outEvent);
                dispatcher.enterOver(pEvent);
            } else {
                // clean up case when finger leaves the screen
                pEvent.target = outTarget;
                pEvent.relatedTarget = null;
                this.cancelOut(pEvent);
            }
        }

        pointer.outEvent = pEvent;
        pointer.outTarget = pEvent.target;
    },

    upOut : function(pEvent) {
        dispatcher.up(pEvent);
        dispatcher.out(pEvent);
        dispatcher.leave(pEvent);

        this.cleanUpPointer(pEvent);
    },

    cancelOut : function(pEvent) {
        dispatcher.cancel(pEvent);
        dispatcher.out(pEvent);
        dispatcher.leave(pEvent);
        this.cleanUpPointer(pEvent);
    },

    cleanUpPointer : function(pEvent) {
        pointermap['delete'](pEvent.pointerId);
        this.removePrimaryPointer(pEvent);
    }
};

var msEvents = {
    events : [
        'MSPointerDown',
        'MSPointerMove',
        'MSPointerUp',
        'MSPointerOut',
        'MSPointerOver',
        'MSPointerCancel'
    ],

    register : function(target) {
        dispatcher.listen(target, this.events);
    },

    unregister : function(target) {
        dispatcher.unlisten(target, this.events);
    },

    POINTER_TYPES : [
        '',
        'unavailable',
        'touch',
        'pen',
        'mouse'
    ],

    prepareEvent : function(event) {
        var e = cloneEvent(event);
        HAS_BITMAP_TYPE && (e.pointerType = this.POINTER_TYPES[event.pointerType]);
        return e;
    },

    MSPointerDown : function(event) {
        pointermap.set(event.pointerId, event);
        var e = this.prepareEvent(event);
        dispatcher.down(e);
    },

    MSPointerMove : function(event) {
        var e = this.prepareEvent(event);
        dispatcher.move(e);
    },

    MSPointerUp : function(event) {
        var e = this.prepareEvent(event);
        dispatcher.up(e);
        this.cleanup(event.pointerId);
    },

    MSPointerOut : function(event) {
        var e = this.prepareEvent(event);
        dispatcher.leaveOut(e);
    },

    MSPointerOver : function(event) {
        var e = this.prepareEvent(event);
        dispatcher.enterOver(e);
    },

    MSPointerCancel : function(event) {
        var e = this.prepareEvent(event);
        dispatcher.cancel(e);
        this.cleanup(event.pointerId);
    },

    cleanup : function(id) {
        pointermap['delete'](id);
    }
};

var navigator = window.navigator;
if(navigator.msPointerEnabled) {
    dispatcher.registerSource('ms', msEvents);
} else {
    dispatcher.registerSource('mouse', mouseEvents);
    if(typeof window.ontouchstart !== 'undefined') {
        dispatcher.registerSource('touch', touchEvents);
    }
}

dispatcher.register(doc);

}));

/* ../../libs/bem-core/common.blocks/jquery/__event/_type/jquery__event_type_pointernative.js end */
;
/* ../../libs/bem-core/common.blocks/jquery/__event/_type/jquery__event_type_pointerpressrelease.js begin */
modules.define('jquery', function(provide, $) {

$.each({
    pointerpress : 'pointerdown',
    pointerrelease : 'pointerup pointercancel'
}, function(spec, origEvent) {
    function eventHandler(e) {
        var res, origType = e.handleObj.origType;

        if(e.which === 1) {
            e.type = spec;
            res = $.event.dispatch.apply(this, arguments);
            e.type = origType;
        }

        return res;
    }

    $.event.special[spec] = {
        setup : function() {
            $(this).on(origEvent, eventHandler);
            return false;
        },
        teardown : function() {
            $(this).off(origEvent, eventHandler);
            return false;
        }
    };
});

provide($);

});

/* ../../libs/bem-core/common.blocks/jquery/__event/_type/jquery__event_type_pointerpressrelease.js end */
;
/* ../../libs/bem-components/common.blocks/control/control.js begin */
/**
 * @module control
 */

modules.define(
    'control',
    ['i-bem__dom', 'dom', 'next-tick'],
    function(provide, BEMDOM, dom, nextTick) {

/**
 * @exports
 * @class control
 * @abstract
 * @bem
 */
provide(BEMDOM.decl(this.name, /** @lends control.prototype */{
    beforeSetMod : {
        'focused' : {
            'true' : function() {
                return !this.hasMod('disabled');
            }
        }
    },

    onSetMod : {
        'js' : {
            'inited' : function() {
                this._focused = dom.containsFocus(this.elem('control'));
                this._focused?
                    // if control is already in focus, we need to force _onFocus
                    this._onFocus() :
                    // if block already has focused mod, we need to focus control
                    this.hasMod('focused') && this._focus();

                this._tabIndex = this.elem('control').attr('tabindex');
                if(this.hasMod('disabled') && this._tabIndex !== 'undefined')
                    this.elem('control').removeAttr('tabindex');
            }
        },

        'focused' : {
            'true' : function() {
                this._focused || this._focus();
            },

            '' : function() {
                this._focused && this._blur();
            }
        },

        'disabled' : {
            '*' : function(modName, modVal) {
                this.elem('control').prop(modName, !!modVal);
            },

            'true' : function() {
                this.delMod('focused');
                typeof this._tabIndex !== 'undefined' &&
                    this.elem('control').removeAttr('tabindex');
            },

            '' : function() {
                typeof this._tabIndex !== 'undefined' &&
                    this.elem('control').attr('tabindex', this._tabIndex);
            }
        }
    },

    /**
     * Returns name of control
     * @returns {String}
     */
    getName : function() {
        return this.elem('control').attr('name') || '';
    },

    /**
     * Returns control value
     * @returns {String}
     */
    getVal : function() {
        return this.elem('control').val();
    },

    _onFocus : function() {
        this._focused = true;
        this.setMod('focused');
    },

    _onBlur : function() {
        this._focused = false;
        this.delMod('focused');
    },

    _focus : function() {
        dom.isFocusable(this.elem('control'))?
            this.elem('control').focus() :
            this._onFocus(); // issues/1456
    },

    _blur : function() {
        dom.isFocusable(this.elem('control'))?
            this.elem('control').blur() :
            this._onBlur();
    }
}, /** @lends control */{
    live : function() {
        this
            .liveBindTo('control', 'focusin', this.prototype._onFocus)
            .liveBindTo('control', 'focusout', this.prototype._onBlur);

        var focused = dom.getFocused();
        if(focused.hasClass(this.buildClass('control'))) {
            var _this = this; // TODO: https://github.com/bem/bem-core/issues/425
            nextTick(function() {
                if(focused[0] === dom.getFocused()[0]) {
                    var block = focused.closest(_this.buildSelector());
                    block && block.bem(_this.getName());
                }
            });
        }
    }
}));

});

/* ../../libs/bem-components/common.blocks/control/control.js end */
;
/* ../../libs/bem-components/desktop.blocks/control/control.js begin */
/** @module control */

modules.define(
    'control',
    function(provide, Control) {

provide(Control.decl({
    beforeSetMod : {
        'hovered' : {
            'true' : function() {
                return !this.hasMod('disabled');
            }
        }
    },

    onSetMod : {
        'disabled' : {
            'true' : function() {
                this.__base.apply(this, arguments);
                this.delMod('hovered');
            }
        },

        'hovered' : {
            'true' : function() {
                this.bindTo('mouseleave', this._onMouseLeave);
            },

            '' : function() {
                this.unbindFrom('mouseleave', this._onMouseLeave);
            }
        }
    },

    _onMouseOver : function() {
        this.setMod('hovered');
    },

    _onMouseLeave : function() {
        this.delMod('hovered');
    }
}, {
    live : function() {
        return this
            .liveBindTo('mouseover', this.prototype._onMouseOver)
            .__base.apply(this, arguments);
    }
}));

});

/* ../../libs/bem-components/desktop.blocks/control/control.js end */
;
/* ../../libs/bem-components/common.blocks/radio/_type/radio_type_button.js begin */
/**
 * @module radio
 */

modules.define('radio', ['button'], function(provide, _, Radio) {

/**
 * @exports
 * @class radio
 * @bem
 */
provide(Radio.decl({ modName : 'type', modVal : 'button' }, /** @lends radio.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {
                this.__base.apply(this, arguments);
                this._button = this.findBlockInside('button')
                    .on(
                        { modName : 'checked', modVal : '*' },
                        proxyModFromButton,
                        this)
                    .on(
                        { modName : 'focused', modVal : '*' },
                        proxyModFromButton,
                        this);
            }
        },

        'checked' : proxyModToButton,
        'disabled' : proxyModToButton,
        'focused' : function(modName, modVal) {
            proxyModToButton.call(this, modName, modVal, false);
        }
    }
}, /** @lends radio */{
    live : function() {
        this.liveInitOnBlockInsideEvent({ modName : 'js', modVal : 'inited' }, 'button');
        return this.__base.apply(this, arguments);
    }
}));

function proxyModToButton(modName, modVal, callBase) {
    callBase !== false && this.__base.apply(this, arguments);
    this._button.setMod(modName, modVal);
}

function proxyModFromButton(_, data) {
    this.setMod(data.modName, data.modVal);
}

});

/* ../../libs/bem-components/common.blocks/radio/_type/radio_type_button.js end */
;
/* ../../libs/bem-components/common.blocks/button/button.js begin */
/**
 * @module button
 */

modules.define(
    'button',
    ['i-bem__dom', 'control', 'jquery', 'dom', 'functions', 'keyboard__codes'],
    function(provide, BEMDOM, Control, $, dom, functions, keyCodes) {

/**
 * @exports
 * @class button
 * @augments control
 * @bem
 */
provide(BEMDOM.decl({ block : this.name, baseBlock : Control }, /** @lends button.prototype */{
    beforeSetMod : {
        'pressed' : {
            'true' : function() {
                return !this.hasMod('disabled') || this.hasMod('togglable');
            }
        },

        'focused' : {
            '' : function() {
                return !this._isPointerPressInProgress;
            }
        }
    },

    onSetMod : {
        'js' : {
            'inited' : function() {
                this.__base.apply(this, arguments);
                this._isPointerPressInProgress = false;
                this._focusedByPointer = false;
            }
        },

        'disabled' : {
            'true' : function() {
                this.__base.apply(this, arguments);
                this.hasMod('togglable') || this.delMod('pressed');
            }
        },

        'focused' : {
            'true' : function() {
                this.__base.apply(this, arguments);
                this._focusedByPointer || this.setMod('focused-hard');
            },

            '' : function() {
                this.__base.apply(this, arguments);
                this.delMod('focused-hard');
            }
        }
    },

    /**
     * Returns text of the button
     * @returns {String}
     */
    getText : function() {
        return this.elem('text').text();
    },

    /**
     * Sets text to the button
     * @param {String} text
     * @returns {button} this
     */
    setText : function(text) {
        this.elem('text').text(text || '');
        return this;
    },

    _onFocus : function() {
        if(this._isPointerPressInProgress) return;

        this.__base.apply(this, arguments);
        this.bindTo('control', 'keydown', this._onKeyDown);
    },

    _onBlur : function() {
        this
            .unbindFrom('control', 'keydown', this._onKeyDown)
            .__base.apply(this, arguments);
    },

    _onPointerPress : function() {
        if(!this.hasMod('disabled')) {
            this._isPointerPressInProgress = true;
            this
                .bindToDoc('pointerrelease', this._onPointerRelease)
                .setMod('pressed');
        }
    },

    _onPointerRelease : function(e) {
        this._isPointerPressInProgress = false;
        this.unbindFromDoc('pointerrelease', this._onPointerRelease);

        if(dom.contains(this.elem('control'), $(e.target))) {
            this._focusedByPointer = true;
            this._focus();
            this._focusedByPointer = false;
            this
                ._updateChecked()
                .emit('click');
        } else {
            this._blur();
        }

        this.delMod('pressed');
    },

    _onKeyDown : function(e) {
        if(this.hasMod('disabled')) return;

        var keyCode = e.keyCode;
        if(keyCode === keyCodes.SPACE || keyCode === keyCodes.ENTER) {
            this
                .unbindFrom('control', 'keydown', this._onKeyDown)
                .bindTo('control', 'keyup', this._onKeyUp)
                ._updateChecked()
                .setMod('pressed');
        }
    },

    _onKeyUp : function(e) {
        this
            .unbindFrom('control', 'keyup', this._onKeyUp)
            .bindTo('control', 'keydown', this._onKeyDown)
            .delMod('pressed');

        e.keyCode === keyCodes.SPACE && this._doAction();

        this.emit('click');
    },

    _updateChecked : function() {
        this.hasMod('togglable') &&
            (this.hasMod('togglable', 'check')?
                this.toggleMod('checked') :
                this.setMod('checked'));

        return this;
    },

    _doAction : functions.noop
}, /** @lends button */{
    live : function() {
        this.liveBindTo('control', 'pointerpress', this.prototype._onPointerPress);
        return this.__base.apply(this, arguments);
    }
}));

});

/* ../../libs/bem-components/common.blocks/button/button.js end */
;
/* ../../libs/bem-core/common.blocks/keyboard/__codes/keyboard__codes.js begin */
/**
 * @module keyboard__codes
 */
modules.define('keyboard__codes', function(provide) {

provide(/** @exports */{
    BACKSPACE : 8,
    TAB : 9,
    ENTER : 13,
    CAPS_LOCK : 20,
    ESC : 27,
    SPACE : 32,
    PAGE_UP : 33,
    PAGE_DOWN : 34,
    END : 35,
    HOME : 36,
    LEFT : 37,
    UP : 38,
    RIGHT : 39,
    DOWN : 40,
    INSERT : 41,
    DELETE : 42
});

});

/* ../../libs/bem-core/common.blocks/keyboard/__codes/keyboard__codes.js end */
;
/* ../../libs/bem-components/common.blocks/input/input.js begin */
/**
 * @module input
 */

modules.define('input', ['i-bem__dom', 'control'], function(provide, BEMDOM, Control) {

/**
 * @exports
 * @class input
 * @augments control
 * @bem
 */
provide(BEMDOM.decl({ block : this.name, baseBlock : Control }, /** @lends input.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {
                this.__base.apply(this, arguments);
                this._val = this.elem('control').val();
            }
        }
    },

    /**
     * Returns control value
     * @returns {String}
     * @override
     */
    getVal : function() {
        return this._val;
    },

    /**
     * Sets control value
     * @param {String} val value
     * @param {Object} [data] additional data
     * @returns {input} this
     */
    setVal : function(val, data) {
        val = String(val);

        if(this._val !== val) {
            this._val = val;

            var control = this.elem('control');
            control.val() !== val && control.val(val);

            this.emit('change', data);
        }

        return this;
    }
}, /** @lends input */{
    live : function() {
        this.__base.apply(this, arguments);
        return false;
    }
}));

});

/* ../../libs/bem-components/common.blocks/input/input.js end */
;
/* ../../libs/bem-components/desktop.blocks/input/input.js begin */
/**
 * @module input
 */

modules.define('input', ['tick', 'idle'], function(provide, tick, idle, Input) {

var instances = [],
    boundToTick,
    bindToTick = function() {
        boundToTick = true;
        tick
            .on('tick', update)
            .start();
        idle
            .on({
                idle : function() {
                    tick.un('tick', update);
                },
                wakeup : function() {
                    tick.on('tick', update);
                }
            })
            .start();
    },
    update = function() {
        var instance, i = 0;
        while(instance = instances[i++]) {
            instance.setVal(instance.elem('control').val());
        }
    };

/**
 * @exports
 * @class input
 * @bem
 */
provide(Input.decl(/** @lends input.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {
                this.__base.apply(this, arguments);

                boundToTick || bindToTick();

                // сохраняем индекс в массиве инстансов чтобы потом быстро из него удалять
                this._instanceIndex = instances.push(this) - 1;
            },

            '' : function() {
                this.__base.apply(this, arguments);

                // удаляем из общего массива instances
                instances.splice(this._instanceIndex, 1);
                // понижаем _instanceIndex всем тем кто был добавлен в instances после нас
                var i = this._instanceIndex, instance;
                while(instance = instances[i++]) --instance._instanceIndex;
            }
        }
    },

    /**
     * Нормализация установки фокуса для IE
     * @private
     * @override
     */
    _focus : function() {
        var input = this.elem('control')[0];
        if(input.createTextRange && !input.selectionStart) {
            var range = input.createTextRange();
            range.move('character', input.value.length);
            range.select();
        } else {
            input.focus();
        }
    }
}));

});

/* ../../libs/bem-components/desktop.blocks/input/input.js end */
;
/* ../../libs/bem-core/common.blocks/tick/tick.vanilla.js begin */
/**
 * @module tick
 * @description Helpers for polling anything
 */

modules.define('tick', ['inherit', 'events'], function(provide, inherit, events) {

var TICK_INTERVAL = 50,
    global = this.global,

    /**
     * @class Tick
     * @augments events:Emitter
     */
    Tick = inherit(events.Emitter, /** @lends Tick.prototype */{
        /**
         * @constructor
         */
        __constructor : function() {
            this._timer = null;
            this._isStarted = false;
        },

        /**
         * Starts polling
         */
        start : function() {
            if(!this._isStarted) {
                this._isStarted = true;
                this._scheduleTick();
            }
        },

        /**
         * Stops polling
         */
        stop : function() {
            if(this._isStarted) {
                this._isStarted = false;
                global.clearTimeout(this._timer);
            }
        },

        _scheduleTick : function() {
            var _this = this;
            this._timer = global.setTimeout(
                function() {
                    _this._onTick();
                },
                TICK_INTERVAL);
        },

        _onTick : function() {
            this.emit('tick');

            this._isStarted && this._scheduleTick();
        }
    });

provide(
    /**
     * @exports
     * @type Tick
     */
    new Tick());

});

/* ../../libs/bem-core/common.blocks/tick/tick.vanilla.js end */
;
/* ../../libs/bem-core/common.blocks/idle/idle.js begin */
/**
 * @module idle
 */

modules.define('idle', ['inherit', 'events', 'jquery'], function(provide, inherit, events, $) {

var IDLE_TIMEOUT = 3000,
    USER_EVENTS = 'mousemove keydown click',
    /**
     * @class Idle
     * @augments events:Emitter
     */
    Idle = inherit(events.Emitter, /** @lends Idle.prototype */{
        /**
         * @constructor
         */
        __constructor : function() {
            this._timer = null;
            this._isStarted = false;
            this._isIdle = false;
        },

        /**
         * Starts monitoring of idle state
         */
        start : function() {
            if(!this._isStarted) {
                this._isStarted = true;
                this._startTimer();
                $(document).on(USER_EVENTS, $.proxy(this._onUserAction, this));
            }
        },

        /**
         * Stops monitoring of idle state
         */
        stop : function() {
            if(this._isStarted) {
                this._isStarted = false;
                this._stopTimer();
                $(document).off(USER_EVENTS, this._onUserAction);
            }
        },

        /**
         * Returns whether state is idle
         * @returns {Boolean}
         */
        isIdle : function() {
            return this._isIdle;
        },

        _onUserAction : function() {
            if(this._isIdle) {
                this._isIdle = false;
                this.emit('wakeup');
            }

            this._stopTimer();
            this._startTimer();
        },

        _startTimer : function() {
            var _this = this;
            this._timer = setTimeout(
                function() {
                    _this._onTimeout();
                },
                IDLE_TIMEOUT);
        },

        _stopTimer : function() {
            this._timer && clearTimeout(this._timer);
        },

        _onTimeout : function() {
            this._isIdle = true;
            this.emit('idle');
        }
    });

provide(
    /**
     * @exports
     * @type Idle
     */
    new Idle());

});

/* ../../libs/bem-core/common.blocks/idle/idle.js end */
;
/* ../../libs/bem-core/common.blocks/vow/vow.vanilla.js begin */
/**
 * @module vow
 * @author Filatov Dmitry <dfilatov@yandex-team.ru>
 * @version 0.4.8
 * @license
 * Dual licensed under the MIT and GPL licenses:
 *   * http://www.opensource.org/licenses/mit-license.php
 *   * http://www.gnu.org/licenses/gpl.html
 */

(function(global) {

var undef,
    nextTick = (function() {
        var fns = [],
            enqueueFn = function(fn) {
                return fns.push(fn) === 1;
            },
            callFns = function() {
                var fnsToCall = fns, i = 0, len = fns.length;
                fns = [];
                while(i < len) {
                    fnsToCall[i++]();
                }
            };

        if(typeof setImmediate === 'function') { // ie10, nodejs >= 0.10
            return function(fn) {
                enqueueFn(fn) && setImmediate(callFns);
            };
        }

        if(typeof process === 'object' && process.nextTick) { // nodejs < 0.10
            return function(fn) {
                enqueueFn(fn) && process.nextTick(callFns);
            };
        }

        if(global.postMessage) { // modern browsers
            var isPostMessageAsync = true;
            if(global.attachEvent) {
                var checkAsync = function() {
                        isPostMessageAsync = false;
                    };
                global.attachEvent('onmessage', checkAsync);
                global.postMessage('__checkAsync', '*');
                global.detachEvent('onmessage', checkAsync);
            }

            if(isPostMessageAsync) {
                var msg = '__promise' + +new Date,
                    onMessage = function(e) {
                        if(e.data === msg) {
                            e.stopPropagation && e.stopPropagation();
                            callFns();
                        }
                    };

                global.addEventListener?
                    global.addEventListener('message', onMessage, true) :
                    global.attachEvent('onmessage', onMessage);

                return function(fn) {
                    enqueueFn(fn) && global.postMessage(msg, '*');
                };
            }
        }

        var doc = global.document;
        if('onreadystatechange' in doc.createElement('script')) { // ie6-ie8
            var createScript = function() {
                    var script = doc.createElement('script');
                    script.onreadystatechange = function() {
                        script.parentNode.removeChild(script);
                        script = script.onreadystatechange = null;
                        callFns();
                };
                (doc.documentElement || doc.body).appendChild(script);
            };

            return function(fn) {
                enqueueFn(fn) && createScript();
            };
        }

        return function(fn) { // old browsers
            enqueueFn(fn) && setTimeout(callFns, 0);
        };
    })(),
    throwException = function(e) {
        nextTick(function() {
            throw e;
        });
    },
    isFunction = function(obj) {
        return typeof obj === 'function';
    },
    isObject = function(obj) {
        return obj !== null && typeof obj === 'object';
    },
    toStr = Object.prototype.toString,
    isArray = Array.isArray || function(obj) {
        return toStr.call(obj) === '[object Array]';
    },
    getArrayKeys = function(arr) {
        var res = [],
            i = 0, len = arr.length;
        while(i < len) {
            res.push(i++);
        }
        return res;
    },
    getObjectKeys = Object.keys || function(obj) {
        var res = [];
        for(var i in obj) {
            obj.hasOwnProperty(i) && res.push(i);
        }
        return res;
    },
    defineCustomErrorType = function(name) {
        var res = function(message) {
            this.name = name;
            this.message = message;
        };

        res.prototype = new Error();

        return res;
    },
    wrapOnFulfilled = function(onFulfilled, idx) {
        return function(val) {
            onFulfilled.call(this, val, idx);
        };
    };

/**
 * @class Deferred
 * @exports vow:Deferred
 * @description
 * The `Deferred` class is used to encapsulate newly-created promise object along with functions that resolve, reject or notify it.
 */

/**
 * @constructor
 * @description
 * You can use `vow.defer()` instead of using this constructor.
 *
 * `new vow.Deferred()` gives the same result as `vow.defer()`.
 */
var Deferred = function() {
    this._promise = new Promise();
};

Deferred.prototype = /** @lends Deferred.prototype */{
    /**
     * Returns corresponding promise.
     *
     * @returns {vow:Promise}
     */
    promise : function() {
        return this._promise;
    },

    /**
     * Resolves corresponding promise with given `value`.
     *
     * @param {*} value
     *
     * @example
     * ```js
     * var defer = vow.defer(),
     *     promise = defer.promise();
     *
     * promise.then(function(value) {
     *     // value is "'success'" here
     * });
     *
     * defer.resolve('success');
     * ```
     */
    resolve : function(value) {
        this._promise.isResolved() || this._promise._resolve(value);
    },

    /**
     * Rejects corresponding promise with given `reason`.
     *
     * @param {*} reason
     *
     * @example
     * ```js
     * var defer = vow.defer(),
     *     promise = defer.promise();
     *
     * promise.fail(function(reason) {
     *     // reason is "'something is wrong'" here
     * });
     *
     * defer.reject('something is wrong');
     * ```
     */
    reject : function(reason) {
        if(this._promise.isResolved()) {
            return;
        }

        if(vow.isPromise(reason)) {
            reason = reason.then(function(val) {
                var defer = vow.defer();
                defer.reject(val);
                return defer.promise();
            });
            this._promise._resolve(reason);
        }
        else {
            this._promise._reject(reason);
        }
    },

    /**
     * Notifies corresponding promise with given `value`.
     *
     * @param {*} value
     *
     * @example
     * ```js
     * var defer = vow.defer(),
     *     promise = defer.promise();
     *
     * promise.progress(function(value) {
     *     // value is "'20%'", "'40%'" here
     * });
     *
     * defer.notify('20%');
     * defer.notify('40%');
     * ```
     */
    notify : function(value) {
        this._promise.isResolved() || this._promise._notify(value);
    }
};

var PROMISE_STATUS = {
    PENDING   : 0,
    RESOLVED  : 1,
    FULFILLED : 2,
    REJECTED  : 3
};

/**
 * @class Promise
 * @exports vow:Promise
 * @description
 * The `Promise` class is used when you want to give to the caller something to subscribe to,
 * but not the ability to resolve or reject the deferred.
 */

/**
 * @constructor
 * @param {Function} resolver See https://github.com/domenic/promises-unwrapping/blob/master/README.md#the-promise-constructor for details.
 * @description
 * You should use this constructor directly only if you are going to use `vow` as DOM Promises implementation.
 * In other case you should use `vow.defer()` and `defer.promise()` methods.
 * @example
 * ```js
 * function fetchJSON(url) {
 *     return new vow.Promise(function(resolve, reject, notify) {
 *         var xhr = new XMLHttpRequest();
 *         xhr.open('GET', url);
 *         xhr.responseType = 'json';
 *         xhr.send();
 *         xhr.onload = function() {
 *             if(xhr.response) {
 *                 resolve(xhr.response);
 *             }
 *             else {
 *                 reject(new TypeError());
 *             }
 *         };
 *     });
 * }
 * ```
 */
var Promise = function(resolver) {
    this._value = undef;
    this._status = PROMISE_STATUS.PENDING;

    this._fulfilledCallbacks = [];
    this._rejectedCallbacks = [];
    this._progressCallbacks = [];

    if(resolver) { // NOTE: see https://github.com/domenic/promises-unwrapping/blob/master/README.md
        var _this = this,
            resolverFnLen = resolver.length;

        resolver(
            function(val) {
                _this.isResolved() || _this._resolve(val);
            },
            resolverFnLen > 1?
                function(reason) {
                    _this.isResolved() || _this._reject(reason);
                } :
                undef,
            resolverFnLen > 2?
                function(val) {
                    _this.isResolved() || _this._notify(val);
                } :
                undef);
    }
};

Promise.prototype = /** @lends Promise.prototype */ {
    /**
     * Returns value of fulfilled promise or reason in case of rejection.
     *
     * @returns {*}
     */
    valueOf : function() {
        return this._value;
    },

    /**
     * Returns `true` if promise is resolved.
     *
     * @returns {Boolean}
     */
    isResolved : function() {
        return this._status !== PROMISE_STATUS.PENDING;
    },

    /**
     * Returns `true` if promise is fulfilled.
     *
     * @returns {Boolean}
     */
    isFulfilled : function() {
        return this._status === PROMISE_STATUS.FULFILLED;
    },

    /**
     * Returns `true` if promise is rejected.
     *
     * @returns {Boolean}
     */
    isRejected : function() {
        return this._status === PROMISE_STATUS.REJECTED;
    },

    /**
     * Adds reactions to promise.
     *
     * @param {Function} [onFulfilled] Callback that will to be invoked with the value after promise has been fulfilled
     * @param {Function} [onRejected] Callback that will to be invoked with the reason after promise has been rejected
     * @param {Function} [onProgress] Callback that will to be invoked with the value after promise has been notified
     * @param {Object} [ctx] Context of callbacks execution
     * @returns {vow:Promise} A new promise, see https://github.com/promises-aplus/promises-spec for details
     */
    then : function(onFulfilled, onRejected, onProgress, ctx) {
        var defer = new Deferred();
        this._addCallbacks(defer, onFulfilled, onRejected, onProgress, ctx);
        return defer.promise();
    },

    /**
     * Adds rejection reaction only. It is shortcut for `promise.then(undefined, onRejected)`.
     *
     * @param {Function} onRejected Callback to be called with the value after promise has been rejected
     * @param {Object} [ctx] Context of callback execution
     * @returns {vow:Promise}
     */
    'catch' : function(onRejected, ctx) {
        return this.then(undef, onRejected, ctx);
    },

    /**
     * Adds rejection reaction only. It is shortcut for `promise.then(null, onRejected)`. It's alias for `catch`.
     *
     * @param {Function} onRejected Callback to be called with the value after promise has been rejected
     * @param {Object} [ctx] Context of callback execution
     * @returns {vow:Promise}
     */
    fail : function(onRejected, ctx) {
        return this.then(undef, onRejected, ctx);
    },

    /**
     * Adds resolving reaction (to fulfillment and rejection both).
     *
     * @param {Function} onResolved Callback that to be called with the value after promise has been rejected
     * @param {Object} [ctx] Context of callback execution
     * @returns {vow:Promise}
     */
    always : function(onResolved, ctx) {
        var _this = this,
            cb = function() {
                return onResolved.call(this, _this);
            };

        return this.then(cb, cb, ctx);
    },

    /**
     * Adds progress reaction.
     *
     * @param {Function} onProgress Callback to be called with the value when promise has been notified
     * @param {Object} [ctx] Context of callback execution
     * @returns {vow:Promise}
     */
    progress : function(onProgress, ctx) {
        return this.then(undef, undef, onProgress, ctx);
    },

    /**
     * Like `promise.then`, but "spreads" the array into a variadic value handler.
     * It is useful with `vow.all` and `vow.allResolved` methods.
     *
     * @param {Function} [onFulfilled] Callback that will to be invoked with the value after promise has been fulfilled
     * @param {Function} [onRejected] Callback that will to be invoked with the reason after promise has been rejected
     * @param {Object} [ctx] Context of callbacks execution
     * @returns {vow:Promise}
     *
     * @example
     * ```js
     * var defer1 = vow.defer(),
     *     defer2 = vow.defer();
     *
     * vow.all([defer1.promise(), defer2.promise()]).spread(function(arg1, arg2) {
     *     // arg1 is "1", arg2 is "'two'" here
     * });
     *
     * defer1.resolve(1);
     * defer2.resolve('two');
     * ```
     */
    spread : function(onFulfilled, onRejected, ctx) {
        return this.then(
            function(val) {
                return onFulfilled.apply(this, val);
            },
            onRejected,
            ctx);
    },

    /**
     * Like `then`, but terminates a chain of promises.
     * If the promise has been rejected, throws it as an exception in a future turn of the event loop.
     *
     * @param {Function} [onFulfilled] Callback that will to be invoked with the value after promise has been fulfilled
     * @param {Function} [onRejected] Callback that will to be invoked with the reason after promise has been rejected
     * @param {Function} [onProgress] Callback that will to be invoked with the value after promise has been notified
     * @param {Object} [ctx] Context of callbacks execution
     *
     * @example
     * ```js
     * var defer = vow.defer();
     * defer.reject(Error('Internal error'));
     * defer.promise().done(); // exception to be thrown
     * ```
     */
    done : function(onFulfilled, onRejected, onProgress, ctx) {
        this
            .then(onFulfilled, onRejected, onProgress, ctx)
            .fail(throwException);
    },

    /**
     * Returns a new promise that will be fulfilled in `delay` milliseconds if the promise is fulfilled,
     * or immediately rejected if promise is rejected.
     *
     * @param {Number} delay
     * @returns {vow:Promise}
     */
    delay : function(delay) {
        var timer,
            promise = this.then(function(val) {
                var defer = new Deferred();
                timer = setTimeout(
                    function() {
                        defer.resolve(val);
                    },
                    delay);

                return defer.promise();
            });

        promise.always(function() {
            clearTimeout(timer);
        });

        return promise;
    },

    /**
     * Returns a new promise that will be rejected in `timeout` milliseconds
     * if the promise is not resolved beforehand.
     *
     * @param {Number} timeout
     * @returns {vow:Promise}
     *
     * @example
     * ```js
     * var defer = vow.defer(),
     *     promiseWithTimeout1 = defer.promise().timeout(50),
     *     promiseWithTimeout2 = defer.promise().timeout(200);
     *
     * setTimeout(
     *     function() {
     *         defer.resolve('ok');
     *     },
     *     100);
     *
     * promiseWithTimeout1.fail(function(reason) {
     *     // promiseWithTimeout to be rejected in 50ms
     * });
     *
     * promiseWithTimeout2.then(function(value) {
     *     // promiseWithTimeout to be fulfilled with "'ok'" value
     * });
     * ```
     */
    timeout : function(timeout) {
        var defer = new Deferred(),
            timer = setTimeout(
                function() {
                    defer.reject(new vow.TimedOutError('timed out'));
                },
                timeout);

        this.then(
            function(val) {
                defer.resolve(val);
            },
            function(reason) {
                defer.reject(reason);
            });

        defer.promise().always(function() {
            clearTimeout(timer);
        });

        return defer.promise();
    },

    _vow : true,

    _resolve : function(val) {
        if(this._status > PROMISE_STATUS.RESOLVED) {
            return;
        }

        if(val === this) {
            this._reject(TypeError('Can\'t resolve promise with itself'));
            return;
        }

        this._status = PROMISE_STATUS.RESOLVED;

        if(val && !!val._vow) { // shortpath for vow.Promise
            val.isFulfilled()?
                this._fulfill(val.valueOf()) :
                val.isRejected()?
                    this._reject(val.valueOf()) :
                    val.then(
                        this._fulfill,
                        this._reject,
                        this._notify,
                        this);
            return;
        }

        if(isObject(val) || isFunction(val)) {
            var then;
            try {
                then = val.then;
            }
            catch(e) {
                this._reject(e);
                return;
            }

            if(isFunction(then)) {
                var _this = this,
                    isResolved = false;

                try {
                    then.call(
                        val,
                        function(val) {
                            if(isResolved) {
                                return;
                            }

                            isResolved = true;
                            _this._resolve(val);
                        },
                        function(err) {
                            if(isResolved) {
                                return;
                            }

                            isResolved = true;
                            _this._reject(err);
                        },
                        function(val) {
                            _this._notify(val);
                        });
                }
                catch(e) {
                    isResolved || this._reject(e);
                }

                return;
            }
        }

        this._fulfill(val);
    },

    _fulfill : function(val) {
        if(this._status > PROMISE_STATUS.RESOLVED) {
            return;
        }

        this._status = PROMISE_STATUS.FULFILLED;
        this._value = val;

        this._callCallbacks(this._fulfilledCallbacks, val);
        this._fulfilledCallbacks = this._rejectedCallbacks = this._progressCallbacks = undef;
    },

    _reject : function(reason) {
        if(this._status > PROMISE_STATUS.RESOLVED) {
            return;
        }

        this._status = PROMISE_STATUS.REJECTED;
        this._value = reason;

        this._callCallbacks(this._rejectedCallbacks, reason);
        this._fulfilledCallbacks = this._rejectedCallbacks = this._progressCallbacks = undef;
    },

    _notify : function(val) {
        this._callCallbacks(this._progressCallbacks, val);
    },

    _addCallbacks : function(defer, onFulfilled, onRejected, onProgress, ctx) {
        if(onRejected && !isFunction(onRejected)) {
            ctx = onRejected;
            onRejected = undef;
        }
        else if(onProgress && !isFunction(onProgress)) {
            ctx = onProgress;
            onProgress = undef;
        }

        var cb;

        if(!this.isRejected()) {
            cb = { defer : defer, fn : isFunction(onFulfilled)? onFulfilled : undef, ctx : ctx };
            this.isFulfilled()?
                this._callCallbacks([cb], this._value) :
                this._fulfilledCallbacks.push(cb);
        }

        if(!this.isFulfilled()) {
            cb = { defer : defer, fn : onRejected, ctx : ctx };
            this.isRejected()?
                this._callCallbacks([cb], this._value) :
                this._rejectedCallbacks.push(cb);
        }

        if(this._status <= PROMISE_STATUS.RESOLVED) {
            this._progressCallbacks.push({ defer : defer, fn : onProgress, ctx : ctx });
        }
    },

    _callCallbacks : function(callbacks, arg) {
        var len = callbacks.length;
        if(!len) {
            return;
        }

        var isResolved = this.isResolved(),
            isFulfilled = this.isFulfilled();

        nextTick(function() {
            var i = 0, cb, defer, fn;
            while(i < len) {
                cb = callbacks[i++];
                defer = cb.defer;
                fn = cb.fn;

                if(fn) {
                    var ctx = cb.ctx,
                        res;
                    try {
                        res = ctx? fn.call(ctx, arg) : fn(arg);
                    }
                    catch(e) {
                        defer.reject(e);
                        continue;
                    }

                    isResolved?
                        defer.resolve(res) :
                        defer.notify(res);
                }
                else {
                    isResolved?
                        isFulfilled?
                            defer.resolve(arg) :
                            defer.reject(arg) :
                        defer.notify(arg);
                }
            }
        });
    }
};

/** @lends Promise */
var staticMethods = {
    /**
     * Coerces given `value` to a promise, or returns the `value` if it's already a promise.
     *
     * @param {*} value
     * @returns {vow:Promise}
     */
    cast : function(value) {
        return vow.cast(value);
    },

    /**
     * Returns a promise to be fulfilled only after all the items in `iterable` are fulfilled,
     * or to be rejected when any of the `iterable` is rejected.
     *
     * @param {Array|Object} iterable
     * @returns {vow:Promise}
     */
    all : function(iterable) {
        return vow.all(iterable);
    },

    /**
     * Returns a promise to be fulfilled only when any of the items in `iterable` are fulfilled,
     * or to be rejected when the first item is rejected.
     *
     * @param {Array} iterable
     * @returns {vow:Promise}
     */
    race : function(iterable) {
        return vow.anyResolved(iterable);
    },

    /**
     * Returns a promise that has already been resolved with the given `value`.
     * If `value` is a promise, returned promise will be adopted with the state of given promise.
     *
     * @param {*} value
     * @returns {vow:Promise}
     */
    resolve : function(value) {
        return vow.resolve(value);
    },

    /**
     * Returns a promise that has already been rejected with the given `reason`.
     *
     * @param {*} reason
     * @returns {vow:Promise}
     */
    reject : function(reason) {
        return vow.reject(reason);
    }
};

for(var prop in staticMethods) {
    staticMethods.hasOwnProperty(prop) &&
        (Promise[prop] = staticMethods[prop]);
}

var vow = /** @exports vow */ {
    Deferred : Deferred,

    Promise : Promise,

    /**
     * Creates a new deferred. This method is a factory method for `vow:Deferred` class.
     * It's equivalent to `new vow.Deferred()`.
     *
     * @returns {vow:Deferred}
     */
    defer : function() {
        return new Deferred();
    },

    /**
     * Static equivalent to `promise.then`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @param {Function} [onFulfilled] Callback that will to be invoked with the value after promise has been fulfilled
     * @param {Function} [onRejected] Callback that will to be invoked with the reason after promise has been rejected
     * @param {Function} [onProgress] Callback that will to be invoked with the value after promise has been notified
     * @param {Object} [ctx] Context of callbacks execution
     * @returns {vow:Promise}
     */
    when : function(value, onFulfilled, onRejected, onProgress, ctx) {
        return vow.cast(value).then(onFulfilled, onRejected, onProgress, ctx);
    },

    /**
     * Static equivalent to `promise.fail`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @param {Function} onRejected Callback that will to be invoked with the reason after promise has been rejected
     * @param {Object} [ctx] Context of callback execution
     * @returns {vow:Promise}
     */
    fail : function(value, onRejected, ctx) {
        return vow.when(value, undef, onRejected, ctx);
    },

    /**
     * Static equivalent to `promise.always`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @param {Function} onResolved Callback that will to be invoked with the reason after promise has been resolved
     * @param {Object} [ctx] Context of callback execution
     * @returns {vow:Promise}
     */
    always : function(value, onResolved, ctx) {
        return vow.when(value).always(onResolved, ctx);
    },

    /**
     * Static equivalent to `promise.progress`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @param {Function} onProgress Callback that will to be invoked with the reason after promise has been notified
     * @param {Object} [ctx] Context of callback execution
     * @returns {vow:Promise}
     */
    progress : function(value, onProgress, ctx) {
        return vow.when(value).progress(onProgress, ctx);
    },

    /**
     * Static equivalent to `promise.spread`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @param {Function} [onFulfilled] Callback that will to be invoked with the value after promise has been fulfilled
     * @param {Function} [onRejected] Callback that will to be invoked with the reason after promise has been rejected
     * @param {Object} [ctx] Context of callbacks execution
     * @returns {vow:Promise}
     */
    spread : function(value, onFulfilled, onRejected, ctx) {
        return vow.when(value).spread(onFulfilled, onRejected, ctx);
    },

    /**
     * Static equivalent to `promise.done`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @param {Function} [onFulfilled] Callback that will to be invoked with the value after promise has been fulfilled
     * @param {Function} [onRejected] Callback that will to be invoked with the reason after promise has been rejected
     * @param {Function} [onProgress] Callback that will to be invoked with the value after promise has been notified
     * @param {Object} [ctx] Context of callbacks execution
     */
    done : function(value, onFulfilled, onRejected, onProgress, ctx) {
        vow.when(value).done(onFulfilled, onRejected, onProgress, ctx);
    },

    /**
     * Checks whether the given `value` is a promise-like object
     *
     * @param {*} value
     * @returns {Boolean}
     *
     * @example
     * ```js
     * vow.isPromise('something'); // returns false
     * vow.isPromise(vow.defer().promise()); // returns true
     * vow.isPromise({ then : function() { }); // returns true
     * ```
     */
    isPromise : function(value) {
        return isObject(value) && isFunction(value.then);
    },

    /**
     * Coerces given `value` to a promise, or returns the `value` if it's already a promise.
     *
     * @param {*} value
     * @returns {vow:Promise}
     */
    cast : function(value) {
        return vow.isPromise(value)?
            value :
            vow.resolve(value);
    },

    /**
     * Static equivalent to `promise.valueOf`.
     * If given `value` is not an instance of `vow.Promise`, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @returns {*}
     */
    valueOf : function(value) {
        return value && isFunction(value.valueOf)? value.valueOf() : value;
    },

    /**
     * Static equivalent to `promise.isFulfilled`.
     * If given `value` is not an instance of `vow.Promise`, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @returns {Boolean}
     */
    isFulfilled : function(value) {
        return value && isFunction(value.isFulfilled)? value.isFulfilled() : true;
    },

    /**
     * Static equivalent to `promise.isRejected`.
     * If given `value` is not an instance of `vow.Promise`, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @returns {Boolean}
     */
    isRejected : function(value) {
        return value && isFunction(value.isRejected)? value.isRejected() : false;
    },

    /**
     * Static equivalent to `promise.isResolved`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @returns {Boolean}
     */
    isResolved : function(value) {
        return value && isFunction(value.isResolved)? value.isResolved() : true;
    },

    /**
     * Returns a promise that has already been resolved with the given `value`.
     * If `value` is a promise, returned promise will be adopted with the state of given promise.
     *
     * @param {*} value
     * @returns {vow:Promise}
     */
    resolve : function(value) {
        var res = vow.defer();
        res.resolve(value);
        return res.promise();
    },

    /**
     * Returns a promise that has already been fulfilled with the given `value`.
     * If `value` is a promise, returned promise will be fulfilled with fulfill/rejection value of given promise.
     *
     * @param {*} value
     * @returns {vow:Promise}
     */
    fulfill : function(value) {
        var defer = vow.defer(),
            promise = defer.promise();

        defer.resolve(value);

        return promise.isFulfilled()?
            promise :
            promise.then(null, function(reason) {
                return reason;
            });
    },

    /**
     * Returns a promise that has already been rejected with the given `reason`.
     * If `reason` is a promise, returned promise will be rejected with fulfill/rejection value of given promise.
     *
     * @param {*} reason
     * @returns {vow:Promise}
     */
    reject : function(reason) {
        var defer = vow.defer();
        defer.reject(reason);
        return defer.promise();
    },

    /**
     * Invokes a given function `fn` with arguments `args`
     *
     * @param {Function} fn
     * @param {...*} [args]
     * @returns {vow:Promise}
     *
     * @example
     * ```js
     * var promise1 = vow.invoke(function(value) {
     *         return value;
     *     }, 'ok'),
     *     promise2 = vow.invoke(function() {
     *         throw Error();
     *     });
     *
     * promise1.isFulfilled(); // true
     * promise1.valueOf(); // 'ok'
     * promise2.isRejected(); // true
     * promise2.valueOf(); // instance of Error
     * ```
     */
    invoke : function(fn, args) {
        var len = Math.max(arguments.length - 1, 0),
            callArgs;
        if(len) { // optimization for V8
            callArgs = Array(len);
            var i = 0;
            while(i < len) {
                callArgs[i++] = arguments[i];
            }
        }

        try {
            return vow.resolve(callArgs?
                fn.apply(global, callArgs) :
                fn.call(global));
        }
        catch(e) {
            return vow.reject(e);
        }
    },

    /**
     * Returns a promise to be fulfilled only after all the items in `iterable` are fulfilled,
     * or to be rejected when any of the `iterable` is rejected.
     *
     * @param {Array|Object} iterable
     * @returns {vow:Promise}
     *
     * @example
     * with array:
     * ```js
     * var defer1 = vow.defer(),
     *     defer2 = vow.defer();
     *
     * vow.all([defer1.promise(), defer2.promise(), 3])
     *     .then(function(value) {
     *          // value is "[1, 2, 3]" here
     *     });
     *
     * defer1.resolve(1);
     * defer2.resolve(2);
     * ```
     *
     * @example
     * with object:
     * ```js
     * var defer1 = vow.defer(),
     *     defer2 = vow.defer();
     *
     * vow.all({ p1 : defer1.promise(), p2 : defer2.promise(), p3 : 3 })
     *     .then(function(value) {
     *          // value is "{ p1 : 1, p2 : 2, p3 : 3 }" here
     *     });
     *
     * defer1.resolve(1);
     * defer2.resolve(2);
     * ```
     */
    all : function(iterable) {
        var defer = new Deferred(),
            isPromisesArray = isArray(iterable),
            keys = isPromisesArray?
                getArrayKeys(iterable) :
                getObjectKeys(iterable),
            len = keys.length,
            res = isPromisesArray? [] : {};

        if(!len) {
            defer.resolve(res);
            return defer.promise();
        }

        var i = len;
        vow._forEach(
            iterable,
            function(value, idx) {
                res[keys[idx]] = value;
                if(!--i) {
                    defer.resolve(res);
                }
            },
            defer.reject,
            defer.notify,
            defer,
            keys);

        return defer.promise();
    },

    /**
     * Returns a promise to be fulfilled only after all the items in `iterable` are resolved.
     *
     * @param {Array|Object} iterable
     * @returns {vow:Promise}
     *
     * @example
     * ```js
     * var defer1 = vow.defer(),
     *     defer2 = vow.defer();
     *
     * vow.allResolved([defer1.promise(), defer2.promise()]).spread(function(promise1, promise2) {
     *     promise1.isRejected(); // returns true
     *     promise1.valueOf(); // returns "'error'"
     *     promise2.isFulfilled(); // returns true
     *     promise2.valueOf(); // returns "'ok'"
     * });
     *
     * defer1.reject('error');
     * defer2.resolve('ok');
     * ```
     */
    allResolved : function(iterable) {
        var defer = new Deferred(),
            isPromisesArray = isArray(iterable),
            keys = isPromisesArray?
                getArrayKeys(iterable) :
                getObjectKeys(iterable),
            i = keys.length,
            res = isPromisesArray? [] : {};

        if(!i) {
            defer.resolve(res);
            return defer.promise();
        }

        var onResolved = function() {
                --i || defer.resolve(iterable);
            };

        vow._forEach(
            iterable,
            onResolved,
            onResolved,
            defer.notify,
            defer,
            keys);

        return defer.promise();
    },

    allPatiently : function(iterable) {
        return vow.allResolved(iterable).then(function() {
            var isPromisesArray = isArray(iterable),
                keys = isPromisesArray?
                    getArrayKeys(iterable) :
                    getObjectKeys(iterable),
                rejectedPromises, fulfilledPromises,
                len = keys.length, i = 0, key, promise;

            if(!len) {
                return isPromisesArray? [] : {};
            }

            while(i < len) {
                key = keys[i++];
                promise = iterable[key];
                if(vow.isRejected(promise)) {
                    rejectedPromises || (rejectedPromises = isPromisesArray? [] : {});
                    isPromisesArray?
                        rejectedPromises.push(promise.valueOf()) :
                        rejectedPromises[key] = promise.valueOf();
                }
                else if(!rejectedPromises) {
                    (fulfilledPromises || (fulfilledPromises = isPromisesArray? [] : {}))[key] = vow.valueOf(promise);
                }
            }

            if(rejectedPromises) {
                throw rejectedPromises;
            }

            return fulfilledPromises;
        });
    },

    /**
     * Returns a promise to be fulfilled only when any of the items in `iterable` is fulfilled,
     * or to be rejected when all the items are rejected (with the reason of the first rejected item).
     *
     * @param {Array} iterable
     * @returns {vow:Promise}
     */
    any : function(iterable) {
        var defer = new Deferred(),
            len = iterable.length;

        if(!len) {
            defer.reject(Error());
            return defer.promise();
        }

        var i = 0, reason;
        vow._forEach(
            iterable,
            defer.resolve,
            function(e) {
                i || (reason = e);
                ++i === len && defer.reject(reason);
            },
            defer.notify,
            defer);

        return defer.promise();
    },

    /**
     * Returns a promise to be fulfilled only when any of the items in `iterable` is fulfilled,
     * or to be rejected when the first item is rejected.
     *
     * @param {Array} iterable
     * @returns {vow:Promise}
     */
    anyResolved : function(iterable) {
        var defer = new Deferred(),
            len = iterable.length;

        if(!len) {
            defer.reject(Error());
            return defer.promise();
        }

        vow._forEach(
            iterable,
            defer.resolve,
            defer.reject,
            defer.notify,
            defer);

        return defer.promise();
    },

    /**
     * Static equivalent to `promise.delay`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @param {Number} delay
     * @returns {vow:Promise}
     */
    delay : function(value, delay) {
        return vow.resolve(value).delay(delay);
    },

    /**
     * Static equivalent to `promise.timeout`.
     * If given `value` is not a promise, then `value` is equivalent to fulfilled promise.
     *
     * @param {*} value
     * @param {Number} timeout
     * @returns {vow:Promise}
     */
    timeout : function(value, timeout) {
        return vow.resolve(value).timeout(timeout);
    },

    _forEach : function(promises, onFulfilled, onRejected, onProgress, ctx, keys) {
        var len = keys? keys.length : promises.length,
            i = 0;

        while(i < len) {
            vow.when(
                promises[keys? keys[i] : i],
                wrapOnFulfilled(onFulfilled, i),
                onRejected,
                onProgress,
                ctx);
            ++i;
        }
    },

    TimedOutError : defineCustomErrorType('TimedOut')
};

var defineAsGlobal = true;
if(typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = vow;
    defineAsGlobal = false;
}

if(typeof modules === 'object' && isFunction(modules.define)) {
    modules.define('vow', function(provide) {
        provide(vow);
    });
    defineAsGlobal = false;
}

if(typeof define === 'function') {
    define(function(require, exports, module) {
        module.exports = vow;
    });
    defineAsGlobal = false;
}

defineAsGlobal && (global.vow = vow);

})(this);

/* ../../libs/bem-core/common.blocks/vow/vow.vanilla.js end */
;
/* ../../desktop.blocks/manager/manager.browser.js begin */
/* global modules:false */

modules.define('manager', 
	['i-bem__dom', 'events__channels', 'request', 'vow', 'vow-queue', 'state', 'path-normalizer', 'state-controller'], 
	function(provide, BEMDOM, channels, request, vow, Queue, state, normalizer, sc) {

var com = channels('116'),
	normalize = normalizer.normalize;

provide(BEMDOM.decl(this.name, {
    onSetMod : {
        'js' : {
            'inited' : function() {
				this._control = this.findBlockInside('control-group').domElem;
				this._popup = this.findBlockInside('popup');
				this._confirm = this.findBlockInside('confirm');
				this._disabler = this.findBlockInside('disabler');
				
				// subscribing for buttons clicks and menu states 
				BEMDOM.blocks['menu'].on({ modName : 'focused', modVal : true }, this._stubMenusState, this);
				BEMDOM.blocks['button'].on(this._control, 'click', this._onButtonClick, this);

				// command button click handlers
				com.on('disable', this._disable, this);
				com.on('enable', this._enable, this);
				com.on('config-ready', function() { this.findBlocksInside('panel'); this._disabler.setMod('disabled', 'true'); }, this);
				com.on('copy', this._copy, this);
				com.on('mkdir', this._mkdir, this);
				com.on('symlink', this._symlink, this);
				com.on('hardlink', this._hardlink, this);
				com.on('move', this._move, this);
				com.on('delete', this._delete, this);
				com.on('download', this._download, this);
				com.on('all', this._selectAll, this);
				com.on('inverse', this._inverseSelection, this);
				com.on('deselect', this._selectNone, this);
				com.on('levelup', this._levelUp, this);

			   	// this.logEvents();
            }
        }
    },

    logEvents: function(e, data) {
		com.on('*', function(e, data){console.log(e.type);})     	
    },

    getActiveItems : function() {
		return this._activeMenu ? this._activeMenu.getVal() : null;
    },

    getActiveMenu: function() {
		if (this._activeMenu) {
			return this._activeMenu
		}     	
    },

    getInactiveMenu: function() {
		if (this._inactiveMenuPosition) {
			var _inactive = this.findBlockInside(
				{ 
					block: 'menu', 
					modName: 'position',
					modVal: this._inactiveMenuPosition 
				}
			);

			return _inactive;
		}     	
    },

    reselectActiveMenu: function() {
		this._activeMenu && this._activeMenu.setMod('focused');
    },

    _onButtonClick : function(e) {
		var _name = e.target.domElem.context.name;
		
		com.emit(_name);
    },

    _stubMenusState : function(e) {
    	if(e.target.hasMod('panel')) {
			this._activeMenu = e.target;
			this._activeMenuPosition = this._activeMenu.getMod('position');
			this._activeMenu.setMod('active');

			this._inactiveMenuPosition = this._activeMenuPosition === 'left' ? 'right' : 'left';
			this._inactiveMenuPath = state.getCurPath(this._inactiveMenuPosition);
			this._inactiveMenu = this.getInactiveMenu();

			this._inactiveMenu && this._inactiveMenu.hasMod('active') && this._inactiveMenu.delMod('active');
    	}

    },

    _getConfirm: function(message) {
		return this._confirm.getConfirm(message);
    },

    _disable: function() {
        this.findBlockInside('control-group').findBlocksInside('button').forEach(function(item){ item.setMod('disabled')} );
        this.findBlocksInside('panel').forEach(function(item){ item.setMod('disabled')} );
    },

    _enable: function() {
        this.findBlockInside('control-group').findBlocksInside('button').forEach(function(item){ item.delMod('disabled')} );
        this.findBlocksInside('panel').forEach(function(item){ item.delMod('disabled')} );
    },

    _levelUp : function() {
    	var _position = this.getActiveMenu().getMod('position'),
	    	_destination = normalize(state.getCurPath(_position) + '/..');

        com.emit('set-path-' + _position, _destination);
        com.emit('path-'     + _position, _destination);  	
    },

	_selectAll: function(e, data) {
		var items = this._activeMenu ? this._activeMenu.findBlocksInside('menu-item') : null;

		items && items.forEach(function(item){ 
			!item.hasMod('toplevel') && item.setMod('checked');	
		});

		this.reselectActiveMenu();
    },

	_selectNone: function(e, data) {
		var items = this._activeMenu ? this._activeMenu.findBlocksInside('menu-item') : null;

		items && items.forEach(function(item){ 
			!item.hasMod('toplevel') && item.hasMod('checked') && item.delMod('checked');	
		});

		this.reselectActiveMenu();
    },

	_inverseSelection: function(e, data) {
		var items = this._activeMenu ? this._activeMenu.findBlocksInside('menu-item') : null;

		items && items.forEach(function(item){
			item.toggleMod('checked');
		});

		this.reselectActiveMenu();
    },

	_download: function(e, data) {
		var items = this.getActiveItems();

		items.length && items.forEach(function(item){
			var spec = { name: state.getName(item),	path: item };
			request.download(spec);
		}, this);

		this._activeMenu.setVal([]);
		this.reselectActiveMenu();
    },


    /*
    * Displays the dialog window and executes the provided callback if user confirmes the action.
    * @exports
    * @param {Function} cb Callback to run on confirmation. It will receives as first arguments array of items and answer object as second.
    * @param {String} action Action type for the confirmation dialog. 
    * @param {Object} [options] Additional options.  
    * You could pass as the "options" argument:
	* 	{ 
	*		destination : true  To enable the destination input in dialog window. 
	*		force : true  To force callback execution even if the user did not confirmed the action.
	*	}
    */

	askAndRun: function(cb, action, options) {
		var confirm,
			_destination,
			_path = state.getCurPath(this._activeMenuPosition),
			items = this.getActiveItems(),

			_performTheAction = function(answer){ 
				if (answer === 'true' || answer.answer === 'true' || options.force) {
					this._activeMenu.setVal([]);
					delete this._activeMenu;

					cb(items, answer);
				}

				this.reselectActiveMenu();
			};

		options || (options = {});

		_destination = options.destination ? state.getCurPath(this._inactiveMenuPosition) : null;

		if (items.length){
			confirm = this._confirm.getConfirm(action, items, _path, _destination);
		} else { return }

		confirm && confirm.then(_performTheAction.bind(this));
    },

	_mkdir: function(e) {
		var confirm,
			_path = state.getCurPath(this._activeMenuPosition);

			_makeIfTrue = function(answer){ 
				if (answer.answer === 'true') {
					request.mkDir(_path + '/' + answer.destination);
				}

				this.reselectActiveMenu();
			};

		confirm = this._confirm.getSimple('mkdir');
		confirm && confirm.then(_makeIfTrue.bind(this));
    },

	_move: function(e) {
		var _cb = function(items, answer){ 	request.move(items, answer.destination); };

		this.askAndRun(_cb, e.type, { destination : true });
    },

	_copy: function(e) {
		var _cb = function(items, answer){ request.copy(items, answer.destination); };

		this.askAndRun(_cb, e.type, { destination : true });
    },

	_symlink: function(e) {
		var _cb = function(items, answer){ request.symlink(items, answer.destination); };

		this.askAndRun(_cb, e.type, { destination : true });
    },

	_hardlink: function(e) {
		var _cb = function(items, answer){ request.hardlink(items, answer.destination); };

		this.askAndRun(_cb, e.type, { destination : true });
    },

	_delete: function(e) {
		var _cb = function(items, answer){
				var _deleteSuccess = function(resp, spec) {
					var _obj = state.getObj(spec.data.path);

					com.emit('updated-item-' + _obj.getMod('position'));

				   	BEMDOM.destruct(_obj.domElem);
				   	state.dropItemByPath(spec.data.path);
			    };

				request.delete(items, _deleteSuccess);
		};

		this.askAndRun(_cb, e.type);
    }
}));
});

/* ../../desktop.blocks/manager/manager.browser.js end */
;
/* ../../common.blocks/path-normalizer/path-normalizer.browser.js begin */
// Normalize method is taken from "path" Node.js module almost without changes. 
// The original license is provided below.

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

modules.define('path-normalizer', function(provide) {

  var _isAbsolute = function(path) {
    return path.charAt(0) === '/';
  },
  
  normalizeArray = function(parts, allowAboveRoot) {
	  // if the path tries to go above the root, `up` ends up > 0
	  var up = 0;
	  for (var i = parts.length - 1; i >= 0; i--) {
	    var last = parts[i];
	    if (last === '.') {
	      parts.splice(i, 1);
	    } else if (last === '..') {
	      parts.splice(i, 1);
	      up++;
	    } else if (up) {
	      parts.splice(i, 1);
	      up--;
	    }
	  }

	  // if the path is allowed to go above the root, restore leading ..s
	  if (allowAboveRoot) {
	    for (; up--; up) {
	      parts.unshift('..');
	    }
	  }

	  return parts;
	},

	normalize = function(path) {
	    var isAbsolute = _isAbsolute(path),
	        trailingSlash = path[path.length - 1] === '/',
	        segments = path.split('/'),
	        nonEmptySegments = [];

	    // Normalize the path
	    for (var i = 0; i < segments.length; i++) {
	      if (segments[i]) {
	        nonEmptySegments.push(segments[i]);
	      }
	    }
	    path = normalizeArray(nonEmptySegments, !isAbsolute).join('/');

	    if (!path && !isAbsolute) {
	      path = '.';
	    }
	    if (path && trailingSlash) {
	      path += '/';
	    }

	    return (isAbsolute ? '/' : '') + path;
	};

provide({ normalize: normalize });

});


/* ../../common.blocks/path-normalizer/path-normalizer.browser.js end */
;
/* ../../common.blocks/state/state.browser.js begin */
/* global modules:false */

modules.define('state', ['events__channels', 'size', 'identify', 'objects', 'path-normalizer'], 
	function(provide, channels, size, identify, objects, normalizer) {
	var com = channels('116'),
        normalize = normalizer.normalize,
		state = { 
			curList: {}, 
			curPath: {}, 
			lists: {}, 
			config: null, 
			disks:  null, 
			activeDriveIndex : { 'left' : 0, 'right' : 0 } 
		},
		ids = {},
		paths = {},

		_init = function(path, extension){
			var _path = normalize(path);

			paths[_path] && extension && (paths[_path] = objects.extend(paths[_path], extension));
			paths[_path] || (paths[_path] = objects.extend({ 
				readable: null, 
				stat: null, 
				dir: null, 
				link: null, 
				name: null, 
				id: null 
			}, extension ? extension : {}));
		},
		
		api = {
			isDir: function(path){
				var _path = normalize(path);

				return paths[_path] ? paths[_path].dir : null; 
			},

			setDir: function(path, value){ 
				_init(path, { dir: value });
			},

			isLink: function(path){ 
				var _path = normalize(path);

				return paths[_path] ? paths[_path].link : null; 
			},

			setLink: function(path, value){ 
				_init(path, { link: value });
			},

			getStates: function(path){
				var _path = normalize(path);

				return paths[_path] ? paths[_path].stat : null; 
			},

			wipeItemProps: function(path){
				var _path = normalize(path);

				if(paths[_path]) {
					paths[_path].readable = null; 
					paths[_path].stat = null; 
					paths[_path].name = null; 
				}
			},

			setStates: function(path, stat){ 
				_init(path, { stat: stat }); 
			},

			getState: function(path, state){ 
				var _path = normalize(path);

				if(paths[_path]) { 
					if(paths[_path].stat && paths[_path].stat[state]) {
						return paths[_path].stat[state]; 
					}
					else { return null }
				}
				else { return null }
			},

			getName: function(path){
				var _path = normalize(path);

				return paths[_path] ? paths[_path].name : null; 
			},

			setName: function(path, name){ 
				_init(path, { name: name });
			},

			getObj: function(path){
				var _path = normalize(path);

				return paths[_path] ? paths[_path].obj : null; 
			},

			setObj: function(path, obj){ 
				_init(path, { obj: obj });
			},

			getReadableStates: function(path){
				var _path = normalize(path);

				return paths[_path] ? paths[_path].readable : null; 
			},

			setReadableStates: function(path, states){ 
				_init(path, { readable: states });
			},

			getReadableState: function(path, state){ 
				var _path = normalize(path);

				if(paths[_path]) { 
					if(paths[_path].readable && paths[_path].readable[state]) {
						return paths[_path].readable[state]; 
					}
					else { return null }
				}
				else { return null }
			},

			setReadableState: function(path, state, value){
				var _path = normalize(path);

				_init(_path);
				paths[_path] && paths[_path].readable && (paths[_path].readable[state] = value);
			},

			getCurList: function(align){ 
				return state.curList[align];
			},

			setCurList: function(align, list){ 
				state.curList[align] = list;
			},

			getDisks: function(){ 
				return state.disks;
			},

			setDisks: function(disks){ 
				state.disks = disks;
			},
			
			getActiveDriveIndex: function(position){ 
				return state.activeDriveIndex[position];
			},

			setActiveDriveIndex: function(position, index){ 
				state.activeDriveIndex[position] = index;
			},

			getCurPath: function(position){ 
				return state.curPath[position];
			},

			setCurPath: function(path, position){ 
				state.curPath[position] = normalize(path);
			},

			getConfig: function(){ 
				return state.config;
			},

			getClientConfig: function(){
				return state.config ? state.config.client : null;
			},

			setConfig: function(config){ 
				state.config = config;
			},

			getList: function(path){ 
				return state.lists[normalize(path)];
			},

			setList: function(path, list){ 
				state.lists[normalize(path)] = list;
			},

			getPathById: function(id){ 
				return ids[id];
			},

			dropItemById: function(id){ 
				var _path = ids[id];
				_path && delete path[_path];
				_path && delete ids[id];
			},

			dropItemByPath: function(path){
				var _path = normalize(path);

				if (paths[_path]){
					var _id = paths[_path].id;

					console.log('Deleting records for path \n' + paths[_path]);
					console.log(delete ids[_id]);
					console.log(delete path[_path]);
				}
			},

			moveItem: function(path, destination){
				var _path = normalize(path),
					_destination = normalize(destination);

				if (paths[_path]){
					var _id = paths[_path].id;

					paths[_destination] = paths[_path];
					api.dropItemByPath(path);
					ids[_id] = _destination;
				}
			},

			storeId: function(path, id){
				var _path = normalize(path);
				
				ids[id] = _path;
				paths[_path] || _init(path, { id: id });
			},

			getId: function(path){ 
				var _path = normalize(path),
					id;
				
				paths[_path] && (id = paths[_path].id);
				id || (id = identify());

				// updating the id if we don't store it yet
				api.getPathById(id) || api.storeId(_path, id);

				return id
			}
		};

provide(api);

});

/* ../../common.blocks/state/state.browser.js end */
;
/* ../../libs/bem-core/common.blocks/events/__channels/events__channels.vanilla.js begin */
/**
 * @module events__channels
 */

modules.define('events__channels', ['events'], function(provide, events) {

var undef,
    channels = {};

provide(
    /**
     * Returns/destroys a named communication channel
     * @exports
     * @param {String} [id='default'] Channel ID
     * @param {Boolean} [drop=false] Destroy the channel
     * @returns {events:Emitter|undefined} Communication channel
     */
    function(id, drop) {
        if(typeof id === 'boolean') {
            drop = id;
            id = undef;
        }

        id || (id = 'default');

        if(drop) {
            if(channels[id]) {
                channels[id].un();
                delete channels[id];
            }
            return;
        }

        return channels[id] || (channels[id] = new events.Emitter());
    });
});

/* ../../libs/bem-core/common.blocks/events/__channels/events__channels.vanilla.js end */
;
/* ../../common.blocks/size/size.vanilla.js begin */
/**
 * @module size
 * @description A function to convert file size from bytes representation to human readable format
 */

modules.define('size', function(provide) {
    /**
     * Converting a bytes value to a human readable representation
     * @param {Number} size
     * @returns {String}
     */

	var humanReadable = function(size){
		var formated,
			maybeRound = function(){
				if (formated == Math.round(formated)) {
					formated = Math.round(formated);
				}
			};

		if(size >= 1073741824){
			formated = (size / 1073741824).toFixed(2);
			maybeRound();
			formated = formated + ' Gb'
		}
		else if (size >= 1048576){
			formated = (size / 1048576).toFixed(1);
			maybeRound();
			formated = formated + ' Mb'
		}
		else if (size >= 1024){
			formated = (size / 1024).toFixed(1);
			maybeRound();
			formated = formated + ' Kb'
		}
		else {
			formated = size;
		}

		return formated
	}

provide(humanReadable);
});

/* ../../common.blocks/size/size.vanilla.js end */
;
/* ../../common.blocks/state-controller/state-controller.browser.js begin */
/* global modules:false */

modules.define('state-controller', ['events__channels', 'request', 'vow', 'path-normalizer', 'state', 'size', 'tick', 'idle'], 
function(provide, channels, request, vow, normalizer, state, size, tick, idle) {

var com = channels('116'),
	normalize = normalizer.normalize,

	_checkIfDir = function(e, data) {
		var _isDir = state.isDir(data.path),
		    _dirSuccess = function(resp, spec) {
		    	// store dir property for path
		    	state.setDir(data.path, resp);

		    	data.object._dirSuccess(resp);
		    };

		// checking if we already know is path a dir
		if(_isDir !== null) {
			data.object._dirSuccess(_isDir);
		}
		else {
			request.isDir(data.path, _dirSuccess, function(err){ console.log(err); });
		};
    },

	_lastPosition = 'left',

	_getStates = function(e, data) {
		var _state = state.getReadableStates(data.path),
	        _id = state.getId(data.path),

		    _statSuccess = function(resp, spec) {
		        var _ctime = new Date(resp.ctime),
			        readable = {
			        	ctime: _ctime.toLocaleString(),
						size: size(resp.size),
						uid: resp.uid,
						name: state.getName(data.path),
						type: 'file'
					};

		        data.object.updateContent(readable);
		    	
		    	state.setReadableStates(data.path, readable);
		    	state.setStates(data.path, resp);
		    };

		// checking if we already get states for path
		if(_state !== null) {
	        data.object.updateContent(_state);
		}
		else {
			request.getStates(data.path, _statSuccess);
		};
    },

	_getList = function(e, data) {
		var exist = state.getList(data.path),
		    _listSuccess = function(resp) {
		    	state.setList(data.path, resp);

			   	com.emit(data.position + '-list-is', resp);
		    },
		    _fail = function(resp){
		    	console.warn(resp);
		    };

		if(data.refresh || !exist) {
			request.getList(data.path, _listSuccess, _fail);
		}
		else {
			com.emit(data.position + '-list-is', exist);
		}
    },

	_updateState = function(e, data) {
		var position = _lastPosition === 'left' ? 'right' : 'left',
			path = state.getCurPath(position),
			oldList = state.getCurList(position),

		    _listSuccess = function(resp) {
		    	if (resp.disks){
					state.setDisks(resp.disks);
					com.emit('disks-changed');
		    	}

		    	var stillTheSame = resp.list.every(function(elem, index){
		    		return elem === oldList[index];
		    	});

		    	if(stillTheSame && oldList.length === resp.list.length){
		    		return
		    	} else {
			    	state.setCurList(position, resp.list);
			    	state.setList(path, resp.list);

				   	com.emit(position + '-list-is', resp.list);
		    	}
		    },

		    _fail = function(resp){
		    	console.warn(resp);
		    };

		_lastPosition = position;
		path && request.ping(path, _listSuccess, _fail);
    },

    boundToTick,
    frequency = 30,
    tickCount = 0,
    
    _bindToTick = function() {
        boundToTick = true;
        tick
            .on('tick', update) // подписываемся на событие tick 
            .start(); // запускаем генерацию события tick
        idle
            .on({
                idle : function() {
                    tick.un('tick', update); // по событию idle отписываемся от tick
                },
                wakeup : function() {
                    tick.on('tick', update); // по событию wakeup подписываемся обратно
                }
            })
            .start();
    },

    update = function() { 
    	if (tickCount <= state.getClientConfig().updateFrequency) {
    		tickCount += 1;
	    } else {
    		tickCount = 0;
    		_updateState();
	    }
	},

    _getConfig = function() {
    	var _sucscess = function(res) {
    		state.setConfig(res.conf);
    		com.emit('config-ready');

	    	if (res.disks){
				state.setDisks(res.disks);
				com.emit('disks-changed'); 
	    	}

			_bindToTick();
    	};

		request.getConfig('', _sucscess);
	},

    storeConfig = function() { 
    	var conf = state.getConfig();

		conf && request.setConfig({ data : JSON.stringify(conf) });
	};

_getConfig();

// internal actions – file type checks and statistic retrieving 
com.on('give-list', _getList, this);
com.on('is-dir', _checkIfDir, this);
com.on('state', _getStates, this);
com.on('config-updated', storeConfig, this);

provide({ storeConfig : storeConfig });

});

/* ../../common.blocks/state-controller/state-controller.browser.js end */
;
/* ../../common.blocks/config/config.vanilla.js begin */
/* global modules:false */

modules.define('config', function(provide) {

var server = {
		basePath: '/Users/ragnar/',
		defEncoding: 'utf-8',
		defLevel: 'desktop.bundles/'
	},
	client = {
		left: '/',
		right: '/',
		updateFrequency: 30, // the current list update interval in ticks. 1 tick = 50ms 
		messages: 
		{
			'delete': {
				SingleFile: 'You are about to delete the file\n',
				PluralFiles: 'Do you want to delete '
			},
			'copy': {
				SingleFile: 'Do you want to copy the file\n',
				PluralFiles: 'Do you want to copy ',
				hint: 'Choose an existing destination by typing the path. Folder recursive coppy not yet supported.'
			},
			'move': {
				SingleFile: 'Do you want to move the file\n',
				PluralFiles: 'Do you want to move ',
				hint: 'Choose an existing destination by typing the path.'
			},
			'symlink': {
				SingleFile: 'Do you want to make a symbolic link to file\n',
				PluralFiles: 'Do you want to make a symbolic links for the ',
				hint: 'Choose an existing destination by typing the path.'
			},
			'mkdir': {
				message: 'Enter the name for a new folder',
				hint: 'To specify the subfolers use a slash'
			}
		},

		queueSettings: {
        	'copy': {
				priority: 5, 
				weight: 30
        	},
        	'move': {
				priority: 5, 
				weight: 30
        	},
        	'read': {
				priority: 3, 
				weight: 20
        	},
        	'delete': {
				priority: 2, 
				weight: 5
        	},
        	'exist': {
				priority: 1, 
				weight: 3
        	},
        	'list': {
				priority: 1, 
				weight: 5
        	},
        	'isdir': {
				priority: 2, 
				weight: 3
        	},
        	'stat': {
				priority: 3, 
				weight: 5
        	},
        	'mkdir': {
				priority: 3, 
				weight: 5
        	}
        }
	};

provide({ 
	'server' : server,
	'client' : client
});

});

/* ../../common.blocks/config/config.vanilla.js end */
;
/* ../../common.blocks/request/request.browser.js begin */
/* global modules:false */

modules.define('request', 
	['events__channels', 'vow', 'jquery', 'vow-queue', 'querystring', 'next-tick', 'objects', 'state'], 
	function(provide, channels, vow, $, Queue, querystring, nxt, objects, state) {

var com = channels('116'),
	conf = state.getClientConfig,
	_counter = 0,

    _onSuccess = function(resp) {
		com.emit('refresh');
		console.log('Request completed and result is\n' + resp);
    },

	_specify = function(action, data) {
        var _def = { priority: 5, weight: 10 },
	        _settings = conf() && conf().queueSettings[action] ? 
		        conf().queueSettings[action] : _def,

	        _request = objects.extend({
	            type: 'GET',
	            dataType: 'html',
	            context: this,
	            url: '/' + action,
	            data: data,
	            cache: false
	        }, _settings ? _settings : _def);

        return _request;
	},

	_enqueRequest = function(spec, cb, onFail) {
	        var defer = vow.defer(),
		        _request = objects.extend(spec, {
			        error: function(resp){ defer.reject(resp) },
		            success: function(resp){ defer.resolve(resp) }
		        });

			this._queue || (this._queue = new Queue());

	        this._queue.enqueue(function(){ 
	        	$.ajax(_request); 
	        	return defer.promise(); 
	        }, spec)
	        .then(function(res) {
	        	var _result = JSON.parse(res);

				cb ? cb(_result, spec) : _onSuccess(_result);
	        }) 
	        .fail(function(res) {
	            onFail ? 
		            onFail(res):
			            console.error(res.responseText);
	        });
	        
	        this._queue.isStarted() || this._queue.start();
    },

	_formRequest = function(spec, cb, onFail) {
		var items = typeof spec.item === 'object' ? spec.item : null,
			_destination = spec.destination ? spec.destination : null,
			_enque = function(item){
				var _data = {},
					_request;

					if (typeof spec.data === 'string' && !_destination && !item) {
						_data = { path: spec.data };
					}
					else if (_destination) {
						_data = { destination: _destination, source: item };
						spec.data && (_data = objects.extend({}, spec.data, _data));
					}
					else {
						_data = spec.data ? objects.extend({}, spec.data, { path: item }) : { path: item };
					}

				_request = _specify(spec.action, _data);
				_enqueRequest(_request, cb, onFail);
			};

		items ? items.forEach(_enque, this) : _enque(spec.item); 	
    },

    _checkIfExist = function(e, data) {
        api.checkExist(data, function(result){
            com.emit('exist', _res);
        });
    },

	api = {

		isDir: function(item, cb, onFail) {
			_formRequest({ 
				item: item, 
				action: 'isdir' }, cb, onFail);
	    },

		delete: function(item, cb, onFail) {
			_formRequest({ 
				item: item, 
				action: 'delete' }, cb, onFail);
	    },

		read: function(item, cb, onFail) {
			_formRequest({ 
				item: item, 
				action: 'read' }, cb, onFail);
	    },

		getStates: function(item, cb, onFail) {
			_formRequest({ 
				item: item, 
				action: 'state' }, cb, onFail);
	    },

		getList: function(item, cb, onFail) {
			_formRequest({ 
				item: item, 
				action: 'list' }, cb, onFail);
	    },

		ping: function(item, cb, onFail) {
			_formRequest({ 
				item: item, 
				action: 'ping' }, cb, onFail);
	    },

		getConfig: function(item, cb, onFail) {
			_formRequest({ 
				item: item, 
				action: 'getconf' }, cb, onFail);
	    },

		setConfig: function(item, cb, onFail) {
			_formRequest({ 
				data: item, 
				action: 'setconf' }, cb, onFail);
	    },

		mkDir: function(item, cb, onFail) {
			_formRequest({ 
				item: item, 
				action: 'mkdir' }, cb, onFail);
	    },

		checkExist: function(item, cb, onFail) {
			_formRequest({ 
				item: item, 
				action: 'exist' }, cb, onFail);
	    },

	    copy: function(source, destination, cb, onFail) {
			_formRequest({ 
				item: source, 
				destination: destination, 
				action: 'copy' }, cb, onFail);
	    },

	    move: function(source, destination, cb, onFail) {
			_formRequest({ 
				item: source, 
				destination: destination, 
				action: 'move' }, cb, onFail);
	    },

	    rename: function(source, destination, cb, onFail) {
			_formRequest({ 
				item: source, 
				destination: destination, 
				action: 'rename' }, cb, onFail);
	    },

	    symlink: function(source, destination, cb, onFail) {
			_formRequest({ 
				item: source, 
				destination: destination, 
				action: 'symlink' }, cb, onFail);
	    },

	    hardlink: function(source, destination, cb, onFail) {
			_formRequest({ 
				item: source, 
				destination: destination, 
				action: 'hardlink' }, cb, onFail);
	    },

	    download: function(spec) {
			var _req = '/download/?' + querystring.stringify({ path: spec.path }),
	            a = document.createElement("a");

	            // safari doesn't support this yet
	            if (typeof a.download === 'undefined') {
	            	_counter < 1000 ? _counter += 160 : _counter = 100;
	            	setTimeout(function(){ window.location = _req }, _counter);
	            } else {
	                a.href = _req;
	                a.download = spec.name;
	                document.body.appendChild(a);
	                nxt(function(){ a.click() });
	            }
	    }
	};


provide(api);

});

/* ../../common.blocks/request/request.browser.js end */
;
/* ../../libs/bem-core/common.blocks/querystring/querystring.vanilla.js begin */
/**
 * @module querystring
 * @description A set of helpers to work with query strings
 */

modules.define('querystring', ['querystring__uri'], function(provide, uri) {

var hasOwnProperty = Object.prototype.hasOwnProperty;

function addParam(res, name, val) {
    /* jshint eqnull: true */
    res.push(encodeURIComponent(name) + '=' + (val == null? '' : encodeURIComponent(val)));
}

provide(/** @exports */{
    /**
     * Parse a query string to an object
     * @param {String} str
     * @returns {Object}
     */
    parse : function(str) {
        if(!str) {
            return {};
        }

        return str.split('&').reduce(
            function(res, pair) {
                if(!pair) {
                    return res;
                }

                var eq = pair.indexOf('='),
                    name, val;

                if(eq >= 0) {
                    name = pair.substr(0, eq);
                    val = pair.substr(eq + 1);
                } else {
                    name = pair;
                    val = '';
                }

                name = uri.decodeURIComponent(name);
                val = uri.decodeURIComponent(val);

                hasOwnProperty.call(res, name)?
                    Array.isArray(res[name])?
                        res[name].push(val) :
                        res[name] = [res[name], val] :
                    res[name] = val;

                return res;
            },
            {});
    },

    /**
     * Serialize an object to a query string
     * @param {Object} obj
     * @returns {String}
     */
    stringify : function(obj) {
        return Object.keys(obj)
            .reduce(
                function(res, name) {
                    var val = obj[name];
                    Array.isArray(val)?
                        val.forEach(function(val) {
                            addParam(res, name, val);
                        }) :
                        addParam(res, name, val);
                    return res;
                },
                [])
            .join('&');
    }
});

});

/* ../../libs/bem-core/common.blocks/querystring/querystring.vanilla.js end */
;
/* ../../libs/bem-core/common.blocks/querystring/__uri/querystring__uri.vanilla.js begin */
/**
 * @module querystring__uri
 * @description A set of helpers to work with URI
 */

modules.define('querystring__uri',  function(provide) {

// Equivalency table for cp1251 and utf8.
var map = { '%D0' : '%D0%A0', '%C0' : '%D0%90', '%C1' : '%D0%91', '%C2' : '%D0%92', '%C3' : '%D0%93', '%C4' : '%D0%94', '%C5' : '%D0%95', '%A8' : '%D0%81', '%C6' : '%D0%96', '%C7' : '%D0%97', '%C8' : '%D0%98', '%C9' : '%D0%99', '%CA' : '%D0%9A', '%CB' : '%D0%9B', '%CC' : '%D0%9C', '%CD' : '%D0%9D', '%CE' : '%D0%9E', '%CF' : '%D0%9F', '%D1' : '%D0%A1', '%D2' : '%D0%A2', '%D3' : '%D0%A3', '%D4' : '%D0%A4', '%D5' : '%D0%A5', '%D6' : '%D0%A6', '%D7' : '%D0%A7', '%D8' : '%D0%A8', '%D9' : '%D0%A9', '%DA' : '%D0%AA', '%DB' : '%D0%AB', '%DC' : '%D0%AC', '%DD' : '%D0%AD', '%DE' : '%D0%AE', '%DF' : '%D0%AF', '%E0' : '%D0%B0', '%E1' : '%D0%B1', '%E2' : '%D0%B2', '%E3' : '%D0%B3', '%E4' : '%D0%B4', '%E5' : '%D0%B5', '%B8' : '%D1%91', '%E6' : '%D0%B6', '%E7' : '%D0%B7', '%E8' : '%D0%B8', '%E9' : '%D0%B9', '%EA' : '%D0%BA', '%EB' : '%D0%BB', '%EC' : '%D0%BC', '%ED' : '%D0%BD', '%EE' : '%D0%BE', '%EF' : '%D0%BF', '%F0' : '%D1%80', '%F1' : '%D1%81', '%F2' : '%D1%82', '%F3' : '%D1%83', '%F4' : '%D1%84', '%F5' : '%D1%85', '%F6' : '%D1%86', '%F7' : '%D1%87', '%F8' : '%D1%88', '%F9' : '%D1%89', '%FA' : '%D1%8A', '%FB' : '%D1%8B', '%FC' : '%D1%8C', '%FD' : '%D1%8D', '%FE' : '%D1%8E', '%FF' : '%D1%8F' };

function convert(str) {
    // Symbol code in cp1251 (hex) : symbol code in utf8)
    return str.replace(
        /%.{2}/g,
        function($0) {
            return map[$0] || $0;
        });
}

function decode(fn,  str) {
    var decoded = '';

    // Try/catch block for getting the encoding of the source string.
    // Error is thrown if a non-UTF8 string is input.
    // If the string was not decoded, it is returned without changes.
    try {
        decoded = fn(str);
    } catch (e1) {
        try {
            decoded = fn(convert(str));
        } catch (e2) {
            decoded = str;
        }
    }

    return decoded;
}

provide(/** @exports */{
    /**
     * Decodes URI string
     * @param {String} str
     * @returns {String}
     */
    decodeURI : function(str) {
        return decode(decodeURI,  str);
    },

    /**
     * Decodes URI component string
     * @param {String} str
     * @returns {String}
     */
    decodeURIComponent : function(str) {
        return decode(decodeURIComponent,  str);
    }
});

});

/* ../../libs/bem-core/common.blocks/querystring/__uri/querystring__uri.vanilla.js end */
;
/* ../../common.blocks/vow-queue/vow-queue.vanilla.js begin */
/**
 * @module vow-queue
 * @author Filatov Dmitry <dfilatov@yandex-team.ru>
 * @version 0.4.1
 * @license
 * Dual licensed under the MIT and GPL licenses:
 *   * http://www.opensource.org/licenses/mit-license.php
 *   * http://www.gnu.org/licenses/gpl.html
 */

(function() {

function getModule(vow, nextTick) {

var extend = function() {
        var res = {};

        for(var i = 0, len = arguments.length; i < len; i++) {
            var obj = arguments[i];
            if(obj) {
                for(var key in obj) {
                    obj.hasOwnProperty(key) && (res[key] = obj[key]);
                }
            }
        }

        return res;
    },

    DEFAULT_QUEUE_PARAMS = {
        weightLimit : 100
    },
    DEFAULT_TASK_PARAMS = {
        weight   : 1,
        priority : 1
    };

/**
 * @class Queue
 * @exports vow-queue
 */

/**
 * @constructor
 * @param {Object} [params]
 * @param {Number} [params.weightLimit=100]
 */
function Queue(params) {
    this._pendingTasks = [];
    this._params = extend(DEFAULT_QUEUE_PARAMS, params);
    this._curWeight = 0;
    this._isRunScheduled = false;
    this._isStopped = true;
    this._processedBuffer = [];
    this._stats = {
        pendingTasksCount    : 0,
        processingTasksCount : 0,
        processedTasksCount  : 0
    };
}

Queue.prototype = /** @lends Queue.prototype */ {
    /**
     * Adds task to queue
     *
     * @param {Function} taskFn
     * @param {Object} [taskParams]
     * @param {Number} [taskParams.weight=1]
     * @param {Number} [taskParams.priority=1]
     * @returns {vow:promise}
     */
    enqueue : function(taskFn, taskParams) {
        var task = this._buildTask(taskFn, taskParams);

        if(task.params.weight > this._params.weightLimit) {
            throw Error('task with weight of ' +
                task.params.weight +
                ' can\'t be performed in queue with limit of ' +
                this._params.weightLimit);
        }

        this._enqueueTask(task);
        this._isStopped || this._scheduleRun();

        task.defer.promise().always(
            function() {
                this._stats.processingTasksCount--;
                this._stats.processedTasksCount++;
            },
            this);

        return task.defer.promise();
    },

    /**
     * Starts processing of queue
     */
    start : function() {
        if(!this._isStopped) {
            return;
        }

        this._isStopped = false;
        var processedBuffer = this._processedBuffer;
        if(processedBuffer.length) {
            this._processedBuffer = [];
            nextTick(function() {
                while(processedBuffer.length) {
                    processedBuffer.shift()();
                }
            });
        }

        this._hasPendingTasks() && this._scheduleRun();
    },

    /**
     * Stops processing of queue
     */
    stop : function() {
        this._isStopped = true;
    },

    /**
     * Checks whether the queue is started
     * @returns {Boolean}
     */
    isStarted : function() {
        return !this._isStopped;
    },

    /**
     * Sets params of queue
     *
     * @param {Object} params
     * @param {Number} [params.weightLimit]
     */
    setParams : function(params) {
        if(typeof params.weightLimit !== 'undefined') {
            this._params.weightLimit = params.weightLimit;
            this._scheduleRun();
        }
    },

    getStats : function() {
        return this._stats;
    },

    _buildTask : function(taskFn, taskParams) {
        return {
            fn     : taskFn,
            params : extend(DEFAULT_TASK_PARAMS, taskParams),
            defer  : vow.defer()
        };
    },

    _enqueueTask : function(task) {
        var pendingTasks = this._pendingTasks,
            i = pendingTasks.length;

        this._stats.pendingTasksCount++;

        while(i) {
            if(pendingTasks[i - 1].params.priority >= task.params.priority) {
                i === pendingTasks.length?
                    pendingTasks.push(task) :
                    pendingTasks.splice(i, 0, task);
                return;
            }
            i--;
        }

        pendingTasks.push(task);
    },

    _scheduleRun : function() {
        if(!this._isRunScheduled) {
            this._isRunScheduled = true;
            nextTick(this._run.bind(this));
        }
    },

    _run : function() {
        this._isRunScheduled = false;
        while(this._hasPendingTasks() && this._allowRunTask(this._pendingTasks[0])) {
            this._runTask(this._pendingTasks.shift());
        }
    },

    _hasPendingTasks : function() {
        return !!this._pendingTasks.length;
    },

    _allowRunTask : function(task) {
        return this._curWeight + task.params.weight <= this._params.weightLimit;
    },

    _runTask : function(task) {
        this._curWeight += task.params.weight;

        this._stats.pendingTasksCount--;
        this._stats.processingTasksCount++;

        var taskRes = vow.invoke(task.fn);

        taskRes
            .progress(
                task.defer.notify,
                task.defer)
            .always(
                function() {
                    this._curWeight -= task.params.weight;
                    if(this._isStopped) {
                        this._processedBuffer.push(function() {
                            task.defer.resolve(taskRes);
                        });
                    }
                    else {
                        task.defer.resolve(taskRes);
                        this._scheduleRun();
                    }
                },
                this);
    }
};

return Queue;

}

var nextTick = typeof setImmediate !== 'undefined'?
        setImmediate :
        typeof process === 'object' && process.nextTick?
            process.nextTick :
            function(fn) {
                setTimeout(fn, 0);
            };

if(typeof modules !== 'undefined') {
    /* global modules */
    modules.define('vow-queue', ['vow'], function(provide, vow) {
        provide(getModule(vow, nextTick));
    });
}

if(typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = getModule(require('vow'), nextTick);
}

})();

/* ../../common.blocks/vow-queue/vow-queue.vanilla.js end */
;
/* ../../desktop.blocks/panel/panel.browser.js begin */
/* global modules:false */

modules.define('panel', ['i-bem__dom', 'BEMHTML', 'events__channels', 'sort', 'state', 'functions__debounce'], 
	function(provide, BEMDOM, BEMHTML, channels, sort, state, debounce) {
		var com = channels('116');

provide(BEMDOM.decl(this.name, {
    onSetMod : {
        'js' : {
            'inited' : function() {
        		this._position = this.getMod('position');

        		this._list = this.findBlockInside('list');
        		this._select = this.findBlockInside('select');
        		this._path = this.findBlockInside('path');
        		this._sorters = this.findBlockInside('radio-group');

        		this.bindTo(this._sorters.domElem, 'click', this._onSorterClick, this);

        		com.on('disks-changed', this._setSelectValue, this);
        		com.on(this._position + '-drive-changed', this._setActiveSelectItem, this);
        		com.on('sort', this._onSortEvent, this);
        		com.on('cd', this._onDriveChange, this);
        		com.on('focus-to-path', this._focusToPath, this);

				com.on('refresh', this._getList, this);
				com.on('path-' + this._position, this._getList, this);

				// updating list on states retrival when custom sort mode is selected
        		com.on('updated-item-' + this._position, debounce(this._update, 700, this), this);
				// default sort mode
				this.hasMod('sort') || this.setMod('sort', 'name');
				
        		this._setChildsMod();
            }
        },
        'sort' : {
            'type' : function() {
				this._sortField = function(path){
					console.log(state.getReadableState(path, 'type'));
					return state.getReadableState(path, 'type');	
				};
            },
            'size' : function() {
				this._sortField = function(path){
					return state.getState(path, 'size');	
				};
            },
            'date' : function() {
				this._sortField = function(path){
					var date = new Date(state.getState(path, 'ctime'));

					return date.getTime();
				};
            },
            'owner' : function() {
				this._sortField = function(path){
					return state.getState(path, 'uid');	
				};
            }
        },
        'disabled' : {
            'true' : function() {
        		this._list.findBlockInside('menu').setMod('disabled');
        		this._select.setMod('disabled');
        		this._path.setMod('disabled');
        		this._sorters.setMod('disabled');
            },
            '' : function() {
        		this._list.findBlockInside('menu').delMod('disabled');
        		this._select.delMod('disabled');
        		this._path.delMod('disabled');
        		this._sorters.delMod('disabled');
            }
        }      
    },

    getListLenght : function() {
        return this._listLength;
    },

    _setChildsMod : function() {
    	this._path.setMod('position', this._position);
    	this._select.setMod('position', this._position);
    	state.getDisks() && this._setSelectValue();
    },

    _setPath : function(e) {
    	var drives = state.getDisks(),
	    	mountpoint = drives[e.target.getVal()].mountpoint;

    	com.emit('set-path-' + this._position, mountpoint);
    	com.emit('path-'     + this._position, mountpoint);
    },

    _setSelectValue : function() {
    	var items = [],
	    	drives = state.getDisks();

			drives.forEach(function (item, index) {
				var drive = {
		            val : index,
		            text : item.drive
		        };

				items.push(drive);
			}.bind(this));

			var html = BEMHTML.apply(

		    	{
				    block : 'select',
				    mods : { mode : 'radio', theme : 'islands', size : 'l' },
				    name : 'drive_'+ this._position,
				    val : state.getActiveDriveIndex(this._position),
				    options : items
				}
			);

			this._select.un('change', this._setPath);

			BEMDOM.replace(this._select.domElem, html);

			this._select = this.findBlockInside('select');
			this._select.on('change', this._setPath, this);
	},

    _setActiveSelectItem : function() {
		this._select.setVal(state.getActiveDriveIndex(this._position));
		this._menu.setMod('focused');
	},

    _onSorterClick : function() {
		var _name = this._sorters.getVal();

		this._customSort(_name);
    },

    _customSort : function(sortmode) {
		if(this.hasMod('sort', sortmode)) {
			this.toggleMod('reverse');
		} else {
			this.hasMod('reverse') && this.delMod('reverse');
		}
		
		this.setMod('sort', sortmode);
		this.setMod('custom-sort');
		this._update();
    },

    _onSortEvent : function(e, data) {
    	if (data && data.position === this._position && data.extras) {
			this._customSort(data.extras);
			this._sorters.setVal(data.extras);
    	}
    },

	_onDriveChange : function(e, data) {
    	if (data && data.extras && data.extras === this._position) {
			this._select.setMod('opened');
    	}
    },

	_focusToPath : function(e, data) {
    	if (data && data.position === this._position) {
			this._path.findBlockInside('input').setMod('focused');
    	}
    },

    _update : function() {
		this.hasMod('custom-sort') && this._getList('');
    },

	_getList : function(e, data) {
		data && (this._curPath = data);

	   	com.on(this._position + '-list-is', this._buildItems, this);
	   	com.emit('give-list', { 
	   		position : this._position, 
	   		path : this._curPath, 
	   		refresh : e.type === 'refresh' ? true : false 
	   	});
    },

    _buildItems : function(e, data) {
		var items = [],
			list = [],
			html,
			path = this._curPath,
			toplevel = {
	            block : 'menu-item',
	            mods : { toplevel : true, position: this._position, pathfinder : true },
	            val : path + '/..',
	            content : '..'
	        },
	        _pos = this._position;

		this._listLength = data.length;

		// saving the current path and list for future generations
    	state.setCurPath(path, this._position);
    	state.setCurList(this._position, data);
    	
		// sorting the list
		data.forEach(function(value){
			var _path = path + '/' + value;
			list.push({
				path: _path,
				name: value,
				key: this.hasMod('sort', 'name') ? value : this._sortField(_path)
			});
		}.bind(this));

		this.hasMod('custom-sort') && 
			list.length > 1 &&
				(list = sort.sortByKey(list, 'key', !this.hasMod('reverse')));

		// notifying all listeners that list is ready and how big it is
		com.emit('ready-list-' + _pos, this._listLength);

		// creating menu-items blocks for the retrieved list 
        path !== '/' && items.push(toplevel);
				
		list.forEach(function(value){
			var item = {
	            block : 'menu-item',
	            mods : { position : _pos, pathfinder : true },
	            val : value.path,
	            content : value.name
	        };

	        items.push(item);
		});

    	html = BEMHTML.apply(
	    	{
			    block : 'menu',
			    mods : { panel: true, theme : 'islands', size : 'l', mode : 'check', position: this._position },
			    content : items
			}
		);

        BEMDOM.update(this._list.domElem, html);
        this._menu = this._list.findBlockInside('menu');

        this._menu.setMod('focused');

		this._path.detectMountpoint();
    }
}, { live : true }));

});

/* ../../desktop.blocks/panel/panel.browser.js end */
;
/* ../../libs/bem-core/common.blocks/cookie/cookie.js begin */
/**
 * @module cookie
 * inspired from $.cookie plugin by Klaus Hartl (stilbuero.de)
 */

modules.define('cookie', function(provide) {

provide(/** @exports */{
    /**
     * Returns cookie by given name
     * @param {String} name
     * @returns {String|null}
     */
    get : function(name) {
        var res = null;
        if(document.cookie && document.cookie !== '') {
            var cookies = document.cookie.split(';');
            for(var i = 0; i < cookies.length; i++) {
                var cookie = cookies[i].trim();
                // Does this cookie string begin with the name we want?
                if(cookie.substring(0, name.length + 1) === (name + '=')) {
                    res = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return res;
    },

    /**
     * Sets cookie by given name
     * @param {String} name
     * @param {String} val
     * @param {Object} options
     * @returns {cookie} this
     */
    set : function(name, val, options) {
        options = options || {};
        if(val === null) {
            val = '';
            options.expires = -1;
        }
        var expires = '';
        if(options.expires && (typeof options.expires === 'number' || options.expires.toUTCString)) {
            var date;
            if(typeof options.expires === 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        // CAUTION: Needed to parenthesize options.path and options.domain
        // in the following expressions, otherwise they evaluate to undefined
        // in the packed version for some reason...
        var path = options.path? '; path=' + (options.path) : '',
            domain = options.domain? '; domain=' + (options.domain) : '',
            secure = options.secure? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(val), expires, path, domain, secure].join('');

        return this;
    }
});

});

/* ../../libs/bem-core/common.blocks/cookie/cookie.js end */
;
/* ../../common.blocks/path/path.browser.js begin */
/* global modules:false */

modules.define('path', ['i-bem__dom', 'events__channels', 'cookie', 'state', 'jquery', 'functions__debounce', 'path-normalizer'], 
    function(provide, BEMDOM, channels, cookie, state, $, debounce, normalizer) {
        var com = channels('116'),
            conf = state.getClientConfig,
            normalize = normalizer.normalize;

provide(BEMDOM.decl(this.name, {
    onSetMod : {
        'js' : {
            'inited' : function() {
                this._input = this.findBlockInside('input');
                this._control = this.findBlockInside('input__control');
                this.hasMod('source') && this.serveAsSource();
                this.hasMod('destination') && this.serveAsDestination();
            }
        },
        'position' : function(name, val) {
            this.serveAsPathfinder(val);
        },
        'disabled' : {
            'true' : function() {
                this._input.setMod('disabled');
            },
            '' : function() {
                this._input.delMod('disabled');
            }
        }       
    },

    /**
     * Sets the input value
     * @param {String} value – Value to set
     */    
    setVal : function(value) {
        this._input.setVal(value);
        this._lastVal = value;
    },

    setFocus : function(value) {
        this._input.setMod('focused');
    },

    delFocus : function(value) {
        this._input.delMod('focused');
    },

    getVal: function() { return this._control.domElem.val() },

    serveAsPathfinder : function(position) {
        this._position = position;

        this.bindTo('input change', debounce(this._checkPath, 850, this));
        com.on('check-path', this._checkPath, this);

        this._ready4All();
        this._getDefPath();
    },

    serveAsDestination : function() {
        this.bindTo('input change', debounce(this._checkExist, 850, this));
    },

    serveAsSource : function() {
        this._input.setMod('disabled');
    },

    _checkExist : function(value) {
        var _requestSuccess = function(result) {
            var _res = JSON.parse(result);
                
            if(_res.exist && _res.path !== '.' && _res.path !== './') {
                this._lastVal = normalize(_res.path);
                this.setVal(normalize(this._lastVal));
            }
            else {
                this._lastVal ? this.setVal(normalize(this._lastVal)) : this.setVal('/');
            };
        };

        this._lastVal || (this._lastVal = normalize(this.getVal()));
        this._checkPath(value, _requestSuccess);
    },

    /**
     * Sets path value in the input and cookie
     * @param {String | Object} e – Value to set or event object
     * @param [{String} data] – Value to set
     */   
    setAll : function(e, data) {
        data || (data = e);

        data = normalize(data);
        this.setVal(data);
        this._setCook(data);
        this._curPath = data;
    },

    detectMountpoint : function() {
        var drives = state.getDisks(),
            path = state.getCurPath(this._position),
            activeDriveIndex = 0;

        if(drives && path) {
            drives.forEach(function (item, index) {
                if(index > 0){
                    path.indexOf(normalize(item.mountpoint)) !== -1 && (activeDriveIndex = index);
                }
            }.bind(this));

            state.setActiveDriveIndex(this._position, activeDriveIndex);
            com.emit(this._position +'-drive-changed');
        }
    },

    _emitPath: function() {
        console.log('position is ' + this._position + '\npath is ' +  this._curPath);
        com.emit(this._position + '-path-is', this._curPath);
    },

    _ready4All: function() {
        com.on('tell-path-' + this._position, this._emitPath, this);
        com.on('set-path-'  + this._position, this.setAll, this);
    },

    _getDefPath : function() {
        this._curPath = cookie.get('path-' + this._position);
console.log(this._curPath);
        this._checkPath(this._curPath);
    },

   _checkPath: function(path, cb) {
        this._abortRequest();
        cb = cb ? cb.bind(this) : this._onSuccess.bind(this);
        var _path = typeof path !== 'object' ? path : this.getVal();
        
        if(!_path){
            cb('{"res":{"exist":false}}');
            return
        }

        this._xhr = $.ajax({
            type: 'GET',
            dataType: 'html',
            url: '/exist',
            data: { path: _path },
            cache: false,
            success: cb
        });
    },

    _abortRequest: function() {
        this._xhr && this._xhr.abort();
    },

    _onSuccess: function(result) {
        var _res = JSON.parse(result);
            
        if(_res.exist) {
            var _path = normalize(_res.path);

            this.setAll(_path);
            com.emit('path-' + this._position, _path);

            this.detectMountpoint();
        }
        else {
            if(!this._curPath) {
                this._curPath = conf()[this._position]
                com.emit('path-' + this._position, this._curPath);
            }
            this.setAll(normalize(this._curPath));
        };

    },

    _setCook : function(path) {
        this._position && cookie.set('path-' + this._position, normalize(path));
    }
},{ live : true }));
});

/* ../../common.blocks/path/path.browser.js end */
;
/* ../../libs/bem-core/common.blocks/functions/__debounce/functions__debounce.vanilla.js begin */
/**
 * @module functions__debounce
 */

modules.define('functions__debounce', function(provide) {

var global = this.global;

provide(
    /**
     * Debounces given function
     * @exports
     * @param {Function} fn function to debounce
     * @param {Number} timeout debounce interval
     * @param {Boolean} [invokeAsap=false] invoke before first interval
     * @param {Object} [ctx] context of function invocation
     * @returns {Function} debounced function
     */
    function(fn, timeout, invokeAsap, ctx) {
        if(arguments.length === 3 && typeof invokeAsap !== 'boolean') {
            ctx = invokeAsap;
            invokeAsap = false;
        }

        var timer;
        return function() {
            var args = arguments;
            ctx || (ctx = this);

            invokeAsap && !timer && fn.apply(ctx, args);

            global.clearTimeout(timer);

            timer = global.setTimeout(function() {
                invokeAsap || fn.apply(ctx, args);
                timer = null;
            }, timeout);
        };
    });
});

/* ../../libs/bem-core/common.blocks/functions/__debounce/functions__debounce.vanilla.js end */
;
/* ../../common.blocks/sort/sort.browser.js begin */
/* global modules:false */

modules.define('sort', function(provide) {

/**
 * An reimplementation of Merge sort algorithm.
 * Based on Paul Lewis gist https://gist.github.com/paullewis/1982121
 * With performance improved by 30-50%
 *
 * Meanwhile, it's nearly 10 time slowly than Array.prototype.sort()
 * for the element values in range from 0 to 100.
 *
 * Compare tests was performed with different array size from 100 to 5000 elements
 *
 * @author Murdalay
 */
function mergesort(inArray) {
	var presorted;
 
  /**
   * Sorts the array by breaking it down
   * into smaller chunks.
   *
   * @param {Array} array The array to sort
   */
	function sort(array) {
		var length = array.length,
		    mid    = Math.floor(length * 0.5),
		    left   = array.slice(0, mid),
		    right  = array.slice(mid, length);

		if(length === 1) {
			return array;
		}

		return merge(sort(left), sort(right));
	}

	/**
	* Merges two sublists back together.
	* Sort performed in reverse order because shift() in JS is to slow.
	*
	* @param {Array} left The left hand sublist
	* @param {Array} right The right hand sublist
	*/
	function merge(left, right) {
		var result = [];

			while(left.length || right.length) {

				if(left.length && right.length) {

				if(left[left.length-1] < right[right.length-1]) {
				    result.push(left.pop());
				} else {
				    result.push(right.pop());
				}

				} else if (left.length) {
					result.push(left.pop());
				} else {
					result.push(right.pop());
				}
			}

		return result.reverse();
	}
 
	presorted = sort(inArray);
}

/**
* Sorts the array by breaking it down
* into smaller chunks.
*
* @param {Array} inArray The array of objects to sort
* @param {String} ket The field for the compare
* @param {Boolean} [reverse] If sets to true reversed array will be returned. (false by default)
*/
function sortByKey(inArray, key, reverse) {
	var presorted;

	function sort(array) {

		var length = array.length,
		    mid    = Math.floor(length * 0.5),
		    left   = array.slice(0, mid),
		    right  = array.slice(mid, length);

		if(length === 1) {
			return array;
		}

		return merge(sort(left), sort(right));
	}

	/**
	* Merges two sublists back together.
	* Sort performed in reverse order because shift() in JS is to slow.
	*
	* @param {Array} left The left hand sublist
	* @param {Array} right The right hand sublist
	*/
	function merge(left, right) {
		var result = [];

			while(left.length || right.length) {

				if(left.length && right.length) {

				if(left[left.length-1][key] < right[right.length-1][key]) {
				    result.push(left.pop());
				} else {
				    result.push(right.pop());
				}

				} else if (left.length) {
					result.push(left.pop());
				} else {
					result.push(right.pop());
				}
			}

		return result.reverse();
	}
 
	presorted = sort(inArray);

	if(presorted[0].key == presorted[presorted.length - 1].key){
		presorted = presorted.reverse();
	}

	reverse && (presorted = presorted.reverse());
	return presorted;

};

provide({ mergesort: mergesort, sortByKey: sortByKey });

});


/* ../../common.blocks/sort/sort.browser.js end */
;
/* ../../libs/bem-components/common.blocks/select/select.js begin */
/**
 * @module select
 */

modules.define(
    'select',
    ['i-bem__dom', 'popup', 'menu', 'button', 'jquery', 'dom', 'keyboard__codes', 'strings__escape'],
    function(provide, BEMDOM, Popup, Menu, Button, $, dom, keyCodes, escape) {

/**
 * @exports
 * @class select
 * @bem
 *
 * @bemmod opened Represents opened state
 */
provide(BEMDOM.decl(this.name, /** @lends select.prototype */{
    beforeSetMod : {
        'opened' : {
            'true' : function() {
                return !this.hasMod('disabled');
            }
        },

        'focused' : {
            '' : function() {
                return !this._isPointerPressInProgress;
            }
        }
    },

    onSetMod : {
        'js' : {
            'inited' : function() {
                this._button = this.findBlockInside('button')
                    .on('click', this._onButtonClick, this);

                this._popup = this.findBlockInside('popup')
                    .setAnchor(this._button)
                    .on({ modName : 'visible', modVal : '' }, this._onPopupHide, this);

                this._menu = this._popup.findBlockInside('menu')
                    .on({
                        'change' : this._onMenuChange,
                        'item-click' : this._onMenuItemClick
                    }, this);

                this._isPointerPressInProgress = false;

                this.hasMod('focused') && this._focus();

                this._updateMenuWidth();
            }
        },

        'focused' : {
            'true' : function() {
                this._focus();
            },

            '' : function() {
                this._blur();
            }
        },

        'opened' : {
            '*' : function(_, modVal) {
                this._menu.setMod('focused', modVal);
            },

            'true' : function() {
                this._updateMenuHeight();
                this._popup.setMod('visible');
                this
                    .bindToDoc('pointerpress', this._onDocPointerPress)
                    .setMod('focused')
                    ._hoverCheckedOrFirstItem();
            },

            '' : function() {
                this
                    .unbindFromDoc('pointerpress', this._onDocPointerPress)
                    ._popup.delMod('visible');
            }
        },

        'disabled' : {
            '*' : function(modName, modVal) {
                this._button.setMod(modName, modVal);
                this._menu.setMod(modName, modVal);
                this.elem('control').prop('disabled', modVal);
            },

            'true' : function() {
                this._popup.delMod('visible');
            }
        }
    },

    /**
     * Get value
     * @returns {*}
     */
    getVal : function() {
        return this._menu.getVal();
    },

    /**
     * Set value
     * @param {*} val
     * @returns {select} this
     */
    setVal : function(val) {
        this._menu.setVal(val);
        return this;
    },

    /**
     * Get name
     * @returns {String}
     */
    getName : function() {
        return this.params.name;
    },

    getDefaultParams : function() {
        return {
            optionsMaxHeight : Number.POSITIVE_INFINITY
        };
    },

    _focus : function() {
        this
            .bindTo('button', {
                keydown : this._onKeyDown,
                keypress : this._onKeyPress
            })
            ._button.setMod('focused');
    },

    _blur : function() {
        this
            .unbindFrom('button', {
                keydown : this._onKeyDown,
                keypress : this._onKeyPress
            })
            .delMod('opened')
            ._button
                .delMod('focused');
    },

    _updateMenuWidth : function() {
        this._menu.domElem.css('min-width', this._button.domElem.outerWidth());

        this._popup.redraw();
    },

    _updateMenuHeight : function() {
        var drawingParams = this._popup.calcPossibleDrawingParams(),
            menuDomElem = this._menu.domElem,
            menuWidth = menuDomElem.outerWidth(),
            bestHeight = 0;

        drawingParams.forEach(function(params) {
            params.width >= menuWidth && params.height > bestHeight && (bestHeight = params.height);
        });

        bestHeight && menuDomElem.css('max-height', Math.min(this.params.optionsMaxHeight, bestHeight));
    },

    _getCheckedItems : function() {
        return this._menu.getItems().filter(function(item) {
            return item.hasMod('checked');
        });
    },

    _hoverCheckedOrFirstItem : function() { // NOTE: may be it should be moved to menu
        (this._getCheckedItems()[0] || this._menu.getItems()[0])
            .setMod('hovered');
    },

    _onKeyDown : function(e) {
        if(this.hasMod('opened')) {
            if(e.keyCode === keyCodes.ESC) {
                // NOTE: stop propagation to prevent from being listened by global handlers
                e.stopPropagation();
                this.delMod('opened');
            }
        } else if((e.keyCode === keyCodes.UP || e.keyCode === keyCodes.DOWN) && !e.shiftKey) {
            e.preventDefault();
            this.setMod('opened');
        }
    },

    _onKeyPress : function(e) {
        // press a key: closed select - set value, opened select - set hover on menu-item.
        if(!this.hasMod('opened')) {
            var item = this._menu.searchItemByKeyboardEvent(e);
            item && this._setSingleVal(item.getVal());
        }
    },

    _setSingleVal : function(value) {
        this.setVal(value);
    },

    _onMenuChange : function() {
        this._updateControl();
        this._updateButton();
        this._updateMenuWidth();

        this.emit('change');
    },

    _onMenuItemClick : function() {},

    _updateControl : function() {},

    _updateButton : function() {},

    _onButtonClick : function() {
        this.toggleMod('opened');
    },

    _onButtonFocusChange : function(e, data) {
        this.setMod('focused', data.modVal);
    },

    _onPopupHide : function() {
        this.delMod('opened');
    },

    _onDocPointerPress : function(e) {
        if(this._isEventInPopup(e)) {
            e.pointerType === 'mouse' && e.preventDefault(); // prevents button blur in most desktop browsers
            this._isPointerPressInProgress = true;
            this.bindToDoc(
                'pointerrelease',
                { focusedHardMod : this._button.getMod('focused-hard') },
                this._onDocPointerRelease);
        }
    },

    _onDocPointerRelease : function(e) {
        this._isPointerPressInProgress = false;
        this
            .unbindFromDoc('pointerrelease', this._onDocPointerRelease)
            ._button
                .toggleMod('focused', true, '', this._isEventInPopup(e))
                .setMod('focused-hard', e.data.focusedHardMod);
    },

    _isEventInPopup : function(e) {
        return dom.contains(this._popup.domElem, $(e.target));
    }
}, /** @lends select */{
    live : function() {
        this.liveInitOnBlockInsideEvent(
            { modName : 'focused', modVal : '*' },
            'button',
            this.prototype._onButtonFocusChange);
    },

    _createControlHTML : function(name, val) {
        // Using string concatenation to not depend on template engines
        return '<input ' +
            'type="hidden" ' +
            'name="' + name + '" ' +
            'class="' + this.buildClass('control') + '" ' +
            'value="' + escape.attr(val) + '"/>';
    }
}));

});

/* ../../libs/bem-components/common.blocks/select/select.js end */
;
/* ../../libs/bem-components/common.blocks/menu/menu.js begin */
/**
 * @module menu
 */

modules.define(
    'menu',
    ['i-bem__dom', 'control', 'keyboard__codes', 'menu-item'],
    function(provide, BEMDOM, Control, keyCodes) {

/** @const Number */
var TIMEOUT_KEYBOARD_SEARCH = 1500;

/**
 * @exports
 * @class menu
 * @augments control
 * @bem
 */
provide(BEMDOM.decl({ block : this.name, baseBlock : Control }, /** @lends menu.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {
                this.__base.apply(this, arguments);
                this._hoveredItem = null;
                this._items = null;

                this._lastTyping = {
                    char : '',
                    text : '',
                    index : 0,
                    time : 0
                };
            }
        },

        'disabled' : function(modName, modVal) {
            this.getItems().forEach(function(menuItem){
                menuItem.setMod(modName, modVal);
            });
        }
    },

    /**
     * Returns items
     * @returns {menu-item[]}
     */
    getItems : function() {
        return this._items || (this._items = this.findBlocksInside('menu-item'));
    },

    /**
     * Sets content
     * @param {String|jQuery} content
     * @returns {menu} this
     */
    setContent : function(content) {
        BEMDOM.update(this.domElem, content);
        this._hoveredItem = null;
        this._items = null;
        return this;
    },

    /**
     * Search menu item by keyboard event
     * @param {jQuery.Event} e
     * @returns {menu-item}
     */
    searchItemByKeyboardEvent : function(e) {
        var currentTime = +new Date(),
            charCode = e.charCode,
            char = String.fromCharCode(charCode).toLowerCase(),
            lastTyping = this._lastTyping,
            index = lastTyping.index,
            isSameChar = char === lastTyping.char && lastTyping.text.length === 1,
            items = this.getItems();

        if(charCode <= keyCodes.SPACE || e.ctrlKey || e.altKey || e.metaKey) {
            lastTyping.time = currentTime;
            return null;
        }

        if(currentTime - lastTyping.time > TIMEOUT_KEYBOARD_SEARCH || isSameChar) {
            lastTyping.text = char;
        } else {
            lastTyping.text += char;
        }

        lastTyping.char = char;
        lastTyping.time = currentTime;

        // If key is pressed again, then continue to search to next menu item
        if(isSameChar && items[index].getText().search(lastTyping.char) === 0) {
            index = index >= items.length - 1? 0 : index + 1;
        }

        // 2 passes: from index to items.length and from 0 to index.
        var i = index, len = items.length;
        while(i < len) {
            if(this._doesItemMatchText(items[i], lastTyping.text)) {
                lastTyping.index = i;
                return items[i];
            }

            i++;

            if(i === items.length) {
                i = 0;
                len = index;
            }
        }

        return null;
    },

    /** @override **/
    _onFocus : function() {
        this.__base.apply(this, arguments);
        this
            .bindToDoc('keydown', this._onKeyDown) // NOTE: should be called after __base
            .bindToDoc('keypress', this._onKeyPress);
    },

    /** @override **/
    _onBlur : function() {
        this
            .unbindFromDoc('keydown', this._onKeyDown)
            .unbindFromDoc('keypress', this._onKeyPress)
            .__base.apply(this, arguments);
        this._hoveredItem && this._hoveredItem.delMod('hovered');
    },

    /**
     * @param {Object} item
     * @private
     */
    _onItemHover : function(item) {
        if(item.hasMod('hovered')) {
            this._hoveredItem && this._hoveredItem.delMod('hovered');
            this._scrollToItem(this._hoveredItem = item);
        } else if(this._hoveredItem === item) {
            this._hoveredItem = null;
        }
    },

    /**
     * @param {Object} item
     * @private
     */
    _scrollToItem : function(item) {
        var domElemOffsetTop = this.domElem.offset().top,
            itemDomElemOffsetTop = item.domElem.offset().top,
            relativeScroll;

        if((relativeScroll = itemDomElemOffsetTop - domElemOffsetTop) < 0 ||
            (relativeScroll =
                itemDomElemOffsetTop +
                item.domElem.outerHeight() -
                domElemOffsetTop -
                this.domElem.outerHeight()) > 0) {
            this.domElem.scrollTop(this.domElem.scrollTop() + relativeScroll);
        }
    },

    /**
     * @param {Object} item
     * @param {Object} data
     * @private
     */
    _onItemClick : function(item, data) {
        this.emit('item-click', { item : item, source : data.source });
    },

    /**
     * @param {jQuery.Event} e
     * @private
     */
    _onKeyDown : function(e) {
        var keyCode = e.keyCode,
            isArrow = keyCode === keyCodes.UP || keyCode === keyCodes.DOWN;

        if(isArrow && !e.shiftKey) {
            e.preventDefault();

            var dir = keyCode - 39, // using the features of key codes for "up"/"down" ;-)
                items = this.getItems(),
                len = items.length,
                hoveredIdx = items.indexOf(this._hoveredItem),
                nextIdx = hoveredIdx,
                i = 0;

            do {
                nextIdx += dir;
                nextIdx = nextIdx < 0? len - 1 : nextIdx >= len? 0 : nextIdx;
                if(++i === len) return; // if we have no next item to hover
            } while(items[nextIdx].hasMod('disabled'));

            this._lastTyping.index = nextIdx;

            items[nextIdx].setMod('hovered');
        }
    },

    /**
     * @param {jQuery.Event} e
     * @private
     */
    _onKeyPress : function(e) {
        var item = this.searchItemByKeyboardEvent(e);
        item && item.setMod('hovered');
    },

    /**
     * @param {Object} item
     * @param {String} text
     * @private
     */
    _doesItemMatchText : function(item, text) {
        return !item.hasMod('disabled') &&
            item.getText().toLowerCase().search(text) === 0;
    }
}, /** @lends menu */{
    live : function() {
        this
            .liveInitOnBlockInsideEvent({ modName : 'hovered', modVal : '*' }, 'menu-item', function(e) {
                this._onItemHover(e.target);
            })
            .liveInitOnBlockInsideEvent('click', 'menu-item', function(e, data) {
                this._onItemClick(e.target, data);
            });

        return this.__base.apply(this, arguments);
    }
}));

});

/* ../../libs/bem-components/common.blocks/menu/menu.js end */
;
/* ../../common.blocks/menu/menu.browser.js begin */
/* global modules:false */

/**
 * @module menu
 */

modules.define('menu', ['keyboard__codes', 'events__channels', 'menu-item', 'functions__throttle', 'functions__debounce', 'state'], 
function(provide, keyCodes, channels, Item, throttle, debounce, state, Menu) {
    var com = channels('116'),
        transitionRequest,
        transitionInProgress = false,

        _onAnimationEnd = function(){
            transitionInProgress = false;

            if(transitionRequest) {
                transitionRequest();
                transitionRequest = false;
            } 
        },

        throttleMe = throttle(_onAnimationEnd, 450, true);

/**
 * @exports
 * @class menu
 * @bem
 */
provide(Menu.decl({ modName : 'panel', modVal : true }, /** @lends menu.prototype */ {
	onSetMod : {
        'js' : {
            'inited' : function() {
                this._lastItem = false;
                com.on('keyOverride', this._keyPressOverride, this);
                com.on('keyRestore', this._keyPressRestore, this);

                Item.on(this.domElem, 'selected', this._onSelect, this);

                this.__base.apply(this, arguments);
            },
            '' : function() {
                com.un('keyOverride', this._keyPressOverride, this);
                com.un('keyRestore', this._keyPressRestore, this);

                Item.un(this.domElem, 'selected', this._onSelect);

                this.__base.apply(this, arguments);
            }
        },
        'focused' : {
            'true' : function() {
                if(this._lastItem){
                    this._hoveredItem = this._lastItem.setMod('selected');  
                } else {
                    this._lastItem = this._hoveredItem ? 
                        this._hoveredItem.setMod('selected') :
                            this.getItems()[0].setMod('selected').setMod('hovered');
                }

                this.__base.apply(this, arguments);
            }
        },
        'active' : {
            'true' : function() {
               this.setMod('focused');
            },
            '' : function() {
                this.hasMod('focused') && this.delMod('focused');
            }
        }
    },

    getActiveItem : function() {
        return this.getItems().filter(function(item) { return item.hasMod('active'); });
    },

    _onKeyDown : function(e) {
		if(this.hasMod('keys-disabled') || !this.hasMod('active')) { return };

        var keyCode = e.keyCode,
            ctrlDown = e.ctrlKey,
            altDown = e.altKey,
            cmdDown = e.metaKey,
            keyBindings = state.getClientConfig().keyBindings,

            _isSpecial = function(){ 
                if (keyCode === 91 || keyCode === 17 || keyCode === 18) {
                    return true;
                }
                return false
            },

            _filterMatchedSpecials = function(){
                var matched = [];

                keyBindings.forEach(function(item){
                    !item.controlKeys.Ctrl === !ctrlDown &&
                    !item.controlKeys.Alt  === !altDown  &&
                    !item.controlKeys.Cmd  === !cmdDown  && matched.push(item);
                }.bind(this));

                return matched;
            };

        console.log(keyCode);

        if(cmdDown || ctrlDown || altDown) {
            if(!_isSpecial()){
                var matched = _filterMatchedSpecials();

                matched.forEach(function(item){
                    if(keyCode === item.KeyCode && typeof item.action === 'string'){
                        com.emit(item.action, 
                            { 
                                active : this.getActiveItem(), 
                                position : this.getMod('position'), 
                                menuObj : this, 
                                extras : item.extra ? item.extra : null 
                            }
                        );
                    }
                }.bind(this));

                return false;
            }
        }

        if(this._hoveredItem && keyCode === keyCodes.ENTER || cmdDown && keyCode === keyCodes.DOWN ) {
            e.preventDefault();
            com.emit('exec');
        } 
        else if(keyCode === keyCodes.TAB) {
            e.preventDefault();
        	this.findBlockOutside('manager').getInactiveMenu().setMod('focused');
        } else {
	        this.__base.apply(this, arguments);
        }
    },

    _keyPressOverride : function(e) {
        this.setMod('keys-disabled');
    },

    _keyPressRestore : function(e) {
        this.delMod('keys-disabled');
    },

    _onSelect : function(event) {
        transitionRequest = function() {
            var list = this.findBlockOutside('list').domElem,
                e = event,

                startTransition = function(scrollTop) {
                    if(list){
                        transitionInProgress = true;
                        list.animate({ scrollTop: scrollTop }, "slow", _onAnimationEnd);
                    }
                }.bind(this),

                topOfset = list.offset().top,
                listHeight = list.innerHeight(),
                position = list.scrollTop(),
                itemPos = e.target.domElem.offset().top - topOfset,
                height = e.target.domElem.innerHeight();
                activeTop = height * 2,
                activeBottom = listHeight - (height * 2);

            if(itemPos > activeBottom) {
                startTransition(position + itemPos - height);
            } else if(itemPos < activeTop && itemPos >= 0) {
                startTransition(position - height * 2);
            } else if(itemPos < 0) {
                startTransition(position + itemPos - height * 2);
            }

            this._lastItem = e.target;
        }.bind(this);

        transitionInProgress || throttleMe();
    },

    _onItemHover : function(item) {
    	this._lastItem = item;
    	this.__base.apply(this, arguments);
    }
},{ isScrolling : function(){ return transitionInProgress } }));
});

/* ../../common.blocks/menu/menu.browser.js end */
;
/* ../../libs/bem-components/common.blocks/menu-item/menu-item.js begin */
/**
 * @module menu-item
 */

modules.define('menu-item', ['i-bem__dom'], function(provide, BEMDOM) {

/**
 * @exports
 * @class menu-item
 * @bem
 *
 * @param val Value of item
 */
provide(BEMDOM.decl(this.name, /** @lends menu-item.prototype */{
    beforeSetMod : {
        'hovered' : {
            'true' : function() {
                return !this.hasMod('disabled');
            }
        }
    },

    onSetMod : {
        'js' : {
            'inited' : function() {
                this.bindTo('pointerleave', this._onPointerLeave);
            }
        },

        'disabled' : {
            'true' : function() {
                this.__base.apply(this, arguments);
                this.delMod('hovered');
            }
        }
    },

    /**
     * Checks whether given value is equal to current value
     * @param {String|Number} val
     * @returns {Boolean}
     */
    isValEq : function(val) {
        // NOTE: String(true) == String(1) -> false
        return String(this.params.val) === String(val);
    },

    /**
     * Returns item value
     * @returns {*}
     */
    getVal : function() {
        return this.params.val;
    },

    /**
     * Returns item text
     * @returns {String}
     */
    getText : function() {
        return this.params.text || this.domElem.text();
    },

    _onPointerOver : function() {
        this.setMod('hovered');
    },

    _onPointerLeave : function() {
        this.delMod('hovered');
    },

    _onPointerClick : function() {
        this.hasMod('disabled') || this.emit('click', { source : 'pointer' });
    }
}, /** @lends menu-item */{
    live : function() {
        var ptp = this.prototype;
        this
            .liveBindTo('pointerover', ptp._onPointerOver)
            .liveBindTo('pointerclick', ptp._onPointerClick);
    }
}));

});

/* ../../libs/bem-components/common.blocks/menu-item/menu-item.js end */
;
/* ../../common.blocks/menu-item/menu-item.browser.js begin */
modules.define('menu-item', ['i-bem__dom', 'events__channels', 'BEMHTML', 'state', 'functions__throttle', 'path-normalizer'], 
	function(provide, BEMDOM, channels, BEMHTML, state, throttle, normalizer, MenuItem) {
		var timer,
            mouseActive = true,
            _mouseActivityTimer,

            _mouseStateUpdate = function() {
                mouseActive = true;
                clearTimeout(_mouseActivityTimer);

                _mouseActivityTimer = setTimeout(function() {
                    mouseActive = false;
                }, 1000);
            },

            normalize = normalizer.normalize,
			com = channels('116');

provide(MenuItem.decl({ modName : 'pathfinder', modVal : true }, /** @lends menu-item.prototype */{
    beforeSetMod : {
        'checked' : {
            'true' : function() {
                if(this._details && this._details.hasMod('rename')) {
                    return false
                }
            }
        }
    },
    onSetMod : {
        'js' : {
            'inited' : function() {
                this._position = this.getMod('position');
                this._path = normalize(this.getVal());

                this.__base.apply(this, arguments);

                if(!this.hasMod('toplevel')) {
                    this._id = state.getId(this._path);
                    this._stat = state.getReadableStates(this._path);
                    this._name = state.getName(this._path);
                    this._isdir = state.isDir(this._path);

                    // state.setObj(this._path, this);

                    if (!this._name) {
                        this._name = this.getText();
                        state.setName(this._path, this._name);
                    };

                    com.on(this._id + '-update', this._statesReady, this);

                    this._isDir();
                    this._stat ? this.updateContent(this._stat) : this.setMod('pending') && com.emit('state', { path: this._path, id: this._id, object: this });
                }
            },
            '' : function() {
                com.un(this._id + '-update', this._statesReady);
                
                this.hasMod('checked') && this.delMod('checked');
            }
        },

        'hovered' : {
            'true' : function() {
                this._stat && !this.hasMod('toplevel') && this._details.setMod('hovered');

                if(this.hasMod('pointerover') && mouseActive) {
                    BEMDOM.blocks['menu'].isScrolling() || (this._timer = setTimeout(this.setSelection.bind(this), 1550));
                } else {
                    this.setSelection();
                }

                this.__base.apply(this, arguments);
            },
            '' : function() {
                this._stat && !this.hasMod('toplevel') && this._details.delMod('hovered');
                this.__base.apply(this, arguments);
                clearTimeout(this._timer);
            }
        },

        'focused' : {
            'true' : function() {
                !this.hasMod('selected') && this.setMod('selected');
                this.__base.apply(this, arguments);
            }
        },

        'selected' : {
            'true' : function() {
                com.emit('remove-selection');
                com.once('remove-selection', this.removeSelection, this);
                com.on('exec', this._exec, this);
                this.emit('selected');

                this._details && this._details.setMod('selected');
            },
            '' : function() {
                com.un('exec');
                this._details && this._details.delMod('selected');
            }
        },

        'pending' : {
            '' : function() {
                this.hasMod('need-update') && this._dirSuccess(state.isDir(this._path));
            }
        },

        'checked' : {
            'true' : function() {
                com.emit('checked-' + this._position, this._path);
            },
            '' : function() {
                com.emit('unchecked-' + this._position, this._path);
            }
        }
    },

    setSelection: function() {
        this.setMod('selected');
        this.hasMod('pointerover') && this.findBlockOutside('menu').setMod('focused');
    },

    removeSelection: function() {
        this.hasMod('selected') && this.delMod('selected'); 
    },

    getPosition: function() {
        return this._position;
    },

    getPath: function() {
        return this._path;
    },

    setPath: function(path) {
        this._path = path;
    },

    _exec : function(e, data) {
        var _isDir = state.isDir(this._path);
            _destination = normalize(this._path);

        if(this.hasMod('toplevel')) {
            com.emit('set-path-' + this._position, _destination);
            com.emit('path-'     + this._position, _destination); 
        } else if(_isDir) {
            com.emit('set-path-' + this._position, this._path);
            com.emit('path-'     + this._position, this._path); 
        }
    },

    // redefining basic onclick handling
    _onPointerClick: function() {
        var base = this.__base,
            _old = function(){ 
                clearTimeout(this._timer);
                this.setMod('selected');
                base.apply(this, arguments);
                timer = false;
            };

        if(!timer){
            timer = setTimeout(_old.bind(this), 300);
        }
    },

    _isDir : function() {
        com.emit('is-dir', { path: this._path, id: this._id, object: this });
    },

    _onPointerOver : function() {
        if(mouseActive) {
            this.setMod('pointerover');
            this.__base.apply(this, arguments);
        }
    },

    _onPointerLeave : function() {
        this.delMod('pointerover');
        this.__base.apply(this, arguments);
    },

    _statesReady : function(e, data) {
        com.emit('updated-item-' + this._position);
        this.updateContent(e, data);
        this.delMod('pending');
    },

    updateContent : function(e, data) {
        this._stat = data ? data : e;

        if(!this.hasMod('toplevel')){
            var html = BEMHTML.apply(
                {
                    block: 'details',
                    name: this._stat.name,
                    type: this._stat.type, 
                    stats: this._stat
                }
            );
    
            BEMDOM.update(this.domElem, html);
            this._details = this.findBlockInside('details');
        }
    },

    _dirSuccess: function(data) {
        this._isdir = data;
        if(!this.hasMod('toplevel') && data) {
            state.setReadableState(this._path, 'type', 'dir');
            this.setMod('dir');

            if(this._details) { 
                this._details.setMod('dir');
            } else {
                this.hasMod('pending') && this.setMod('need-update');
            }        
        }
    }
},
{   // cancel live initialization
    live : function(){ 
        this.__base.apply(this, arguments);
        this.liveBindTo('dblclick', function() { this._exec() });
        this.liveBindTo('pointermove', throttle(_mouseStateUpdate, 300));
	},
    getMouseState : function() { 
        return mouseActive
    }
}));
});

/**
 * @module menu-item
 */

modules.define('menu-item', function(provide, MenuItem) {

/**
 * @exports
 * @class menu-item
 * @bem
 */
provide(MenuItem.decl({ modName : 'toplevel', modVal : true }, /** @lends menu-item.prototype */{
    beforeSetMod : {
        'checked' : {
            'true' : function() {
                return false
            }
        }
    }
}));
});

/* ../../common.blocks/menu-item/menu-item.browser.js end */
;
/* ../../common.blocks/details/details.browser.js begin */
/* global modules:false */

modules.define('details', ['i-bem__dom', 'events__channels', 'BEMHTML', 'keyboard__codes', 'state', 'request', 'functions__debounce', 'path-normalizer'],
	function(provide, BEMDOM, channels, BEMHTML, keyCodes, state, request, debounce, normalizer) {
		var com = channels('116'),
            norm = normalizer.normalize;

provide(BEMDOM.decl(this.name, {
    onSetMod : {
        'js' : {
            'inited' : function() {

            }
        },
        'hovered' : {
            'true' : function() {
                this.setMod(this.findElem('name'), 'hovered');
            },
            '' : function() {
                this.delMod(this.findElem('name'), 'hovered');
            }
        },
        'dir' : {
            'true' : function() {
                this.elem('type').html('dir');
                this.setMod(this.elem('name'), 'type', 'dir');
            }
        },
        'selected' : {
            'true' : function() {
                com.on('rename', this.rename, this);
            },
            '' : function() {
                com.un('rename', this.rename, this);
            }
        },
        'error' : {
            'true' : function() {
                this.delMod('good');
                this.delMod('old');
            }
        },
        'good' : {
            'true' : function() {
                this.delMod('error');
                this.delMod('old');
            }
        },
        'old' : {
            'true' : function() {
                this.delMod('good');
                this.delMod('error');
            }
        },
        'rename' : {
            'true' : function() {
                com.emit('keyOverride');

                this._oldVal = this.elem('name').html();

                this.setMod(this.elem('name'), 'rename');

                var html = BEMHTML.apply({
                    block : 'input',
                    mods : { theme : 'islands', size : 'l' },
                    val : this._oldVal
                });

                BEMDOM.update(this.elem('name'), html);
                this._input = this.findBlockInside('input');
                this._input.setMod('focused');

                this._path = this._item.getPath();
                this.bindToDoc('keypress', this._onKeyPress, this);
                this._input.on('input change', this._onInput, this);

                com.emit('disable');
                this.findBlockOutside('menu-item').delMod('disabled');
                // this.setMod('old');
            },
            '' : function() {
                this.delMod(this.elem('name'), 'rename');
                this.unbindFromDoc('keypress');

                this.unbindFrom('input change', this._onInput);
                com.emit('keyRestore');
                com.emit('enable');
                this.delMod('good');
                this.delMod('error');
                this.delMod('old');

                delete this._input;
                delete this._path;
                delete this._item;
                delete this._basePath;
            }
        }     
    },

    rename : function() {
        this._item = this.findBlockOutside('menu-item');
        
        this._position = this._item.getMod('position');
        this._basePath = state.getCurPath(this._position);

        this.setMod('rename');
        this._item.delMod('checked');
    },

    _restore : function() {
        this.delMod('rename');
        BEMDOM.update(this.elem('name'), this._oldVal);
        this.findBlockOutside('menu').setMod('focused');
    },

    _sendRequest : debounce(function(path, cb) {
        request.checkExist(path, cb, function(){ console.error('Error checking exist')});
    }, 450),

    _confirm : function() {
        var _success = function() {
                var old = this._oldVal,
                    list = state.getCurList(this._position),
                    val = this._input.getVal();

                BEMDOM.update(this.elem('name'), val);

                list.forEach(function(item, i){
                    if(item == old){
                        list[i] = val;
                    };
                });

                state.setCurList(this._position, list);
                state.setList(this._basePath, list);
                state.moveItem(this._path, this._goodVal);
                state.wipeItemProps(this._goodVal);
                state.setName(this._goodVal, val);
                this._item.setPath(this._goodVal);

                this.delMod('rename');
                this.findBlockOutside('menu').setMod('focused');
            }.bind(this);

        if(this.hasMod('good')) {
            request.rename(this._path, this._goodVal, _success);
        }
        else if(this.hasMod('old')) {
            this._restore();
        }
    },

    _onInput : function(e) {
        var _checkSuccess = function(res) {
                this.delMod('typing');

                if(res.path === norm(this._path)) {
                    this.setMod('old');
                }
                else if(res.exist === true) {
                    this.setMod('error');
                }
                else {
                    this.setMod('good');
                    this._goodVal = res.path;
                }
            }.bind(this);

        this.setMod('typing');

        this._sendRequest(this._basePath + '/' + this._input.getVal(), _checkSuccess);
    },

    _onKeyPress : function(e) {
        var keyCode = e.keyCode;
                
        // close on Esc
        if(keyCode === keyCodes.ESC) {
            e.preventDefault();
            this._restore();
        } else if(keyCode === keyCodes.ENTER) {
            this.hasMod('typing') || this._confirm();
        }
    }
}));

});


/* ../../common.blocks/details/details.browser.js end */
;
/* ../../libs/bem-components/common.blocks/popup/popup.js begin */
/**
 * @module popup
 */

modules.define(
    'popup',
    ['i-bem__dom'],
    function(provide, BEMDOM) {

var ZINDEX_FACTOR = 1000,
    visiblePopupsZIndexes = {},
    undef;

/**
 * @exports
 * @class popup
 * @bem
 *
 * @param {Number} [zIndexGroupLevel=0] z-index group level
 *
 * @bemmod visible Represents visible state
 */
provide(BEMDOM.decl(this.name, /** @lends popup.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {
                this._parentPopup = undef;
                this._zIndex = null;
                this._zIndexGroupLevel = null;
                this._isAttachedToScope = false;
            },

            '' : function() {
                this.delMod('visible');
            }
        },

        'visible' : {
            'true' : function() {
                if(!this._isAttachedToScope) {
                    BEMDOM.scope.append(this.domElem);
                    this._isAttachedToScope = true;
                }

                this
                    ._captureZIndex()
                    ._bindToParentPopup()
                    .bindTo('pointerpress pointerclick', this._setPreventHideByClick);
            },

            '' : function() {
                this
                    ._releaseZIndex()
                    ._unbindFromParentPopup()
                    .unbindFrom('pointerpress pointerclick', this._setPreventHideByClick);
            }
        }
    },

    /**
     * Sets content
     * @param {String|jQuery} content
     * @returns {popup} this
     */
    setContent : function(content) {
        BEMDOM.update(this.domElem, content);
        return this;
    },

    _calcZIndexGroupLevel : function() {
        var res = this.params.zIndexGroupLevel,
            parentPopup = this._getParentPopup();

        parentPopup && (res += parentPopup._zIndexGroupLevel);

        return res;
    },

    _setPreventHideByClick : function() {
        var curPopup = this;
        do {
            curPopup._preventHideByClick = true;
        } while(curPopup = curPopup._getParentPopup());
    },

    _bindToParentPopup : function() {
        var parentPopup = this._getParentPopup();
        parentPopup && parentPopup.on({ modName : 'visible', modVal : '' }, this._onParentPopupHide, this);

        return this;
    },

    _unbindFromParentPopup : function() {
        this._parentPopup && this._parentPopup.un({ modName : 'visible', modVal : '' }, this._onParentPopupHide, this);
        this._parentPopup = undef;

        return this;
    },

    _onParentPopupHide : function() {
        this.delMod('visible');
    },

    _getParentPopup : function() {
        return this._parentPopup;
    },

    _captureZIndex : function() {
        var level = this._zIndexGroupLevel === null?
                this._zIndexGroupLevel = this._calcZIndexGroupLevel() :
                this._zIndexGroupLevel,
            zIndexes = visiblePopupsZIndexes[level] || (visiblePopupsZIndexes[level] = [(level + 1) * ZINDEX_FACTOR]),
            prevZIndex = this._zIndex;

        this._zIndex = zIndexes[zIndexes.push(zIndexes[zIndexes.length - 1] + 1) - 1];
        this._zIndex !== prevZIndex && this.domElem.css('z-index', this._zIndex);

        return this;
    },

    _releaseZIndex : function() {
        var zIndexes = visiblePopupsZIndexes[this._zIndexGroupLevel];
        zIndexes.splice(zIndexes.indexOf(this._zIndex), 1);

        return this;
    },

    _recaptureZIndex : function() {
        this._releaseZIndex();
        this._zIndexGroupLevel = null;

        return this._captureZIndex();
    },

    getDefaultParams : function() {
        return {
            zIndexGroupLevel : 0
        };
    }
}, /** @lends popup */{
    live : true
}));

});

/* ../../libs/bem-components/common.blocks/popup/popup.js end */
;
/* ../../libs/bem-core/common.blocks/functions/__throttle/functions__throttle.vanilla.js begin */
/**
 * @module functions__throttle
 */

modules.define('functions__throttle', function(provide) {

var global = this.global;

provide(
    /**
     * Throttle given function
     * @exports
     * @param {Function} fn function to throttle
     * @param {Number} timeout throttle interval
     * @param {Boolean} [invokeAsap=true] invoke before first interval
     * @param {Object} [ctx] context of function invocation
     * @returns {Function} throttled function
     */
    function(fn, timeout, invokeAsap, ctx) {
        var typeofInvokeAsap = typeof invokeAsap;
        if(typeofInvokeAsap === 'undefined') {
            invokeAsap = true;
        } else if(arguments.length === 3 && typeofInvokeAsap !== 'boolean') {
            ctx = invokeAsap;
            invokeAsap = true;
        }

        var timer, args, needInvoke,
            wrapper = function() {
                if(needInvoke) {
                    fn.apply(ctx, args);
                    needInvoke = false;
                    timer = global.setTimeout(wrapper, timeout);
                } else {
                    timer = null;
                }
            };

        return function() {
            args = arguments;
            ctx || (ctx = this);
            needInvoke = true;

            if(!timer) {
                invokeAsap?
                    wrapper() :
                    timer = global.setTimeout(wrapper, timeout);
            }
        };
    });

});

/* ../../libs/bem-core/common.blocks/functions/__throttle/functions__throttle.vanilla.js end */
;
/* ../../libs/bem-components/common.blocks/popup/_autoclosable/popup_autoclosable.js begin */
/**
 * @module popup
 */

modules.define(
    'popup',
    ['jquery', 'i-bem__dom', 'ua', 'dom', 'keyboard__codes'],
    function(provide, $, BEMDOM, ua, dom, keyCodes, Popup) {

var KEYDOWN_EVENT = ua.opera && ua.version < 12.10? 'keypress' : 'keydown',
    visiblePopupsStack = [];

/**
 * @exports
 * @class popup
 * @bem
 */
provide(Popup.decl({ modName : 'autoclosable', modVal : true }, /** @lends popup.prototype */{
    onSetMod : {
        'visible' : {
            'true' : function() {
                visiblePopupsStack.unshift(this);
                this
                    // NOTE: nextTick because of event bubbling to document
                    .nextTick(function() {
                        this.bindToDoc('pointerclick', this._onDocPointerClick);
                    })
                    .__base.apply(this, arguments);
            },

            '' : function() {
                visiblePopupsStack.splice(visiblePopupsStack.indexOf(this), 1);
                this
                    .unbindFromDoc('pointerclick', this._onDocPointerClick)
                    .__base.apply(this, arguments);
            }
        }
    },

    _onDocPointerClick : function(e) {
        if(this.hasMod('target', 'anchor') && dom.contains(this._anchor, $(e.target)))
            return;

        this._preventHideByClick?
           this._preventHideByClick = null :
           this.delMod('visible');
    }
}, /** @lends popup */{
    live : function() {
        BEMDOM.doc.on(KEYDOWN_EVENT, onDocKeyPress);
    }
}));

function onDocKeyPress(e) {
    e.keyCode === keyCodes.ESC &&
        // omit ESC in inputs, selects and etc.
        visiblePopupsStack.length &&
        !dom.isEditable($(e.target)) &&
            visiblePopupsStack[0].delMod('visible');
}

});

/* ../../libs/bem-components/common.blocks/popup/_autoclosable/popup_autoclosable.js end */
;
/* ../../libs/bem-components/common.blocks/popup/_target/popup_target.js begin */
/**
 * @module popup
 */

modules.define(
    'popup',
    ['i-bem__dom', 'objects'],
    function(provide, BEMDOM, objects, Popup) {

var VIEWPORT_ACCURACY_FACTOR = 0.99,
    DEFAULT_DIRECTIONS = [
        'bottom-left', 'bottom-center', 'bottom-right',
        'top-left', 'top-center', 'top-right',
        'right-top', 'right-center', 'right-bottom',
        'left-top', 'left-center', 'left-bottom'
    ],

    win = BEMDOM.win,
    undef;

/**
 * @exports
 * @class popup
 * @bem
 *
 * @param {Number} [mainOffset=0] offset along the main direction
 * @param {Number} [secondaryOffset=0] offset along the secondary direction
 * @param {Number} [viewportOffset=0] offset from the viewport (window)
 * @param {Array[String]} [directions] allowed directions
 */
provide(Popup.decl({ modName : 'target' }, /** @lends popup.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {
                this.__base.apply(this, arguments);

                this._lastDrawingCss = {
                    left : undef,
                    top : undef,
                    zIndex : undef,
                    display : undef
                };
            }
        },

        'visible' : {
            'true' : function() {
                this.__base.apply(this, arguments);
                this
                    .bindToWin('scroll resize', this._onWinScrollAndResize)
                    .redraw();
            },

            '' : function() {
                this.__base.apply(this, arguments);
                this.unbindFromWin('scroll resize', this._onWinScrollAndResize);
            }
        }
    },

    /**
     * @override
     */
    setContent : function() {
        return this.__base.apply(this, arguments).redraw();
    },

    /**
     * Redraws popup
     * @returns {popup} this
     */
    redraw : function() {
        if(!this.hasMod('visible')) return this;

        var bestDrawingParams = this._calcBestDrawingParams();

        this.setMod('direction', bestDrawingParams.direction);

        var lastDrawingCss = this._lastDrawingCss,
            needUpdateCss = false;

        objects.each(
            this._calcDrawingCss(bestDrawingParams),
            function(val, name) {
                if(lastDrawingCss[name] !== val) {
                    lastDrawingCss[name] = val;
                    needUpdateCss = true;
                }
            });

        needUpdateCss && this.domElem.css(lastDrawingCss);

        return this;
    },

    _calcDrawingCss : function(drawingParams) {
        return {
            left : drawingParams.left,
            top : drawingParams.top
        };
    },

    /**
     * Returns possible directions to draw with max available width and height.
     * @returns {Array}
     */
    calcPossibleDrawingParams : function() {
        var target = this._calcTargetDimensions(),
            viewport = this._calcViewportDimensions(),
            params = this.params,
            mainOffset = params.mainOffset,
            secondaryOffset = params.secondaryOffset,
            viewportOffset = params.viewportOffset;

        return this.params.directions.map(function(direction) {
            var subRes = {
                    direction : direction,
                    width : 0,
                    height : 0,
                    left : 0,
                    top : 0
                };

            if(this._checkMainDirection(direction, 'bottom')) {
                subRes.top = target.top + target.height + mainOffset;
                subRes.height = viewport.bottom - subRes.top - viewportOffset;
            } else if(this._checkMainDirection(direction, 'top')) {
                subRes.height = target.top - viewport.top - mainOffset - viewportOffset;
                subRes.top = target.top - subRes.height - mainOffset;
            } else {
                if(this._checkSecondaryDirection(direction, 'center')) {
                    subRes.height = viewport.bottom - viewport.top - 2 * viewportOffset;
                    subRes.top = target.top + target.height / 2 - subRes.height / 2;
                } else if(this._checkSecondaryDirection(direction, 'bottom')) {
                    subRes.height = target.top + target.height - viewport.top - secondaryOffset - viewportOffset;
                    subRes.top = target.top + target.height - subRes.height - secondaryOffset;
                } else if(this._checkSecondaryDirection(direction, 'top')) {
                    subRes.top = target.top + secondaryOffset;
                    subRes.height = viewport.bottom - subRes.top - viewportOffset;
                }

                if(this._checkMainDirection(direction, 'left')) {
                    subRes.width = target.left - viewport.left - mainOffset - viewportOffset;
                    subRes.left = target.left - subRes.width - mainOffset;
                } else {
                    subRes.left = target.left + target.width + mainOffset;
                    subRes.width = viewport.right - subRes.left - viewportOffset;
                }
            }

            if(this._checkSecondaryDirection(direction, 'right')) {
                subRes.width = target.left + target.width - viewport.left - secondaryOffset - viewportOffset;
                subRes.left = target.left + target.width - subRes.width - secondaryOffset;
            } else if(this._checkSecondaryDirection(direction, 'left')) {
                subRes.left = target.left + secondaryOffset;
                subRes.width = viewport.right - subRes.left - viewportOffset;
            } else if(this._checkSecondaryDirection(direction, 'center')) {
                if(this._checkMainDirection(direction, 'top', 'bottom')) {
                    subRes.width = viewport.right - viewport.left - 2 * viewportOffset;
                    subRes.left = target.left + target.width / 2 - subRes.width / 2;
                }
            }

            return subRes;
        }, this);
    },

    _calcBestDrawingParams : function() {
        var popup = this._calcPopupDimensions(),
            target = this._calcTargetDimensions(),
            viewport = this._calcViewportDimensions(),
            directions = this.params.directions,
            i = 0,
            direction,
            pos,
            viewportFactor,
            bestDirection,
            bestPos,
            bestViewportFactor;

        while(direction = directions[i++]) {
            pos = this._calcPos(direction, target, popup);
            viewportFactor = this._calcViewportFactor(pos, viewport, popup);
            if(i === 1 ||
                    viewportFactor > bestViewportFactor ||
                    (!bestViewportFactor && this.hasMod('direction', direction))) {
                bestDirection = direction;
                bestViewportFactor = viewportFactor;
                bestPos = pos;
            }
            if(bestViewportFactor > VIEWPORT_ACCURACY_FACTOR) break;
        }

        return {
            direction : bestDirection,
            left : bestPos.left,
            top : bestPos.top
        };
    },

    _calcPopupDimensions : function() {
        var popupWidth = this.domElem.outerWidth(),
            popupHeight = this.domElem.outerHeight();

        return {
            width : popupWidth,
            height : popupHeight,
            area : popupWidth * popupHeight
        };
    },

    /**
     * @abstract
     * @protected
     * @returns {Object}
     */
    _calcTargetDimensions : function() {},

    _calcViewportDimensions : function() {
        var winTop = win.scrollTop(),
            winLeft = win.scrollLeft(),
            winWidth = win.width(),
            winHeight = win.height();

        return {
            top : winTop,
            left : winLeft,
            bottom : winTop + winHeight,
            right : winLeft + winWidth
        };
    },

    _calcPos : function(direction, target, popup) {
        var res = {},
            mainOffset = this.params.mainOffset,
            secondaryOffset = this.params.secondaryOffset;

        if(this._checkMainDirection(direction, 'bottom')) {
            res.top = target.top + target.height + mainOffset;
        } else if(this._checkMainDirection(direction, 'top')) {
            res.top = target.top - popup.height - mainOffset;
        } else if(this._checkMainDirection(direction, 'left')) {
            res.left = target.left - popup.width - mainOffset;
        } else if(this._checkMainDirection(direction, 'right')) {
            res.left = target.left + target.width + mainOffset;
        }

        if(this._checkSecondaryDirection(direction, 'right')) {
            res.left = target.left + target.width - popup.width - secondaryOffset;
        } else if(this._checkSecondaryDirection(direction, 'left')) {
            res.left = target.left + secondaryOffset;
        } else if(this._checkSecondaryDirection(direction, 'bottom')) {
            res.top = target.top + target.height - popup.height - secondaryOffset;
        } else if(this._checkSecondaryDirection(direction, 'top')) {
            res.top = target.top + secondaryOffset;
        } else if(this._checkSecondaryDirection(direction, 'center')) {
            if(this._checkMainDirection(direction, 'top', 'bottom')) {
                res.left = target.left + target.width / 2 - popup.width / 2;
            } else if(this._checkMainDirection(direction, 'left', 'right')) {
                res.top = target.top + target.height / 2 - popup.height / 2;
            }
        }

        return res;
    },

    _calcViewportFactor : function(pos, viewport, popup) {
        var viewportOffset = this.params.viewportOffset,
            intersectionLeft = Math.max(pos.left, viewport.left + viewportOffset),
            intersectionRight = Math.min(pos.left + popup.width, viewport.right - viewportOffset),
            intersectionTop = Math.max(pos.top, viewport.top + viewportOffset),
            intersectionBottom = Math.min(pos.top + popup.height, viewport.bottom - viewportOffset);

        return intersectionLeft < intersectionRight && intersectionTop < intersectionBottom? // has intersection
            (intersectionRight - intersectionLeft) *
                (intersectionBottom - intersectionTop) /
                popup.area :
            0;
    },

    _checkMainDirection : function(direction, mainDirection1, mainDirection2) {
        return !direction.indexOf(mainDirection1) || (mainDirection2 && !direction.indexOf(mainDirection2));
    },

    _checkSecondaryDirection : function(direction, secondaryDirection) {
        return ~direction.indexOf('-' + secondaryDirection);
    },

    _onWinScrollAndResize : function() {
        this.redraw();
    },

    getDefaultParams : function() {
        return objects.extend(
            this.__base.apply(this, arguments),
            {
                mainOffset : 0,
                secondaryOffset : 0,
                viewportOffset : 0,
                directions : DEFAULT_DIRECTIONS
            });
    }
}));

});

/* ../../libs/bem-components/common.blocks/popup/_target/popup_target.js end */
;
/* ../../libs/bem-components/common.blocks/popup/_target/popup_target_anchor.js begin */
/**
 * @module popup
 */

modules.define(
    'popup',
    ['i-bem__dom', 'jquery', 'objects', 'functions__throttle'],
    function(provide, BEMDOM, $, objects, throttle, Popup) {

var body = $(BEMDOM.doc[0].body),
    UPDATE_TARGET_VISIBILITY_THROTTLING_INTERVAL = 100,
    undef;

/**
 * @exports
 * @class popup
 * @bem
 */
provide(Popup.decl({ modName : 'target', modVal : 'anchor' }, /** @lends popup.prototype */{
    beforeSetMod : {
        'visible' : {
            'true' : function() {
                if(!this._anchor)
                    throw Error('Can\'t show popup without anchor');
            }
        }
    },

    onSetMod : {
        'js' : {
            'inited' : function() {
                this.__base.apply(this, arguments);

                this._anchor = null;
                this._anchorParents = null;
                this._destructor = null;
                this._isAnchorVisible = undef;
                this._updateIsAnchorVisible = throttle(
                    this._updateIsAnchorVisible,
                    UPDATE_TARGET_VISIBILITY_THROTTLING_INTERVAL,
                    false,
                    this);
            },

            '' : function() {
                this.__base.apply(this, arguments);
                this._unbindFromDestructor(); // don't destruct anchor as it might be the same anchor for several popups
            }
        },

        'visible' : {
            'true' : function() {
                this._anchorParents = this._anchor.parents();
                this._bindToAnchorParents();

                this.__base.apply(this, arguments);
            },

            '' : function() {
                this.__base.apply(this, arguments);

                this._unbindFromAnchorParents();
                this._anchorParents = null;
                this._isAnchorVisible = undef;
            }
        }
    },

    /**
     * Sets target
     * @param {jQuery|BEMDOM} anchor DOM elem or anchor BEMDOM block
     * @returns {popup} this
     */
    setAnchor : function(anchor) {
        this
            ._unbindFromAnchorParents()
            ._unbindFromParentPopup()
            ._unbindFromDestructor();

        this._anchor = anchor instanceof BEMDOM?
            anchor.domElem :
            anchor;

        this._destructor = this._anchor.bem('_' + this.__self.getName() + '-destructor');
        this._isAnchorVisible = undef;

        this._bindToDestructor();

        if(this.hasMod('visible')) {
            this._anchorParents = this._anchor.parents();
            this
                ._recaptureZIndex()
                ._bindToAnchorParents()
                ._bindToParentPopup()
                .redraw();
        } else {
            this._anchorParents = null;
            this._zIndexGroupLevel = null;
        }

        return this;
    },

    /**
     * @override
     */
    _calcTargetDimensions : function() {
        var anchor = this._anchor,
            anchorOffset = anchor.offset(),
            bodyOffset = body.css('position') === 'static'?
                { left : 0, top : 0 } :
                body.offset();

        return {
            left : anchorOffset.left - bodyOffset.left,
            top : anchorOffset.top - bodyOffset.top,
            width : anchor.outerWidth(),
            height : anchor.outerHeight()
        };
    },

    /**
     * @override
     */
    _calcDrawingCss : function(drawingParams) {
        typeof this._isAnchorVisible === 'undefined' &&
            (this._isAnchorVisible = this._calcIsAnchorVisible());

        return objects.extend(
            this.__base(drawingParams),
            { display : this._isAnchorVisible? '' : 'none' });
    },

    /**
     * Calculates target visibility state
     * @private
     * @returns {Boolean} Whether state is visible
     */
    _calcIsAnchorVisible : function() {
        var anchor = this._anchor,
            anchorOffset = anchor.offset(),
            anchorLeft = anchorOffset.left,
            anchorTop = anchorOffset.top,
            anchorRight = anchorLeft + anchor.outerWidth(),
            anchorBottom = anchorTop + anchor.outerHeight(),
            direction = this.getMod('direction'),
            vertBorder = Math.floor(this._checkMainDirection(direction, 'top') ||
                    this._checkSecondaryDirection(direction, 'top')?
                anchorTop :
                anchorBottom),
            horizBorder = Math.floor(this._checkMainDirection(direction, 'left') ||
                    this._checkSecondaryDirection(direction, 'left')?
                anchorLeft :
                anchorRight),
            res = true;

        this._anchorParents.each(function() {
            if(this.tagName === 'BODY') return false;

            var parent = $(this),
                overflowY = parent.css('overflow-y'),
                checkOverflowY = overflowY === 'scroll' || overflowY === 'hidden' || overflowY === 'auto',
                overflowX = parent.css('overflow-x'),
                checkOverflowX = overflowX === 'scroll' || overflowX === 'hidden' || overflowX === 'auto';

            if(checkOverflowY || checkOverflowX) {
                var parentOffset = parent.offset();

                if(checkOverflowY) {
                    var parentTopOffset = Math.floor(parentOffset.top);
                    if(vertBorder < parentTopOffset || parentTopOffset + parent.outerHeight() < vertBorder) {
                        return res = false;
                    }
                }

                if(checkOverflowX) {
                    var parentLeftOffset = Math.floor(parentOffset.left);
                    return res = !(
                        horizBorder < parentLeftOffset ||
                        parentLeftOffset + parent.outerWidth() < horizBorder);
                }
            }
        });

        return res;
    },

    _calcZIndexGroupLevel : function() {
        var res = this.__base.apply(this, arguments);

        return this._destructor.findBlocksOutside('z-index-group').reduce(
            function(res, zIndexGroup) {
                return res + Number(zIndexGroup.getMod('level'));
            },
            res);
    },

    _bindToAnchorParents : function() {
        return this.bindTo(
            this._anchorParents,
            'scroll',
            this._onAnchorParentsScroll);
    },

    _unbindFromAnchorParents : function() {
        this._anchorParents && this.unbindFrom(
            this._anchorParents,
            'scroll',
            this._onAnchorParentsScroll);
        return this;
    },

    _onAnchorParentsScroll : function() {
        this
            .redraw()
            ._updateIsAnchorVisible();
    },

    /**
     * @override
     */
    _onWinScrollAndResize : function() {
        this.__base.apply(this, arguments);
        this._updateIsAnchorVisible();
    },

    _updateIsAnchorVisible : function() {
        if(!this.hasMod('js', 'inited') || !this.hasMod('visible'))
            return;

        var isAnchorVisible = this._calcIsAnchorVisible();
        if(isAnchorVisible !== this._isAnchorVisible) {
            this._isAnchorVisible = isAnchorVisible;
            this.redraw();
        }
    },

    _bindToDestructor : function() {
        this._destructor.on({ modName : 'js', modVal : '' }, this._onPopupAnchorDestruct, this);
        return this;
    },

    _unbindFromDestructor : function() {
        this._destructor &&
            this._destructor.un({ modName : 'js', modVal : '' }, this._onPopupAnchorDestruct, this);
        return this;
    },

    _onPopupAnchorDestruct : function() {
        BEMDOM.destruct(this.domElem);
    },

    _getParentPopup : function() {
        return this._parentPopup === undef?
            this._parentPopup = this.findBlockOutside(this._anchor, this.__self.getName()) :
            this._parentPopup;
    }
}));

});

/* ../../libs/bem-components/common.blocks/popup/_target/popup_target_anchor.js end */
;
/* ../../libs/bem-core/common.blocks/strings/__escape/strings__escape.vanilla.js begin */
/**
 * @module strings__escape
 * @description A set of string escaping functions
 */

modules.define('strings__escape', function(provide) {

var symbols = {
        '"' : '&quot;',
        '\'' : '&apos;',
        '&' : '&amp;',
        '<' : '&lt;',
        '>' : '&gt;'
    },
    mapSymbol = function(s) {
        return symbols[s] || s;
    },
    buildEscape = function(regexp) {
        regexp = new RegExp(regexp, 'g');
        return function(str) {
            return ('' + str).replace(regexp, mapSymbol);
        };
    };

provide(/** @exports */{
    /**
     * Escape string to use in XML
     * @type Function
     * @param {String} str
     * @returns {String}
     */
    xml : buildEscape('[&<>]'),

    /**
     * Escape string to use in HTML
     * @type Function
     * @param {String} str
     * @returns {String}
     */
    html : buildEscape('[&<>]'),

    /**
     * Escape string to use in attributes
     * @type Function
     * @param {String} str
     * @returns {String}
     */
    attr : buildEscape('["\'&<>]')
});

});

/* ../../libs/bem-core/common.blocks/strings/__escape/strings__escape.vanilla.js end */
;
/* ../../libs/bem-components/common.blocks/select/_mode/select_mode_radio.js begin */
/**
 * @module select
 */

modules.define('select', function(provide, Select) {

/**
 * @exports
 * @class select
 * @bem
 */
provide(Select.decl({ modName : 'mode', modVal : 'radio' }, /** @lends select.prototype */{
    _updateControl : function() {
        var val = this.getVal();
        this.elem('control').val(val);
    },

    _updateButton : function() {
        this._button.setText(this._getCheckedItems()[0].getText());
    },

    _onMenuItemClick : function(_, data) {
        data.source === 'pointer' && this.delMod('opened');
    }
}));

});

/* ../../libs/bem-components/common.blocks/select/_mode/select_mode_radio.js end */
;
/* ../../libs/bem-components/common.blocks/menu/_mode/menu_mode.js begin */
/**
 * @module menu
 */

modules.define('menu', ['keyboard__codes'], function(provide, keyCodes, Menu) {

/**
 * @exports
 * @class menu
 * @bem
 */
provide(Menu.decl({ modName : 'mode' }, /** @lends menu.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {
                this.__base.apply(this, arguments);
                this._val = null;
                this._isValValid = false;
            }
        }
    },

    _onKeyDown : function(e) {
        if(e.keyCode === keyCodes.ENTER || e.keyCode === keyCodes.SPACE) {
            this
                .unbindFromDoc('keydown', this._onKeyDown)
                .bindToDoc('keyup', this._onKeyUp);

            e.keyCode === keyCodes.SPACE && e.preventDefault();
            this._onItemClick(this._hoveredItem, { source : 'keyboard' });
        }
        this.__base.apply(this, arguments);
    },

    _onKeyUp : function() {
        this.unbindFromDoc('keyup', this._onKeyUp);
        // it could be unfocused while is key being pressed
        this.hasMod('focused') && this.bindToDoc('keydown', this._onKeyDown);
    },

    /**
     * Returns menu value
     * @returns {*}
     */
    getVal : function() {
        if(!this._isValValid) {
            this._val = this._getVal();
            this._isValValid = true;
        }
        return this._val;
    },

    /**
     * @abstract
     * @protected
     * @returns {*}
     */
    _getVal : function() {
        throw Error('_getVal is not implemented');
    },

    /**
     * Sets menu value
     * @param {*} val
     * @returns {menu} this
     */
    setVal : function(val) {
        if(this._setVal(val)) {
            this._val = val;
            this._isValValid = true;
            this.emit('change');
        }
        return this;
    },

    /**
     * @abstract
     * @protected
     * @param {*} val
     * @returns {Boolean} returns true if value was changed
     */
    _setVal : function() {
        throw Error('_setVal is not implemented');
    },

    _updateItemsCheckedMod : function(modVals) {
        var items = this.getItems();
        modVals.forEach(function(modVal, i) {
            items[i].setMod('checked', modVal);
        });
    },

    /**
     * Sets content
     * @override
     */
    setContent : function() {
        var res = this.__base.apply(this, arguments);
        this._isValValid = false;
        this.emit('change'); // NOTE: potentially unwanted event could be emitted
        return res;
    }
}));

});

/* ../../libs/bem-components/common.blocks/menu/_mode/menu_mode.js end */
;
/* ../../libs/bem-components/common.blocks/menu/_mode/menu_mode_radio.js begin */
/**
 * @module menu
 */

modules.define('menu', function(provide, Menu) {

/**
 * @exports
 * @class menu
 * @bem
 */
provide(Menu.decl({ modName : 'mode', modVal : 'radio' }, /** @lends menu.prototype */{
    /**
     * @override
     */
    _getVal : function() {
        var items = this.getItems(),
            i = 0,
            item;

        while(item = items[i++])
            if(item.hasMod('checked'))
                return item.getVal();
    },

    /**
     * @override
     */
    _setVal : function(val) {
        var wasChanged = false,
            hasVal = false,
            itemsCheckedVals = this.getItems().map(function(item) {
                if(!item.isValEq(val)) return false;

                item.hasMod('checked') || (wasChanged = true);
                return hasVal = true;
            });

        if(!hasVal) return false;

        this._updateItemsCheckedMod(itemsCheckedVals);

        return wasChanged;
    },

    /**
     * @override
     */
    _onItemClick : function(clickedItem) {
        this.__base.apply(this, arguments);

        var isChanged = false;
        this.getItems().forEach(function(item) {
            if(item === clickedItem) {
                if(!item.hasMod('checked')) {
                    item.setMod('checked', true);
                    this._isValValid = false;
                    isChanged = true;
                }
            } else {
                item.delMod('checked');
            }
        }, this);
        isChanged && this.emit('change');
    }
}));

});

/* ../../libs/bem-components/common.blocks/menu/_mode/menu_mode_radio.js end */
;
/* ../../libs/bem-components/design/common.blocks/popup/_theme/popup_theme_islands.js begin */
modules.define('popup', ['objects'], function(provide, objects, Popup) {

provide(Popup.decl({ modName : 'theme', modVal : 'islands' }, {
    getDefaultParams : function() {
        return objects.extend(
            this.__base(),
            {
                mainOffset : 5,
                viewportOffset : 10
            });
    }
}));

});

/* ../../libs/bem-components/design/common.blocks/popup/_theme/popup_theme_islands.js end */
;
/* ../../libs/bem-components/common.blocks/menu/_mode/menu_mode_check.js begin */
/**
 * @module menu
 */

modules.define('menu', function(provide, Menu) {

/**
 * @exports
 * @class menu
 * @bem
 */
provide(Menu.decl({ modName : 'mode', modVal : 'check' }, /** @lends menu.prototype */{
    /**
     * @override
     */
    _getVal : function() {
        return this.getItems()
            .filter(function(item) { return item.hasMod('checked'); })
            .map(function(item) { return item.getVal(); });
    },

    /**
     * @override
     * @param {Array} vals
     */
    _setVal : function(vals) {
        var wasChanged = false,
            notFoundValsCnt = vals.length,
            itemsCheckedVals = this.getItems().map(function(item) {
                var isChecked = item.hasMod('checked'),
                    hasEqVal = vals.some(function(val) {
                        return item.isValEq(val);
                    });
                if(hasEqVal) {
                    --notFoundValsCnt;
                    isChecked || (wasChanged = true);
                } else {
                    isChecked && (wasChanged = true);
                }
                return hasEqVal;
            });

        if(!wasChanged || notFoundValsCnt)
            return false;

        this._updateItemsCheckedMod(itemsCheckedVals);

        return wasChanged;
    },

    /**
     * @override
     */
    _onItemClick : function(clickedItem) {
        this.__base.apply(this, arguments);

        this.getItems().forEach(function(item) {
            item === clickedItem && item.toggleMod('checked');
        });
        this._isValValid = false;
        this.emit('change');
    }
}));

});

/* ../../libs/bem-components/common.blocks/menu/_mode/menu_mode_check.js end */
;
/* ../../desktop.blocks/divider/divider.browser.js begin */
/* global modules:false */

modules.define('divider', function(provide) {

provide();

});


/* ../../desktop.blocks/divider/divider.browser.js end */
;
/* ../../common.blocks/disabler/disabler.browser.js begin */
/* global modules:false */

modules.define('disabler', function(provide) {

provide();

});


/* ../../common.blocks/disabler/disabler.browser.js end */
;
/* ../../common.blocks/confirm/confirm.browser.js begin */
/* global modules:false */

modules.define('confirm', ['i-bem__dom', 'events__channels', 'vow', 'state', 'keyboard__codes'], 
	function(provide, BEMDOM, channels, vow, state, keyCodes) {

var com = channels('116'),
    conf = state.getClientConfig;

provide(BEMDOM.decl(this.name, {
    onSetMod : {
        'js' : {
            'inited' : function() {
                this._popup = this.findBlockInside('popup');
                this._question = this.findBlockInside('question');

                this._popupDest = this.findBlockInside({ block: 'popup', modName: 'with-destination', modVal: 'true' });
                this._questionDest = this.findBlockInside({ block: 'question', modName: 'with-destination', modVal: 'true' });
                
                this._popupSimple = this.findBlockInside({ block: 'popup', modName: 'simple', modVal: 'true' });
				this._questionSimple = this.findBlockInside({ block: 'question', modName: 'simple', modVal: 'true' });

				this._manager = this.findBlockOutside('manager');
				this._disabler = this._manager.findBlockInside('disabler');
            }
        }
    },

    getConfirm: function(action, items, source, destination) {
        var defer = vow.defer(),
            _confMessage = conf().messages[action],
            _message,
            _length = items.length,
            _hint = _confMessage ? conf().messages[action].hint : null,
            list = items.length > 1 ? items.length : state.getName(items[0]);

        com.on('answer-is', function(e, data){ 
            defer.resolve(data);
            this._hidePopup();
        }, this);

        if(_confMessage && _length > 1) {
            list = _length;
            _message = _confMessage['PluralFiles'];
            _message = _message + list + ' files';
        } 
        else if (_confMessage) {
            list = state.getName(items[0]);
            _message = _confMessage['SingleFile'];
            _message = _message + list;
        }

        if (destination){
            this._currentQuestion = this._questionDest;
            this._currentQuestion.setDestination(destination);
        } else {
            this._currentQuestion = this._question;
        }

        _hint && this._currentQuestion.setHint(_hint);
        this._currentQuestion.setMessage(_message);
        source && this._currentQuestion.setSource(source);
        
        this._showPopup(destination);
        this._currentQuestion.setFocusToActive();
        
        return defer.promise();
    },

    getSimple: function(action, preset) {
        var defer = vow.defer(),
            _hint = conf().messages[action].hint,
            _message = conf().messages[action]['message'] || 'Type the text';

        com.on('answer-is', function(e, data){ 
            defer.resolve(data);
            this._hidePopup();
        }, this);
        
        this._currentQuestion = this._questionSimple;

        this._questionSimple.setSimple(_message, preset);
        _hint && this._questionSimple.setHint(_hint);

        this._showPopup('simple');
        this._currentQuestion.setFocusToActive();

		return defer.promise();
    },

    _onKeyPress: function(e) {
        var keyCode = e.keyCode;
                
        // close on Esc
        if(keyCode === keyCodes.ESC) {
            e.preventDefault();
            com.emit('answer-is', 'false');
        }
        else if(keyCode === keyCodes.TAB){
            e.preventDefault();
            this._currentQuestion.focusOnNextButton();
        }
    },

    _showPopup: function(dest) {
        var _left = Math.round(window.innerWidth / 2);

        dest !== 'simple' && (this._activePopup = dest ? this._popupDest : this._popup);
        dest === 'simple' && (this._activePopup = this._popupSimple);
        
        this._disabler.delMod('disabled');
        this._activePopup.setPosition(_left, 360);
        this._activePopup.setMod('visible');

        // ask all keydown subscribers to ignore keydowns
        com.emit('keyOverride');

        this.bindToDoc('keydown', this._onKeyPress);
    },

    _hidePopup: function() {
        delete this._currentQuestion;
        this._disabler.setMod('disabled', 'true');
        this._activePopup.delMod('visible');

        // tell all keydown subscribers that they can resume listening
        this.unbindFromDoc('keydown', this._onKeyPress);
        com.emit('keyRestore');
    }
}));

});

/* ../../common.blocks/confirm/confirm.browser.js end */
;
/* ../../libs/bem-components/common.blocks/popup/_target/popup_target_position.js begin */
/**
 * @module popup
 */

modules.define(
    'popup',
    function(provide, Popup) {

/**
 * @exports
 * @class popup
 * @bem
 */
provide(Popup.decl({ modName : 'target', modVal : 'position' }, /** @lends popup.prototype */{
    beforeSetMod : {
        'visible' : {
            'true' : function() {
                if(!this._position)
                    throw Error('Can\'t show popup without position');
            }
        }
    },

    onSetMod : {
        'js' : {
            'inited' : function() {
                this.__base.apply(this, arguments);
                this._position = null;
            }
        }
    },

    /**
     * Sets position
     * @param {Number} left x-coordinate
     * @param {Number} top y-coordinate
     * @returns {popup} this
     */
    setPosition : function(left, top) {
        this._position = { left : left, top : top };
        return this.redraw();
    },

    /**
     * @override
     */
    _calcTargetDimensions : function() {
        var pos = this._position;

        return {
            left : pos.left,
            top : pos.top,
            width : 0,
            height : 0
        };
    }
}));

});

/* ../../libs/bem-components/common.blocks/popup/_target/popup_target_position.js end */
;
/* ../../common.blocks/question/question.browser.js begin */
/* global modules:false */

modules.define('question', ['i-bem__dom', 'events__channels', 'vow', 'BEMHTML'], 
	function(provide, BEMDOM, channels, vow, BEMHTML) {

var com = channels('116');

provide(BEMDOM.decl(this.name, {
    onSetMod : {
        'js' : {
            'inited' : function() {
				this._source = this.findBlockInside({ block: 'path', modName: 'source', modVal: 'true' });
				this._message = this.elem('message');
                this._buttons = this.findBlocksInside('button');

				BEMDOM.blocks['button'].on(this.domElem, 'click', this._onClick, this);
            }
        }
    },

    _onClick : function(e) {
		var _name = e.target.domElem.context.name,
		    _val = e.target.getVal();

	    this.hasMod('with-destination', 'true') && (_val = { answer: _val, destination: this._destination.getVal() })
	    this.hasMod('simple') && (_val = { answer: _val, destination: this._simple.getVal() })

		com.emit('answer-is', _val);
    },

    setSource: function(val) {
        this._source.setVal(val);
    },

    focusOnNextButton: function(val) {
        var index = this._buttons.indexOf(this._activeButton);

        if(index === -1 || this._buttons.length === index + 1) {
            this._activeButton = this._buttons[0];
        } else {
            this._activeButton = this._buttons[index + 1]
        }

        this._activeButton.setMod('focused');
    },

    setSimple: function(message, val) {
        !this.hasMod('simple') && this.setMod('simple', 'true');
        this._simple = this.findBlockInside({ block: 'path', modName: 'simple', modVal: 'true' });
        val ? this._simple.setVal(val) : this._simple.setVal('');
        this._message.html(message);

        this._active = this._simple;
    },

    setFocusToActive: function() {
        this._active && this._active.setFocus();
    },

    setDestination: function(val) {
    	!this.hasMod('with-destination', 'true') && this.setMod('with-destination', 'true');
    	this._destination = this.findBlockInside({ block: 'path', modName: 'destination', modVal: 'true' });
        this._destination.setVal(val);
    	this._active = this._destination;
    },

    setHint: function(val) {
        this.elem('hint').html(val);
    },

    setMessage: function(val) {
		this._message.html(val + '<br>from the folder:');
	}
}));

});

/* ../../common.blocks/question/question.browser.js end */
;
/* ../../common.blocks/info/info.browser.js begin */
/* global modules:false */

modules.define('info', function(provide) {

provide();

});


/* ../../common.blocks/info/info.browser.js end */
;
/* ../../common.blocks/status/status.browser.js begin */
/* global modules:false */

modules.define('status', ['i-bem__dom', 'events__channels', 'state', 'functions__debounce', 'size'], 
	function(provide, BEMDOM, channels, state, debounce, size) {
		var com = channels('116');

provide(BEMDOM.decl(this.name, {
    onSetMod : {
        'js' : {
            'inited' : function() {
        		this._position = this.getMod('position');
                this._list = this.elem('list');
                this._listSize = this.elem('list-size');
                this._selected = this.elem('selected');

                this.setMod(this._selected, this._position);

                // updating list size on states retrival
        		com.on('updated-item-' + this._position, debounce(this._updateListSize, 700, this), this);
                com.on('path-' + this._position, this._updateListSize, this);
				
                com.on('ready-list-' + this._position, this._updateList, this);
                
                com.on('checked-' + this._position, this._addItem, this);
                com.on('unchecked-' + this._position, this._removeItem, this);
            }
        }     
    },

    _addItem: function(e, data) {
        var _size = state.getState(data, 'size');

        this._itemNumber || (this._itemNumber = 0);
        this._itemsSize  || (this._itemsSize = 0);

        _size && (this._itemsSize += _size);
        this._itemNumber += 1;

        this._updateChecked();
    },

    _removeItem: function(e, data) {
        var _size = state.getState(data, 'size');

        (this._itemsSize -= _size);
        this._itemNumber -= 1;

        this._updateChecked();

        this._itemsSize || this._itemNumber || this._selected.html('') && this.elem('selected-size').html('');
    },

    _updateChecked: function() {
        this._selected.html(this._itemNumber + ' files selected');
        this.elem('selected-size').html('the list size is ' + size(this._itemsSize));
    },

    _clearItems: function() {
        delete this._itemsSize;
        delete this._itemNumber;
        this._selected.html('');
    },

    _updateList: function(e, data) {
        this._itemNumber && this._clearItems();
        this._list.html('Folder contains ' + data + ' files');
        this._updateListSize();
    },

    _updateListSize: function() {
        var _size = 0,
            _curPath = state.getCurPath(this._position),
            _list = state.getCurList(this._position);

        _list ? _list.forEach(function(item){
                _size += state.getState(_curPath + '/' + item, 'size');
            }) : (_size = 0);

        this._listSize.html('Total size ' + size(_size));
    }
}));

});

/* ../../common.blocks/status/status.browser.js end */
;
/* ../../common.blocks/disk-monitor/disk-monitor.browser.js begin */
/* global modules:false */

modules.define('disk-monitor', ['i-bem__dom', 'events__channels', 'state'], 
    function(provide, BEMDOM, channels, state) {
        var com = channels('116'),
            conf = state.getClientConfig;

provide(BEMDOM.decl(this.name, {
    onSetMod : {
        'js' : {
            'inited' : function() {
            	this._position = this.getMod('position');
                com.on(this._position +'-drive-changed' + ' disks-changed', this._update, this);
            }
        }      
    }, 

    _update : function() {
    	var disk = state.getDisks()[state.getActiveDriveIndex(this._position)];
    	this.elem('free').html(disk.available);
    	this.elem('total').html(disk.total);
    	this.elem('mount-point').html(disk.mountpoint);
    }
}));

});

/* ../../common.blocks/disk-monitor/disk-monitor.browser.js end */
;
(function(g) {
  var __bem_xjst = function(exports) {
     var $$mode = "", $$block = "", $$elem = "", $$elemMods = null, $$mods = null;

var __$ref = {};

function apply(ctx) {
    ctx = ctx || this;
    $$mods = ctx["mods"];
    $$elemMods = ctx["elemMods"];
    $$elem = ctx["elem"];
    $$block = ctx["block"];
    $$mode = ctx["_mode"];
    try {
        return applyc(ctx, __$ref);
    } catch (e) {
        e.xjstContext = ctx;
        throw e;
    }
}

exports.apply = apply;

function applyc(__$ctx, __$ref) {
    var __$t = $$mode;
    if (__$t === "bem") {
        var __$t = $$block;
        if (__$t === "path-normalizer") {
            if (!$$elem) {
                return false;
            }
        } else if (__$t === "ua") {
            if (!$$elem) {
                return false;
            }
        }
        return undefined;
    } else if (__$t === "content") {
        var __$r = __$g0(__$ctx, __$ref);
        if (__$r !== __$ref) return __$r;
    } else if (__$t === "js") {
        var __$r = __$g1(__$ctx, __$ref);
        if (__$r !== __$ref) return __$r;
    } else if (__$t === "tag") {
        var __$r = __$g2(__$ctx, __$ref);
        if (__$r !== __$ref) return __$r;
    } else if (__$t === "attrs") {
        var __$r = __$g3(__$ctx, __$ref);
        if (__$r !== __$ref) return __$r;
    } else if (__$t === "default") {
        var __$r = __$g4(__$ctx, __$ref);
        if (__$r !== __$ref) return __$r;
    } else if (__$t === "mix") {
        var __$t = $$block;
        if (__$t === "menu") {
            if (!$$elem) {
                return [ {
                    elem: "control"
                } ];
            }
        } else if (__$t === "button") {
            if (!$$elem) {
                return {
                    elem: "control"
                };
            }
        }
        return undefined;
    } else if (__$t === "cls") {
        return undefined;
    } else if (__$t === "") {
        if (__$ctx.ctx && __$ctx.ctx._vow && (__$ctx.__$a0 & 65536) === 0) {
            var __$r = __$b72(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        if (__$ctx.isSimple(__$ctx.ctx)) {
            var __$r = __$b73(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        if (!__$ctx.ctx) {
            var __$r = __$b74(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        if (__$ctx.isArray(__$ctx.ctx)) {
            var __$r = __$b75(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        var __$r = __$b76(__$ctx, __$ref);
        if (__$r !== __$ref) return __$r;
    }
}

[ function(exports, context) {
    var undef, BEM_ = {}, toString = Object.prototype.toString, slice = Array.prototype.slice, isArray = Array.isArray || function(obj) {
        return toString.call(obj) === "[object Array]";
    }, SHORT_TAGS = {
        area: 1,
        base: 1,
        br: 1,
        col: 1,
        command: 1,
        embed: 1,
        hr: 1,
        img: 1,
        input: 1,
        keygen: 1,
        link: 1,
        meta: 1,
        param: 1,
        source: 1,
        wbr: 1
    };
    (function(BEM, undefined) {
        var MOD_DELIM = "_", ELEM_DELIM = "__", NAME_PATTERN = "[a-zA-Z0-9-]+";
        function buildModPostfix(modName, modVal) {
            var res = MOD_DELIM + modName;
            if (modVal !== true) res += MOD_DELIM + modVal;
            return res;
        }
        function buildBlockClass(name, modName, modVal) {
            var res = name;
            if (modVal) res += buildModPostfix(modName, modVal);
            return res;
        }
        function buildElemClass(block, name, modName, modVal) {
            var res = buildBlockClass(block) + ELEM_DELIM + name;
            if (modVal) res += buildModPostfix(modName, modVal);
            return res;
        }
        BEM.INTERNAL = {
            NAME_PATTERN: NAME_PATTERN,
            MOD_DELIM: MOD_DELIM,
            ELEM_DELIM: ELEM_DELIM,
            buildModPostfix: buildModPostfix,
            buildClass: function(block, elem, modName, modVal) {
                var typeOfModName = typeof modName;
                if (typeOfModName === "string" || typeOfModName === "boolean") {
                    var typeOfModVal = typeof modVal;
                    if (typeOfModVal !== "string" && typeOfModVal !== "boolean") {
                        modVal = modName;
                        modName = elem;
                        elem = undef;
                    }
                } else if (typeOfModName !== "undefined") {
                    modName = undef;
                } else if (elem && typeof elem !== "string") {
                    elem = undef;
                }
                if (!(elem || modName)) {
                    return block;
                }
                return elem ? buildElemClass(block, elem, modName, modVal) : buildBlockClass(block, modName, modVal);
            },
            buildModsClasses: function(block, elem, mods) {
                var res = "";
                if (mods) {
                    var modName;
                    for (modName in mods) {
                        if (!mods.hasOwnProperty(modName)) continue;
                        var modVal = mods[modName];
                        if (!modVal && modVal !== 0) continue;
                        typeof modVal !== "boolean" && (modVal += "");
                        res += " " + (elem ? buildElemClass(block, elem, modName, modVal) : buildBlockClass(block, modName, modVal));
                    }
                }
                return res;
            },
            buildClasses: function(block, elem, mods) {
                var res = "";
                res += elem ? buildElemClass(block, elem) : buildBlockClass(block);
                res += this.buildModsClasses(block, elem, mods);
                return res;
            }
        };
    })(BEM_);
    var ts = {
        '"': "&quot;",
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;"
    }, f = function(t) {
        return ts[t] || t;
    };
    var buildEscape = function(r) {
        r = new RegExp(r, "g");
        return function(s) {
            return ("" + s).replace(r, f);
        };
    };
    context.BEMContext = BEMContext;
    function BEMContext(context, apply_) {
        this.ctx = typeof context === "undefined" ? "" : context;
        this.apply = apply_;
        this._str = "";
        var _this = this;
        this._buf = {
            push: function() {
                var chunks = slice.call(arguments).join("");
                _this._str += chunks;
            },
            join: function() {
                return this._str;
            }
        };
        this._ = this;
        this._start = true;
        this._mode = "";
        this._listLength = 0;
        this._notNewList = false;
        this.position = 0;
        this.block = undef;
        this.elem = undef;
        this.mods = undef;
        this.elemMods = undef;
    }
    BEMContext.prototype.isArray = isArray;
    BEMContext.prototype.isSimple = function isSimple(obj) {
        if (!obj || obj === true) return true;
        var t = typeof obj;
        return t === "string" || t === "number";
    };
    BEMContext.prototype.isShortTag = function isShortTag(t) {
        return SHORT_TAGS.hasOwnProperty(t);
    };
    BEMContext.prototype.extend = function extend(o1, o2) {
        if (!o1 || !o2) return o1 || o2;
        var res = {}, n;
        for (n in o1) o1.hasOwnProperty(n) && (res[n] = o1[n]);
        for (n in o2) o2.hasOwnProperty(n) && (res[n] = o2[n]);
        return res;
    };
    var cnt = 0, id = +new Date(), expando = "__" + id, get = function() {
        return "uniq" + id + ++cnt;
    };
    BEMContext.prototype.identify = function(obj, onlyGet) {
        if (!obj) return get();
        if (onlyGet || obj[expando]) {
            return obj[expando];
        } else {
            return obj[expando] = get();
        }
    };
    BEMContext.prototype.xmlEscape = buildEscape("[&<>]");
    BEMContext.prototype.attrEscape = buildEscape('["&<>]');
    BEMContext.prototype.BEM = BEM_;
    BEMContext.prototype.isFirst = function isFirst() {
        return this.position === 1;
    };
    BEMContext.prototype.isLast = function isLast() {
        return this.position === this._listLength;
    };
    BEMContext.prototype.generateId = function generateId() {
        return this.identify(this.ctx);
    };
    var oldApply = exports.apply;
    exports.apply = BEMContext.apply = function BEMContext_apply(context) {
        var ctx = new BEMContext(context || this, oldApply);
        ctx.apply();
        return ctx._str;
    };
    BEMContext.prototype.reapply = BEMContext.apply;
} ].forEach(function(fn) {
    fn(exports, this);
}, {
    recordExtensions: function(ctx) {
        ctx["__$a0"] = 0;
        ctx["_checkedOption"] = undefined;
        ctx["_input"] = undefined;
        ctx["_mode"] = undefined;
        ctx["ctx"] = undefined;
        ctx["_menuMods"] = undefined;
        ctx["_select"] = undefined;
        ctx["_checkedOptions"] = undefined;
        ctx["_firstOption"] = undefined;
        ctx["_str"] = undefined;
        ctx["block"] = undefined;
        ctx["elem"] = undefined;
        ctx["_notNewList"] = undefined;
        ctx["position"] = undefined;
        ctx["_listLength"] = undefined;
        ctx["_currBlock"] = undefined;
        ctx["mods"] = undefined;
        ctx["elemMods"] = undefined;
    },
    resetApplyNext: function(ctx) {
        ctx["__$a0"] = 0;
    }
});

function __$b14(__$ctx, __$ref) {
    var ctx__$75 = __$ctx.ctx, content__$76 = [ ctx__$75.icon ];
    "text" in ctx__$75 && content__$76.push({
        elem: "text",
        content: ctx__$75.text
    });
    return content__$76;
}

function __$b23(__$ctx, __$ref) {
    var ctx__$96 = __$ctx.ctx;
    return {
        name: ctx__$96.name,
        optionsMaxHeight: ctx__$96.optionsMaxHeight
    };
}

function __$b26(__$ctx, __$ref) {
    var ctx__$16 = __$ctx.ctx;
    return {
        mainOffset: ctx__$16.mainOffset,
        secondaryOffset: ctx__$16.secondaryOffset,
        viewportOffset: ctx__$16.viewportOffset,
        directions: ctx__$16.directions,
        zIndexGroupLevel: ctx__$16.zIndexGroupLevel
    };
}

function __$b47(__$ctx, __$ref) {
    var attrs__$0 = {
        "aria-hidden": "true"
    }, url__$1 = __$ctx.ctx.url;
    if (url__$1) attrs__$0.style = "background-image:url(" + url__$1 + ")";
    return attrs__$0;
}

function __$b51(__$ctx, __$ref) {
    var attrs__$46 = {
        role: "menu"
    };
    $$mods.disabled || (attrs__$46.tabindex = 0);
    return attrs__$46;
}

function __$b53(__$ctx, __$ref) {
    var ctx__$77 = __$ctx.ctx, attrs__$78 = {
        type: $$mods.type || "button",
        name: ctx__$77.name,
        value: ctx__$77.val
    };
    $$mods.disabled && (attrs__$78.disabled = "disabled");
    return __$ctx.extend(function __$lb__$79() {
        var __$r__$80;
        var __$l0__$81 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 4096;
        __$r__$80 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l0__$81;
        return __$r__$80;
    }(), attrs__$78);
}

function __$b54(__$ctx, __$ref) {
    var ctx__$82 = __$ctx.ctx;
    return {
        role: "button",
        tabindex: ctx__$82.tabIndex,
        id: ctx__$82.id,
        title: ctx__$82.title
    };
}

function __$b55(__$ctx, __$ref) {
    var input__$26 = __$ctx._input, attrs__$27 = {
        id: input__$26.id,
        name: input__$26.name,
        value: input__$26.val,
        maxlength: input__$26.maxLength,
        tabindex: input__$26.tabIndex,
        placeholder: input__$26.placeholder
    };
    input__$26.autocomplete === false && (attrs__$27.autocomplete = "off");
    $$mods.disabled && (attrs__$27.disabled = "disabled");
    return attrs__$27;
}

function __$b58(__$ctx, __$ref) {
    (__$ctx._firstItem.mods = __$ctx._firstItem.mods || {}).checked = true;
    var __$r__$3;
    var __$l0__$4 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 1;
    __$r__$3 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l0__$4;
    return;
}

function __$b59(__$ctx, __$ref) {
    var ctx__$47 = __$ctx.ctx, mods__$48 = $$mods, firstItem__$49, checkedItems__$50 = [];
    if (ctx__$47.content) {
        var isValDef__$51 = typeof ctx__$47.val !== "undefined", containsVal__$52 = function(val) {
            return isValDef__$51 && (mods__$48.mode === "check" ? ctx__$47.val.indexOf(val) > -1 : ctx__$47.val === val);
        }, iterateItems__$53 = function(content) {
            var i__$54 = 0, itemOrGroup__$55;
            while (itemOrGroup__$55 = content[i__$54++]) {
                if (itemOrGroup__$55.block === "menu-item") {
                    firstItem__$49 || (firstItem__$49 = itemOrGroup__$55);
                    if (containsVal__$52(itemOrGroup__$55.val)) {
                        (itemOrGroup__$55.mods = itemOrGroup__$55.mods || {}).checked = true;
                        checkedItems__$50.push(itemOrGroup__$55);
                    }
                } else {
                    iterateItems__$53(itemOrGroup__$55.content);
                }
            }
        };
        if (!__$ctx.isArray(ctx__$47.content)) throw Error("menu: content must be an array of the menu items");
        iterateItems__$53(ctx__$47.content);
    }
    __$ctx._firstItem = firstItem__$49;
    __$ctx._checkedItems = checkedItems__$50;
    var __$r__$57;
    var __$l0__$58 = __$ctx._menuMods;
    __$ctx._menuMods = {
        theme: mods__$48.theme,
        disabled: mods__$48.disabled
    };
    var __$r__$60;
    var __$l1__$61 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 512;
    __$r__$60 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l1__$61;
    __$r__$57 = __$r__$60;
    __$ctx._menuMods = __$l0__$58;
    return;
}

function __$b60(__$ctx, __$ref) {
    var checkedOptions__$8 = __$ctx._checkedOptions, firstOption__$9 = __$ctx._firstOption;
    if (firstOption__$9 && !checkedOptions__$8.length) {
        firstOption__$9.checked = true;
        checkedOptions__$8 = [ firstOption__$9 ];
    }
    var __$r__$11;
    var __$l0__$12 = __$ctx._checkedOption;
    __$ctx._checkedOption = checkedOptions__$8[0];
    var __$r__$14;
    var __$l1__$15 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 4;
    __$r__$14 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l1__$15;
    __$r__$11 = __$r__$14;
    __$ctx._checkedOption = __$l0__$12;
    return;
}

function __$b61(__$ctx, __$ref) {
    var mods__$62 = $$mods, optionToMenuItem__$63 = function(option) {
        var res__$64 = {
            block: "menu-item",
            mods: {
                disabled: mods__$62.disabled || option.disabled
            },
            val: option.val,
            js: {
                checkedText: option.checkedText
            },
            content: option.text
        };
        if (option.icon) {
            res__$64.js.text = option.text;
            res__$64.content = [ option.icon, res__$64.content ];
        }
        return res__$64;
    };
    var __$r__$66;
    var __$l0__$67 = $$mode;
    $$mode = "";
    var __$l1__$68 = __$ctx.ctx;
    __$ctx.ctx = {
        block: "menu",
        mix: {
            block: $$block,
            elem: $$elem
        },
        mods: {
            size: mods__$62.size,
            theme: mods__$62.theme,
            disabled: mods__$62.disabled,
            mode: mods__$62.mode
        },
        val: __$ctx._select.val,
        attrs: {
            tabindex: undefined
        },
        content: __$ctx._select.options.map(function(optionOrGroup) {
            return optionOrGroup.group ? {
                elem: "group",
                mods: {
                    "has-title": !!optionOrGroup.title
                },
                title: optionOrGroup.title,
                content: optionOrGroup.group.map(optionToMenuItem__$63)
            } : optionToMenuItem__$63(optionOrGroup);
        })
    };
    var __$r__$70;
    var __$l2__$71 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 1024;
    __$r__$70 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l2__$71;
    __$r__$66 = __$r__$70;
    $$mode = __$l0__$67;
    __$ctx.ctx = __$l1__$68;
    return;
}

function __$b62(__$ctx, __$ref) {
    var mods__$83 = $$mods;
    var __$r__$85;
    var __$l0__$86 = $$mode;
    $$mode = "";
    var __$l1__$87 = __$ctx.ctx;
    __$ctx.ctx = {
        block: "button",
        mix: {
            block: $$block,
            elem: $$elem
        },
        mods: {
            size: mods__$83.size,
            theme: mods__$83.theme,
            view: mods__$83.view,
            focused: mods__$83.focused,
            disabled: mods__$83.disabled,
            checked: mods__$83.mode !== "radio" && !!__$ctx._checkedOptions.length
        },
        id: __$ctx._select.id,
        tabIndex: __$ctx._select.tabIndex,
        content: [ function __$lb__$88() {
            var __$r__$89;
            var __$l3__$90 = $$mode;
            $$mode = "content";
            __$r__$89 = applyc(__$ctx, __$ref);
            $$mode = __$l3__$90;
            return __$r__$89;
        }(), {
            block: "icon",
            mix: {
                block: "select",
                elem: "tick"
            }
        } ]
    };
    var __$r__$91;
    var __$l2__$92 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 8192;
    __$r__$91 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l2__$92;
    __$r__$85 = __$r__$91;
    $$mode = __$l0__$86;
    __$ctx.ctx = __$l1__$87;
    return;
}

function __$b63(__$ctx, __$ref) {
    if (!$$mods.mode) throw Error("Can't build select without mode modifier");
    var ctx__$97 = __$ctx.ctx, isValDef__$98 = typeof ctx__$97.val !== "undefined", isModeCheck__$99 = $$mods.mode === "check", firstOption__$100, checkedOptions__$101 = [], containsVal__$102 = function(val) {
        return isValDef__$98 && (isModeCheck__$99 ? ctx__$97.val.indexOf(val) > -1 : ctx__$97.val === val);
    }, iterateOptions__$103 = function(content) {
        var i__$104 = 0, option__$105;
        while (option__$105 = content[i__$104++]) {
            if (option__$105.group) {
                iterateOptions__$103(option__$105.group);
            } else {
                firstOption__$100 || (firstOption__$100 = option__$105);
                if (containsVal__$102(option__$105.val)) {
                    option__$105.checked = true;
                    checkedOptions__$101.push(option__$105);
                }
            }
        }
    };
    iterateOptions__$103(ctx__$97.options);
    var __$r__$107;
    var __$l0__$108 = __$ctx._select;
    __$ctx._select = __$ctx.ctx;
    var __$l1__$109 = __$ctx._checkedOptions;
    __$ctx._checkedOptions = checkedOptions__$101;
    var __$l2__$110 = __$ctx._firstOption;
    __$ctx._firstOption = firstOption__$100;
    var __$r__$112;
    var __$l3__$113 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 32768;
    __$r__$112 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l3__$113;
    __$r__$107 = __$r__$112;
    __$ctx._select = __$l0__$108;
    __$ctx._checkedOptions = __$l1__$109;
    __$ctx._firstOption = __$l2__$110;
    return;
}

function __$b64(__$ctx, __$ref) {
    var __$r__$29;
    var __$l0__$30 = __$ctx._input;
    __$ctx._input = __$ctx.ctx;
    var __$r__$32;
    var __$l1__$33 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 64;
    __$r__$32 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l1__$33;
    __$r__$29 = __$r__$32;
    __$ctx._input = __$l0__$30;
    return;
}

function __$b65(__$ctx, __$ref) {
    var ctx__$34 = __$ctx.ctx;
    ctx__$34._wrapped = true;
    var __$r__$36;
    var __$l0__$37 = $$mode;
    $$mode = "";
    var __$l1__$38 = __$ctx.ctx;
    __$ctx.ctx = {
        block: "details-wrapper",
        content: __$ctx.ctx
    };
    var __$r__$40;
    var __$l2__$41 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 128;
    __$r__$40 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l2__$41;
    __$r__$36 = __$r__$40;
    $$mode = __$l0__$37;
    __$ctx.ctx = __$l1__$38;
    return;
}

function __$b66(__$ctx, __$ref) {
    var mods__$42 = $$mods;
    mods__$42.theme = mods__$42.theme || __$ctx._menuMods.theme;
    mods__$42.disabled = mods__$42.disabled || __$ctx._menuMods.disabled;
    var __$r__$44;
    var __$l0__$45 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 256;
    __$r__$44 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l0__$45;
    return;
}

function __$b67(__$ctx, __$ref) {
    var BEM_INTERNAL__$114 = __$ctx.BEM.INTERNAL, ctx__$115 = __$ctx.ctx, isBEM__$116, tag__$117, res__$118;
    var __$r__$120;
    var __$l0__$121 = __$ctx._str;
    __$ctx._str = "";
    var vBlock__$122 = $$block;
    var __$r__$124;
    var __$l1__$125 = $$mode;
    $$mode = "tag";
    __$r__$124 = applyc(__$ctx, __$ref);
    $$mode = __$l1__$125;
    tag__$117 = __$r__$124;
    typeof tag__$117 !== "undefined" || (tag__$117 = ctx__$115.tag);
    typeof tag__$117 !== "undefined" || (tag__$117 = "div");
    if (tag__$117) {
        var jsParams__$126, js__$127;
        if (vBlock__$122 && ctx__$115.js !== false) {
            var __$r__$128;
            var __$l2__$129 = $$mode;
            $$mode = "js";
            __$r__$128 = applyc(__$ctx, __$ref);
            $$mode = __$l2__$129;
            js__$127 = __$r__$128;
            js__$127 = js__$127 ? __$ctx.extend(ctx__$115.js, js__$127 === true ? {} : js__$127) : ctx__$115.js === true ? {} : ctx__$115.js;
            js__$127 && ((jsParams__$126 = {})[BEM_INTERNAL__$114.buildClass(vBlock__$122, ctx__$115.elem)] = js__$127);
        }
        __$ctx._str += "<" + tag__$117;
        var __$r__$130;
        var __$l3__$131 = $$mode;
        $$mode = "bem";
        __$r__$130 = applyc(__$ctx, __$ref);
        $$mode = __$l3__$131;
        isBEM__$116 = __$r__$130;
        typeof isBEM__$116 !== "undefined" || (isBEM__$116 = typeof ctx__$115.bem !== "undefined" ? ctx__$115.bem : ctx__$115.block || ctx__$115.elem);
        var __$r__$133;
        var __$l4__$134 = $$mode;
        $$mode = "cls";
        __$r__$133 = applyc(__$ctx, __$ref);
        $$mode = __$l4__$134;
        var cls__$132 = __$r__$133;
        cls__$132 || (cls__$132 = ctx__$115.cls);
        var addJSInitClass__$135 = ctx__$115.block && jsParams__$126 && !ctx__$115.elem;
        if (isBEM__$116 || cls__$132) {
            __$ctx._str += ' class="';
            if (isBEM__$116) {
                __$ctx._str += BEM_INTERNAL__$114.buildClasses(vBlock__$122, ctx__$115.elem, ctx__$115.elemMods || ctx__$115.mods);
                var __$r__$137;
                var __$l5__$138 = $$mode;
                $$mode = "mix";
                __$r__$137 = applyc(__$ctx, __$ref);
                $$mode = __$l5__$138;
                var mix__$136 = __$r__$137;
                ctx__$115.mix && (mix__$136 = mix__$136 ? [].concat(mix__$136, ctx__$115.mix) : ctx__$115.mix);
                if (mix__$136) {
                    var visited__$139 = {}, visitedKey__$140 = function(block, elem) {
                        return (block || "") + "__" + (elem || "");
                    };
                    visited__$139[visitedKey__$140(vBlock__$122, $$elem)] = true;
                    __$ctx.isArray(mix__$136) || (mix__$136 = [ mix__$136 ]);
                    for (var i__$141 = 0; i__$141 < mix__$136.length; i__$141++) {
                        var mixItem__$142 = mix__$136[i__$141], hasItem__$143 = mixItem__$142.block && (vBlock__$122 !== ctx__$115.block || mixItem__$142.block !== vBlock__$122) || mixItem__$142.elem, mixBlock__$144 = mixItem__$142.block || mixItem__$142._block || $$block, mixElem__$145 = mixItem__$142.elem || mixItem__$142._elem || $$elem;
                        hasItem__$143 && (__$ctx._str += " ");
                        __$ctx._str += BEM_INTERNAL__$114[hasItem__$143 ? "buildClasses" : "buildModsClasses"](mixBlock__$144, mixItem__$142.elem || mixItem__$142._elem || (mixItem__$142.block ? undefined : $$elem), mixItem__$142.elemMods || mixItem__$142.mods);
                        if (mixItem__$142.js) {
                            (jsParams__$126 || (jsParams__$126 = {}))[BEM_INTERNAL__$114.buildClass(mixBlock__$144, mixItem__$142.elem)] = mixItem__$142.js === true ? {} : mixItem__$142.js;
                            addJSInitClass__$135 || (addJSInitClass__$135 = mixBlock__$144 && !mixItem__$142.elem);
                        }
                        if (hasItem__$143 && !visited__$139[visitedKey__$140(mixBlock__$144, mixElem__$145)]) {
                            visited__$139[visitedKey__$140(mixBlock__$144, mixElem__$145)] = true;
                            var __$r__$147;
                            var __$l6__$148 = $$mode;
                            $$mode = "mix";
                            var __$l7__$149 = $$block;
                            $$block = mixBlock__$144;
                            var __$l8__$150 = $$elem;
                            $$elem = mixElem__$145;
                            __$r__$147 = applyc(__$ctx, __$ref);
                            $$mode = __$l6__$148;
                            $$block = __$l7__$149;
                            $$elem = __$l8__$150;
                            var nestedMix__$146 = __$r__$147;
                            if (nestedMix__$146) {
                                for (var j__$151 = 0; j__$151 < nestedMix__$146.length; j__$151++) {
                                    var nestedItem__$152 = nestedMix__$146[j__$151];
                                    if (!nestedItem__$152.block && !nestedItem__$152.elem || !visited__$139[visitedKey__$140(nestedItem__$152.block, nestedItem__$152.elem)]) {
                                        nestedItem__$152._block = mixBlock__$144;
                                        nestedItem__$152._elem = mixElem__$145;
                                        mix__$136.splice(i__$141 + 1, 0, nestedItem__$152);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            cls__$132 && (__$ctx._str += isBEM__$116 ? " " + cls__$132 : cls__$132);
            __$ctx._str += addJSInitClass__$135 ? ' i-bem"' : '"';
        }
        if (isBEM__$116 && jsParams__$126) {
            __$ctx._str += ' data-bem="' + __$ctx.attrEscape(JSON.stringify(jsParams__$126)) + '"';
        }
        var __$r__$154;
        var __$l9__$155 = $$mode;
        $$mode = "attrs";
        __$r__$154 = applyc(__$ctx, __$ref);
        $$mode = __$l9__$155;
        var attrs__$153 = __$r__$154;
        attrs__$153 = __$ctx.extend(attrs__$153, ctx__$115.attrs);
        if (attrs__$153) {
            var name__$156, attr__$157;
            for (name__$156 in attrs__$153) {
                attr__$157 = attrs__$153[name__$156];
                if (typeof attr__$157 === "undefined") continue;
                __$ctx._str += " " + name__$156 + '="' + __$ctx.attrEscape(__$ctx.isSimple(attr__$157) ? attr__$157 : __$ctx.reapply(attr__$157)) + '"';
            }
        }
    }
    if (__$ctx.isShortTag(tag__$117)) {
        __$ctx._str += "/>";
    } else {
        tag__$117 && (__$ctx._str += ">");
        var __$r__$159;
        var __$l10__$160 = $$mode;
        $$mode = "content";
        __$r__$159 = applyc(__$ctx, __$ref);
        $$mode = __$l10__$160;
        var content__$158 = __$r__$159;
        if (content__$158 || content__$158 === 0) {
            isBEM__$116 = vBlock__$122 || $$elem;
            var __$r__$161;
            var __$l11__$162 = $$mode;
            $$mode = "";
            var __$l12__$163 = __$ctx._notNewList;
            __$ctx._notNewList = false;
            var __$l13__$164 = __$ctx.position;
            __$ctx.position = isBEM__$116 ? 1 : __$ctx.position;
            var __$l14__$165 = __$ctx._listLength;
            __$ctx._listLength = isBEM__$116 ? 1 : __$ctx._listLength;
            var __$l15__$166 = __$ctx.ctx;
            __$ctx.ctx = content__$158;
            __$r__$161 = applyc(__$ctx, __$ref);
            $$mode = __$l11__$162;
            __$ctx._notNewList = __$l12__$163;
            __$ctx.position = __$l13__$164;
            __$ctx._listLength = __$l14__$165;
            __$ctx.ctx = __$l15__$166;
        }
        tag__$117 && (__$ctx._str += "</" + tag__$117 + ">");
    }
    res__$118 = __$ctx._str;
    __$r__$120 = undefined;
    __$ctx._str = __$l0__$121;
    __$ctx._buf.push(res__$118);
    return;
}

function __$b72(__$ctx, __$ref) {
    var __$r__$168;
    var __$l0__$169 = $$mode;
    $$mode = "";
    var __$l1__$170 = __$ctx.ctx;
    __$ctx.ctx = __$ctx.ctx._value;
    var __$r__$172;
    var __$l2__$173 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 65536;
    __$r__$172 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l2__$173;
    __$r__$168 = __$r__$172;
    $$mode = __$l0__$169;
    __$ctx.ctx = __$l1__$170;
    return;
}

function __$b73(__$ctx, __$ref) {
    __$ctx._listLength--;
    var ctx__$174 = __$ctx.ctx;
    if (ctx__$174 && ctx__$174 !== true || ctx__$174 === 0) {
        __$ctx._str += ctx__$174 + "";
    }
    return;
}

function __$b74(__$ctx, __$ref) {
    __$ctx._listLength--;
    return;
}

function __$b75(__$ctx, __$ref) {
    var ctx__$175 = __$ctx.ctx, len__$176 = ctx__$175.length, i__$177 = 0, prevPos__$178 = __$ctx.position, prevNotNewList__$179 = __$ctx._notNewList;
    if (prevNotNewList__$179) {
        __$ctx._listLength += len__$176 - 1;
    } else {
        __$ctx.position = 0;
        __$ctx._listLength = len__$176;
    }
    __$ctx._notNewList = true;
    while (i__$177 < len__$176) (function __$lb__$180() {
        var __$r__$181;
        var __$l0__$182 = __$ctx.ctx;
        __$ctx.ctx = ctx__$175[i__$177++];
        __$r__$181 = applyc(__$ctx, __$ref);
        __$ctx.ctx = __$l0__$182;
        return __$r__$181;
    })();
    prevNotNewList__$179 || (__$ctx.position = prevPos__$178);
    return;
}

function __$b76(__$ctx, __$ref) {
    __$ctx.ctx || (__$ctx.ctx = {});
    var vBlock__$183 = __$ctx.ctx.block, vElem__$184 = __$ctx.ctx.elem, block__$185 = __$ctx._currBlock || $$block;
    var __$r__$187;
    var __$l0__$188 = $$mode;
    $$mode = "default";
    var __$l1__$189 = $$block;
    $$block = vBlock__$183 || (vElem__$184 ? block__$185 : undefined);
    var __$l2__$190 = __$ctx._currBlock;
    __$ctx._currBlock = vBlock__$183 || vElem__$184 ? undefined : block__$185;
    var __$l3__$191 = $$elem;
    $$elem = vElem__$184;
    var __$l4__$192 = $$mods;
    $$mods = vBlock__$183 ? __$ctx.ctx.mods || (__$ctx.ctx.mods = {}) : $$mods;
    var __$l5__$193 = $$elemMods;
    $$elemMods = __$ctx.ctx.elemMods || {};
    $$block || $$elem ? __$ctx.position = (__$ctx.position || 0) + 1 : __$ctx._listLength--;
    applyc(__$ctx, __$ref);
    __$r__$187 = undefined;
    $$mode = __$l0__$188;
    $$block = __$l1__$189;
    __$ctx._currBlock = __$l2__$190;
    $$elem = __$l3__$191;
    $$mods = __$l4__$192;
    $$elemMods = __$l5__$193;
    return;
}

function __$g0(__$ctx, __$ref) {
    var __$t = $$block;
    if (__$t === "path") {
        if (!$$elem) {
            return [ {
                block: "input",
                mods: {
                    theme: "islands",
                    size: "l",
                    width: "available"
                },
                name: "path"
            } ];
        }
    } else if (__$t === "button-wrapper") {
        if (!$$elem && $$mods && $$mods["yesno"] === "true") {
            return [ {
                block: "button",
                mods: {
                    theme: "islands",
                    size: "xl",
                    yes: "true"
                },
                name: "yes",
                val: "true",
                text: "Yes"
            }, {
                block: "gap"
            }, {
                block: "button",
                mods: {
                    theme: "islands",
                    size: "xl",
                    no: "true"
                },
                name: "no",
                val: "false",
                text: "No"
            } ];
        }
    } else if (__$t === "question") {
        var __$t = !$$elem;
        if (__$t) {
            var __$t = $$mods;
            if (__$t) {
                if ($$mods["simple"] === "true") {
                    return [ {
                        elem: "message"
                    }, {
                        block: "path",
                        mods: {
                            simple: "true"
                        }
                    }, {
                        elem: "hint",
                        content: "Choose an existing destination by typing the path."
                    }, {
                        block: "button-wrapper",
                        mods: {
                            yesno: "true"
                        }
                    } ];
                }
                if ($$mods["with-destination"] === "true") {
                    return [ {
                        elem: "message",
                        content: __$ctx.ctx.message ? __$ctx.ctx.message : "blah"
                    }, {
                        block: "path",
                        mods: {
                            source: "true"
                        }
                    }, {
                        elem: "destination-message",
                        content: "to the following destination folder:"
                    }, {
                        block: "path",
                        mods: {
                            destination: "true"
                        }
                    }, {
                        elem: "hint",
                        content: "Choose an existing destination by typing the path."
                    }, {
                        block: "button-wrapper",
                        mods: {
                            yesno: "true"
                        }
                    } ];
                }
            }
            return [ {
                elem: "message",
                content: __$ctx.ctx.message ? __$ctx.ctx.message : "blah"
            }, {
                block: "path",
                mods: {
                    source: "true"
                }
            }, {
                block: "button-wrapper",
                mods: {
                    yesno: "true"
                }
            } ];
        }
    } else if (__$t === "menu") {
        if ($$elem === "group" && typeof __$ctx.ctx.title !== "undefined" && (__$ctx.__$a0 & 8) === 0) {
            return [ {
                elem: "group-title",
                content: __$ctx.ctx.title
            }, function __$lb__$17() {
                var __$r__$18;
                var __$l0__$19 = __$ctx.__$a0;
                __$ctx.__$a0 = __$ctx.__$a0 | 8;
                __$r__$18 = applyc(__$ctx, __$ref);
                __$ctx.__$a0 = __$l0__$19;
                return __$r__$18;
            }() ];
        }
    } else if (__$t === "select") {
        if ($$elem === "button" && $$mods && $$mods["mode"] === "radio") {
            return [ {
                elem: "text",
                content: __$ctx._checkedOption.text
            } ];
        }
        var __$t = !$$elem;
        if (__$t) {
            if ($$mods && $$mods["mode"] === "radio" && (__$ctx.__$a0 & 2) === 0) {
                return [ {
                    elem: "control",
                    val: __$ctx._checkedOption.val
                }, function __$lb__$5() {
                    var __$r__$6;
                    var __$l0__$7 = __$ctx.__$a0;
                    __$ctx.__$a0 = __$ctx.__$a0 | 2;
                    __$r__$6 = applyc(__$ctx, __$ref);
                    __$ctx.__$a0 = __$l0__$7;
                    return __$r__$6;
                }() ];
            }
            return [ {
                elem: "button"
            }, {
                block: "popup",
                mods: {
                    target: "anchor",
                    theme: $$mods.theme,
                    autoclosable: true
                },
                directions: [ "bottom-left", "bottom-right", "top-left", "top-right" ],
                content: {
                    block: $$block,
                    mods: $$mods,
                    elem: "menu"
                }
            } ];
        }
    } else if (__$t === "button") {
        var __$t = !$$elem;
        if (__$t) {
            if (typeof __$ctx.ctx.content !== "undefined") {
                return __$ctx.ctx.content;
            }
            var __$r = __$b14(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "input") {
        if (!$$elem) {
            return {
                elem: "box",
                content: {
                    elem: "control"
                }
            };
        }
    } else if (__$t === "details") {
        if (!$$elem) {
            return [ {
                elem: "name",
                content: __$ctx.ctx.name,
                mods: {
                    type: __$ctx.ctx.type
                }
            }, {
                elem: "type",
                content: __$ctx.ctx.type
            }, {
                elem: "size",
                content: __$ctx.ctx.stats.size
            }, {
                elem: "owner",
                content: __$ctx.ctx.stats.uid
            }, {
                elem: "date",
                content: __$ctx.ctx.stats.ctime
            } ];
        }
    } else if (__$t === "ua") {
        if (!$$elem) {
            return [ "(function(e,c){", 'e[c]=e[c].replace(/(ua_js_)no/g,"$1yes");', '})(document.documentElement,"className");' ];
        }
    }
    return __$ctx.ctx.content;
    return __$ref;
}

function __$g1(__$ctx, __$ref) {
    var __$t = $$block;
    if (__$t === "path") {
        if (!$$elem) {
            return true;
        }
    } else if (__$t === "menu") {
        var __$t = !$$elem;
        if (__$t) {
            if ($$mods && $$mods["focused"] === true && (__$ctx.__$a0 & 32) === 0) {
                var __$r = __$ctx.extend(function __$lb__$23() {
                    var __$r__$24;
                    var __$l0__$25 = __$ctx.__$a0;
                    __$ctx.__$a0 = __$ctx.__$a0 | 32;
                    __$r__$24 = applyc(__$ctx, __$ref);
                    __$ctx.__$a0 = __$l0__$25;
                    return __$r__$24;
                }(), {
                    live: false
                });
                if (__$r !== __$ref) return __$r;
            }
            return true;
        }
    } else if (__$t === "select") {
        var __$t = !$$elem;
        if (__$t) {
            if ($$mods && $$mods["focused"] === true && (__$ctx.__$a0 & 16384) === 0) {
                var __$r = __$ctx.extend(function __$lb__$93() {
                    var __$r__$94;
                    var __$l0__$95 = __$ctx.__$a0;
                    __$ctx.__$a0 = __$ctx.__$a0 | 16384;
                    __$r__$94 = applyc(__$ctx, __$ref);
                    __$ctx.__$a0 = __$l0__$95;
                    return __$r__$94;
                }(), {
                    live: false
                });
                if (__$r !== __$ref) return __$r;
            }
            var __$r = __$b23(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "button") {
        var __$t = !$$elem;
        if (__$t) {
            if ($$mods && $$mods["focused"] === true && (__$ctx.__$a0 & 2048) === 0) {
                var __$r = __$ctx.extend(function __$lb__$72() {
                    var __$r__$73;
                    var __$l0__$74 = __$ctx.__$a0;
                    __$ctx.__$a0 = __$ctx.__$a0 | 2048;
                    __$r__$73 = applyc(__$ctx, __$ref);
                    __$ctx.__$a0 = __$l0__$74;
                    return __$r__$73;
                }(), {
                    live: false
                });
                if (__$r !== __$ref) return __$r;
            }
            return true;
        }
    } else if (__$t === "popup") {
        if (!$$elem) {
            var __$r = __$b26(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "input") {
        if (!$$elem) {
            return true;
        }
    } else if (__$t === "menu-item") {
        if (!$$elem) {
            return {
                val: __$ctx.ctx.val
            };
        }
    }
    return undefined;
    return __$ref;
}

function __$g2(__$ctx, __$ref) {
    var __$t = $$block;
    if (__$t === "gap") {
        if (!$$elem) {
            return "span";
        }
    } else if (__$t === "icon") {
        if (!$$elem) {
            return "i";
        }
    } else if (__$t === "select") {
        if ($$elem === "control") {
            return "input";
        }
    } else if (__$t === "button") {
        if ($$elem === "text") {
            return "span";
        }
        if (!$$elem) {
            return __$ctx.ctx.tag || "button";
        }
    } else if (__$t === "input") {
        var __$t = $$elem;
        if (__$t === "control") {
            return "input";
        } else if (__$t === "box") {
            return "span";
        }
        if (!$$elem) {
            return "span";
        }
    } else if (__$t === "details-wrapper") {
        if (!$$elem) {
            return "table";
        }
    } else if (__$t === "details") {
        var __$t = $$elem;
        if (__$t === "date") {
            return "td";
        } else if (__$t === "owner") {
            return "td";
        } else if (__$t === "size") {
            return "td";
        } else if (__$t === "type") {
            return "td";
        } else if (__$t === "name") {
            return "td";
        }
        if (!$$elem) {
            return "tr";
        }
    } else if (__$t === "ua") {
        if (!$$elem) {
            return "script";
        }
    }
    return undefined;
    return __$ref;
}

function __$g3(__$ctx, __$ref) {
    var __$t = $$block;
    if (__$t === "icon") {
        if (!$$elem) {
            var __$r = __$b47(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "menu") {
        var __$t = $$elem;
        if (__$t === "group-title") {
            return {
                role: "presentation"
            };
        } else if (__$t === "group") {
            if (typeof __$ctx.ctx.title !== "undefined" && (__$ctx.__$a0 & 16) === 0) {
                var __$r = __$ctx.extend(function __$lb__$20() {
                    var __$r__$21;
                    var __$l0__$22 = __$ctx.__$a0;
                    __$ctx.__$a0 = __$ctx.__$a0 | 16;
                    __$r__$21 = applyc(__$ctx, __$ref);
                    __$ctx.__$a0 = __$l0__$22;
                    return __$r__$21;
                }(), {
                    "aria-label": __$ctx.ctx.title
                });
                if (__$r !== __$ref) return __$r;
            }
            return {
                role: "group"
            };
        }
        if (!$$elem) {
            var __$r = __$b51(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "select") {
        if ($$elem === "control") {
            return {
                type: "hidden",
                name: __$ctx._select.name,
                value: __$ctx.ctx.val,
                disabled: $$mods.disabled ? "disabled" : undefined
            };
        }
    } else if (__$t === "button") {
        var __$t = !$$elem;
        if (__$t) {
            if ((!$$mods.type || $$mods.type === "submit") && (__$ctx.__$a0 & 4096) === 0) {
                var __$r = __$b53(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
            var __$r = __$b54(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "input") {
        if ($$elem === "control") {
            var __$r = __$b55(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "menu-item") {
        if (!$$elem) {
            return {
                role: "menuitem"
            };
        }
    }
    return undefined;
    return __$ref;
}

function __$g4(__$ctx, __$ref) {
    var __$t = $$block;
    if (__$t === "menu") {
        var __$t = !$$elem;
        if (__$t) {
            if ($$mods && $$mods["mode"] === "radio" && __$ctx._firstItem && __$ctx._checkedItems && !__$ctx._checkedItems.length && (__$ctx.__$a0 & 1) === 0) {
                var __$r = __$b58(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
            if ((__$ctx.__$a0 & 512) === 0) {
                var __$r = __$b59(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
        }
    } else if (__$t === "select") {
        if (!$$elem && $$mods && $$mods["mode"] === "radio" && __$ctx._checkedOptions && (__$ctx.__$a0 & 4) === 0) {
            var __$r = __$b60(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        var __$t = $$elem;
        if (__$t === "menu") {
            if ((__$ctx.__$a0 & 1024) === 0) {
                var __$r = __$b61(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
        } else if (__$t === "button") {
            if ((__$ctx.__$a0 & 8192) === 0) {
                var __$r = __$b62(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
        }
        if (!$$elem && !__$ctx._select && (__$ctx.__$a0 & 32768) === 0) {
            var __$r = __$b63(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "input") {
        if (!$$elem && (__$ctx.__$a0 & 64) === 0) {
            var __$r = __$b64(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "details") {
        if (!$$elem && !__$ctx.ctx._wrapped && (__$ctx.__$a0 & 128) === 0) {
            var __$r = __$b65(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "menu-item") {
        if (!$$elem && __$ctx._menuMods && (__$ctx.__$a0 & 256) === 0) {
            var __$r = __$b66(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    }
    var __$r = __$b67(__$ctx, __$ref);
    if (__$r !== __$ref) return __$r;
    return __$ref;
};
     return exports;
  }
  var defineAsGlobal = true;
  if(typeof exports === "object") {
    exports["BEMHTML"] = __bem_xjst({});
    defineAsGlobal = false;
  }
  if(typeof modules === "object") {
    modules.define("BEMHTML",
      function(provide) {
        provide(__bem_xjst({})) });
    defineAsGlobal = false;
  }
  defineAsGlobal && (g["BEMHTML"] = __bem_xjst({}));
})(this);