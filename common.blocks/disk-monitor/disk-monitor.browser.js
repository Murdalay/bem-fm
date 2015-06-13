/* global modules:false */

modules.define('disk-monitor', ['i-bem__dom', 'events__channels', 'state'], 
    function(provide, BEMDOM, channels, state) {
        var com = channels('116'),
            conf = state.getClientConfig;

provide(BEMDOM.decl(this.name, {
    onSetMod : {
        'js' : {
            'inited' : function() {
            	this._position = this.getMod('position');
            	console.log(this._position);
                com.on(this._position +'-drive-changed', this._update, this);
            }
        }      
    },

    /**
     * Sets the input value
     * @param {String} value – Value to set
     */    

    _update : function() {
    	var disk = state.getDisks()[state.getActiveDriveIndex(this._position)];
    	console.log(disk);
    	this.elem('free').html(disk.available);
    	this.elem('total').html(disk.total);
    	this.elem('mount-point').html(disk.mountpoint);
    	console.log(this.elem('free'));
    }
}));

});
