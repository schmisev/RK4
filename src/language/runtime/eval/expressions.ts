import { RuntimeError } from "../../../errors";
import { Identifier, BinaryExpr, UnaryExpr, AssignmentExpr, CallExpr, MemberExpr, StmtKind } from "../../frontend/ast";
import { Environment } from "../environment";
import { SteppedEval, evaluate_expr } from "../interpreter";
import {
    RuntimeVal,
    NumberVal,
    BooleanVal,
    StringVal,
    MK_BOOL,
    MK_NUMBER,
    ObjectVal,
    MK_STRING,
    AbruptAlias,
    ValueAlias,
} from "../values";
import { eval_bare_statements } from "./statements";

export function eval_identifier(
    ident: Identifier,
    env: Environment
): RuntimeVal {
    const val = env.lookupVar(ident.symbol);
    return val;
}

function expectObject(val: RuntimeVal, reason: string, lineIndex: number): asserts val is ObjectVal {
    if (val.type != ValueAlias.Object) {
        throw new RuntimeError(
            `Erwartete ein Object, aber bekam '${val.type}' - ${reason}`, lineIndex
        )
    }
}

export function* eval_assignment_expr(
    node: AssignmentExpr,
    env: Environment
): SteppedEval<RuntimeVal> {
    if (node.assigne.kind == StmtKind.MemberExpr) {
        const assigne = node.assigne;
        const symbol = assigne.member.symbol;
        const obj = yield* evaluate_expr(assigne.container, env);
        expectObject(obj, "nur Objekten können Eigenschaften zugewiesen werden", node.lineIndex);
        const value = yield* evaluate_expr(node.value, env);
        obj.cls.prototype.assignVar(obj, symbol, value);
        return value;
    }

    // regular assigments
    if (node.assigne.kind == StmtKind.Identifier) {
        const varname = node.assigne.symbol;
        const value = env.assignVar(varname, yield* evaluate_expr(node.value, env));
        return value;
    }

    throw new RuntimeError(
        `Kann den Wert von '${node.assigne.kind}' nicht ändern - weil das Quatsch wäre!`, node.lineIndex
    );
}

export function* eval_binary_expr(
    binop: BinaryExpr,
    env: Environment
): SteppedEval<RuntimeVal> {
    const lhs = yield* evaluate_expr(binop.left, env);
    const rhs = yield* evaluate_expr(binop.right, env);

    try {
        if (lhs.type == ValueAlias.Number && rhs.type == ValueAlias.Number) {
            return eval_numeric_binary_expr(
                lhs,
                rhs,
                binop.operator,
                binop.lineIndex
            );
        } else if (lhs.type == ValueAlias.Boolean && rhs.type == ValueAlias.Boolean) {
            return eval_logical_binary_expr(
                lhs,
                rhs,
                binop.operator,
                binop.lineIndex
            );
        } else if (lhs.type == ValueAlias.String && rhs.type == ValueAlias.String) {
            return eval_string_binary_expr(
                lhs,
                rhs,
                binop.operator,
                binop.lineIndex
            );
        }
    } catch {
        throw new RuntimeError(
            `Operator in '${lhs.type} ${binop.operator} ${rhs.type}' ist nicht unterstützt!`, binop.lineIndex
        );
    }

    throw new RuntimeError(
        `Unpassendende Typen im Ausdruck '${lhs.type} ${binop.operator} ${rhs.type}'!`, binop.lineIndex
    );
    //return MK_NULL();
}

export function eval_numeric_binary_expr(
    lhs: NumberVal,
    rhs: NumberVal,
    operator: string,
    lineIndex: number
): RuntimeVal {
    // stays numeric
    if (operator == "+") {
        return MK_NUMBER(lhs.value + rhs.value);
    } else if (operator == "-") {
        return MK_NUMBER(lhs.value - rhs.value);
    } else if (operator == "*") {
        return MK_NUMBER(lhs.value * rhs.value);
    } else if (operator == "/" || operator == ":") {
        return MK_NUMBER(Math.floor(lhs.value / rhs.value));
    } else if (operator == "%") {
        return MK_NUMBER(lhs.value % rhs.value);
    }
    // boolean values
    else if (operator == "=") {
        return MK_BOOL(lhs.value == rhs.value);
    } else if (operator == ">") {
        return MK_BOOL(lhs.value > rhs.value);
    } else if (operator == "<") {
        return MK_BOOL(lhs.value < rhs.value);
    }

    // nothing worked
    throw new RuntimeError(`Operator '${operator}' kann so nicht verwendet werden.`, lineIndex);
}

