// Esprima parser
var esprima = require('esprima');

// Traverse AST
var traverse = require('./lib/traverse.js');

// Splice for strings
// require('./lib/splice.js').install();
var splice = require('./lib/splice.js');

// Runtime: convert property to attribute form
function _p2a(p){return 'data-'+(p.replace(/([A-Z])/g,'-$1')).toLowerCase();};

// Runtime: convert attribute to property (camelcase) form
function _a2p(a){return a.replace(/^data\-([a-z0-9\-]+)/,'$1').replace(/\-([a-z0-9])/g,function(r,m){return m.toUpperCase()})};

// Runtime: get data attribute
var _get = function(e,p){p=_p2a(p);if(e&&e.getAttribute){return e.hasAttribute(p)?e.getAttribute(p):void 0}};

// Runtime: set data attribute
var _set = function(e,p,v){p=_p2a(p);if(e&&e.setAttribute){e.setAttribute(p,v);return v}};

// Transpiling constants
var TC_SET = '.set( ',
	TC_GET = '.get( ',
	TC_SEPARATOR = ', ',
	TC_CLOSE = ' )';


// Helper function for console.log marking
function mark(p) {
	++p;
	return (function(l,s) {
		while (--l>=0) s+=s; return s; }
	)(Math.log2(p-1)+1,' ').substring(0,p-1)+"^";
}

