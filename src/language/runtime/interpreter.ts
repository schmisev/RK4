import { RuntimeVal, NumberVal, BooleanVal, StringVal } from "./values";
import { BinaryExpr, BooleanLiteral, ShowCommand, Identifier, NumericLiteral, Program, Stmt, VarDeclaration, AssignmentExpr, IfElseBlock, EmptyLine, WhileBlock, ForBlock, StringLiteral, UnaryExpr, CallExpr, FunctionDefinition, ClassDefinition, ObjDeclaration, MemberExpr, ReturnCommand, ExtMethodDefinition } from "../frontend/ast";
import Environment from "./environment";
import { eval_identifier, eval_binary_expr, eval_assignment_expr, eval_unary_expr, eval_call_expr, eval_member_expr } from "./eval/expressions";
import { eval_fn_definition, eval_empty_line, eval_for_block, eval_if_else_block, eval_program, eval_show_command, eval_var_declaration, eval_while_block, eval_class_definition, eval_obj_declaration, eval_return_command, eval_ext_method_definition } from "./eval/statements";
import { Break, Continue } from "./eval/errors";

export type SteppedEval<T> = Generator<void, T, void>;

export function* evaluate(
    astNode: Stmt,
    env: Environment
): SteppedEval<RuntimeVal> {
    switch (astNode.kind) {
        case "NumericLiteral":
            return {
                value: (astNode as NumericLiteral).value,
                type: "number",
            } as NumberVal;
        case "StringLiteral":
            return {
                value: (astNode as StringLiteral).value,
                type: "string",
            } as StringVal;
        case "Identifier":
            return eval_identifier(astNode as Identifier, env);
        case "BooleanLiteral":
            return {
                value: (astNode as BooleanLiteral).value,
                type: "boolean",
            } as BooleanVal;
        case "BinaryExpr":
            return yield* eval_binary_expr(astNode as BinaryExpr, env);
        case "UnaryExpr":
            return yield* eval_unary_expr(astNode as UnaryExpr, env);
        case "AssignmentExpr":
            return yield* eval_assignment_expr(astNode as AssignmentExpr, env);
        case "CallExpr":
            yield;
            return yield* eval_call_expr(astNode as CallExpr, env);
        case "MemberExpr":
            return yield* eval_member_expr(astNode as MemberExpr, env);
        case "Program":
            return yield* eval_program(astNode as Program, env);
        case "WhileBlock":
            return yield* eval_while_block(astNode as WhileBlock, env);
        case "ForBlock":
            return yield* eval_for_block(astNode as ForBlock, env);
        case "IfElseBlock":
            return yield* eval_if_else_block(astNode as IfElseBlock, env);
        case "VarDeclaration":
            return yield* eval_var_declaration(astNode as VarDeclaration, env);
        case "ObjDeclaration":
            return eval_obj_declaration(astNode as ObjDeclaration, env);
        case "FunctionDefinition":
            return eval_fn_definition(astNode as FunctionDefinition, env);
        case "ExtMethodDefinition":
            return eval_ext_method_definition(astNode as ExtMethodDefinition, env);
        case "ClassDefinition":
            return eval_class_definition(astNode as ClassDefinition, env);
        case "ShowCommand":
            return yield* eval_show_command(astNode as ShowCommand, env);
        case "BreakCommand":
            throw new Break();
        case "ContinueCommand":
            throw new Continue();
        case "ReturnCommand":
            return yield* eval_return_command(astNode as ReturnCommand, env);
        case "EmptyLine":
            return eval_empty_line(astNode as EmptyLine, env);
        default:
            console.error("This AST Node has not been setup yet!", astNode);
    }
}