/**
 * @module size
 * @description A function to convert file size from bytes representation to human readable format
 */

modules.define('size', function(provide) {
    /**
     * Converting a bytes value to a human readable representation
     * @param {Number} size
     * @returns {String}
     */

	var humanReadable = function(size){
		var formated,
			maybeRound = function(){
				if (formated == Math.round(formated)) {
					formated = Math.round(formated);
				}
			};

		if(size >= 1073741824){
			formated = (size / 1073741824).toFixed(2);
			maybeRound();
			formated = formated + ' Gb'
		}
		else if (size >= 1048576){
			formated = (size / 1048576).toFixed(1);
			maybeRound();
			formated = formated + ' Mb'
		}
		else if (size >= 1024){
			formated = (size / 1024).toFixed(1);
			maybeRound();
			formated = formated + ' Kb'
		}
		else {
			formated = size;
		}

		return formated
	}

provide(humanReadable);
});
