import {
  AST,
  Doc,
  FastPath,
  Parser,
  ParserOptions,
  Plugin,
  Printer,
  SupportLanguage,
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

function printMyJSON(path: FastPath<Context>): Doc {
  const node: Context = path.getValue();
  console.log(node.ruleIndex);
  if (node instanceof JsonContext) {
    return path.call(printMyJSON, "children", 0);
  } else if (node instanceof ObjContext) {
    console.log(node.children);
  } else if (node instanceof PairContext) {
  } else if (node instanceof ValueContext) {
    if (node.obj()) {
      return path.call(printMyJSON, "children", 0);
    }
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
