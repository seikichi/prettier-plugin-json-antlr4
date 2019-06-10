import {
  AST,
  Doc,
  FastPath,
  Parser,
  ParserOptions,
  Printer,
  SupportLanguage,
  doc
} from "prettier";
import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import { TerminalNode } from "antlr4ts/tree/TerminalNode";

import { JSONLexer } from "./antlr4/JSONLexer";
import {
  JSONParser,
  JsonContext,
  ArrayContext,
  ObjContext,
  PairContext,
  ValueContext
} from "./antlr4/JSONParser";

const {
  builders: { concat, group, indent, join, line, softline, hardline }
} = doc;

type Context =
  | JsonContext
  | ObjContext
  | ArrayContext
  | PairContext
  | ValueContext;

function parse(
  text: string,
  _parsers: { [parserName: string]: Parser },
  _options: ParserOptions
): AST {
  const stream = new ANTLRInputStream(text);
  const lexer = new JSONLexer(stream);
  const tokens = new CommonTokenStream(lexer);
  const parser = new JSONParser(tokens);
  return parser.json();
}

function printMyJSON(
  path: FastPath<Context>,
  _options: ParserOptions,
  print: (path: FastPath<Context>) => Doc
): Doc {
  const node: Context = path.getValue();

  if (node instanceof JsonContext) {
    return concat([path.call(print, "children", 0), hardline]);
  }

  if (node instanceof PairContext && node.children) {
    const key = node.children[0];
    return concat([key.text, ": ", path.call(print, "children", 2)]);
  }

  if (node instanceof ValueContext) {
    if (node.obj() || node.array()) {
      return path.call(print, "children", 0);
    }
    return node.text;
  }

  if (node instanceof ObjContext && node.children) {
    const docs: Doc[] = [];
    node.children.forEach((child, index) => {
      if (child instanceof PairContext) {
        docs.push(path.call(print, "children", index));
      }
    });
    return docs.length === 0
      ? "{}"
      : concat([
          "{",
          indent(concat([hardline, join(concat([",", hardline]), docs)])),
          hardline,
          "}"
        ]);
  }

  if (node instanceof ArrayContext && node.children) {
    const docs: Doc[] = [];
    node.children.forEach((child, index) => {
      if (!(child instanceof TerminalNode)) {
        docs.push(path.call(print, "children", index));
      }
    });
    return docs.length === 0
      ? "[]"
      : concat([
          "[",
          indent(concat([hardline, join(concat([",", hardline]), docs)])),
          hardline,
          "]"
        ]);
  }

  return "";
}

export const languages: SupportLanguage[] = [
  {
    extensions: [".myjson"],
    name: "MYJSON",
    parsers: ["myjson-parse"]
  } as SupportLanguage
];

export const parsers: { [parserName: string]: Parser } = {
  "myjson-parse": {
    parse,
    astFormat: "myjson-ast",
    locStart: _node => 0,
    locEnd: _node => 0
  }
};

export const printers: { [astFormat: string]: Printer } = {
  "myjson-ast": {
    print: printMyJSON
  }
};