// Parses the passed JavaScript source, replacing occurences
// of .dataset property accesses (gets & sets) with Data
module.exports = function(src, addRuntime, runtimePrefix) {
	// Prepends runtime Data.* functions to the returned source output
	addRuntime = addRuntime === void 0 ? true : addRuntime;

	// Default runtime prefix is Data.(get|set)
	runtimePrefix = runtimePrefix || 'Data';

	//console.log(JSON.stringify(esprima.parse(src), null, 2));
	// Generate AST, with source ranges
	var astl = esprima.parse(src, { range: true });

	// Create output script
	var outScript = src,
		outOffset = 0
		valueOffset = 0,
		valueBoundary = 0,
		offsetBoundary = 0,
		ofs = [];

	traverse(astl, function(n, pn) {
		if (n.type === 'Identifier' && n.name === 'dataset') {
			//console.log('.dataset @ '+n.range[0]+'-'+n.range[1]+' ('+pn.length+')');
			//console.log(JSON.stringify(pn));
			//console.log('> ' + src.substring(pn[pn.length - 1].range[0], n.range[0]-1));

			var dataElement, dataProperty, dataValue,
				translateStart, translateEnd, translateOriginal, translateFrom, translateTo,
				currentStart, currentOffset, ofsLength, sIdx, eIdx;

			// The element/object the .dataset property is read from
			dataElement = src.substring(pn[pn.length - 1].range[0], n.range[0]-1);

			// Dataset attribute access type
			dataProperty = src.substring(pn[pn.length - 2].property.range[0],pn[pn.length - 2].property.range[1]);

			// Simple inline property access via dot operator, add quotes
			if ('name' in pn[pn.length - 2].property) {
				dataProperty = '"' + dataProperty + '"';
			}

			// Decide whether this a set or get expression
			if (pn[pn.length - 3].operator && pn[pn.length - 3].left === pn[pn.length - 2]) {
				// Assignment expression with dataset on the left - this is a setter
				dataValue = src.substring(pn[pn.length -3].right.range[0], pn[pn.length -3].right.range[1]);
			} else {
				// This is a getter
				dataValue = null;
			}

			// Translate (splice) boundaries
			translateStart = pn[pn.length - (dataValue ? 3 : 2)].range[0];
			translateEnd =   pn[pn.length - (dataValue ? 3 : 2)].range[1];

			// Out offset
			currentOffset = 0;
			//ofsLength = sIdx = ofs.length - 1;
			ofsLength = ofs.length - 1;

			// Translated dataElement
			dataElement = outScript.substring(calcOfs(pn[pn.length - 1].range[0]), calcOfs(n.range[0]-1));

			// Translated dataProperty
			dataProperty = outScript.substring(calcOfs(pn[pn.length - 2].property.range[0]), calcOfs(pn[pn.length - 2].property.range[1] -1) +1);
			if ('name' in pn[pn.length - 2].property) dataProperty = '"' + dataProperty + '"';

			// Translated dataValue
			if (dataValue) dataValue = outScript.substring(calcOfs(pn[pn.length -3].right.range[0]), calcOfs(pn[pn.length -3].right.range[1]));

			function calcOfs(i) {
				var l = ofsLength;
				while (l >= 0) {
					if (ofs[l] && ofs[l].s<=i) {
						//console.log(i, l, ofs[l], ofs[l].t - ofs[l].s);
						return i + ofs[l].t - ofs[l].s;
					}
					--l;
				}
				return i;
			}

			sIdx = ofs.length - 1;
			while (sIdx >= 0 && (!ofs[sIdx] || ofs[sIdx].s > translateStart)) --sIdx;
			if (ofs[sIdx]) {
				currentOffset = ofs[sIdx].t - ofs[sIdx].s;
			}
			//console.log('ofs:',sIdx,ofs[sIdx]);

			// Offset & contents: prefix
			translateTo = runtimePrefix	+ (dataValue ? TC_SET : TC_GET);
			currentStart = calcOfs(pn[pn.length - 1].range[0]);
			//console.log("start:",translateStart,"->",currentStart);
			ofs.push({
				s: pn[pn.length - 1].range[0],
				c: currentStart,
				t: currentStart + translateTo.length });

			// Offset & contents: element
			translateTo += dataElement + TC_SEPARATOR;
			ofs.push({
				s: pn[pn.length - 2].property.range[0],
				c: calcOfs(pn[pn.length - 2].property.range[0]),
				t: currentStart + translateTo.length });

			// Offset & contents: property
			translateTo += dataProperty;

			// Offset & contents: value
			if (dataValue) {
				translateTo += TC_SEPARATOR;
				ofs.push({
					s: pn[pn.length - 3].right.range[0],
					c: calcOfs(pn[pn.length - 3].right.range[0]),
					t: currentStart + translateTo.length });

				translateTo += dataValue;
			} else {
				ofs.push(null);
			}

			// Offset & contents: end of translated string
			translateTo += TC_CLOSE;
			ofs.push({
				s: translateEnd,
				c: calcOfs(translateEnd),
				t: currentStart + translateTo.length });

			// Translate contents (source)
			translateOriginal = src.substring(translateStart, translateEnd);
			if (ofs.length>0) {
				translateFrom = outScript.substring(ofs[ofs.length - 4].c, calcOfs(ofs[ofs.length - 1].s -1) +1);
			} else {
				translateFrom	= translateOriginal;
			}

			if (this&&this.debug) {
				console.log(translateOriginal,' ->\n',translateFrom,' ->\n',translateTo,'\n');
				console.log(src);
				console.log(ofs.slice(-4).reduce(function(str, current) {
					return str + (current ? mark(current.s).substring(str.length) : '');
				},''));
				console.log(outScript);
				console.log(ofs.slice(-4).reduce(function(str, current) {
					return str + (current ? mark(current.c||0).substring(str.length) : '');
				},'')+'\n');
			}

			// Execute replacement
			outScript = splice(outScript, ofs[ofs.length - 4].c, calcOfs(ofs[ofs.length - 1].s -1) +1, translateTo);

			if (this&&this.debug) {
				console.log(outScript);
				console.log(ofs.slice(-4).reduce(function(str, current) {
					return str + (current ? mark(current.t).substring(str.length) :'');
				},'')+'\n');
			}

			// Update offset
			outOffset += translateTo.length - (translateEnd - translateStart);
		}
	});

	// Add runtime
	if (addRuntime) {
		outScript = 'var '
			+ runtimePrefix
			+ '=(function(){'
			+ (_p2a.toString())
			+ ';'
			+ (_a2p.toString())
			+ ';return {'
			+ '"get":' + (_get.toString())
			+ ','
			+ '"set":' + (_set.toString())
			+ '}})();\n\n'
			+ outScript;
	}

	if (this&&this.debug) {
		// Display original script
		console.log('\nOriginal script:');
		src.split(/\n/).map(function(line, n) { console.log(++n +'  '+ line); });

		// Display script output
		console.log('\nTranspiled output:');
		outScript.split(/\n/).map(function(line, n) { console.log(++n +'  '+ line); });
	}

	// Transpiled script
	return outScript;
};

// Export runtime functions (for testing)
module.exports.p2a = _p2a;
module.exports.a2p = _a2p;
