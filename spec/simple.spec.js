describe('Transpiling simple dataset references', function() {
	var transpile = require('../index.js');

	var script;

	it('works for simple get-s', function() {
		expect(
			transpile('value = e.dataset.prop', false)
		).toEqual(
			'value = Data.get( e, "prop" )'
		);
	});

	it('works for simple set-s', function() {
		expect(
			transpile('e.dataset.prop = "value"', false)
		).toEqual(
			'Data.set( e, "prop", "value" )'
		);
	});

});
