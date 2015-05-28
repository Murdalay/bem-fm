/* global modules:false */

modules.define('panel', ['i-bem__dom', 'config', 'BEMHTML', 'events__channels', 'sort', 'state', 'functions__debounce'], 
	function(provide, BEMDOM, config, BEMHTML, channels, sort, state, debounce) {
		var com = channels('116');

provide(BEMDOM.decl(this.name, {
    onSetMod : {
        'js' : {
            'inited' : function() {
        		this._position = this.getMod('position');

        		this._list = this.findBlockInside('list');
        		this._path = this.findBlockInside('path');
        		this._sorters = this.findBlockInside('radio-group');

        		this._sorters.on('change', this._onSorterClick, this);
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
        }      
    },

    getListLenght: function() {
        return this._listLength;
    },

    _setChildsMod : function() {
    	this._path.setMod('position', this._position);
    },

    _onSorterClick : function(e) {
		var _name = e.target.getVal();
		this.setMod('sort', _name);
		this.setMod('custom-sort');
		this._update();
    },

    _update : function() {
		this.hasMod('custom-sort') && this._getList('');
    },

	_getList: function(e, data) {
		data && (this._curPath = data);

	   	com.on(this._position + '-list-is', this._buildItems, this);
	   	com.emit('give-list', { 
	   		position : this._position, 
	   		path: this._curPath, 
	   		refresh: e.type === 'refresh' ? true : false 
	   	});
    },

    _buildItems: function(e, data) {
		var items = [],
			list = [],
			html,
			path = this._curPath,
			toplevel = {
	            block : 'menu-item',
	            mods : { toplevel : true, position: this._position },
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
				(list = sort.sortByKey(list, 'key'));

		// notifying all listeners that list is ready and how big it is
		com.emit('ready-list-' + _pos, this._listLength);

		// creating menu-items blocks for the retrieved list 
        path !== '/' && items.push(toplevel);
				
		list.forEach(function(value){
			var item = {
	            block : 'menu-item',
	            mods : { position: _pos },
	            val : value.path,
	            content : value.name
	        };

	        items.push(item);
		});

    	html = BEMHTML.apply(
	    	{
			    block : 'menu',
			    mods : { theme : 'islands', size : 'l', mode : 'check', position: this._position, panel: true },
			    content : items
			}
		);

        BEMDOM.update(this._list.domElem, html);
        this._menu = this.findBlockInside('menu');
        this._menu.setMod('focused');
    }
}));

});
