/* global modules:false */

modules.define('panel', ['i-bem__dom', 'BEMHTML', 'events__channels', 'sort', 'state', 'functions__debounce'], 
	function(provide, BEMDOM, BEMHTML, channels, sort, state, debounce) {
		var com = channels('116');

provide(BEMDOM.decl(this.name, {
    onSetMod : {
        'js' : {
            'inited' : function() {
        		this._position = this.getMod('position');

        		this._list = this.findBlockInside('list');
        		this._select = this.findBlockInside('select');
        		this._path = this.findBlockInside('path');
        		this._sorters = this.findBlockInside('radio-group');

        		this.bindTo(this._sorters.domElem, 'click', this._onSorterClick, this);

        		com.on('disks-changed', this._setSelectValue, this);
        		com.on(this._position + '-drive-changed', this._setActiveSelectItem, this);
        		com.on('sort', this._onSortEvent, this);
        		com.on('cd', this._onDriveChange, this);
        		com.on('focus-to-path', this._focusToPath, this);

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
					console.log(state.getReadableState(path, 'type'));
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
        },
        'disabled' : {
            'true' : function() {
        		this._list.findBlockInside('menu').setMod('disabled');
        		this._select.setMod('disabled');
        		this._path.setMod('disabled');
        		this._sorters.setMod('disabled');
            },
            '' : function() {
        		this._list.findBlockInside('menu').delMod('disabled');
        		this._select.delMod('disabled');
        		this._path.delMod('disabled');
        		this._sorters.delMod('disabled');
            }
        }      
    },

    getListLenght : function() {
        return this._listLength;
    },

    _setChildsMod : function() {
    	this._path.setMod('position', this._position);
    	this._select.setMod('position', this._position);
    	state.getDisks() && this._setSelectValue();
    },

    _setPath : function(e) {
    	var drives = state.getDisks(),
	    	mountpoint = drives[e.target.getVal()].mountpoint;

    	com.emit('set-path-' + this._position, mountpoint);
    	com.emit('path-'     + this._position, mountpoint);
    },

    _setSelectValue : function() {
    	var items = [],
	    	drives = state.getDisks();

			drives.forEach(function (item, index) {
				var drive = {
		            val : index,
		            text : item.drive
		        };

				items.push(drive);
			}.bind(this));

			var html = BEMHTML.apply(

		    	{
				    block : 'select',
				    mods : { mode : 'radio', theme : 'islands', size : 'l' },
				    name : 'drive_'+ this._position,
				    val : state.getActiveDriveIndex(this._position),
				    options : items
				}
			);

			this._select.un('change', this._setPath);

			BEMDOM.replace(this._select.domElem, html);

			this._select = this.findBlockInside('select');
			this._select.on('change', this._setPath, this);
	},

    _setActiveSelectItem : function() {
		this._select.setVal(state.getActiveDriveIndex(this._position));
		this._menu.setMod('focused');
	},

    _onSorterClick : function() {
		var _name = this._sorters.getVal();

		this._customSort(_name);
    },

    _customSort : function(sortmode) {
		if(this.hasMod('sort', sortmode)) {
			this.toggleMod('reverse');
		} else {
			this.hasMod('reverse') && this.delMod('reverse');
		}
		
		this.setMod('sort', sortmode);
		this.setMod('custom-sort');
		this._update();
    },

    _onSortEvent : function(e, data) {
    	if (data && data.position === this._position && data.extras) {
			this._customSort(data.extras);
			this._sorters.setVal(data.extras);
    	}
    },

	_onDriveChange : function(e, data) {
    	if (data && data.extras && data.extras === this._position) {
			this._select.setMod('opened');
    	}
    },

	_focusToPath : function(e, data) {
    	if (data && data.position === this._position) {
			this._path.findBlockInside('input').setMod('focused');
    	}
    },

    _update : function() {
		this.hasMod('custom-sort') && this._getList('');
    },

	_getList : function(e, data) {
		data && (this._curPath = data);

	   	com.on(this._position + '-list-is', this._buildItems, this);
	   	com.emit('give-list', { 
	   		position : this._position, 
	   		path : this._curPath, 
	   		refresh : e.type === 'refresh' ? true : false 
	   	});
    },

    _buildItems : function(e, data) {
		var items = [],
			list = [],
			html,
			path = this._curPath,
			toplevel = {
	            block : 'menu-item',
	            mods : { toplevel : true, position: this._position, pathfinder : true },
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
				(list = sort.sortByKey(list, 'key', !this.hasMod('reverse')));

		// notifying all listeners that list is ready and how big it is
		com.emit('ready-list-' + _pos, this._listLength);

		// creating menu-items blocks for the retrieved list 
        path !== '/' && items.push(toplevel);
				
		list.forEach(function(value){
			var item = {
	            block : 'menu-item',
	            mods : { position : _pos, pathfinder : true },
	            val : value.path,
	            content : value.name
	        };

	        items.push(item);
		});

    	html = BEMHTML.apply(
	    	{
			    block : 'menu',
			    mods : { panel: true, theme : 'islands', size : 'l', mode : 'check', position: this._position },
			    content : items
			}
		);

        BEMDOM.update(this._list.domElem, html);
        this._menu = this._list.findBlockInside('menu');

        this._menu.setMod('focused');

		this._path.detectMountpoint();
    }
}, { live : true }));

});
