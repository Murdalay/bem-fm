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

