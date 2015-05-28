/* global modules:false */

modules.define('request', 
	['events__channels', 'vow', 'jquery', 'vow-queue', 'querystring', 'next-tick', 'objects', 'state'], 
	function(provide, channels, vow, $, Queue, querystring, nxt, objects, state) {

var com = channels('116'),
	conf = state.getClientConfig,
	_counter = 0,

    _onSuccess = function(resp) {
		com.emit('refresh');
		console.log('Request completed and result is\n' + resp);
    },

	_specify = function(action, data) {
        var _def = { priority: 5, weight: 10 },
	        _settings = conf() && conf().queueSettings[action] ? 
		        conf().queueSettings[action] : _def,

	        _request = objects.extend({
	            type: 'GET',
	            dataType: 'html',
	            context: this,
	            url: '/' + action,
	            data: data,
	            cache: false
	        }, _settings ? _settings : _def);

        return _request;
	},

	_enqueRequest = function(spec, cb, onFail) {
	        var defer = vow.defer(),
		        _request = objects.extend(spec, {
			        error: function(resp){ defer.reject(resp) },
		            success: function(resp){ defer.resolve(resp) }
		        });

			this._queue || (this._queue = new Queue());

	        this._queue.enqueue(function(){ 
	        	$.ajax(_request); 
	        	return defer.promise(); 
	        }, spec)
	        .then(function(res) {
	        	var _result = JSON.parse(res);

				cb ? cb(_result, spec) : _onSuccess(_result);
	        }) 
	        .fail(function(res) {
	            onFail ? 
		            onFail(res):
			            console.error(res.responseText);
	        });
	        
	        this._queue.isStarted() || this._queue.start();
    },

	_formRequest = function(spec, cb, onFail) {
		var items = typeof spec.item === 'object' ? spec.item : null,
			_destination = spec.destination ? spec.destination : null,
			_enque = function(item){
				var _data = {},
					_request;

					if (typeof spec.data === 'string' && !_destination && !item) {
						_data = { path: spec.data };
					}
					else if (_destination) {
						_data = { destination: _destination, source: item };
						spec.data && (_data = objects.extend({}, spec.data, _data));
					}
					else {
						_data = spec.data ? objects.extend({}, spec.data, { path: item }) : { path: item };
					}

				_request = _specify(spec.action, _data);
				_enqueRequest(_request, cb, onFail);
			};

		items ? items.forEach(_enque, this) : _enque(spec.item); 	
    },

    _checkIfExist = function(e, data) {
        api.checkExist(data, function(result){
            com.emit('exist', _res);
        });
    },

	api = {

		isDir: function(item, cb, onFail) {
			_formRequest({ 
				item: item, 
				action: 'isdir' }, cb, onFail);
	    },

		delete: function(item, cb, onFail) {
			_formRequest({ 
				item: item, 
				action: 'delete' }, cb, onFail);
	    },

		read: function(item, cb, onFail) {
			_formRequest({ 
				item: item, 
				action: 'read' }, cb, onFail);
	    },

		getStates: function(item, cb, onFail) {
			_formRequest({ 
				item: item, 
				action: 'state' }, cb, onFail);
	    },

		getList: function(item, cb, onFail) {
			_formRequest({ 
				item: item, 
				action: 'list' }, cb, onFail);
	    },

		getConfig: function(item, cb, onFail) {
			_formRequest({ 
				item: item, 
				action: 'getconf' }, cb, onFail);
	    },

		setConfig: function(item, cb, onFail) {
			_formRequest({ 
				data: item, 
				action: 'setconf' }, cb, onFail);
	    },

		mkDir: function(item, cb, onFail) {
			_formRequest({ 
				item: item, 
				action: 'mkdir' }, cb, onFail);
	    },

		checkExist: function(item, cb, onFail) {
			_formRequest({ 
				item: item, 
				action: 'exist' }, cb, onFail);
	    },

	    copy: function(source, destination, cb, onFail) {
			_formRequest({ 
				item: source, 
				destination: destination, 
				action: 'copy' }, cb, onFail);
	    },

	    move: function(source, destination, cb, onFail) {
			_formRequest({ 
				item: source, 
				destination: destination, 
				action: 'move' }, cb, onFail);
	    },

	    symlink: function(source, destination, cb, onFail) {
			_formRequest({ 
				item: source, 
				destination: destination, 
				action: 'symlink' }, cb, onFail);
	    },

	    hardlink: function(source, destination, cb, onFail) {
			_formRequest({ 
				item: source, 
				destination: destination, 
				action: 'hardlink' }, cb, onFail);
	    },

	    download: function(spec) {
			var _req = '/download/?' + querystring.stringify({ path: spec.path }),
	            a = document.createElement("a");

	            // safari doesn't support this yet
	            if (typeof a.download === 'undefined') {
	            	_counter < 1000 ? _counter += 160 : _counter = 100;
	            	setTimeout(function(){ window.location = _req }, _counter);
	            } else {
	                a.href = _req;
	                a.download = spec.name;
	                document.body.appendChild(a);
	                nxt(function(){ a.click() });
	            }
	    }
	};


provide(api);

});
