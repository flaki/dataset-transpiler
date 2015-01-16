describe('Transpiling with custom parameters', function() {
	var transpile = require('../index.js');

	var script;

	it('custom prefix works for simple get-s', function() {
		expect(
			transpile('value = e.dataset.prop', false, '$DATASET')
		).toEqual(
			'value = $DATASET.get( e, "prop" )'
		);
	});

	it('custom prefix works for simple set-s', function() {
		expect(
			transpile('e.dataset.prop = "value"', false, '$DATASET')
		).toEqual(
			'$DATASET.set( e, "prop", "value" )'
		);
	});

});
