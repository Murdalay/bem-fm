/* global modules:false */

modules.define('confirm', ['i-bem__dom', 'events__channels', 'vow', 'config', 'state', 'keyboard__codes'], 
	function(provide, BEMDOM, channels, vow, config, state, keyCodes) {

var com = channels('116');

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
            _confMessage = config.client.messages[action],
            _message,
            _length = items.length,
            _hint = _confMessage ? config.client.messages[action].hint : null,
            list = items.length > 1 ? items.length : state.getName(items[0]);

        com.on('answer-is', function(e, data){ 
            defer.resolve(data);
            this._hidePopup();
        }, this);

        this._showPopup(destination);

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

        return defer.promise();
    },

    getSimple: function(action, preset) {
        var defer = vow.defer(),
            _hint = config.client.messages[action].hint,
            _message = config.client.messages[action]['message'] || 'Type the text';

        com.on('answer-is', function(e, data){ 
            defer.resolve(data);
            this._hidePopup();
        }, this);

    	this._showPopup('simple');

        this._questionSimple.setSimple(_message, preset);
        _hint && this._questionSimple.setHint(_hint);


		return defer.promise();
    },

    _showPopup: function(dest) {
        var _width = window.innerWidth / 2;

        dest !== 'simple' && (this._activePopup = dest ? this._popupDest : this._popup);
        dest === 'simple' && (this._activePopup = this._popupSimple);

        this._disabler.delMod('disabled');
        this._activePopup.setPosition(_width, 360)
        this._activePopup.setMod('visible');

        this.bindToDoc('keydown', this._onKeyPress);
        com.emit('keyOverride');
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

    _hidePopup: function() {
        delete this._currentQuestion;
        this._disabler.setMod('disabled', 'true');
        this._activePopup.delMod('visible');

        this.unbindFromDoc('keydown', this._onKeyPress);
        com.emit('keyRestore');
    }
}));

});

 
