/* global modules:false */

modules.define('path', ['i-bem__dom', 'events__channels', 'cookie', 'state', 'jquery', 'functions__debounce', 'path-normalizer'], 
    function(provide, BEMDOM, channels, cookie, state, $, debounce, normalizer) {
        var com = channels('116'),
            conf = state.getClientConfig,
            normalize = normalizer.normalize;

provide(BEMDOM.decl(this.name, {
    onSetMod : {
        'js' : {
            'inited' : function() {
                this._input = this.findBlockInside('input');
                this._control = this.findBlockInside('input__control');
                this.hasMod('source') && this.serveAsSource();
                this.hasMod('destination') && this.serveAsDestination();
            }
        },
        'position' : function(name, val) {
            this.serveAsPathfinder(val);
        },
        'disabled' : {
            'true' : function() {
                this._input.setMod('disabled');
            },
            '' : function() {
                this._input.delMod('disabled');
            }
        }       
    },

    /**
     * Sets the input value
     * @param {String} value – Value to set
     */    
    setVal : function(value) {
        this._input.setVal(value);
        this._lastVal = value;
    },

    setFocus : function(value) {
        this._input.setMod('focused');
    },

    delFocus : function(value) {
        this._input.delMod('focused');
    },

    getVal: function() { return this._control.domElem.val() },

    serveAsPathfinder : function(position) {
        this._position = position;

        this.bindTo('input change', debounce(this._checkPath, 850, this));
        com.on('check-path', this._checkPath, this);

        this._ready4All();
        this._getDefPath();
    },

    serveAsDestination : function() {
        this.bindTo('input change', debounce(this._checkExist, 850, this));
    },

    serveAsSource : function() {
        this._input.setMod('disabled');
    },

    _checkExist : function(value) {
        var _requestSuccess = function(result) {
            var _res = JSON.parse(result);
                
            if(_res.exist && _res.path !== '.' && _res.path !== './') {
                this._lastVal = normalize(_res.path);
                this.setVal(normalize(this._lastVal));
            }
            else {
                this._lastVal ? this.setVal(normalize(this._lastVal)) : this.setVal('/');
            };
        };

        this._lastVal || (this._lastVal = normalize(this.getVal()));
        this._checkPath(value, _requestSuccess);
    },

    /**
     * Sets path value in the input and cookie
     * @param {String | Object} e – Value to set or event object
     * @param [{String} data] – Value to set
     */   
    setAll : function(e, data) {
        data || (data = e);

        data = normalize(data);
        this.setVal(data);
        this._setCook(data);
        this._curPath = data;
    },

    detectMountpoint : function() {
        var drives = state.getDisks(),
            path = state.getCurPath(this._position),
            activeDriveIndex = 0;

        if(drives && path) {
            drives.forEach(function (item, index) {
                if(index > 0){
                    path.indexOf(normalize(item.mountpoint)) !== -1 && (activeDriveIndex = index);
                }
            }.bind(this));

            state.setActiveDriveIndex(this._position, activeDriveIndex);
            com.emit(this._position +'-drive-changed');
        }
    },

    _emitPath: function() {
        console.log('position is ' + this._position + '\npath is ' +  this._curPath);
        com.emit(this._position + '-path-is', this._curPath);
    },

    _ready4All: function() {
        com.on('tell-path-' + this._position, this._emitPath, this);
        com.on('set-path-'  + this._position, this.setAll, this);
    },

    _getDefPath : function() {
        this._curPath = cookie.get('path-' + this._position);
console.log(this._curPath);
        this._checkPath(this._curPath);
    },

   _checkPath: function(path, cb) {
        this._abortRequest();
        cb = cb ? cb.bind(this) : this._onSuccess.bind(this);
        var _path = typeof path !== 'object' ? path : this.getVal();
        
        if(!_path){
            cb('{"res":{"exist":false}}');
            return
        }

        this._xhr = $.ajax({
            type: 'GET',
            dataType: 'html',
            url: '/exist',
            data: { path: _path },
            cache: false,
            success: cb
        });
    },

    _abortRequest: function() {
        this._xhr && this._xhr.abort();
    },

    _onSuccess: function(result) {
        var _res = JSON.parse(result);
            
        if(_res.exist) {
            var _path = normalize(_res.path);

            this.setAll(_path);
            com.emit('path-' + this._position, _path);

            this.detectMountpoint();
        }
        else {
            if(!this._curPath) {
                this._curPath = conf()[this._position]
                com.emit('path-' + this._position, this._curPath);
            }
            this.setAll(normalize(this._curPath));
        };

    },

    _setCook : function(path) {
        this._position && cookie.set('path-' + this._position, normalize(path));
    }
},{ live : true }));
});
