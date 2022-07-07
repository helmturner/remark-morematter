import type { Plugin } from "unified";
import type { Root } from "mdast";
export declare class MultiError extends Error {
    errors: Error[];
    constructor(errors: Error[]);
}
export declare type Options = {
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
    handlers?: {
        [key: string]: Handler;
    };
};
export declare type Handler = {
    parser: (argument0: string) => unknown;
    validator?: (...arguments_: unknown[]) => unknown;
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
declare const remarkMorematter: Plugin<[Options], Root, Root>;
export default remarkMorematter;
//# sourceMappingURL=index.d.ts.map