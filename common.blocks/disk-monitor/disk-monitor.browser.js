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
                com.on(this._position +'-drive-changed' + ' disks-changed', this._update, this);
            }
        }      
    }, 

    _update : function() {
    	var disk = state.getDisks()[state.getActiveDriveIndex(this._position)];
    	this.elem('free').html(disk.available);
    	this.elem('total').html(disk.total);
    	this.elem('mount-point').html(disk.mountpoint);
    }
}));

});
