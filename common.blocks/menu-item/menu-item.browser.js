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
    },

    _onPointerClick : function() {
        console.log('You are trying to select toplevel element');
    }
}));
});

modules.define('menu-item', ['i-bem__dom', 'events__channels', 'BEMHTML', 'state'], 
	function(provide, BEMDOM, channels, BEMHTML, state, MenuItem) {
		var timer,
			com = channels('116');

provide(MenuItem.decl({ modName : 'pathfinder', modVal : true }, /** @lends menu-item.prototype */{
    onSetMod : {
        'js' : {
            'inited' : function() {
				this._position = this.getMod('position');
                this._path = this.getVal();

                this._id = state.getId(this._path);
                this._stat = state.getReadableStates(this._path);
                this._name = state.getName(this._path);
                this._isdir = state.isDir(this._path);

                if (!this._name) {
                    this._name = this.getText();
                    this._name !== '..' && state.setName(this._path, this._name);
                };

                this.bindTo('dblclick', this._exec);

                com.on(this._id + '-update', this._statesReady, this);

                this.__base.apply(this, arguments);
                !this.hasMod('toplevel') && this._isdir === null && this._isdir === null && this._isDir();
                this._stat && this.updateContent(this._stat);
            },
            '' : function() {
                com.un(this._id + '-update', this._statesReady);
            }
        },

        'hovered' : {
            'true' : function() {
                this._stat && !this.hasMod('toplevel') && this._details.setMod('hovered');
                this.__base.apply(this, arguments);
            },
            '' : function() {
                this._stat && !this.hasMod('toplevel') && this._details.delMod('hovered');
                this.__base.apply(this, arguments);
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

    getPosition: function() {
        return this._position;
    },

    getPath: function() {
        return this._path;
    },

    // redefining basic onclick handling
    _onPointerClick: function() {
        var base = this.__base,
            _old = function(){ 
                base.apply(this, arguments);
                timer = false;
            };

        if(!timer){
            timer = setTimeout(_old.bind(this), 300);
        }
    },

    _exec: function(e) {
        window.clearTimeout(timer); 
        (this._isdir || this.hasMod('toplevel')) && 
            com.emit('exec', { position: this._position, path: this._path });
        timer = false;
    },

    _isDir: function() {
        state.setDir(this._path, 'waiting');

        com.once(this._id + '-is-dir', this._dirSuccess, this);
        com.emit('is-dir', { path: this._path, id: this._id, object: this });
    },

    _statesReady: function(e, data) {
        com.emit('updated-item-' + this._position);
        this.updateContent(e, data);
    },

    updateContent: function(e, data) {
        this._stat = data;
        data || (this._stat = e);


        if(!this.hasMod('toplevel')){
            var html = BEMHTML.apply(
                    {
                        block: 'details',
                        name: this._stat.name,
                        type: this._stat.type, 
                        stats: this._stat
                    });
    
            BEMDOM.update(this.domElem, html);
            this._details = this.findBlockInside('details');
        }
    },

    _dirSuccess: function(e, data) {
    	this._isdir = data;
    	!this.hasMod('toplevel') && data && this.setMod('dir');
    }
},
{   // cancel live initialization
	live: function(){ 
		this.__base.apply(this, arguments);
		return false 
	}
}));
});
