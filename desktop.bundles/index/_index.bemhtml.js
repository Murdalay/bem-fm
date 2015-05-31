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
    if (__$t === "content") {
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
        } else if (__$t === "radio-group") {
            if (!$$elem) {
                return [ {
                    block: "control-group"
                } ];
            }
        }
        return undefined;
    } else if (__$t === "bem") {
        var __$t = $$block;
        if (__$t === "path-normalizer") {
            if (!$$elem) {
                return false;
            }
        } else if (__$t === "page") {
            var __$t = $$elem;
            if (__$t === "js") {
                return false;
            } else if (__$t === "css") {
                return false;
            } else if (__$t === "favicon") {
                return false;
            } else if (__$t === "link") {
                return false;
            } else if (__$t === "meta") {
                return false;
            } else if (__$t === "head") {
                return false;
            }
        } else if (__$t === "ua") {
            if (!$$elem) {
                return false;
            }
        }
        return undefined;
    } else if (__$t === "cls") {
        return undefined;
    } else if (__$t === "") {
        if (__$ctx.ctx && __$ctx.ctx._vow && (__$ctx.__$a0 & 1048576) === 0) {
            var __$r = __$b117(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        if (__$ctx.isSimple(__$ctx.ctx)) {
            var __$r = __$b118(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        if (!__$ctx.ctx) {
            var __$r = __$b119(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        if (__$ctx.isArray(__$ctx.ctx)) {
            var __$r = __$b120(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        var __$r = __$b121(__$ctx, __$ref);
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
        ctx["_mode"] = undefined;
        ctx["ctx"] = undefined;
        ctx["_menuMods"] = undefined;
        ctx["_select"] = undefined;
        ctx["_checkedOptions"] = undefined;
        ctx["_firstOption"] = undefined;
        ctx["_input"] = undefined;
        ctx["_ieCommented"] = undefined;
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

function __$b8(__$ctx, __$ref) {
    var ctx__$118 = __$ctx.ctx, mods__$119 = $$mods;
    return [ {
        block: "button",
        mods: {
            togglable: mods__$119.mode === "radio-check" ? "check" : "radio",
            checked: mods__$119.checked,
            disabled: mods__$119.disabled,
            theme: mods__$119.theme,
            size: mods__$119.size
        },
        title: ctx__$118.title,
        content: [ ctx__$118.icon, typeof ctx__$118.text !== "undefined" ? {
            elem: "text",
            content: ctx__$118.text
        } : "" ]
    }, {
        block: "radio",
        elem: "control",
        checked: mods__$119.checked,
        disabled: mods__$119.disabled,
        name: ctx__$118.name,
        val: ctx__$118.val
    } ];
}

function __$b9(__$ctx, __$ref) {
    var ctx__$122 = __$ctx.ctx;
    return [ {
        elem: "box",
        content: {
            elem: "control",
            checked: $$mods.checked,
            disabled: $$mods.disabled,
            name: ctx__$122.name,
            val: ctx__$122.val
        }
    }, ctx__$122.text ];
}

function __$b15(__$ctx, __$ref) {
    var ctx__$110 = __$ctx.ctx, content__$111 = [ ctx__$110.icon ];
    "text" in ctx__$110 && content__$111.push({
        elem: "text",
        content: ctx__$110.text
    });
    return content__$111;
}

function __$b20(__$ctx, __$ref) {
    var mods__$123 = $$mods, ctx__$124 = __$ctx.ctx, isValDef__$125 = typeof ctx__$124.val !== "undefined";
    return (ctx__$124.options || []).map(function(option, i) {
        return [ !!i && !mods__$123.type && {
            tag: "br"
        }, {
            block: "radio",
            mods: {
                type: mods__$123.type,
                mode: mods__$123.mode,
                theme: mods__$123.theme,
                size: mods__$123.size,
                checked: isValDef__$125 && ctx__$124.val === option.val,
                disabled: option.disabled || mods__$123.disabled
            },
            name: ctx__$124.name,
            val: option.val,
            text: option.text,
            title: option.title,
            icon: option.icon
        } ];
    });
}

function __$b31(__$ctx, __$ref) {
    var ctx__$81 = __$ctx.ctx;
    return {
        name: ctx__$81.name,
        optionsMaxHeight: ctx__$81.optionsMaxHeight
    };
}

function __$b34(__$ctx, __$ref) {
    var ctx__$20 = __$ctx.ctx;
    return {
        mainOffset: ctx__$20.mainOffset,
        secondaryOffset: ctx__$20.secondaryOffset,
        viewportOffset: ctx__$20.viewportOffset,
        directions: ctx__$20.directions,
        zIndexGroupLevel: ctx__$20.zIndexGroupLevel
    };
}

function __$b73(__$ctx, __$ref) {
    var ctx__$0 = __$ctx.ctx;
    return __$ctx.extend(function __$lb__$1() {
        var __$r__$2;
        var __$l0__$3 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 1;
        __$r__$2 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l0__$3;
        return __$r__$2;
    }(), {
        src: ctx__$0.url,
        width: ctx__$0.width,
        height: ctx__$0.height,
        alt: ctx__$0.alt,
        title: ctx__$0.title
    });
}

function __$b75(__$ctx, __$ref) {
    var attrs__$4 = {
        "aria-hidden": "true"
    }, url__$5 = __$ctx.ctx.url;
    if (url__$5) attrs__$4.style = "background-image:url(" + url__$5 + ")";
    return attrs__$4;
}

function __$b76(__$ctx, __$ref) {
    var ctx__$120 = __$ctx.ctx, attrs__$121 = {
        type: "radio",
        autocomplete: "off",
        name: ctx__$120.name,
        value: ctx__$120.val
    };
    ctx__$120.checked && (attrs__$121.checked = "checked");
    ctx__$120.disabled && (attrs__$121.disabled = "disabled");
    return attrs__$121;
}

function __$b80(__$ctx, __$ref) {
    var attrs__$42 = {
        role: "menu"
    };
    $$mods.disabled || (attrs__$42.tabindex = 0);
    return attrs__$42;
}

function __$b82(__$ctx, __$ref) {
    var ctx__$112 = __$ctx.ctx, attrs__$113 = {
        type: $$mods.type || "button",
        name: ctx__$112.name,
        value: ctx__$112.val
    };
    $$mods.disabled && (attrs__$113.disabled = "disabled");
    return __$ctx.extend(function __$lb__$114() {
        var __$r__$115;
        var __$l0__$116 = __$ctx.__$a0;
        __$ctx.__$a0 = __$ctx.__$a0 | 65536;
        __$r__$115 = applyc(__$ctx, __$ref);
        __$ctx.__$a0 = __$l0__$116;
        return __$r__$115;
    }(), attrs__$113);
}

function __$b83(__$ctx, __$ref) {
    var ctx__$117 = __$ctx.ctx;
    return {
        role: "button",
        tabindex: ctx__$117.tabIndex,
        id: ctx__$117.id,
        title: ctx__$117.title
    };
}

function __$b85(__$ctx, __$ref) {
    var input__$99 = __$ctx._input, attrs__$100 = {
        id: input__$99.id,
        name: input__$99.name,
        value: input__$99.val,
        maxlength: input__$99.maxLength,
        tabindex: input__$99.tabIndex,
        placeholder: input__$99.placeholder
    };
    input__$99.autocomplete === false && (attrs__$100.autocomplete = "off");
    $$mods.disabled && (attrs__$100.disabled = "disabled");
    return attrs__$100;
}

function __$b86(__$ctx, __$ref) {
    var attrs__$126 = {};
    if (__$ctx.ctx.url) {
        attrs__$126.src = __$ctx.ctx.url;
    } else if (__$ctx._nonceCsp) {
        attrs__$126.nonce = __$ctx._nonceCsp;
    }
    return attrs__$126;
}

function __$b90(__$ctx, __$ref) {
    (__$ctx._firstItem.mods = __$ctx._firstItem.mods || {}).checked = true;
    var __$r__$7;
    var __$l0__$8 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 2;
    __$r__$7 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l0__$8;
    return;
}

function __$b91(__$ctx, __$ref) {
    var ctx__$43 = __$ctx.ctx, mods__$44 = $$mods, firstItem__$45, checkedItems__$46 = [];
    if (ctx__$43.content) {
        var isValDef__$47 = typeof ctx__$43.val !== "undefined", containsVal__$48 = function(val) {
            return isValDef__$47 && (mods__$44.mode === "check" ? ctx__$43.val.indexOf(val) > -1 : ctx__$43.val === val);
        }, iterateItems__$49 = function(content) {
            var i__$50 = 0, itemOrGroup__$51;
            while (itemOrGroup__$51 = content[i__$50++]) {
                if (itemOrGroup__$51.block === "menu-item") {
                    firstItem__$45 || (firstItem__$45 = itemOrGroup__$51);
                    if (containsVal__$48(itemOrGroup__$51.val)) {
                        (itemOrGroup__$51.mods = itemOrGroup__$51.mods || {}).checked = true;
                        checkedItems__$46.push(itemOrGroup__$51);
                    }
                } else {
                    iterateItems__$49(itemOrGroup__$51.content);
                }
            }
        };
        if (!__$ctx.isArray(ctx__$43.content)) throw Error("menu: content must be an array of the menu items");
        iterateItems__$49(ctx__$43.content);
    }
    __$ctx._firstItem = firstItem__$45;
    __$ctx._checkedItems = checkedItems__$46;
    var __$r__$53;
    var __$l0__$54 = __$ctx._menuMods;
    __$ctx._menuMods = {
        theme: mods__$44.theme,
        disabled: mods__$44.disabled
    };
    var __$r__$56;
    var __$l1__$57 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 512;
    __$r__$56 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l1__$57;
    __$r__$53 = __$r__$56;
    __$ctx._menuMods = __$l0__$54;
    return;
}

function __$b92(__$ctx, __$ref) {
    var checkedOptions__$12 = __$ctx._checkedOptions, firstOption__$13 = __$ctx._firstOption;
    if (firstOption__$13 && !checkedOptions__$12.length) {
        firstOption__$13.checked = true;
        checkedOptions__$12 = [ firstOption__$13 ];
    }
    var __$r__$15;
    var __$l0__$16 = __$ctx._checkedOption;
    __$ctx._checkedOption = checkedOptions__$12[0];
    var __$r__$18;
    var __$l1__$19 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 8;
    __$r__$18 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l1__$19;
    __$r__$15 = __$r__$18;
    __$ctx._checkedOption = __$l0__$16;
    return;
}

function __$b93(__$ctx, __$ref) {
    var mods__$58 = $$mods, optionToMenuItem__$59 = function(option) {
        var res__$60 = {
            block: "menu-item",
            mods: {
                disabled: mods__$58.disabled || option.disabled
            },
            val: option.val,
            js: {
                checkedText: option.checkedText
            },
            content: option.text
        };
        if (option.icon) {
            res__$60.js.text = option.text;
            res__$60.content = [ option.icon, res__$60.content ];
        }
        return res__$60;
    };
    var __$r__$62;
    var __$l0__$63 = $$mode;
    $$mode = "";
    var __$l1__$64 = __$ctx.ctx;
    __$ctx.ctx = {
        block: "menu",
        mix: {
            block: $$block,
            elem: $$elem
        },
        mods: {
            size: mods__$58.size,
            theme: mods__$58.theme,
            disabled: mods__$58.disabled,
            mode: mods__$58.mode
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
                content: optionOrGroup.group.map(optionToMenuItem__$59)
            } : optionToMenuItem__$59(optionOrGroup);
        })
    };
    var __$r__$66;
    var __$l2__$67 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 1024;
    __$r__$66 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l2__$67;
    __$r__$62 = __$r__$66;
    $$mode = __$l0__$63;
    __$ctx.ctx = __$l1__$64;
    return;
}

function __$b94(__$ctx, __$ref) {
    var mods__$68 = $$mods;
    var __$r__$70;
    var __$l0__$71 = $$mode;
    $$mode = "";
    var __$l1__$72 = __$ctx.ctx;
    __$ctx.ctx = {
        block: "button",
        mix: {
            block: $$block,
            elem: $$elem
        },
        mods: {
            size: mods__$68.size,
            theme: mods__$68.theme,
            view: mods__$68.view,
            focused: mods__$68.focused,
            disabled: mods__$68.disabled,
            checked: mods__$68.mode !== "radio" && !!__$ctx._checkedOptions.length
        },
        id: __$ctx._select.id,
        tabIndex: __$ctx._select.tabIndex,
        content: [ function __$lb__$73() {
            var __$r__$74;
            var __$l3__$75 = $$mode;
            $$mode = "content";
            __$r__$74 = applyc(__$ctx, __$ref);
            $$mode = __$l3__$75;
            return __$r__$74;
        }(), {
            block: "icon",
            mix: {
                block: "select",
                elem: "tick"
            }
        } ]
    };
    var __$r__$76;
    var __$l2__$77 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 2048;
    __$r__$76 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l2__$77;
    __$r__$70 = __$r__$76;
    $$mode = __$l0__$71;
    __$ctx.ctx = __$l1__$72;
    return;
}

function __$b95(__$ctx, __$ref) {
    if (!$$mods.mode) throw Error("Can't build select without mode modifier");
    var ctx__$82 = __$ctx.ctx, isValDef__$83 = typeof ctx__$82.val !== "undefined", isModeCheck__$84 = $$mods.mode === "check", firstOption__$85, checkedOptions__$86 = [], containsVal__$87 = function(val) {
        return isValDef__$83 && (isModeCheck__$84 ? ctx__$82.val.indexOf(val) > -1 : ctx__$82.val === val);
    }, iterateOptions__$88 = function(content) {
        var i__$89 = 0, option__$90;
        while (option__$90 = content[i__$89++]) {
            if (option__$90.group) {
                iterateOptions__$88(option__$90.group);
            } else {
                firstOption__$85 || (firstOption__$85 = option__$90);
                if (containsVal__$87(option__$90.val)) {
                    option__$90.checked = true;
                    checkedOptions__$86.push(option__$90);
                }
            }
        }
    };
    iterateOptions__$88(ctx__$82.options);
    var __$r__$92;
    var __$l0__$93 = __$ctx._select;
    __$ctx._select = __$ctx.ctx;
    var __$l1__$94 = __$ctx._checkedOptions;
    __$ctx._checkedOptions = checkedOptions__$86;
    var __$l2__$95 = __$ctx._firstOption;
    __$ctx._firstOption = firstOption__$85;
    var __$r__$97;
    var __$l3__$98 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 8192;
    __$r__$97 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l3__$98;
    __$r__$92 = __$r__$97;
    __$ctx._select = __$l0__$93;
    __$ctx._checkedOptions = __$l1__$94;
    __$ctx._firstOption = __$l2__$95;
    return;
}

function __$b96(__$ctx, __$ref) {
    var ctx__$30 = __$ctx.ctx;
    ctx__$30._wrapped = true;
    var __$r__$32;
    var __$l0__$33 = $$mode;
    $$mode = "";
    var __$l1__$34 = __$ctx.ctx;
    __$ctx.ctx = {
        block: "details-wrapper",
        content: __$ctx.ctx
    };
    var __$r__$36;
    var __$l2__$37 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 128;
    __$r__$36 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l2__$37;
    __$r__$32 = __$r__$36;
    $$mode = __$l0__$33;
    __$ctx.ctx = __$l1__$34;
    return;
}

function __$b97(__$ctx, __$ref) {
    var mods__$38 = $$mods;
    mods__$38.theme = mods__$38.theme || __$ctx._menuMods.theme;
    mods__$38.disabled = mods__$38.disabled || __$ctx._menuMods.disabled;
    var __$r__$40;
    var __$l0__$41 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 256;
    __$r__$40 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l0__$41;
    return;
}

function __$b98(__$ctx, __$ref) {
    var __$r__$102;
    var __$l0__$103 = __$ctx._input;
    __$ctx._input = __$ctx.ctx;
    var __$r__$105;
    var __$l1__$106 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 16384;
    __$r__$105 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l1__$106;
    __$r__$102 = __$r__$105;
    __$ctx._input = __$l0__$103;
    return;
}

function __$b99(__$ctx, __$ref) {
    var url__$127 = __$ctx.ctx.url;
    var __$r__$129;
    var __$l0__$130 = $$mode;
    $$mode = "";
    var __$l1__$131 = __$ctx.ctx;
    __$ctx.ctx = [ 6, 7, 8, 9 ].map(function(v) {
        return {
            elem: "css",
            url: url__$127 + ".ie" + v + ".css",
            ie: "IE " + v
        };
    });
    var __$r__$133;
    var __$l2__$134 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 131072;
    __$r__$133 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l2__$134;
    __$r__$129 = __$r__$133;
    $$mode = __$l0__$130;
    __$ctx.ctx = __$l1__$131;
    return;
}

function __$b100(__$ctx, __$ref) {
    var ie__$135 = __$ctx.ctx.ie, hideRule__$136 = !ie__$135 ? [ "gt IE 9", "<!-->", "<!--" ] : ie__$135 === "!IE" ? [ ie__$135, "<!-->", "<!--" ] : [ ie__$135, "", "" ];
    var __$r__$138;
    var __$l0__$139 = $$mode;
    $$mode = "";
    var __$l3__$140 = __$ctx.ctx;
    var __$l1__$141 = __$l3__$140._ieCommented;
    __$l3__$140._ieCommented = true;
    var __$l2__$142 = __$ctx.ctx;
    __$ctx.ctx = [ "<!--[if " + hideRule__$136[0] + "]>" + hideRule__$136[1], __$ctx.ctx, hideRule__$136[2] + "<![endif]-->" ];
    __$r__$138 = applyc(__$ctx, __$ref);
    $$mode = __$l0__$139;
    __$l3__$140._ieCommented = __$l1__$141;
    __$ctx.ctx = __$l2__$142;
    return;
}

function __$b101(__$ctx, __$ref) {
    var ctx__$146 = __$ctx.ctx;
    __$ctx._nonceCsp = ctx__$146.nonce;
    var __$r__$148;
    var __$l0__$149 = $$mode;
    $$mode = "";
    var __$l1__$150 = __$ctx.ctx;
    __$ctx.ctx = [ ctx__$146.doctype || "<!DOCTYPE html>", {
        tag: "html",
        cls: "ua_js_no",
        content: [ {
            elem: "head",
            content: [ {
                tag: "meta",
                attrs: {
                    charset: "utf-8"
                }
            }, ctx__$146.uaCompatible === false ? "" : {
                tag: "meta",
                attrs: {
                    "http-equiv": "X-UA-Compatible",
                    content: ctx__$146.uaCompatible || "IE=edge"
                }
            }, {
                tag: "title",
                content: ctx__$146.title
            }, {
                block: "ua",
                attrs: {
                    nonce: ctx__$146.nonce
                }
            }, ctx__$146.head, ctx__$146.styles, ctx__$146.favicon ? {
                elem: "favicon",
                url: ctx__$146.favicon
            } : "" ]
        }, ctx__$146 ]
    } ];
    var __$r__$152;
    var __$l2__$153 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 524288;
    __$r__$152 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l2__$153;
    __$r__$148 = __$r__$152;
    $$mode = __$l0__$149;
    __$ctx.ctx = __$l1__$150;
    return;
}

function __$b102(__$ctx, __$ref) {
    var BEM_INTERNAL__$154 = __$ctx.BEM.INTERNAL, ctx__$155 = __$ctx.ctx, isBEM__$156, tag__$157, res__$158;
    var __$r__$160;
    var __$l0__$161 = __$ctx._str;
    __$ctx._str = "";
    var vBlock__$162 = $$block;
    var __$r__$164;
    var __$l1__$165 = $$mode;
    $$mode = "tag";
    __$r__$164 = applyc(__$ctx, __$ref);
    $$mode = __$l1__$165;
    tag__$157 = __$r__$164;
    typeof tag__$157 !== "undefined" || (tag__$157 = ctx__$155.tag);
    typeof tag__$157 !== "undefined" || (tag__$157 = "div");
    if (tag__$157) {
        var jsParams__$166, js__$167;
        if (vBlock__$162 && ctx__$155.js !== false) {
            var __$r__$168;
            var __$l2__$169 = $$mode;
            $$mode = "js";
            __$r__$168 = applyc(__$ctx, __$ref);
            $$mode = __$l2__$169;
            js__$167 = __$r__$168;
            js__$167 = js__$167 ? __$ctx.extend(ctx__$155.js, js__$167 === true ? {} : js__$167) : ctx__$155.js === true ? {} : ctx__$155.js;
            js__$167 && ((jsParams__$166 = {})[BEM_INTERNAL__$154.buildClass(vBlock__$162, ctx__$155.elem)] = js__$167);
        }
        __$ctx._str += "<" + tag__$157;
        var __$r__$170;
        var __$l3__$171 = $$mode;
        $$mode = "bem";
        __$r__$170 = applyc(__$ctx, __$ref);
        $$mode = __$l3__$171;
        isBEM__$156 = __$r__$170;
        typeof isBEM__$156 !== "undefined" || (isBEM__$156 = typeof ctx__$155.bem !== "undefined" ? ctx__$155.bem : ctx__$155.block || ctx__$155.elem);
        var __$r__$173;
        var __$l4__$174 = $$mode;
        $$mode = "cls";
        __$r__$173 = applyc(__$ctx, __$ref);
        $$mode = __$l4__$174;
        var cls__$172 = __$r__$173;
        cls__$172 || (cls__$172 = ctx__$155.cls);
        var addJSInitClass__$175 = ctx__$155.block && jsParams__$166 && !ctx__$155.elem;
        if (isBEM__$156 || cls__$172) {
            __$ctx._str += ' class="';
            if (isBEM__$156) {
                __$ctx._str += BEM_INTERNAL__$154.buildClasses(vBlock__$162, ctx__$155.elem, ctx__$155.elemMods || ctx__$155.mods);
                var __$r__$177;
                var __$l5__$178 = $$mode;
                $$mode = "mix";
                __$r__$177 = applyc(__$ctx, __$ref);
                $$mode = __$l5__$178;
                var mix__$176 = __$r__$177;
                ctx__$155.mix && (mix__$176 = mix__$176 ? [].concat(mix__$176, ctx__$155.mix) : ctx__$155.mix);
                if (mix__$176) {
                    var visited__$179 = {}, visitedKey__$180 = function(block, elem) {
                        return (block || "") + "__" + (elem || "");
                    };
                    visited__$179[visitedKey__$180(vBlock__$162, $$elem)] = true;
                    __$ctx.isArray(mix__$176) || (mix__$176 = [ mix__$176 ]);
                    for (var i__$181 = 0; i__$181 < mix__$176.length; i__$181++) {
                        var mixItem__$182 = mix__$176[i__$181], hasItem__$183 = mixItem__$182.block && (vBlock__$162 !== ctx__$155.block || mixItem__$182.block !== vBlock__$162) || mixItem__$182.elem, mixBlock__$184 = mixItem__$182.block || mixItem__$182._block || $$block, mixElem__$185 = mixItem__$182.elem || mixItem__$182._elem || $$elem;
                        hasItem__$183 && (__$ctx._str += " ");
                        __$ctx._str += BEM_INTERNAL__$154[hasItem__$183 ? "buildClasses" : "buildModsClasses"](mixBlock__$184, mixItem__$182.elem || mixItem__$182._elem || (mixItem__$182.block ? undefined : $$elem), mixItem__$182.elemMods || mixItem__$182.mods);
                        if (mixItem__$182.js) {
                            (jsParams__$166 || (jsParams__$166 = {}))[BEM_INTERNAL__$154.buildClass(mixBlock__$184, mixItem__$182.elem)] = mixItem__$182.js === true ? {} : mixItem__$182.js;
                            addJSInitClass__$175 || (addJSInitClass__$175 = mixBlock__$184 && !mixItem__$182.elem);
                        }
                        if (hasItem__$183 && !visited__$179[visitedKey__$180(mixBlock__$184, mixElem__$185)]) {
                            visited__$179[visitedKey__$180(mixBlock__$184, mixElem__$185)] = true;
                            var __$r__$187;
                            var __$l6__$188 = $$mode;
                            $$mode = "mix";
                            var __$l7__$189 = $$block;
                            $$block = mixBlock__$184;
                            var __$l8__$190 = $$elem;
                            $$elem = mixElem__$185;
                            __$r__$187 = applyc(__$ctx, __$ref);
                            $$mode = __$l6__$188;
                            $$block = __$l7__$189;
                            $$elem = __$l8__$190;
                            var nestedMix__$186 = __$r__$187;
                            if (nestedMix__$186) {
                                for (var j__$191 = 0; j__$191 < nestedMix__$186.length; j__$191++) {
                                    var nestedItem__$192 = nestedMix__$186[j__$191];
                                    if (!nestedItem__$192.block && !nestedItem__$192.elem || !visited__$179[visitedKey__$180(nestedItem__$192.block, nestedItem__$192.elem)]) {
                                        nestedItem__$192._block = mixBlock__$184;
                                        nestedItem__$192._elem = mixElem__$185;
                                        mix__$176.splice(i__$181 + 1, 0, nestedItem__$192);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            cls__$172 && (__$ctx._str += isBEM__$156 ? " " + cls__$172 : cls__$172);
            __$ctx._str += addJSInitClass__$175 ? ' i-bem"' : '"';
        }
        if (isBEM__$156 && jsParams__$166) {
            __$ctx._str += ' data-bem="' + __$ctx.attrEscape(JSON.stringify(jsParams__$166)) + '"';
        }
        var __$r__$194;
        var __$l9__$195 = $$mode;
        $$mode = "attrs";
        __$r__$194 = applyc(__$ctx, __$ref);
        $$mode = __$l9__$195;
        var attrs__$193 = __$r__$194;
        attrs__$193 = __$ctx.extend(attrs__$193, ctx__$155.attrs);
        if (attrs__$193) {
            var name__$196, attr__$197;
            for (name__$196 in attrs__$193) {
                attr__$197 = attrs__$193[name__$196];
                if (typeof attr__$197 === "undefined") continue;
                __$ctx._str += " " + name__$196 + '="' + __$ctx.attrEscape(__$ctx.isSimple(attr__$197) ? attr__$197 : __$ctx.reapply(attr__$197)) + '"';
            }
        }
    }
    if (__$ctx.isShortTag(tag__$157)) {
        __$ctx._str += "/>";
    } else {
        tag__$157 && (__$ctx._str += ">");
        var __$r__$199;
        var __$l10__$200 = $$mode;
        $$mode = "content";
        __$r__$199 = applyc(__$ctx, __$ref);
        $$mode = __$l10__$200;
        var content__$198 = __$r__$199;
        if (content__$198 || content__$198 === 0) {
            isBEM__$156 = vBlock__$162 || $$elem;
            var __$r__$201;
            var __$l11__$202 = $$mode;
            $$mode = "";
            var __$l12__$203 = __$ctx._notNewList;
            __$ctx._notNewList = false;
            var __$l13__$204 = __$ctx.position;
            __$ctx.position = isBEM__$156 ? 1 : __$ctx.position;
            var __$l14__$205 = __$ctx._listLength;
            __$ctx._listLength = isBEM__$156 ? 1 : __$ctx._listLength;
            var __$l15__$206 = __$ctx.ctx;
            __$ctx.ctx = content__$198;
            __$r__$201 = applyc(__$ctx, __$ref);
            $$mode = __$l11__$202;
            __$ctx._notNewList = __$l12__$203;
            __$ctx.position = __$l13__$204;
            __$ctx._listLength = __$l14__$205;
            __$ctx.ctx = __$l15__$206;
        }
        tag__$157 && (__$ctx._str += "</" + tag__$157 + ">");
    }
    res__$158 = __$ctx._str;
    __$r__$160 = undefined;
    __$ctx._str = __$l0__$161;
    __$ctx._buf.push(res__$158);
    return;
}

function __$b117(__$ctx, __$ref) {
    var __$r__$208;
    var __$l0__$209 = $$mode;
    $$mode = "";
    var __$l1__$210 = __$ctx.ctx;
    __$ctx.ctx = __$ctx.ctx._value;
    var __$r__$212;
    var __$l2__$213 = __$ctx.__$a0;
    __$ctx.__$a0 = __$ctx.__$a0 | 1048576;
    __$r__$212 = applyc(__$ctx, __$ref);
    __$ctx.__$a0 = __$l2__$213;
    __$r__$208 = __$r__$212;
    $$mode = __$l0__$209;
    __$ctx.ctx = __$l1__$210;
    return;
}

function __$b118(__$ctx, __$ref) {
    __$ctx._listLength--;
    var ctx__$214 = __$ctx.ctx;
    if (ctx__$214 && ctx__$214 !== true || ctx__$214 === 0) {
        __$ctx._str += ctx__$214 + "";
    }
    return;
}

function __$b119(__$ctx, __$ref) {
    __$ctx._listLength--;
    return;
}

function __$b120(__$ctx, __$ref) {
    var ctx__$215 = __$ctx.ctx, len__$216 = ctx__$215.length, i__$217 = 0, prevPos__$218 = __$ctx.position, prevNotNewList__$219 = __$ctx._notNewList;
    if (prevNotNewList__$219) {
        __$ctx._listLength += len__$216 - 1;
    } else {
        __$ctx.position = 0;
        __$ctx._listLength = len__$216;
    }
    __$ctx._notNewList = true;
    while (i__$217 < len__$216) (function __$lb__$220() {
        var __$r__$221;
        var __$l0__$222 = __$ctx.ctx;
        __$ctx.ctx = ctx__$215[i__$217++];
        __$r__$221 = applyc(__$ctx, __$ref);
        __$ctx.ctx = __$l0__$222;
        return __$r__$221;
    })();
    prevNotNewList__$219 || (__$ctx.position = prevPos__$218);
    return;
}

function __$b121(__$ctx, __$ref) {
    __$ctx.ctx || (__$ctx.ctx = {});
    var vBlock__$223 = __$ctx.ctx.block, vElem__$224 = __$ctx.ctx.elem, block__$225 = __$ctx._currBlock || $$block;
    var __$r__$227;
    var __$l0__$228 = $$mode;
    $$mode = "default";
    var __$l1__$229 = $$block;
    $$block = vBlock__$223 || (vElem__$224 ? block__$225 : undefined);
    var __$l2__$230 = __$ctx._currBlock;
    __$ctx._currBlock = vBlock__$223 || vElem__$224 ? undefined : block__$225;
    var __$l3__$231 = $$elem;
    $$elem = vElem__$224;
    var __$l4__$232 = $$mods;
    $$mods = vBlock__$223 ? __$ctx.ctx.mods || (__$ctx.ctx.mods = {}) : $$mods;
    var __$l5__$233 = $$elemMods;
    $$elemMods = __$ctx.ctx.elemMods || {};
    $$block || $$elem ? __$ctx.position = (__$ctx.position || 0) + 1 : __$ctx._listLength--;
    applyc(__$ctx, __$ref);
    __$r__$227 = undefined;
    $$mode = __$l0__$228;
    $$block = __$l1__$229;
    __$ctx._currBlock = __$l2__$230;
    $$elem = __$l3__$231;
    $$mods = __$l4__$232;
    $$elemMods = __$l5__$233;
    return;
}

function __$g0(__$ctx, __$ref) {
    var __$t = $$block;
    if (__$t === "status") {
        if (!$$elem) {
            return [ {
                elem: "list"
            }, {
                elem: "list-size"
            }, {
                elem: "selected"
            }, {
                elem: "selected-size"
            } ];
        }
    } else if (__$t === "info") {
        if (!$$elem) {
            return [ {
                block: "status",
                mods: {
                    position: "left"
                }
            }, {
                block: "status",
                mods: {
                    position: "right"
                }
            }, {
                block: "queue-display"
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
    } else if (__$t === "divider") {
        if (!$$elem) {
            return {
                block: "image",
                url: "/images/divider.png"
            };
        }
    } else if (__$t === "radio") {
        var __$t = !$$elem;
        if (__$t) {
            if ($$mods && $$mods["type"] === "button") {
                var __$r = __$b8(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
            var __$r = __$b9(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "menu") {
        if ($$elem === "group" && typeof __$ctx.ctx.title !== "undefined" && (__$ctx.__$a0 & 16) === 0) {
            return [ {
                elem: "group-title",
                content: __$ctx.ctx.title
            }, function __$lb__$21() {
                var __$r__$22;
                var __$l0__$23 = __$ctx.__$a0;
                __$ctx.__$a0 = __$ctx.__$a0 | 16;
                __$r__$22 = applyc(__$ctx, __$ref);
                __$ctx.__$a0 = __$l0__$23;
                return __$r__$22;
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
            if ($$mods && $$mods["mode"] === "radio" && (__$ctx.__$a0 & 4) === 0) {
                return [ {
                    elem: "control",
                    val: __$ctx._checkedOption.val
                }, function __$lb__$9() {
                    var __$r__$10;
                    var __$l0__$11 = __$ctx.__$a0;
                    __$ctx.__$a0 = __$ctx.__$a0 | 4;
                    __$r__$10 = applyc(__$ctx, __$ref);
                    __$ctx.__$a0 = __$l0__$11;
                    return __$r__$10;
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
            var __$r = __$b15(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
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
    } else if (__$t === "path") {
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
    } else if (__$t === "panel") {
        if (!$$elem) {
            return [ {
                block: "path"
            }, {
                block: "radio-group",
                mods: {
                    theme: "islands",
                    size: "l",
                    type: "button"
                },
                val: "name",
                options: [ {
                    val: "name",
                    text: "Name"
                }, {
                    val: "type",
                    text: "Type"
                }, {
                    val: "size",
                    text: "Size"
                }, {
                    val: "owner",
                    text: "Owner"
                }, {
                    val: "date",
                    text: "Creation date"
                } ]
            }, {
                block: "select",
                mods: {
                    mode: "radio",
                    theme: "islands",
                    size: "l",
                    disabled: true
                },
                name: "select1",
                val: 1,
                options: [ {
                    val: 1,
                    text: "Drive data is unavailable"
                } ]
            }, {
                block: "list"
            } ];
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
    } else if (__$t === "radio-group") {
        if (!$$elem) {
            var __$r = __$b20(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "page") {
        if (!$$elem && (__$ctx.__$a0 & 262144) === 0) {
            return [ function __$lb__$143() {
                var __$r__$144;
                var __$l0__$145 = __$ctx.__$a0;
                __$ctx.__$a0 = __$ctx.__$a0 | 262144;
                __$r__$144 = applyc(__$ctx, __$ref);
                __$ctx.__$a0 = __$l0__$145;
                return __$r__$144;
            }(), __$ctx.ctx.scripts ];
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
    if (__$t === "status") {
        if (!$$elem) {
            return true;
        }
    } else if (__$t === "info") {
        if (!$$elem) {
            return true;
        }
    } else if (__$t === "disabler") {
        if (!$$elem) {
            return false;
        }
    } else if (__$t === "radio") {
        if (!$$elem) {
            return true;
        }
    } else if (__$t === "menu") {
        var __$t = !$$elem;
        if (__$t) {
            if ($$mods && $$mods["focused"] === true && (__$ctx.__$a0 & 64) === 0) {
                var __$r = __$ctx.extend(function __$lb__$27() {
                    var __$r__$28;
                    var __$l0__$29 = __$ctx.__$a0;
                    __$ctx.__$a0 = __$ctx.__$a0 | 64;
                    __$r__$28 = applyc(__$ctx, __$ref);
                    __$ctx.__$a0 = __$l0__$29;
                    return __$r__$28;
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
            if ($$mods && $$mods["focused"] === true && (__$ctx.__$a0 & 4096) === 0) {
                var __$r = __$ctx.extend(function __$lb__$78() {
                    var __$r__$79;
                    var __$l0__$80 = __$ctx.__$a0;
                    __$ctx.__$a0 = __$ctx.__$a0 | 4096;
                    __$r__$79 = applyc(__$ctx, __$ref);
                    __$ctx.__$a0 = __$l0__$80;
                    return __$r__$79;
                }(), {
                    live: false
                });
                if (__$r !== __$ref) return __$r;
            }
            var __$r = __$b31(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "button") {
        var __$t = !$$elem;
        if (__$t) {
            if ($$mods && $$mods["focused"] === true && (__$ctx.__$a0 & 32768) === 0) {
                var __$r = __$ctx.extend(function __$lb__$107() {
                    var __$r__$108;
                    var __$l0__$109 = __$ctx.__$a0;
                    __$ctx.__$a0 = __$ctx.__$a0 | 32768;
                    __$r__$108 = applyc(__$ctx, __$ref);
                    __$ctx.__$a0 = __$l0__$109;
                    return __$r__$108;
                }(), {
                    live: false
                });
                if (__$r !== __$ref) return __$r;
            }
            return true;
        }
    } else if (__$t === "popup") {
        if (!$$elem) {
            var __$r = __$b34(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "menu-item") {
        if (!$$elem) {
            return {
                val: __$ctx.ctx.val
            };
        }
    } else if (__$t === "path") {
        if (!$$elem) {
            return true;
        }
    } else if (__$t === "panel") {
        if (!$$elem) {
            return true;
        }
    } else if (__$t === "manager") {
        if (!$$elem) {
            return true;
        }
    } else if (__$t === "input") {
        if (!$$elem) {
            return true;
        }
    } else if (__$t === "radio-group") {
        if (!$$elem) {
            return true;
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
    } else if (__$t === "image") {
        var __$t = !$$elem;
        if (__$t) {
            if (typeof __$ctx.ctx.content === "undefined") {
                return "img";
            }
            return "span";
        }
    } else if (__$t === "icon") {
        if (!$$elem) {
            return "i";
        }
    } else if (__$t === "radio") {
        var __$t = $$elem;
        if (__$t === "control") {
            return "input";
        } else if (__$t === "box") {
            return "span";
        }
        if (!$$elem) {
            return "label";
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
    } else if (__$t === "radio-group") {
        if (!$$elem) {
            return "span";
        }
    } else if (__$t === "page") {
        var __$t = $$elem;
        if (__$t === "js") {
            return "script";
        } else if (__$t === "css") {
            if (__$ctx.ctx.url) {
                return "link";
            }
            return "style";
        } else if (__$t === "favicon") {
            return "link";
        } else if (__$t === "link") {
            return "link";
        } else if (__$t === "meta") {
            return "meta";
        } else if (__$t === "head") {
            return "head";
        }
        if (!$$elem) {
            return "body";
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
    if (__$t === "image") {
        var __$t = !$$elem;
        if (__$t) {
            if (typeof __$ctx.ctx.content === "undefined" && (__$ctx.__$a0 & 1) === 0) {
                var __$r = __$b73(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
            return {
                role: "img"
            };
        }
    } else if (__$t === "icon") {
        if (!$$elem) {
            var __$r = __$b75(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "radio") {
        if ($$elem === "control") {
            var __$r = __$b76(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "menu") {
        var __$t = $$elem;
        if (__$t === "group-title") {
            return {
                role: "presentation"
            };
        } else if (__$t === "group") {
            if (typeof __$ctx.ctx.title !== "undefined" && (__$ctx.__$a0 & 32) === 0) {
                var __$r = __$ctx.extend(function __$lb__$24() {
                    var __$r__$25;
                    var __$l0__$26 = __$ctx.__$a0;
                    __$ctx.__$a0 = __$ctx.__$a0 | 32;
                    __$r__$25 = applyc(__$ctx, __$ref);
                    __$ctx.__$a0 = __$l0__$26;
                    return __$r__$25;
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
            var __$r = __$b80(__$ctx, __$ref);
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
            if ((!$$mods.type || $$mods.type === "submit") && (__$ctx.__$a0 & 65536) === 0) {
                var __$r = __$b82(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
            var __$r = __$b83(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "menu-item") {
        if (!$$elem) {
            return {
                role: "menuitem"
            };
        }
    } else if (__$t === "input") {
        if ($$elem === "control") {
            var __$r = __$b85(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "page") {
        var __$t = $$elem;
        if (__$t === "js") {
            var __$r = __$b86(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        } else if (__$t === "css") {
            if (__$ctx.ctx.url) {
                return {
                    rel: "stylesheet",
                    href: __$ctx.ctx.url
                };
            }
        } else if (__$t === "favicon") {
            return {
                rel: "shortcut icon",
                href: __$ctx.ctx.url
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
            if ($$mods && $$mods["mode"] === "radio" && __$ctx._firstItem && __$ctx._checkedItems && !__$ctx._checkedItems.length && (__$ctx.__$a0 & 2) === 0) {
                var __$r = __$b90(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
            if ((__$ctx.__$a0 & 512) === 0) {
                var __$r = __$b91(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
        }
    } else if (__$t === "select") {
        if (!$$elem && $$mods && $$mods["mode"] === "radio" && __$ctx._checkedOptions && (__$ctx.__$a0 & 8) === 0) {
            var __$r = __$b92(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
        var __$t = $$elem;
        if (__$t === "menu") {
            if ((__$ctx.__$a0 & 1024) === 0) {
                var __$r = __$b93(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
        } else if (__$t === "button") {
            if ((__$ctx.__$a0 & 2048) === 0) {
                var __$r = __$b94(__$ctx, __$ref);
                if (__$r !== __$ref) return __$r;
            }
        }
        if (!$$elem && !__$ctx._select && (__$ctx.__$a0 & 8192) === 0) {
            var __$r = __$b95(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "details") {
        if (!$$elem && !__$ctx.ctx._wrapped && (__$ctx.__$a0 & 128) === 0) {
            var __$r = __$b96(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "menu-item") {
        if (!$$elem && __$ctx._menuMods && (__$ctx.__$a0 & 256) === 0) {
            var __$r = __$b97(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "input") {
        if (!$$elem && (__$ctx.__$a0 & 16384) === 0) {
            var __$r = __$b98(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    } else if (__$t === "page") {
        var __$t = $$elem;
        if (__$t === "css") {
            var __$t = !__$ctx.ctx._ieCommented;
            if (__$t) {
                var __$t = __$ctx.ctx.hasOwnProperty("ie");
                if (__$t) {
                    if (__$ctx.ctx.ie === true && (__$ctx.__$a0 & 131072) === 0) {
                        var __$r = __$b99(__$ctx, __$ref);
                        if (__$r !== __$ref) return __$r;
                    }
                    var __$r = __$b100(__$ctx, __$ref);
                    if (__$r !== __$ref) return __$r;
                }
            }
        }
        if (!$$elem && (__$ctx.__$a0 & 524288) === 0) {
            var __$r = __$b101(__$ctx, __$ref);
            if (__$r !== __$ref) return __$r;
        }
    }
    var __$r = __$b102(__$ctx, __$ref);
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