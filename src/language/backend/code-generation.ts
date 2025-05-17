/**
 * The goal: Translating the AST to native code, i.e. JavaScript
 * to then be executed with eval or similar.
 * It should still be steppable and support highlighting.
 */

import { mod } from "../../utils";
import { AbruptStmtKind, Program, Stmt, StmtKind } from "../frontend/ast";
import { TokenType } from "../frontend/lexer";

export class CodeGenerator {
  instructions: string[] = [];

  reset() {
    this.instructions = [];
  }

  add_instruction(instr: string) {
    this.instructions.push(
      `${instr}`
    )
  }

  push(val: string) {
    this.add_instruction(`__s.push(${val})`);
  }

  compile<A extends AbruptStmtKind>(stmt: Program | Stmt<A>) {
    switch (stmt.kind) {
      case StmtKind.NumericLiteral:
      case StmtKind.FloatLiteral:
      case StmtKind.NullLiteral:
      case StmtKind.BooleanLiteral:
      case StmtKind.StringLiteral:
        this.push(stmt.value.toString())
        break;
      case StmtKind.ListLiteral:
        break;
      case StmtKind.Program:
        this.compile_program(stmt);
        break;
      case StmtKind.VarDeclaration:
      case StmtKind.EmptyLine:
      case StmtKind.DocComment:
      case StmtKind.IfElseBlock:
      case StmtKind.SwitchBlock:
      case StmtKind.ForBlock:
      case StmtKind.WhileBlock:
      case StmtKind.AlwaysBlock:
      case StmtKind.FromToBlock:
      case StmtKind.ForInBlock:
      case StmtKind.ShowCommand:
      case StmtKind.AssignmentExpr:
      case StmtKind.InstanceExpr:
        break;
      case StmtKind.BinaryExpr: {
        this.compile(stmt.right);
        this.compile(stmt.left);
        let vm_fn = VM.get_bin_op(stmt.operator.type);
        this.push(`__vm.${vm_fn}(__s.pop(),__s.pop())`)
        break;
      }
      case StmtKind.UnaryExpr: {
        this.compile(stmt.right);
        let vm_fn = VM.get_un_op(stmt.operator.type);
        this.push(`__vm.${vm_fn}(__s.pop())`)
        break;
      }
      case StmtKind.Identifier:
      case StmtKind.MemberExpr:
      case StmtKind.ComputedMemberExpr:
      case StmtKind.CallExpr:
      case StmtKind.ClassDefinition:
      case StmtKind.FunctionDefinition:
      case StmtKind.ExtMethodDefinition:
      case StmtKind.BreakCommand:
      case StmtKind.ContinueCommand:
      case StmtKind.ReturnCommand:
        break;
      default:
        const _UNREACHABLE: never = stmt;
    }
  }

  // compiling nodes
  compile_program(program: Program) {
    for (const stmt of program.body) {
      if (
        stmt.kind == StmtKind.DocComment ||
        stmt.kind == StmtKind.EmptyLine
      ) continue; // ignore
      this.compile(stmt);
    }
  }

  compile_ast(ast: Program) {
    this.reset();
    this.compile(ast);
  }

  print_instructions() {
    for (const [i, instr] of this.instructions.entries()) {
      console.info(`${i}: ${instr}`);
    }
  }
}

export class VM {
  s: any[] = [];
  t: any = {};

  // builtin operations
  static add(a: any, b: any) {
    return a + b;
  }

  static sub(a: number, b: number) {
    return a - b;
  }

  static mult(a: number, b: number) {
    return a * b;
  }

  static div(a: number, b: number) {
    return a / b;
  }

  static mod(a: number, b: number) {
    return mod(a, b);
  }

  static gt(a: number, b: number) {
    return a > b;
  }

  static ge(a: number, b: number) {
    return a >= b;
  }

  static lt(a: number, b: number) {
    return a < b;
  }

  static le(a: number, b: number) {
    return a <= b;
  }

  static eq(a: number, b: number) {
    return a === b;
  }

  static neq(a: number, b: number) {
    return a !== b;
  }

  static and(a: boolean, b: boolean) {
    return a && b;
  }

  static or(a: boolean, b: boolean) {
    return a && b;
  }

  static not(a: boolean | number) {
    return !a;
  }

  static neg(a: number) {
    return -a;
  }

  static pos(a: number) {
    return +a;
  }

  static get_bin_op(tt: TokenType) {
    switch (tt) {
      case TokenType.Plus: return this.add.name
      case TokenType.Minus: return this.sub.name
      case TokenType.Multiply: return this.mult.name
      case TokenType.Divide: return this.div.name
      case TokenType.Mod: return this.mod.name
      case TokenType.Greater: return this.gt.name
      case TokenType.GEQ: return this.ge.name
      case TokenType.Lesser: return this.lt.name
      case TokenType.LEQ: return this.le.name
      case TokenType.Equal: return this.eq.name
      case TokenType.NEQ: return this.neq.name
      case TokenType.And: return this.and.name
      case TokenType.Or: return this.or.name
      case TokenType.ClassDef: return this.neq.name
    }
  }

  static get_un_op(tt: TokenType) {
    switch (tt) {
      case TokenType.Plus: return this.pos.name
      case TokenType.Minus: return this.neg.name
      case TokenType.Not: return this.not.name
    }
  }

  reset() {
    this.s = [];
    this.t = {};
  }

  run_instructions(instructions: string[]) {
    this.reset();

    for (let [i, instr] of instructions.entries()) {
      try {
        const call = Function("__s", "__t", "__vm", instr)
        const ret = call(this.s, this.t, VM);
        console.info(`${JSON.stringify(this.s)} => ${ret}`);
      } catch (e) {
        console.info(JSON.stringify(e));
      }
    }
  }
}