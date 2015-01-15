// Esprima parser
var esprima = require('esprima');

// Traverse AST
var traverse = require('./lib/traverse.js');

// Splice for strings
// require('./lib/splice.js').install();
var splice = require('./lib/splice.js');


// Parses the passed JavaScript source, replacing occurences
// of .dataset property accesses (gets & sets) with Data
module.exports = function(script, addRuntime, runtimePrefix) {
	// Prepends runtime Data.* functions to the returned source output
	addRuntime = addRuntime === void 0 ? true : addRuntime;

	// Default runtime prefix is Data.(get|set)
	runtimePrefix = runtimePrefix || 'Data';

	//console.log(JSON.stringify(esprima.parse(script), null, 2));
	// Generate AST, with source ranges
	var astl = esprima.parse(script, { range: true });

	// Create output script
	var outScript = script,
		outOffset = 0;

	traverse(astl, function(n, pn) {
		if (n.type === 'Identifier' && n.name === 'dataset') {
			//console.log('.dataset @ '+n.range[0]+'-'+n.range[1]+' ('+pn.length+')');
			//console.log(JSON.stringify(pn));
			//console.log('> ' + script.substring(pn[pn.length - 1].range[0], n.range[0]-1));

			var dataElement, dataProperty, dataValue,
				translateStart, translateEnd, translateFrom, translateTo;

			// The element/object the .dataset property is read from
			dataElement = script.substring(pn[pn.length - 1].range[0], n.range[0]-1);

			// Simple inline property access via dot operator
			if ('name' in pn[pn.length - 2].property) {
				dataProperty = '"' + pn[pn.length - 2].property.name + '"';

			// Property access via array attribute accessor (literal/expression)
			} else {
				dataProperty = script.substring(pn[pn.length - 2].property.range[0],pn[pn.length - 2].property.range[1]);
			}

			if (pn[pn.length - 3].type ="AssignmentExpression" && 'operator' in pn[pn.length - 3]) {
				//console.log(pn[pn.length - 3]);
				dataValue = script.substring(pn[pn.length -3].right.range[0],pn[pn.length -3].right.range[1]);
			} else {
				dataValue = null;
			}

			// Translate (splice) boundaries
			translateStart = pn[pn.length - (dataValue ? 3 : 2)].range[0];
			translateEnd =   pn[pn.length - (dataValue ? 3 : 2)].range[1];

			translateFrom = script.substring(translateStart, translateEnd);
			translateTo = 'Data.'
				+ (dataValue ? 'set' : 'get')
				+ '( ' + dataElement + ', ' + dataProperty + (dataValue ? ', ' + dataValue : '') + ' )';

			//console.log(translateFrom + ' ->' +translateTo);
			//console.log(pn.reduce(function(p,c) { return p +'> '+ (c.type||'?') +' '; }, '|'));
			//console.log(JSON.stringify(pn[pn.length - 2],null,4));

			// Splice output
			outScript = splice(outScript, translateStart + outOffset, translateEnd + outOffset, translateTo);

			// Update offset
			outOffset += translateTo.length - (translateEnd - translateStart);
		}
	});

	// Add runtime
	if (addRuntime) outScript = 'var Data=(function(){function _p2a(p){return a};function _a2p(a){return p};return {"get":function(e,p){},"set":function(e,p,v){}}})();\n\n' + outScript;

	// Display original script
	console.log('\nOriginal script:');
	script.split(/\n/).map(function(line, n) { console.log(++n +'  '+ line); });

	// Display script output
	console.log('\nTranspiled output:');
	outScript.split(/\n/).map(function(line, n) { console.log(++n +'  '+ line); });

	// Transpiled script
	return outScript;
}



module.exports(`
el.dataset.prop = "val";
var propvar = el.dataset.prop;
document.querySelector('body').dataset.prop = "val";
document.body['firstChild'].children[2].lastChild.dataset.prop ="n";
elem.dataset['somethingWeird'];
document.querySelector('body').dataset['even'+2+'Weirder'] = "val";
elem.dataset.prop = "complicated" + (function(){ return 'functioncall';})() + 3*(xpre)+5510+n;
`);
