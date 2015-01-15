// Executes visitor on the object and its children (recursively).
module.exports = function traverse(object, visitor, parent) {
	var key, child;

	// Push parent nodes into a stack
	if (!parent) parent=[];

	// Visit current node
	visitor.call(null, object, parent);

	// Push current node into the parent stack
	parent.push(object);

	// Traverse subnodes
	for (key in object) {
		if (object.hasOwnProperty(key)) {
			child = object[key];
			if (typeof child === 'object' && child !== null) {
				traverse(child, visitor, parent);
			}
		}
	}

	// Remove current node from parent stack
	parent.pop();
}
