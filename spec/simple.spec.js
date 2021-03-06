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

	it('array property accessor', function() {
		expect(
			transpile('value = e.dataset["prop"]', false)
		).toEqual(
			'value = Data.get( e, "prop" )'
		);
	});

	it('works for combined set/get-s', function() {
		expect(
			transpile('e1.dataset["to"] = e2.dataset.from', false)
		).toEqual(
			'Data.set( e1, "to", Data.get( e2, "from" ) )'
		);
	});

	// TODO: needs work, fails currently
	xit('get-ception', function() {
		expect(
			transpile('outer.dataset[ inner.dataset.prop ]', false)
		).toEqual(
			'Data.get( outer, Data.get( inner, "prop" ) )'
		);
	});

	xit('setters combined with get-ception', function() {
		expect(transpile(
			'outer.dataset[ inner.dataset.prop ] = element.dataset.myValue'
		, false)).toEqual(
			'Data.set( outer, Data.get( inner, "prop" ), Data.get( element, "myValue" ) )'
		);
	});

	xit('ultimate dataset-ception', function() {
		expect(transpile(
			'document.querySelector(e.dataset.selector).dataset[ inner.dataset["prop"] ] = element.dataset.myValue'
		, false)).toEqual(
			'Data.set( document.querySelector(e.dataset.selector), Data.get( inner, "prop" ), Data.get( element, "myValue" ) )'
		);
	});

	it('combined get/set', function() {
		expect(transpile(
			'document.querySelector("#first").dataset.property = second.dataset.myValue;'
		, false)).toEqual(
			'Data.set( document.querySelector("#first"), "property", Data.get( second, "myValue" ) );'
		);
	});

	// TODO: this currently fails for some reason, the first combined setter
	// seem to screw up the internal offsets somehow
	xit('a second set call, following a combined get/set', function() {
		expect(transpile(
			'document.querySelector("#first").dataset.property = second.dataset.myValue; document.querySelector(".next").dataset.nextproperty = "value";'
		, false)).toEqual(
			'Data.set( document.querySelector("#first"), "property", Data.get( second, "myValue" ) ); Data.set( document.querySelector(".next"), "nextproperty", "value");'
		);
	});

});
