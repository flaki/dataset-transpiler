// Executes visitor on the object and its children (recursively).
module.exports = function traverse(object, visitor, parent) {
	var key, child;
	var propertyTraversed = false;

	// Push parent nodes into a stack
	//if (!parent) console.log(JSON.stringify(object,null,4));
	if (!parent) parent=[];

	// Push current node into the parent stack
	parent.push(object);

	// Traverse property of MemberExpressions before the object
	if (object && object.type && object.type === "MemberExpression" && "property" in object
		&& typeof object.property === 'object' && object.property !== null) {
		traverse(object.property, visitor, parent);
		propertyTraversed = true;
	}

	// Traversal of subnodes
	for (key in object) {
		if (object.hasOwnProperty(key) && key !== 'range' && !(key === "property" && propertyTraversed)) {
			child = object[key];
			if (typeof child === 'object' && child !== null) {
				traverse(child, visitor, parent);
			}
		}
	}

	// Remove current node from parent stack
	parent.pop();

	// Visit current node
	visitor.call(null, object, parent);
	//console.log(parent.length,object&&object.type?object.type:'?');
}
