module.exports = (function() {
	// Splice method
	function _splice(from, to, replace) {
		return this.substring(0,from)+replace+this.substring(to);
	}

	// Splice function
	function splice(source, from, to, replace) {
		return _splice.call(source, from, to, replace);
	}

	// Install into String.prototype
	splice.install = function() {
		String.prototype.splice = _splice;
	}


	// Use as require('splice.js')(source, from, to, replace)
	// or install into string proto via require('splice.js').install()
	// and use as source.splice(from, to, replace)
	return splice;
})();
