// pegjs.d.ts
declare module "pegjs" {
	export interface PEGParser {
		parse(input: string, options?: {
			startRule: string,
			tracer: any,
		}): any;
		nodes: any;
	}

	export function buildParser(grammar: string, options?: {
		cache: boolean,
		allowedStartRules: string[],
		output: string /* "source" | "parser" */,
		optimize: string /* "speed" | "size" */,
		plugins: any[]
	}): PEGParser;
}

// parser.d.ts - This describes the parser you generated with `pegjs grammar.pegjs parser.js`
declare module "parser" {
	import pegjs = require("pegjs");
	var t: pegjs.PEGParser;
	export = t;
}
