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
