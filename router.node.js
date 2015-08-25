var fs = require('fs'),
	conf = require(process.cwd() + '/config.json'),
    path = require('path'),
    pathToBundle = path.join(process.cwd(), 'desktop.bundles', 'index');

require(path.join(pathToBundle, 'index.node.js'));

modules.require(['router'], function(r) {
	var app = r.app;
	app.listen(conf.server.defPort);	 
});

