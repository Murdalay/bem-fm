/* global modules:false */

modules.define('fm', ['events__channels', 'config'], function(provide, channels, config) {
	var vfs = require('vow-fs'),
		com = channels('116'),
		list = function(path){
			var _promise = vfs.listDir(path);

			_promise
				.then(function(result){
					console.log('Path to get is ' + path);
					com.emit('list-ready-' + path, result);
				})
				.fail(function(response){
					console.error('Failed to get list\n');
					console.error(response);
				});
		},
		stat = function(path){
			var _promise = vfs.stat(path);
			
			_promise.then(function(result){
				console.log('Geting status for ' + path);
				com.emit('stat-' + path, result);
			})
			.fail(function(response){
				console.error('Failed to get status\n');
				console.error(response);
			});
		},
		exist = function(path){
			vfs.exists(path).then(function(result){
				com.emit('check-exist-' + path, result);
			});
		},

		readfile = function(path){
			vfs.read(path, 'utf-8').then(function(result){
				console.log(result);
				com.emit('readfile-' + path, result);
			});
		},

		isdir = function(path){
			return vfs.isDir(path);
				
		},

		emit = function(type){ com.emit(type); };

	com.on('getlist', function(e, data) { list(data); });
	com.on('getstat', function(e, data) { stat(data); });
	com.on('check-exist', function(e, data) { exist(data); });
	com.on('check-if-dir', function(e, data) {
		console.log('Checking is dir \n' + data);
		isdir(data); 
	});
	com.on('readfile', function(e, data) { readfile(data); });

provide({
	'emit': emit,
	'isdir': isdir,
	'list': list		
});
});

