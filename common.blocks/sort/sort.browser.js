/* global modules:false */

modules.define('sort', function(provide) {

/**
 * An reimplementation of Merge sort algorithm.
 * Based on Paul Lewis gist https://gist.github.com/paullewis/1982121
 * With performance improved by 30-50%
 *
 * Meanwhile, it's nearly 10 time slowly than Array.prototype.sort()
 * for the element values in range from 0 to 100.
 *
 * Compare tests was performed with different array size from 100 to 5000 elements
 *
 * @author Murdalay
 */
function mergesort(inArray) {
	var presorted;
 
  /**
   * Sorts the array by breaking it down
   * into smaller chunks.
   *
   * @param {Array} array The array to sort
   */
	function sort(array) {
		var length = array.length,
		    mid    = Math.floor(length * 0.5),
		    left   = array.slice(0, mid),
		    right  = array.slice(mid, length);

		if(length === 1) {
			return array;
		}

		return merge(sort(left), sort(right));
	}

	/**
	* Merges two sublists back together.
	* Sort performed in reverse order because shift() in JS is to slow.
	*
	* @param {Array} left The left hand sublist
	* @param {Array} right The right hand sublist
	*/
	function merge(left, right) {
		var result = [];

			while(left.length || right.length) {

				if(left.length && right.length) {

				if(left[left.length-1] < right[right.length-1]) {
				    result.push(left.pop());
				} else {
				    result.push(right.pop());
				}

				} else if (left.length) {
					result.push(left.pop());
				} else {
					result.push(right.pop());
				}
			}

		return result.reverse();
	}
 
	presorted = sort(inArray);
}

/**
* Sorts the array by breaking it down
* into smaller chunks.
*
* @param {Array} inArray The array of objects to sort
* @param {String} ket The field for the compare
* @param {Boolean} [reverse] If sets to true reversed array will be returned. (false by default)
*/
function sortByKey(inArray, key, reverse) {
	var presorted;

	function sort(array) {

		var length = array.length,
		    mid    = Math.floor(length * 0.5),
		    left   = array.slice(0, mid),
		    right  = array.slice(mid, length);

		if(length === 1) {
			return array;
		}

		return merge(sort(left), sort(right));
	}

	/**
	* Merges two sublists back together.
	* Sort performed in reverse order because shift() in JS is to slow.
	*
	* @param {Array} left The left hand sublist
	* @param {Array} right The right hand sublist
	*/
	function merge(left, right) {
		var result = [];

			while(left.length || right.length) {

				if(left.length && right.length) {

				if(left[left.length-1][key] < right[right.length-1][key]) {
				    result.push(left.pop());
				} else {
				    result.push(right.pop());
				}

				} else if (left.length) {
					result.push(left.pop());
				} else {
					result.push(right.pop());
				}
			}

		return result.reverse();
	}
 
	presorted = sort(inArray);

	if(presorted[0].key == presorted[presorted.length - 1].key){
		presorted = presorted.reverse();
	}

	reverse && (presorted = presorted.reverse());
	return presorted;

};

provide({ mergesort: mergesort, sortByKey: sortByKey });

});

