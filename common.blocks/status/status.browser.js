/* global modules:false */

modules.define('status', ['i-bem__dom', 'events__channels', 'state', 'functions__debounce', 'size'], 
	function(provide, BEMDOM, channels, state, debounce, size) {
		var com = channels('116');

provide(BEMDOM.decl(this.name, {
    onSetMod : {
        'js' : {
            'inited' : function() {
        		this.hasMod('position', 'left') ? 
            		this._position = 'left' : 
	            		this._position = 'right';

                this._list = this.elem('list');
                this._listSize = this.elem('list-size');
                this._selected = this.elem('selected');
                this._selectedSize = this.elem('selected-size');

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

        this._selected.html(this._itemNumber + ' files selected with total size of ' + size(this._itemsSize));
    },

    _removeItem: function(e, data) {
        var _size = state.getState(data, 'size');

        (this._itemsSize -= _size);
        this._itemNumber -= 1;

        this._selected.html(this._itemNumber + ' files selected with total size of ' + size(this._itemsSize));
        this._itemsSize || this._itemNumber || this._selected.html('');
    },

    _clearItems: function() {
        delete this._itemsSize;
        delete this._itemNumber;
        this._selected.html('');
    },

    _updateList: function(e, data) {
        this._itemNumber && this._clearItems();
        this._list.html('Folder contains ' + data + ' files');
    },

    _updateListSize: function() {
        var _size = 0,
            _curPath = state.getCurPath(this._position),
            _list = state.getCurList(this._position);

        _list && _list.forEach(function(item){
            _size += state.getState(_curPath + '/' + item, 'size');
        });

        this._listSize.html('List size is ' + size(_size));
    }
}));

});
