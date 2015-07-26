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
            com.emit('exec');
            e.preventDefault();
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
}));
});
