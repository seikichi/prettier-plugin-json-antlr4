import {
  AST,
  Doc,
  FastPath,
  Parser,
  ParserOptions,
  Printer,
  SupportLanguage,
  doc,
} from "prettier";
import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";

import { JSONLexer } from "./antlr4/JSONLexer";
import {
  JSONParser,
  JsonContext,
  ObjContext,
  PairContext,
  ValueContext,
} from "./antlr4/JSONParser";

const { builders: { concat, join } } = doc;

type Context = JsonContext | ObjContext | PairContext | ValueContext;

function parse(text: string, parsers: { [parserName: string]: Parser }, options: ParserOptions): AST {
  // console.log(`parse: ${text}`);
  const stream = new ANTLRInputStream(text);
  const lexer = new JSONLexer(stream);
  const tokens = new CommonTokenStream(lexer);
  const parser = new JSONParser(tokens);
  const tree = parser.json();
  return tree;
}

function printMyJSON(path: FastPath<Context>, _options: ParserOptions, print: (path: FastPath<Context>) => Doc): Doc {
  const node: Context = path.getValue();

  if (node instanceof JsonContext) {
    return path.call(print, "children", 0);
  } else if (node instanceof ObjContext) {
    const results: Doc[] = [];
    (node.children || []).map((child, index) => {
      if (child instanceof PairContext) {
        results.push(path.call(print, "children", index));
      }
    });
    return concat(["{", join(",", results), "}"]);
  } else if (node instanceof PairContext) {
    if (node.children) {
      const key = node.children[0];
      return concat([key.text, ":", path.call(print, "children", 2)]);
    }
  } else if (node instanceof ValueContext) {
    if (node.obj()) {
      return path.call(print, "children", 0);
    }
    return node.text;
  }

  return "";
}

export const languages: SupportLanguage[] = [
  {
    extensions: [".myjson"],
    name: "MYJSON",
    parsers: ["myjson-parse"],
  } as SupportLanguage,
];

export const parsers: { [parserName: string]: Parser } = {
  "myjson-parse": {
    parse,
    astFormat: "myjson-ast",
    locStart: _node => 0,
    locEnd: _node => 0,
  }
};

export const printers: { [astFormat: string]: Printer } = {
  "myjson-ast": {
    print: printMyJSON
  }
};
