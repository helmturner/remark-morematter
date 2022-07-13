import { visit } from "unist-util-visit";
export class MultiError extends Error {
    constructor(errors) {
        super(`Multiple Errors Occured:`);
        Object.defineProperty(this, "errors", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.name = "MultiError";
        this.errors = errors;
    }
}
/**
 * Parses, stores, and optionally validates the contents of frontmatter blocks pasred by remark-frontmatter.
 *
 * For every key in settings.handlers, the following steps are performed:
 *  - Searches for nodes of type `[key]` and calls `handlers[key].parser` on the node's value.
 *  - If a Validator is supplied for that key and validation succeeds,
 *    parsedValue is set to the value returned by the Validator
 *  - Appends the parser's return value to an array on the Vfile's `data` property as follows:
 *    * if a name is given for the handler, the array is stored udnder `data[name]`
 *    * if no name is given, the array is stored under `data[key]`
 *  - Removes the node from the tree.
 * If `throwOnError` is true, and validation errors occur, an instance of MultiError is thrown.
 * Otherwise, errors are stored as messages on the VFile.
 * @param settings The settings object passed to the remark-validate plugin
 */
const remarkMorematter = function (settings) {
    const { failOnError = true, handlers = {} } = settings !== null && settings !== void 0 ? settings : {};
    return function (tree, file) {
        const errors = [];
        for (const key in handlers) {
            const { parser, validator, name = key } = handlers[key];
            const results = [];
            visit(tree, key, (node, index, parent) => {
                if (!("value" in node))
                    throw new Error(`remark-morematter: Node of type '${key}' has no 'value' property to parse.`);
                if (!parent)
                    throw new Error(`remark-morematter: Missing parent for node at index ${index}. '${key}' must be a leaf node.`);
                if (index === null || index === undefined)
                    throw new Error(`remark-morematter: Exected node of type '${key}' to have an index, got '${index}'.`);
                let result;
                const value = parser(node.value);
                try {
                    if (typeof validator === "function") {
                        result = validator(value);
                        if (result === undefined || result === null) {
                            throw new Error(`Validation failed for ${key} at index ${index}`);
                        }
                    }
                    result !== null && result !== void 0 ? result : (result = value);
                    results.push(result);
                    parent.children.splice(index, 1);
                    return ++index;
                }
                catch (error) {
                    failOnError
                        ? errors.push(error)
                        : file.message(error);
                }
            });
            file.data[name] = results;
        }
        if (errors.length > 0) {
            throw new MultiError(errors);
        }
    };
};
export default remarkMorematter;
