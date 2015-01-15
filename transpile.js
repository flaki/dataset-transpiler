var esprima = require('esprima');

console.log(JSON.stringify(esprima.parse('element.dataset.prop = "val";'), null, 4));
