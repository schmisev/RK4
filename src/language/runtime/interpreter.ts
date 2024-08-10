import { RuntimeVal, MK_NUMBER, MK_STRING, MK_BOOL, MK_NULL } from "./values";
import { Stmt } from "../frontend/ast";
import Environment from "./environment";
import { eval_identifier, eval_binary_expr, eval_assignment_expr, eval_unary_expr, eval_call_expr, eval_member_expr } from "./eval/expressions";
import { eval_fn_definition, eval_empty_line, eval_for_block, eval_if_else_block, eval_program, eval_show_command, eval_var_declaration, eval_while_block, eval_class_definition, eval_obj_declaration, eval_return_command, eval_ext_method_definition } from "./eval/statements";
import { Break, Continue } from "./eval/errors";

export type SteppedEval<T> = Generator<void, T, void>;

function assertUnreachable(x: never): never {
    throw new Error("Didn't expect to get here");
}
export function* evaluate(
    astNode: Stmt,
    env: Environment
): SteppedEval<RuntimeVal> {
    switch (astNode.kind) {
        case "NumericLiteral":
            return MK_NUMBER(astNode.value);
        case "StringLiteral":
            return MK_STRING(astNode.value);
        case "BooleanLiteral":
            return MK_BOOL(astNode.value);
        case "NullLiteral":
            return MK_NULL();
        case "Identifier":
            return eval_identifier(astNode, env);
        case "BinaryExpr":
            return yield* eval_binary_expr(astNode, env);
        case "UnaryExpr":
            return yield* eval_unary_expr(astNode, env);
        case "AssignmentExpr":
            return yield* eval_assignment_expr(astNode, env);
        case "CallExpr":
            yield;
            return yield* eval_call_expr(astNode, env);
        case "MemberExpr":
            return yield* eval_member_expr(astNode, env);
        case "Program":
            return yield* eval_program(astNode, env);
        case "WhileBlock":
            return yield* eval_while_block(astNode, env);
        case "ForBlock":
            return yield* eval_for_block(astNode, env);
        case "IfElseBlock":
            return yield* eval_if_else_block(astNode, env);
        case "VarDeclaration":
            return yield* eval_var_declaration(astNode, env);
        case "ObjDeclaration":
            return eval_obj_declaration(astNode, env);
        case "FunctionDefinition":
            return eval_fn_definition(astNode, env);
        case "ExtMethodDefinition":
            return eval_ext_method_definition(astNode, env);
        case "ClassDefinition":
            return eval_class_definition(astNode, env);
        case "ShowCommand":
            return yield* eval_show_command(astNode, env);
        case "BreakCommand":
            throw new Break();
        case "ContinueCommand":
            throw new Continue();
        case "ReturnCommand":
            return yield* eval_return_command(astNode, env);
        case "EmptyLine":
            return eval_empty_line(astNode, env);
    }
    const _UNREACHABLE: never = astNode;
}
