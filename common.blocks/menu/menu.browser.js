/* global modules:false */

/**
 * @module menu
 */

modules.define('menu', ['keyboard__codes', 'events__channels'], 
function(provide, keyCodes, channels, Menu) {
	var com = channels('116');

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
                com.on('keyRestore', this._keyRestore, this);

                this.__base.apply(this, arguments);
            }
        },
        'focused' : {
            'true' : function() {
            	if(this._lastItem){
	            	this._hoveredItem = this._lastItem.setMod('hovered');	
            	} else {
	                this._lastItem = this._hoveredItem ? 
		                this._hoveredItem :
			                this.getItems()[0].setMod('hovered');
            	}

                this.__base.apply(this, arguments);
            }
        }
    },

    _onKeyDown : function(e) {
        var keyCode = e.keyCode,
	        cmdDown = false,
	        _cmd = function(e){ 
	        	if (e.keyCode === 91) {
					this.unbindFromDoc('keyup', _cmd);
					cmdDown = false;
	        	}
			};

			console.log(e);

		if(this.hasMod('keys-disabled')) { 
            e.preventDefault();
            return 
        };

        e.metaKey && (cmdDown = true) && this.bindToDoc('keyup', _cmd);

        if(this._hoveredItem && keyCode === keyCodes.ENTER || cmdDown && keyCode === keyCodes.DOWN ) {
			com.emit('exec', { 
				position: this._hoveredItem.getPosition(),
				path: this._hoveredItem.getPath() 
			});
        } 
        else if(this._hoveredItem && cmdDown) {
        	if (keyCode === keyCodes.BACKSPACE) {
				com.emit('delete');
        	}
        	else if(keyCode === keyCodes.UP) {
				com.emit('levelup', this._hoveredItem.getPosition());
        	}
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

    _keyRestore : function(e) {
        this.delMod('keys-disabled');
    },

    _onItemHover : function(item) {
    	this._lastItem = item;
    	this.__base.apply(this, arguments);
    }
}));
});
