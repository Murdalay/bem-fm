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
