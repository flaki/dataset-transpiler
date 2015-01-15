var esprima = require('esprima');

var script = `
el.dataset.prop = "val";
var propvar = el.dataset.prop;
document.querySelector('body').dataset.prop = "val";
document.body['firstChild'].children[2].lastChild.dataset.prop ="n";
elem.dataset['somethingWeird'];
document.querySelector('body').dataset['even'+2+'Weirder'] = "val";
`;


// Executes visitor on the object and its children (recursively).
function traverse(object, visitor, parent) {
	var key, child;

	if (!parent) parent=[];

	visitor.call(null, object, parent);

	parent.push(object);

	for (key in object) {
		if (object.hasOwnProperty(key)) {
			child = object[key];
			if (typeof child === 'object' && child !== null) {
				traverse(child, visitor, parent);
			}
		}
	}

	parent.pop();
}

var ast = esprima.parse(script),
	astl = esprima.parse(script, { range: true });

console.log(JSON.stringify(ast, null, 2));

script.split(/\n/).map(function(line, n) { console.log(++n +'  '+ line); });

traverse(astl, function(n, pn) {
	if (n.type === 'Identifier' && n.name === 'dataset') {
		console.log('.dataset @ '+n.range[0]+'-'+n.range[1]+' ('+pn.length+')');
		//console.log(JSON.stringify(pn));
		//console.log('> ' + script.substring(pn[pn.length - 1].range[0], n.range[0]-1));

		var dataElement, dataProperty, dataValue;

		dataElement = script.substring(pn[pn.length - 1].range[0], n.range[0]-1);
		//console.log(pn[pn.length - 2].property);
		if ('value' in pn[pn.length - 2].property) {
			dataProperty = '"' + pn[pn.length - 2].property.value + '"';
		} else {
			dataProperty = script.substring(pn[pn.length - 2].property.range[0],pn[pn.length - 2].property.range[1]);
		}

		console.log(script.substring(pn[pn.length - 2].range[0], pn[pn.length - 2].range[1]) + ' ->');
		console.log('Data.get( ' + dataElement + ', ' + dataProperty + ' )');
		console.log(pn.reduce(function(p,c) { return p +'> '+ (c.type||'?') +' '; }, '|'));
		//console.log(JSON.stringify(pn[pn.length - 2],null,4));
	}
});
