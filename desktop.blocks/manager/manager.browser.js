/* global modules:false */

modules.define('manager', 
	['i-bem__dom', 'events__channels', 'request', 'vow', 'vow-queue', 'state', 'path-normalizer', 'state-controller'], 
	function(provide, BEMDOM, channels, request, vow, Queue, state, normalizer, sc) {

var com = channels('116'),
	normalize = normalizer.normalize;

provide(BEMDOM.decl(this.name, {
    onSetMod : {
        'js' : {
            'inited' : function() {
				this._control = this.findBlockInside('control-group').domElem;
				this._popup = this.findBlockInside('popup');
				this._confirm = this.findBlockInside('confirm');
				this._disabler = this.findBlockInside('disabler');
				
				// subscribing for buttons clicks and menu states 
				BEMDOM.blocks['menu'].on({ modName : 'focused', modVal : true }, this._stubMenusState, this);
				BEMDOM.blocks['button'].on(this._control, 'click', this._onButtonClick, this);

				// command button click handlers
				com.on('exec', this._exec, this);
				com.on('copy', this._copy, this);
				com.on('mkdir', this._mkdir, this);
				com.on('symlink', this._symlink, this);
				com.on('hardlink', this._hardlink, this);
				com.on('move', this._move, this);
				com.on('delete', this._delete, this);
				com.on('download', this._download, this);
				com.on('all', this._selectAll, this);
				com.on('inverse', this._inverseSelection, this);
				com.on('deselect', this._selectNone, this);
				com.on('levelup', this._levelUp, this);

			   	// this.logEvents();
            }
        }
    },

    logEvents: function(e, data) {
		com.on('*', function(e, data){console.log(e.type);})     	
    },

    getActiveItems : function() {
		return this._activeMenu ? this._activeMenu.getVal() : null;
    },

    getActiveMenu: function() {
		if (this._activeMenu) {
			return this._activeMenu
		}     	
    },

    getInactiveMenu: function() {
		if (this._inactiveMenuPosition) {
			var _inactive = this.findBlockInside(
				{ 
					block: 'menu', 
					modName: 'position',
					modVal: this._inactiveMenuPosition 
				}
			);

			return _inactive;
		}     	
    },

    reselectActiveMenu: function() {
		this._activeMenu && this._activeMenu.setMod('focused');
    },

    _onButtonClick : function(e) {
		var _name = e.target.domElem.context.name;
		
		com.emit(_name);
    },

    _stubMenusState : function(e) {
    	if(e.target.hasMod('panel')) {
			this._activeMenu = e.target;
			this._activeMenuPosition = this._activeMenu.getMod('position');
			this._activeMenu.setMod('active');

			this._inactiveMenuPosition = this._activeMenuPosition === 'left' ? 'right' : 'left';
			this._inactiveMenuPath = state.getCurPath(this._inactiveMenuPosition);
			this._inactiveMenu = this.getInactiveMenu();

			this._inactiveMenu && this._inactiveMenu.hasMod('active') && this._inactiveMenu.delMod('active');
    	}

    },

    _getConfirm: function(message) {
		return this._confirm.getConfirm(message);
    },

    _levelUp : function(e, data) {
    	var _position = data,
	    	_path = state.getCurPath(_position) + '/..',
	    	_destination = normalize(_path);

        com.emit('set-path-' + _position, _destination);
        com.emit('path-'     + _position, _destination);  	
    },

    _exec : function(e, data) {
    	this._execPosition = data.position;
    	var normalPath = normalize(data.path),
	    	_name,
	    	_isDir = state.isDir(normalPath);

		if(_isDir){
			com.emit('set-path-' + this._execPosition, normalPath);    	
	        com.emit('path-'     + this._execPosition, normalPath);  
		} else {
			_name = data.path.split('/');
			_name = _name[_name.length - 1];

			if (_name === '..'){
		        com.emit('set-path-' + this._execPosition, normalPath);    	
		        com.emit('path-'     + this._execPosition, normalPath);  	
			}
		}
    },

	_selectAll: function(e, data) {
		var items = this._activeMenu ? this._activeMenu.findBlocksInside('menu-item') : null;

		items && items.forEach(function(item){ 
			!item.hasMod('toplevel') && item.setMod('checked');	
		});

		this.reselectActiveMenu();
    },

	_selectNone: function(e, data) {
		var items = this._activeMenu ? this._activeMenu.findBlocksInside('menu-item') : null;

		items && items.forEach(function(item){ 
			!item.hasMod('toplevel') && item.hasMod('checked') && item.delMod('checked');	
		});

		this.reselectActiveMenu();
    },

	_inverseSelection: function(e, data) {
		var items = this._activeMenu ? this._activeMenu.findBlocksInside('menu-item') : null;

		items && items.forEach(function(item){
			item.toggleMod('checked');
		});

		this.reselectActiveMenu();
    },

	_download: function(e, data) {
		var items = this.getActiveItems();

		items.length && items.forEach(function(item){
			var spec = { name: state.getName(item),	path: item };
			request.download(spec);
		}, this);

		this._activeMenu.setVal([]);
		this.reselectActiveMenu();
    },


    /*
    * Displays the dialog window and executes the provided callback if user confirmes the action.
    * @exports
    * @param {Function} cb Callback to run on confirmation. It will receives as first arguments array of items and answer object as second.
    * @param {String} action Action type for the confirmation dialog. 
    * @param {Object} [options] Additional options.  
    * You could pass as the "options" argument:
	* 	{ 
	*		destination : true  To enable the destination input in dialog window. 
	*		force : true  To force callback execution even if the user did not confirmed the action.
	*	}
    */

	askAndRun: function(cb, action, options) {
		var confirm,
			_destination,
			_path = state.getCurPath(this._activeMenuPosition),
			items = this.getActiveItems(),

			_performTheAction = function(answer){ 
				if (answer === 'true' || answer.answer === 'true' || options.force) {
					this._activeMenu.setVal([]);
					delete this._activeMenu;

					cb(items, answer);
				}

				this.reselectActiveMenu();
			};

		options || (options = {});

		_destination = options.destination ? state.getCurPath(this._inactiveMenuPosition) : null;

		if (items.length){
			confirm = this._confirm.getConfirm(action, items, _path, _destination);
		} else { return }

		confirm && confirm.then(_performTheAction.bind(this));
    },

	_mkdir: function(e) {
		var confirm,
			_path = state.getCurPath(this._activeMenuPosition);

			_makeIfTrue = function(answer){ 
				if (answer.answer === 'true') {
					request.mkDir(_path + '/' + answer.destination);
				}

				this.reselectActiveMenu();
			};

		confirm = this._confirm.getSimple('mkdir');
		confirm && confirm.then(_makeIfTrue.bind(this));
    },

	_move: function(e) {
		var _cb = function(items, answer){ 	request.move(items, answer.destination); };

		this.askAndRun(_cb, e.type, { destination : true });
    },

	_copy: function(e) {
		var _cb = function(items, answer){ request.copy(items, answer.destination); };

		this.askAndRun(_cb, e.type, { destination : true });
    },

	_symlink: function(e) {
		var _cb = function(items, answer){ request.symlink(items, answer.destination); };

		this.askAndRun(_cb, e.type, { destination : true });
    },

	_hardlink: function(e) {
		var _cb = function(items, answer){ request.hardlink(items, answer.destination); };

		this.askAndRun(_cb, e.type, { destination : true });
    },

	_delete: function(e) {
		var _cb = function(items, answer){
				var _deleteSuccess = function(resp, spec) {
					var _obj = state.getObj(spec.data.path);

				   	BEMDOM.destruct(_obj.domElem);
				   	state.dropItemByPath(spec.data.path);
			    };

				request.delete(items, _deleteSuccess);
		};

		this.askAndRun(_cb, e.type);
    }
}));
});
