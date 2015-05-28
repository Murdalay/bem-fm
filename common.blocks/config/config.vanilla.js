/* global modules:false */

modules.define('config', function(provide) {

var server = {
		basePath: '/Users/ragnar/',
		defEncoding: 'utf-8',
		defLevel: 'desktop.bundles/'
	},
	client = {
		left: '/',
		right: '/',
		updateFrequency: 30, // the current list update interval in ticks. 1 tick = 50ms 
		messages: 
		{
			'delete': {
				SingleFile: 'You are about to delete the file\n',
				PluralFiles: 'Do you want to delete '
			},
			'copy': {
				SingleFile: 'Do you want to copy the file\n',
				PluralFiles: 'Do you want to copy ',
				hint: 'Choose an existing destination by typing the path. Folder recursive coppy not yet supported.'
			},
			'move': {
				SingleFile: 'Do you want to move the file\n',
				PluralFiles: 'Do you want to move ',
				hint: 'Choose an existing destination by typing the path.'
			},
			'symlink': {
				SingleFile: 'Do you want to make a symbolic link to file\n',
				PluralFiles: 'Do you want to make a symbolic links for the ',
				hint: 'Choose an existing destination by typing the path.'
			},
			'mkdir': {
				message: 'Enter the name for a new folder',
				hint: 'To specify the subfolers use a slash'
			}
		},

		queueSettings: {
        	'copy': {
				priority: 5, 
				weight: 30
        	},
        	'move': {
				priority: 5, 
				weight: 30
        	},
        	'read': {
				priority: 3, 
				weight: 20
        	},
        	'delete': {
				priority: 2, 
				weight: 5
        	},
        	'exist': {
				priority: 1, 
				weight: 3
        	},
        	'list': {
				priority: 1, 
				weight: 5
        	},
        	'isdir': {
				priority: 2, 
				weight: 3
        	},
        	'stat': {
				priority: 3, 
				weight: 5
        	},
        	'mkdir': {
				priority: 3, 
				weight: 5
        	}
        }
	};

provide({ 
	'server' : server,
	'client' : client
});

});
