/* global modules:false */

modules.define('state-controller', ['events__channels', 'request', 'vow', 'path-normalizer', 'state', 'size', 'tick', 'idle'], 
function(provide, channels, request, vow, normalizer, state, size, tick, idle) {

var com = channels('116'),
	normalize = normalizer.normalize,

	_checkIfDir = function(e, data) {
		var _isDir = state.isDir(data.path),
		    _dirSuccess = function(resp, spec) {
		    	// store dir property for path
		    	state.setDir(data.path, resp);
		    	
			   	com.emit(data.id + '-is-dir', resp);
			   	com.emit('state', data);
		    };

		state.setObj(data.path, data.object);

		// checking if we already know is path a dir
		if(_isDir !== null && _isDir !== 'waiting') {
			com.emit(data.id + '-is-dir', _isDir);
		}
		else {
			request.isDir(data.path, _dirSuccess);
		};
    },

	_lastPosition = 'left',

	_getStates = function(e, data) {
		var _state = state.getReadableStates(data.path),
	        _id = state.getId(data.path),

		    _statSuccess = function(resp, spec) {
		        var _ctime = new Date(resp.ctime),
			        readable = {
			        	ctime: _ctime.toLocaleString(),
						size: size(resp.size),
						uid: resp.uid,
						name: state.getName(data.path),
						type: state.isDir(data.path) ? 'dir' : 'file'
					};

		        com.emit(_id + '-update', readable);
		    	
		    	state.setReadableStates(data.path, readable);
		    	state.setStates(data.path, resp);
		    };

		// checking if we already get states for path
		if(_state !== null) {
			com.emit(_id + '-update', _state);
		}
		else {
			request.getStates(data.path, _statSuccess);
		};
    },

	_getList = function(e, data) {
		var exist = state.getList(data.path),
		    _listSuccess = function(resp) {
		    	state.setList(data.path, resp);

			   	com.emit(data.position + '-list-is', resp);
		    },
		    _fail = function(resp){
		    	console.warn(resp);
		    };

		if(data.refresh || !exist) {
			request.getList(data.path, _listSuccess, _fail);
		}
		else {
			com.emit(data.position + '-list-is', exist);
		}
    },

	_updateState = function(e, data) {
		var position = _lastPosition === 'left' ? 'right' : 'left',
			path = state.getCurPath(position),
			oldList = state.getCurList(position),

		    _listSuccess = function(resp) {
		    	if (resp.disks){
					state.setDisks(resp.disks);
					com.emit('disks-changed');
		    	}

		    	var stillTheSame = resp.list.every(function(elem, index){
		    		return elem === oldList[index];
		    	});

		    	if(stillTheSame && oldList.length === resp.list.length){
		    		return
		    	} else {
			    	state.setCurList(position, resp.list);
			    	state.setList(path, resp.list);

				   	com.emit(position + '-list-is', resp.list);
		    	}
		    },

		    _fail = function(resp){
		    	console.warn(resp);
		    };

		_lastPosition = position;
		path && request.ping(path, _listSuccess, _fail);
    },

    boundToTick,
    frequency = 30,
    tickCount = 0,
    
    _bindToTick = function() {
        boundToTick = true;
        tick
            .on('tick', update) // подписываемся на событие tick 
            .start(); // запускаем генерацию события tick
        idle
            .on({
                idle : function() {
                    tick.un('tick', update); // по событию idle отписываемся от tick
                },
                wakeup : function() {
                    tick.on('tick', update); // по событию wakeup подписываемся обратно
                }
            })
            .start();
    },

    update = function() { 
    	if (tickCount <= state.getClientConfig().updateFrequency) {
    		tickCount += 1;
	    } else {
    		tickCount = 0;
    		_updateState();
	    }
	},

    _getConfig = function() {
    	var _sucscess = function(res) {
    		state.setConfig(res.conf);
    		com.emit('config-ready');

	    	if (res.disks){
				state.setDisks(res.disks);
				com.emit('disks-changed'); 
	    	}

			_bindToTick();
    	};

		request.getConfig('', _sucscess);
	},

    storeConfig = function() { 
    	var conf = state.getConfig();

		conf && request.setConfig({ data : JSON.stringify(conf) });
	};

_getConfig();

// internal actions – file type checks and statistic retrieving 
com.on('give-list', _getList, this);
com.on('is-dir', _checkIfDir, this);
com.on('state', _getStates, this);
com.on('config-updated', storeConfig, this);

provide({ storeConfig : storeConfig });

});
