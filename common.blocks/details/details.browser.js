/* global modules:false */

modules.define('details', ['i-bem__dom', 'events__channels'],
	function(provide, BEMDOM, channels) {
		var com = channels('116');

provide(BEMDOM.decl(this.name, {
    onSetMod : {
        'js' : {
            'inited' : function() {

            }
        },
        'hovered' : {
            'true' : function() {
        		this.setMod(this.findElem('name'), 'hovered')
            },
            '' : function() {
        		this.delMod(this.findElem('name'), 'hovered')
            }
        }      
    }
}));

});

