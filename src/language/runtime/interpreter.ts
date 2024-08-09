import { RuntimeVal, NumberVal, BooleanVal, StringVal } from "./values";
import { BinaryExpr, BooleanLiteral, ShowCommand, Identifier, NumericLiteral, Program, Stmt, VarDeclaration, AssignmentExpr, IfElseBlock, EmptyLine, WhileBlock, ForBlock, StringLiteral, UnaryExpr, CallExpr, FunctionDefinition, ClassDefinition, ObjDeclaration, MemberExpr, ReturnCommand, ExtMethodDefinition } from "../frontend/ast";
import Environment from "./environment";
import { eval_identifier, eval_binary_expr, eval_assignment_expr, eval_unary_expr, eval_call_expr, eval_member_expr } from "./eval/expressions";
import { eval_fn_definition, eval_empty_line, eval_for_block, eval_if_else_block, eval_program, eval_show_command, eval_var_declaration, eval_while_block, eval_class_definition, eval_obj_declaration, eval_return_command, eval_ext_method_definition } from "./eval/statements";
import { Break, Continue } from "./eval/errors";
import { sleep } from "./utils";
import { stepSleep } from "../../index";

export async function evaluate(astNode: Stmt, env: Environment): Promise<RuntimeVal> {
    switch (astNode.kind) {
        case "NumericLiteral":
            return {
                value: ((astNode as NumericLiteral).value),
                type: "number",
            } as NumberVal;
        case "StringLiteral":
            return {
                value: ((astNode as StringLiteral).value),
                type: "string"
            } as StringVal;
        case "Identifier":
            return eval_identifier(astNode as Identifier, env);
        case "BooleanLiteral":
            return {
                value: ((astNode as BooleanLiteral).value),
                type: "boolean",
            } as BooleanVal;
        case "BinaryExpr":
            return eval_binary_expr(astNode as BinaryExpr, env);
        case "UnaryExpr":
            return eval_unary_expr(astNode as UnaryExpr, env);
        case "AssignmentExpr":
            return eval_assignment_expr(astNode as AssignmentExpr, env);
        case "CallExpr":
            await stepSleep(); // TIMED STATEMENT
            return eval_call_expr(astNode as CallExpr, env);
        case "MemberExpr":
            return eval_member_expr(astNode as MemberExpr, env);
        case "Program":
            return await eval_program(astNode as Program, env);
        case "WhileBlock":
            return eval_while_block(astNode as WhileBlock, env);
        case "ForBlock":
            return eval_for_block(astNode as ForBlock, env);
        case "IfElseBlock":
            return eval_if_else_block(astNode as IfElseBlock, env);
        case "VarDeclaration":
            return eval_var_declaration(astNode as VarDeclaration, env);
        case "ObjDeclaration":
            return eval_obj_declaration(astNode as ObjDeclaration, env);
        case "FunctionDefinition":
            return eval_fn_definition(astNode as FunctionDefinition, env);
        case "ExtMethodDefinition":
            return eval_ext_method_definition(astNode as ExtMethodDefinition, env);
        case "ClassDefinition":
            return eval_class_definition(astNode as ClassDefinition, env);
        case "ShowCommand":
            return eval_show_command(astNode as ShowCommand, env);
        case "BreakCommand":
            throw new Break();
        case "ContinueCommand":
            throw new Continue();
        case "ReturnCommand":
            return eval_return_command(astNode as ReturnCommand, env);
        case "EmptyLine":
            return eval_empty_line(astNode as EmptyLine, env);
        default:
            console.error("This AST Node has not been setup yet!", astNode);
    }
}