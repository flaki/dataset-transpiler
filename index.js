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

			// Dataset attribute access type
			if ('name' in pn[pn.length - 2].property) {
				// Simple inline property access via dot operator
				dataProperty = '"' + pn[pn.length - 2].property.name + '"';
			} else {
				// Property access via array attribute accessor (literal/expression)
				dataProperty = script.substring(pn[pn.length - 2].property.range[0],pn[pn.length - 2].property.range[1]);
			}

			// Decide whether this a set or get expression
			if (pn[pn.length - 3].operator && pn[pn.length - 3].left === pn[pn.length - 2]) {
				// Assignment expression with dataset on the left - this is a setter
				dataValue = script.substring(pn[pn.length -3].right.range[0],pn[pn.length -3].right.range[1]);
			} else {
				// This is a getter
				dataValue = null;
			}

			// Translate (splice) boundaries
			translateStart = pn[pn.length - (dataValue ? 3 : 2)].range[0];
			translateEnd =   pn[pn.length - (dataValue ? 3 : 2)].range[1];

			translateFrom = script.substring(translateStart, translateEnd);
			translateTo = 'Data.'
				+ (dataValue ? 'set' : 'get')
				+ '( ' + dataElement + ', ' + dataProperty + (dataValue ? ', ' + dataValue : '') + ' )';

			if (this&&this.debug) {
				console.log(translateFrom + ' -> ' +translateTo);
				console.log(pn.reduce(function(p,c) { return p +'> '+ (c.type||'?') +' '; }, '|'));
				console.log(JSON.stringify(pn[pn.length - 3], null, 4));
			}

			// Splice output
			outScript = splice(outScript, translateStart + outOffset, translateEnd + outOffset, translateTo);

			// Update offset
			outOffset += translateTo.length - (translateEnd - translateStart);
		}
	});

	// Add runtime
	if (addRuntime) outScript = 'var Data=(function(){function _p2a(p){return a};function _a2p(a){return p};return {"get":function(e,p){},"set":function(e,p,v){}}})();\n\n' + outScript;

	if (this&&this.debug) {
		// Display original script
		console.log('\nOriginal script:');
		script.split(/\n/).map(function(line, n) { console.log(++n +'  '+ line); });

		// Display script output
		console.log('\nTranspiled output:');
		outScript.split(/\n/).map(function(line, n) { console.log(++n +'  '+ line); });
	}

	// Transpiled script
	return outScript;
};
