"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiError = void 0;
const unist_util_visit_1 = require("unist-util-visit");
class MultiError extends Error {
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
exports.MultiError = MultiError;
/**
 * Parses, stores, and optionally validates the contents of frontmatter blocks pasred by remark-frontmatter.
 *
 * For every key in settings.handlers, the following steps are performed:
 *  - Searches for nodes of type `[key]` and calls `handlers[key].parser` on the node's value.
 *  - Calls `handlers[key].validator` (if defined) on the parser's return value.
 *  - Appends the parser's return value to an array on the Vfile's `data` property as follows:
 *    * if a name is given for the handler, the array is stored udnder `data[name]`
 *    * if no name is given, the array is stored under `data[key]`
 *  - Removes the node from the tree.
 * If `throwOnError` is true, and validation errors occur, an instance of MultiError is thrown.
 * Otherwise, errors are stored as messages on the VFile.
 * @param settings The settings object passed to the remark-validate plugin
 */
const remarkMorematter = function (settings = {}) {
    const { failOnError = true, handlers = {} } = settings;
    if (handlers["root"])
        throw new Error("remark-morematter: handlers for 'root' are not supported");
    const transformer = function (tree, file) {
        const errors = [];
        for (const key in handlers) {
            const { parser, validator, name = key } = handlers[key];
            const results = [];
            (0, unist_util_visit_1.visit)(tree, key, (node, index, parent) => {
                throwOnInvalidNodeType(node.type);
                //@ts-expect-error: We've already excluded invalid node types
                const value = parser(node.value);
                node.type;
                try {
                    validator && validator(value);
                }
                catch (error) {
                    failOnError
                        ? errors.push(error)
                        : file.message(error);
                }
                results.push(value);
                // Remove this node from the tree
                parent && index && parent.children.splice(index, 1);
                // Since we removed a node, continue visiting at the same index to avoid skipping nodes
                return index;
            });
            file.data[name] = results;
        }
    };
    return transformer;
};
function throwOnInvalidNodeType(type) {
    const invalidNodeTypes = [
        "root",
        "paragraph",
        "heading",
        "list",
        "listItem",
        "thematicBreak",
        "blockquote",
        "table",
        "definition",
        "footnoteDefinition",
        "tableRow",
        "tableCell",
        "link",
        "linkReference",
        "emphasis",
        "strong",
        "delete",
        "inlineCode",
        "break",
        "image",
        "imageReference",
        "footnote",
        "footnoteReference",
    ];
    if (invalidNodeTypes.includes(type)) {
        throw new Error(`remark-morematter: handling ${type} node types is not supported`);
    }
}
exports.default = remarkMorematter;
