import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
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

export type Handler<Output = unknown> = {
  parser: (frontmatter: string) => unknown;
  name?: string;
  /**
 * Optional validation function that receives the parsed frontmatter value.
 *
 * If the validator returns a nullish value or throws an error, validation fails for that node.
 * Otherwise, the validator's return value is used as the parsed frontmatter value.
 * @param parsedValue The parsed frontmatter value before validation
 * @param args Additional arguments passed to the validator
 * @returns The validated (and optionally, transformed) frontmatter value
 */
  validator?: (
    parsedValue: unknown,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, unicorn/prevent-abbreviations
    ...args: any[]
  ) => Output | undefined | null | never;
};


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
const remarkMorematter: Plugin<[Options | null], Root, Root> = function (
  settings
) {
  const { failOnError = true, handlers = {} } = settings ?? {};
  return function (tree, file) {
    const errors: Error[] = [];
    for (const key in handlers) {
      const { parser, validator, name = key } = handlers[key];
      const results: unknown[] = [];
      visit(tree, key, (node, index, parent) => {
        if (!("value" in node))
          throw new Error(
            `remark-morematter: Node of type '${key}' has no 'value' property to parse.`
          );
        if (!parent)
          throw new Error(
            `remark-morematter: Missing parent for node at index ${index}. '${key}' must be a leaf node.`
          );
        if (index === null || index === undefined)
          throw new Error(
            `remark-morematter: Exected node of type '${key}' to have an index, got '${index}'.`
          );

        let result;
        const value = parser(node.value);
        try {
          if (typeof validator === "function") {
            result = validator(value);
            if (result === undefined || result === null) {
              throw new Error(`Validation failed for ${key} at index ${index}`);
            }
          }
          result ??= value;
          results.push(result);
          parent.children.splice(index, 1);
          return ++index;
        } catch (error) {
          failOnError
            ? errors.push(error as Error)
            : file.message(error as Error);
        }
      });
      file.data[name] = results;
    }
  };
};

export default remarkMorematter;
