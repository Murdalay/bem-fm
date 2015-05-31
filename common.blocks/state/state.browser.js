/* global modules:false */

modules.define('state', ['events__channels', 'size', 'identify', 'objects', 'path-normalizer'], 
	function(provide, channels, size, identify, objects, normalizer) {
	var com = channels('116'),
        normalize = normalizer.normalize,
		state = { 
			curList: {}, 
			curPath: {}, 
			lists: {}, 
			config: null, 
			disks:  null, 
			activeDriveIndex : { 'left' : 0, 'right' : 0 } 
		},
		ids = {},
		paths = {},

		_init = function(path, extension){
			var _path = normalize(path);

			paths[_path] && extension && (paths[_path] = objects.extend(paths[_path], extension));
			paths[_path] || (paths[_path] = objects.extend({ 
				readable: null, 
				stat: null, 
				dir: null, 
				link: null, 
				name: null, 
				id: null 
			}, extension ? extension : {}));
		},
		
		api = {
			isDir: function(path){
				var _path = normalize(path);

				return paths[_path] ? paths[_path].dir : null; 
			},

			setDir: function(path, value){ 
				_init(path, { dir: value });
			},

			isLink: function(path){ 
				var _path = normalize(path);

				return paths[_path] ? paths[_path].link : null; 
			},

			setLink: function(path, value){ 
				_init(path, { link: value });
			},

			getStates: function(path){
				var _path = normalize(path);

				return paths[_path] ? paths[_path].stat : null; 
			},

			setStates: function(path, stat){ 
				_init(path, { stat: stat }); 
			},

			getState: function(path, state){ 
				var _path = normalize(path);

				if(paths[_path]) { 
					if(paths[_path].stat && paths[_path].stat[state]) {
						return paths[_path].stat[state]; 
					}
					else { return null }
				}
				else { return null }
			},

			getName: function(path){
				var _path = normalize(path);

				return paths[_path] ? paths[_path].name : null; 
			},

			setName: function(path, name){ 
				_init(path, { name: name });
			},

			getObj: function(path){
				var _path = normalize(path);

				return paths[_path] ? paths[_path].obj : null; 
			},

			setObj: function(path, obj){ 
				_init(path, { obj: obj });
			},

			getReadableStates: function(path){
				var _path = normalize(path);

				return paths[_path] ? paths[_path].readable : null; 
			},

			setReadableStates: function(path, states){ 
				_init(path, { readable: states });
			},

			getReadableState: function(path, state){ 
				var _path = normalize(path);

				if(paths[_path]) { 
					if(paths[_path].readable && paths[_path].readable[state]) {
						return paths[_path].readable[state]; 
					}
					else { return null }
				}
				else { return null }
			},

			setReadableState: function(path, state, value){
				_init(path);

				var _path = normalize(path);
				paths[_path].readable[state] = value;
			},

			getCurList: function(align){ 
				return state.curList[align];
			},

			setCurList: function(align, list){ 
				state.curList[align] = list;
			},

			getDisks: function(){ 
				return state.disks;
			},

			setDisks: function(disks){ 
				state.disks = disks;
			},
			
			getActiveDriveIndex: function(position){ 
				return state.activeDriveIndex[position];
			},

			setActiveDriveIndex: function(position, index){ 
				state.activeDriveIndex[position] = index;
			},

			getCurPath: function(position){ 
				return state.curPath[position];
			},

			setCurPath: function(path, position){ 
				state.curPath[position] = path;
			},

			getConfig: function(){ 
				return state.config;
			},

			getClientConfig: function(){
				return state.config ? state.config.client : null;
			},

			setConfig: function(config){ 
				state.config = config;
			},

			getList: function(path){ 
				return state.lists[path];
			},

			setList: function(path, list){ 
				state.lists[path] = list;
			},

			getPathById: function(id){ 
				return ids[id];
			},

			dropItemById: function(id){ 
				var _path = ids[id];
				_path && delete path[_path];
				_path && delete ids[id];
			},

			dropItemByPath: function(path){
				var _path = normalize(path);

				if (paths[_path]){
					var _id = paths[_path].id;

					console.log('Deleting records for path \n' + paths[_path]);
					console.log(delete ids[_id]);
					console.log(delete path[_path]);
				}
			},

			storeId: function(path, id){
				var _path = normalize(path);
				
				ids[id] = _path;
				paths[_path] || _init(path, { id: id });
			},

			getId: function(path){ 
				var _path = normalize(path),
					id;
				
				paths[_path] && (id = paths[_path].id);
				id || (id = identify());

				// updating the id if we don't store it yet
				api.getPathById(id) || api.storeId(_path, id);

				return id
			}
		};

provide(api);

});
