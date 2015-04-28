/* global modules:false */

modules.define('path', ['i-bem__dom', 'events__channels', 'cookie', 'config', 'jquery', 'functions__debounce', 'path-normalizer', 'state'], 
    function(provide, BEMDOM, channels, cookie, config, $, debounce, normalizer, state) {
        var com = channels('116'),
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
        'position' : {
            'left' : function() {
                this.serveAsPathfinder('left');

            },
            'right' : function() {
                this.serveAsPathfinder('right');
            }
        }        
    },

    /**
     * Sets the input value
     * @param {String} value – Value to set
     */    
    setVal : function(value) {
        this._control.domElem.val(value);
        this._lastVal = value;
        this._input.setMod('focused');
    },

    getVal: function() { return this._control.domElem.val() },

    serveAsPathfinder : function(position) {
        this.bindTo('input change', debounce(this._checkPath, 650, this));
        com.on('check-path', this._checkPath, this);

        this._position = position;
        this._getDefPath();
        this._ready4All();
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
                this.setVal(this._lastVal);
            }
            else {
                this._lastVal ? this.setVal(this._lastVal) : this.setVal('/');
            };
        };

        this._lastVal || (this._lastVal = this.getVal());
        this._checkPath(value, _requestSuccess);
    },

    /**
     * Sets path value in the input and cookie
     * @param {String | Object} e – Value to set or event object
     * @param [{String} data] – Value to set
     */   
    setAll : function(e, data) {
        data || (data = e);

        this.setVal(data);
        this._setCook(data);
        this._curPath = data;
    },

    _emitPath: function() {
        console.log('position is ' + this._position + '\npath is ' +  this._curPath);
        com.emit(this._position + '-path-is', this._curPath);
    },

    _ready4All: function() {
        com.on('tell-path-' + this._position, this._emitPath, this);
        com.on('set-path-' + this._position, this.setAll, this);
    },

    _getDefPath : function() {
        this._curPath = cookie.get('path-' + this._position);
        this._curPath || (this._curPath = config.client[this._position]);

        this._checkPath(this._curPath);
    },

   _checkPath: function(path, cb) {
        this._abortRequest();
        
        var _path = typeof path !== 'object' ? normalize(path) : normalize(this.getVal());

        this._xhr = $.ajax({
            type: 'GET',
            dataType: 'html',
            url: '/exist',
            data: { path: _path },
            cache: false,
            success: cb ? cb.bind(this) : this._onSuccess.bind(this)
        });
    },

    _abortRequest: function() {
        this._xhr && this._xhr.abort();
    },

    _onSuccess: function(result) {
        var _res = JSON.parse(result);
            
        if(_res.exist) {
            this.setAll(normalize(_res.path));
            com.emit('path-' + this._position, _res.path);
            com.emit('curPath', { position: this._position, path: _res.path});
        }
        else {
            this._curPath ? 
                this.setAll(this._curPath) :
                    this.setAll('/');
        };
    },

    _setCook : function(path) {
        this._position && cookie.set('path-' + this._position, path);
    }
}));
});