export function eval_logical_binary_expr(
    lhs: BooleanVal,
    rhs: BooleanVal,
    operator: string,
    lineIndex: number
): BooleanVal {
    if (operator == "und") {
        return MK_BOOL(lhs.value && rhs.value);
    } else if (operator == "oder") {
        return MK_BOOL(lhs.value || rhs.value);
    }
    throw new RuntimeError(`Operator '${operator}' kann so nicht verwendet werden.`, lineIndex);
}

export function eval_string_binary_expr(
    lhs: StringVal,
    rhs: StringVal,
    operator: string,
    lineIndex: number
): RuntimeVal {
    if (operator == "+") {
        return MK_STRING(lhs.value + rhs.value);
    } else if (operator == "=") {
        return MK_BOOL(lhs.value === rhs.value);
    }
    throw new RuntimeError(`Operator '${operator}' kann so nicht verwendet werden.`, lineIndex);
}

export function* eval_unary_expr(
    unop: UnaryExpr,
    env: Environment
): SteppedEval<RuntimeVal> {
    const rhs = yield* evaluate_expr(unop.right, env);

    try {
        if (rhs.type == ValueAlias.Boolean) {
            return eval_logical_unary_expr(rhs, unop.operator, unop.lineIndex);
        } else if (rhs.type == ValueAlias.Number) {
            return eval_numeric_unary_expr(rhs, unop.operator, unop.lineIndex);
        } else if (rhs.type == ValueAlias.String) {
            return eval_string_unary_expr(rhs, unop.operator, unop.lineIndex);
        }
    } catch {
        throw new RuntimeError(`Operator in '${unop.operator} ${rhs.type}' ist nicht unterstützt!`, unop.lineIndex);
    }
    throw new RuntimeError(`Unpassender Typ im Ausdruck '${unop.operator} ${rhs.type}'!`, unop.lineIndex);
}

export function eval_logical_unary_expr(
    rhs: BooleanVal,
    operator: string,
    lineIndex: number
): BooleanVal {
    if (operator == "nicht") {
        return MK_BOOL(!rhs.value);
    }
    throw new RuntimeError(`Operator '${operator}' kann so nicht verwendet werden.`, lineIndex);
}

export function eval_numeric_unary_expr(
    rhs: NumberVal,
    operator: string,
    lineIndex: number
): RuntimeVal {
    if (operator == "nicht") {
        return MK_BOOL(rhs.value == 0);
    } else if (operator == "-") {
        return MK_NUMBER(-rhs.value);
    } else if (operator == "+") {
        return rhs;
    }
    throw new RuntimeError(`Operator '${operator}' kann so nicht verwendet werden.`, lineIndex);
}

export function eval_string_unary_expr(
    rhs: StringVal,
    operator: string,
    lineIndex: number
): StringVal {
    throw new RuntimeError(`Operator '${operator}' kann so nicht verwendet werden.`, lineIndex);
}

export function* eval_call_expr(
    call: CallExpr,
    env: Environment
): SteppedEval<RuntimeVal> {
    const args: RuntimeVal[] = [];
    for (const expr of call.args) {
        const result = yield* evaluate_expr(expr, env);
        args.push(result);
    }
    //const args = call.args.map((arg) => evaluate(arg, env));
    const fn = yield* evaluate_expr(call.ident, env);

    if (fn.type == ValueAlias.NativeFunction) {
        return fn.call(args);
    } else if (fn.type == ValueAlias.Function) {
        const scope = new Environment(fn.declenv);

        // create variables
        if (args.length != fn.params.length)
            throw new RuntimeError(
                `Erwarte ${fn.params.length} Parameter, habe aber ${args.length} erhalten!`, call.lineIndex
            );
        for (let i = 0; i < fn.params.length; i++) {
            const param = fn.params[i];
            const varname = param.ident;
            const arg = args[i];

            if (param.type != arg.type)
                throw new RuntimeError(
                    `'${varname}' sollte '${param.type}' sein, ist aber '${arg.type}'`, call.lineIndex
                );
            scope.declareVar(varname, args[i]);
        }

        const result = yield* eval_bare_statements(fn.body, scope);
        if (result.type === AbruptAlias.Return) {
            return result.value;
        }
        return result;
    }

    throw new RuntimeError(`Du versuchst hier ${JSON.stringify(fn)} als Funktion auszuführen!`, call.lineIndex);
}

export function* eval_member_expr(
    expr: MemberExpr,
    env: Environment
): SteppedEval<RuntimeVal> {
    const obj = yield* evaluate_expr(expr.container, env);
    expectObject(obj, "nur Objekte haben Attribute und Methoden!", expr.lineIndex);
    return obj.cls.prototype.lookupVar(obj, expr.member.symbol);
}
