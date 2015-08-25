modules.define('router', ['vow'], function(provide, vow) {
	var express = require('express'),
	    path = require('path'),
	    fs = require('fs'),
	    vfs = require('vow-fs'),
	    morgan = require('morgan'),
	    mime = require('mime'),
	    njds = require('nodejs-disks'),
	    session = require('express-session'),
		app = express(),
		basePath = process.cwd(),
		pathToIndex = path.join(basePath, 'desktop.bundles', 'index'),
		pathToBundles = path.join(basePath, 'desktop.bundles'),
		pathToImages = path.join(basePath, 'images'),
		pathToLogin = path.join(basePath, 'desktop.bundles', 'login'),
		conf = require(basePath + '/config.json'),
		pass = conf.server.security.password,
	    disksObj = null;


	    njds.drives(function (err, drives) {
	        njds.drivesDetail(drives, function (err, data) { disksObj = data });
        });

	function checkAcess(req, res, next) {
	  if (req.session.confirmed) {
	    next();
	  } else {
	    res.redirect('/login');
	  }
	}

	app
	    .disable('x-powered-by')
	    .use(morgan('dev'))

	    .use('/login', express.static(pathToLogin, { index: 'login.html' }))
	    .use('/images', express.static(pathToImages));

	app.get('/list', function (req, res) {
		var _path = path.normalize(req.query.path);

		vfs.listDir(_path)
			.then(function(data){
				res.end(JSON.stringify(data));
			})
			.fail(function(response){
				console.error('Failed to get list\n' + response);
			});
	});

	app.get('/ping', function (req, res) {
		var defer = vow.defer(),
		    _path = path.normalize(req.query.path),
			_data = null,

			finishReqest = function(){
				vfs.listDir(_path)
						.then(function(data){
							res.end(JSON.stringify({ list : data, disks : _data }));
						})
						.fail(function(response){
							console.error('Failed to get list\n' + response);
						});
					}.bind(this),

			promise = function(){
				njds.drives(function (err, drives) {
			            njds.drivesDetail(drives, function (err, data) {
			            	defer.resolve(data);
						}.bind(this));
			        }.bind(this)
			    );

		        return defer.promise(); 
			}();

	    promise.then(function(res) { 
	    	if(disksObj && res.length == disksObj.length){
		    	res.every(function(item, i){
		    		return item.used == disksObj[i].used
		    	}) || (_data = res); 
	    	} else {
		    	_data = res; 
	    	}

			disksObj = res;
			finishReqest();
	    });

	});

	app.get('/isdir', function (req, res) {
		var _path = path.normalize(req.query.path);

		vfs.isDir(_path)
			.then(function(data){
				res.end(JSON.stringify(data));
			})
			.fail(function(response){
				console.error('Failed to detect if it is dir\n' + response);
			});
	});

	app.get('/issymlink', function (req, res) {
		var _path = path.normalize(req.query.path);

		vfs.isSymLink(_path)
			.then(function(data){
				res.end(JSON.stringify(data));
			})
			.fail(function(response){
				console.error('Failed to detect if it is symlink\n' + response);
			});
	});

	app.get('/astpart', function (req, res) {
		if(req.query.path){

		} else {
			res.status('500').end('No path was provided in request');
			console.error('No path was provided in request\n');
		}
	});

	app.get('/exist', function (req, res) {
		var _path = path.normalize(req.query.path);

		vfs.exists(_path)
			.then(function(data){
				res.end(JSON.stringify({ exist: data, path: _path }));
			})
			.fail(function(response){
				console.error('Failed to detect if it is dir\n' + response);
			});
	});

	app.get('/download', function (req, res) {
		var _path = path.normalize(req.query.path),
			_filename = path.basename(_path),
			mimetype = mime.lookup(_path);
		
		vfs.exists(_path)
			.then(function(data){
				res.setHeader('Content-disposition', 'attachment; filename=' + _filename);
				res.setHeader('Content-type', mimetype);
				
				res.sendFile(_path, function (err) {
				    if (err) {
				      console.log(err);
				      res.status(err.status).end();
				    }
				    else {
				      console.log('Sent:', _filename);
				    }
				});
			})
			.fail(function(response){
				res.status('404').end(response);
				console.error('Failed to download - file not found\n' + response);
			});
	});	

	app.get('/read', function (req, res) {
		var _path = path.normalize(req.query.path),
			_filename = path.basename(_path),
			_filestream,
			mimetype = mime.lookup(_path);
		
		vfs.exists(_path)
			.then(function(data){

				res.setHeader('Content-disposition', 'attachment; filename=' + _filename);
				res.setHeader('Content-type', mimetype);

				vfs.read(_path, 'utf-8')
					.then(function(data){
						res.end(JSON.stringify(data));
					})
					.fail(function(response){
						console.error('Failed to read\n' + response);
					});
			})
			.fail(function(response){
				res.status('404').end(response);
				console.error('Failed to read\n' + response);
			});

	});	

	app.get('/getconf', function (req, res) {
		var conf = require(process.cwd() + '/config.json');
		res.end(JSON.stringify({ conf : conf, disks : disksObj }));
	});	

	app.get('/setconf', function (req, res) {
		console.log(req.query);
		
		vfs.write(path.join(process.cwd(), 'config.json'), JSON.stringify(JSON.parse(req.query.data), null, 4), 'utf-8')		
		.then(function(data){
			console.log(data);
			res.end(JSON.stringify('done'));
		})
		.fail(function(response, message){
			res.status(500).end(JSON.stringify(response));
			console.warn('Failed to store config\n');
			console.error(response);
		});
	});	

	app.get('/copy', function (req, res) {
		vfs.copy(req.query.source, 
			path.join(req.query.destination, path.basename(req.query.source)))
		.then(function(data){
			res.end(JSON.stringify('done'));
		})
		.fail(function(response, message){
			res.status(500).end(JSON.stringify(response));
			console.warn('Failed to copy\n');
			console.error(response);
		});
	});

	app.get('/symlink', function (req, res) {
		vfs.symLink(req.query.source, 
			path.join(req.query.destination, path.basename(req.query.source)))
		.then(function(data){
			res.end(JSON.stringify('done'));
		})
		.fail(function(response, message){
			res.status(500).end(JSON.stringify(response));
			console.warn('Failed to make symlink\n');
			console.error(response);
		});
	});

	app.get('/hardlink', function (req, res) {
		vfs.link(req.query.source, 
			path.join(req.query.destination, path.basename(req.query.source)))
		.then(function(data){
			res.end(JSON.stringify('done'));
		})
		.fail(function(response, message){
			res.status(500).end(JSON.stringify(response));
			console.warn('Failed to make hardlink\n');
			console.error(response);
		});
	});

	app.get('/delete', function (req, res) {
		var _path = req.query.path;

		vfs.isDir(_path).then(function(dir){
			console.log(dir);
			dir ? vfs.removeDir(_path) : vfs.remove(_path)
				.then(function(data){
					res.end(JSON.stringify('done'));
				})
				.fail(function(response, message){
					res.status(500).end(JSON.stringify(response));
					console.warn('Failed to delete\n');
					console.error(response);
				});
		});

	});

	app.get('/move', function (req, res) {
		vfs.move(req.query.source, 
			path.join(req.query.destination, path.basename(req.query.source)))
		.then(function(data){
			console.log('success');
			res.end(JSON.stringify('done'));
		})
		.fail(function(response){
			res.status(500).end(JSON.stringify(response));
			console.warn('Failed to move\n');
			console.error(response);
		});
	});

	app.get('/rename', function (req, res) {
		vfs.move(req.query.source, req.query.destination)
		.then(function(data){
			console.log('success');
			res.end(JSON.stringify('done'));
		})
		.fail(function(response){
			res.status(500).end(JSON.stringify(response));
			console.warn('Failed to move\n');
			console.error(response);
		});
	});

	app.get('/state', function (req, res) {
		var _path = path.normalize(req.query.path);

		vfs.stat(_path)
			.then(function(result){
				res.end(JSON.stringify(result));
			})
			.fail(function(response){
				console.error('Failed to get status\n' + response.responseText);
			});
	});

	app.get('/mkdir', function (req, res) {
		var _path = path.normalize(req.query.path);

		vfs.makeDir(_path)
			.then(function(result){
				console.log(result);
				res.end(JSON.stringify('done'));
			})
			.fail(function(response){
				console.error('Failed to make dir\n' + response.responseText);
			});
	});

	app 
	    .use(require('body-parser').urlencoded())
		.use(session({
		  secret: 'The lost tome of elves',
		  resave: false
		}))
		.get('/', checkAcess, function (req, res, next) { next() })
	    .use('/', express.static(pathToIndex));

	app.post('/login', function (req, res, next) {
		if(req.body.pass == pass){
			req.session.confirmed = true;
		}
	    res.redirect('/');
	});


provide({ 'app': app });

});
