describe('Attribute - property conversion', function() {
	var a2p = require('../index.js').a2p;

	var script;

	it('simple camel-case: data-foo-bar', function() {
		expect(
			a2p('data-foo-bar')
		).toEqual(
			'fooBar'
		);
	});

	it('more complicated: data--x-y-z', function() {
		expect(
			a2p('data--x-y-z', false)
		).toEqual(
			'XYZ'
		);
	});

});
