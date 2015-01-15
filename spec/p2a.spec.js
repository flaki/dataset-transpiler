describe('Property - attribute conversion', function() {
	var p2a = require('../index.js').p2a;

	var script;

	it('simple camel-case: fooBar', function() {
		expect(
			p2a('fooBar')
		).toEqual(
			'data-foo-bar'
		);
	});

	it('more complicated: XYZ', function() {
		expect(
			p2a('XYZ', false)
		).toEqual(
			'data--x-y-z'
		);
	});

});
