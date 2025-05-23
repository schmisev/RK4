import {
    MK_NUMBER,
    MK_STRING,
    MK_BOOL,
    MK_NULL,
    RuntimeVal,
    MK_FLOAT,
} from "./values";
import {
    AbruptStmtKind,
    Program,
    Stmt,
    StmtKind,
    AbruptEvalResult,
    Expr,
} from "../frontend/ast";
import { Environment } from "./environment";
import {
    eval_identifier,
    eval_binary_expr,
    eval_assignment_expr,
    eval_unary_expr,
    eval_call_expr,
    eval_member_expr,
    eval_list_literal,
    eval_computed_member_expr,
    eval_instance_expr,
} from "./eval/expressions";
import {
    eval_fn_definition,
    eval_empty_line,
    eval_for_block,
    eval_if_else_block,
    eval_program,
    eval_show_command,
    eval_var_declaration,
    eval_while_block,
    eval_class_definition,
    eval_return_command,
    eval_ext_method_definition,
    eval_always_block,
    eval_doc_comment,
    eval_break_command,
    eval_continue_command,
    eval_switch_block,
    eval_from_to_block,
    eval_for_in_block,
} from "./eval/statements";
import { CodePosition } from "../frontend/lexer";

export type SteppedEval<T> = Generator<CodePosition, T, void>;

export function evaluate_expr(
    astNode: Expr,
    env: Environment
): SteppedEval<RuntimeVal> {
    return evaluate<never>(astNode, env);
}

export function* evaluate<A extends AbruptStmtKind>(
    astNode: Program | Stmt<A>,
    env: Environment
): SteppedEval<RuntimeVal | AbruptEvalResult<A>> {
    const a = astNode.kind;
    switch (astNode.kind) {
        case StmtKind.NumericLiteral:
            return MK_NUMBER(astNode.value);
        case StmtKind.FloatLiteral:
            return MK_FLOAT(astNode.value);
        case StmtKind.StringLiteral:
            return MK_STRING(astNode.value);
        case StmtKind.BooleanLiteral:
            return MK_BOOL(astNode.value);
        case StmtKind.NullLiteral:
            return MK_NULL();
        case StmtKind.ListLiteral:
            return yield* eval_list_literal(astNode, env);
        case StmtKind.Identifier:
            return eval_identifier(astNode, env);
        case StmtKind.BinaryExpr:
            return yield* eval_binary_expr(astNode, env);
        case StmtKind.UnaryExpr:
            return yield* eval_unary_expr(astNode, env);
        case StmtKind.AssignmentExpr:
            yield astNode.codePos;
            return yield* eval_assignment_expr(astNode, env);
        case StmtKind.InstanceExpr:
            yield astNode.codePos;
            return yield* eval_instance_expr(astNode, env);
        case StmtKind.CallExpr:
            yield astNode.codePos;
            return yield* eval_call_expr(astNode, env);
        case StmtKind.ComputedMemberExpr:
            return yield* eval_computed_member_expr(astNode, env);
        case StmtKind.MemberExpr:
            return yield* eval_member_expr(astNode, env);
        case StmtKind.Program:
            return yield* eval_program(astNode, env);
        case StmtKind.WhileBlock:
            return yield* eval_while_block(astNode, env);
        case StmtKind.AlwaysBlock:
            return yield* eval_always_block(astNode, env);
        case StmtKind.ForBlock:
            return yield* eval_for_block(astNode, env);
        case StmtKind.FromToBlock:
            return yield* eval_from_to_block(astNode, env);
        case StmtKind.ForInBlock:
            return yield* eval_for_in_block(astNode, env);
        case StmtKind.IfElseBlock:
            return yield* eval_if_else_block(astNode, env);
        case StmtKind.SwitchBlock:
            return yield* eval_switch_block(astNode, env);
        case StmtKind.VarDeclaration:
            return yield* eval_var_declaration(astNode, env);
        case StmtKind.FunctionDefinition:
            return yield* eval_fn_definition(astNode, env);
        case StmtKind.ExtMethodDefinition:
            return eval_ext_method_definition(astNode, env);
        case StmtKind.ClassDefinition:
            return eval_class_definition(astNode, env);
        case StmtKind.ShowCommand:
            yield astNode.codePos;
            return yield* eval_show_command(astNode, env);
        case StmtKind.BreakCommand:
            yield astNode.codePos;
            // as 'any'? what is this, amateure hour?
            return yield* eval_break_command(astNode, env) as any;
        case StmtKind.ContinueCommand:
            yield astNode.codePos;
            return yield* eval_continue_command(astNode, env) as any;
        case StmtKind.ReturnCommand:
            yield astNode.codePos;
            return yield* eval_return_command(astNode, env) as any;
        case StmtKind.EmptyLine:
            return eval_empty_line(astNode, env);
        case StmtKind.DocComment:
            return eval_doc_comment(astNode, env);
    }
    const _UNREACHABLE: never = astNode;
}
