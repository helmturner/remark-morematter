import { visit } from "unist-util-visit";

import type { Plugin, Transformer } from "unified";
import type { Root } from "mdast";

export class MultiError extends Error {
  errors: Error[];
  constructor(errors: Error[]) {
    super(`Multiple Errors Occured:`);
    this.name = "MultiError";
    this.errors = errors;
  }
}

export type Options = {
  /**
   * Whether to throw an error if validation fails. Has no effect if `errorCollector` is empty after validation
   * @false appends errors to the `messages` property of the VFile
   * @true throws an instance of `MultiError`
   * @default true
   */
  failOnError?: boolean;
  /**
   * A map of node types to their handlers. If not provided, the plugin does nothing.
   */
  handlers?: { [key: string]: Handler };
};

export type Handler = {
  parser: (argument0: string) => unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validator?: (...arguments_: any[]) => any;
  name?: string;
};

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
const remarkMorematter: Plugin<[Options|null], Root, Root> = function (
  settings
) {
  const { failOnError = true, handlers = {} } = settings ?? {};
  if (handlers["root"])
    throw new Error("remark-morematter: handlers for 'root' are not supported");

  const transformer: Transformer<Root, Root> = function (tree, file) {
    const errors: Error[] = [];
    for (const key in handlers) {
      const { parser, validator, name = key } = handlers[key];
      const results: unknown[] = [];

      visit(tree, key, (node, index, parent) => {
        throwOnInvalidNodeType(node.type);
        //@ts-expect-error: We've already excluded invalid node types
        const value = parser(node.value);
        node.type;
        try {
          validator && validator(value);
        } catch (error) {
          failOnError
            ? errors.push(error as Error)
            : file.message(error as Error);
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

function throwOnInvalidNodeType(type: string) {
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
    throw new Error(
      `remark-morematter: handling ${type} node types is not supported`
    );
  }
}

export default remarkMorematter;
