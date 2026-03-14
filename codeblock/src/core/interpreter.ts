import type { Block, Program, Expression, Condition, FunctionDeclarationBlock, Value } from './types';

export class Interpreter {

    private scopes: Map<string, Value>[];
    private arrays: Map<string, Value[]>;
    private functions: Map<string, FunctionDeclarationBlock>;

    constructor() {
        this.scopes = [new Map()];
        this.arrays = new Map();
        this.functions = new Map();
    }

    private getVariable(name: string): Value {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            const val = this.scopes[i].get(name);
            if (val !== undefined) return val;
        }
        throw new Error(`Переменная ${name} не объявлена`);
    }

    private setVariable(name: string, value: Value): void {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i].has(name)) {
                this.scopes[i].set(name, value);
                return;
            }
        }
        this.scopes[this.scopes.length - 1].set(name, value);
    }

    private declareVariable(name: string, value: Value): void {
        this.scopes[this.scopes.length - 1].set(name, value);
    }

    private pushScope(): void {
        this.scopes.push(new Map());
    }

    private popScope(): void {
        if (this.scopes.length > 1) this.scopes.pop();
    }

    private toNumber(val: Value): number {
        if (typeof val === 'number') return val;
        if (typeof val === 'boolean') return val ? 1 : 0;
        const n = Number(val);
        if (isNaN(n)) throw new Error(`Невозможно преобразовать "${val}" в число`);
        return n;
    }

    private evaluateCondition (cond: Condition): boolean{
        switch (cond.type) {
            case "Comparison": {
                const left = this.evaluateExpression(cond.left);
                const right = this.evaluateExpression(cond.right);
                switch (cond.operator){
                    case ">": return left > right;
                    case "<": return left < right;
                    case ">=": return left >= right;
                    case "<=": return left <= right;
                    case "==": return left === right;
                    case "!=": return left !== right;
                }
            }
            case "LogicalOp": {
                const left = this.evaluateCondition(cond.left);
                const right = this.evaluateCondition(cond.right);
                if (cond.operator === "AND") return left && right;
                if (cond.operator === "OR") return left || right;
                throw new Error(`Неизвестный логический оператор: ${cond.operator}`);
            }
            case "Not":
                return !this.evaluateCondition(cond.operand);
        }
    }

    private evaluateExpression (expr: Expression): Value {
        switch (expr.type) {
            case "Number":
                return expr.value;
            case "String":
                return expr.value;
            case "Boolean":
                return expr.value;
            case "Variable":
                return this.getVariable(expr.name);
            case "ArrayAccess": {
                const arr = this.arrays.get(expr.name);
                if (!arr) throw new Error(`Массив ${expr.name} не объявлен`);
                const idx = this.toNumber(this.evaluateExpression(expr.index));
                if (idx < 0 || idx >= arr.length) throw new Error(`Индекс ${idx} за пределами массива ${expr.name}[${arr.length}]`);
                return arr[idx];
            }
            case "BinaryOp": {
                const left = this.evaluateExpression(expr.left);
                const right = this.evaluateExpression(expr.right);
                if (expr.operator === '+' && (typeof left === 'string' || typeof right === 'string')) {
                    return String(left) + String(right);
                }
                const l = this.toNumber(left);
                const r = this.toNumber(right);
                switch (expr.operator){
                    case "+":
                        return l + r;
                    case "-":
                        return l - r;
                    case "*":
                        return l * r;
                    case "/":
                        if (r === 0) {
                            throw new Error("Деление на ноль");
                        }
                        return l / r;
                    case "%":
                        return l % r;
                }
                throw new Error(`Неизвестный тип выражения`);
            }
        }
    }

    executeBlock (block:Block): void{
        switch (block.type) {
            case "VarDeclaration": {
                const unique = new Set(block.variables);
                for (const name of unique) {
                    this.declareVariable(name, 0);
                }
            }
                break;
            case "Assignment": {
                const value = this.evaluateExpression(block.expression);
                this.setVariable(block.variable, value);
                break;
            }
            case "If":
                if (this.evaluateCondition(block.condition)) {
                    for (const subBlock of block.body) {
                        this.executeBlock(subBlock);
                    }
                } else if (block.elseBody) {
                    for (const subBlock of block.elseBody) {
                        this.executeBlock(subBlock);
                    }
                };
                break;
            case "While":
                while(this.evaluateCondition(block.condition)){
                    for(const subBlock of block.body){
                        this.executeBlock(subBlock);
                    }
                }
                break;
            case "BeginEnd":
                for (const subBlock of block.body) {
                    this.executeBlock(subBlock);
                }
                break;
            case "For": {
                const from = this.toNumber(this.evaluateExpression(block.from));
                const to = this.toNumber(this.evaluateExpression(block.to));
                for (let i = from; i <= to; i++) {
                    this.setVariable(block.variable, i);
                    for (const subBlock of block.body) {
                        this.executeBlock(subBlock);
                    }
                }
                break;
            }
            case "ArrayDeclaration": {
                const size = this.toNumber(this.evaluateExpression(block.size));
                this.arrays.set(block.name, new Array(size).fill(0));
                break;
            }
            case "ArrayAssignment": {
                const arr = this.arrays.get(block.name);
                if (!arr) throw new Error(`Массив ${block.name} не объявлен`);
                const idx = this.toNumber(this.evaluateExpression(block.index));
                if (idx < 0 || idx >= arr.length) throw new Error(`Индекс ${idx} за пределами массива ${block.name}[${arr.length}]`);
                arr[idx] = this.evaluateExpression(block.expression);
                break;
            }
            case "FunctionDeclaration": {
                this.functions.set(block.name, block);
                break;
            }
            case "FunctionCall": {
                const func = this.functions.get(block.name);
                if (!func) throw new Error(`Функция ${block.name} не объявлена`);
                if (block.args.length !== func.params.length) {
                    throw new Error(`Функция ${block.name} ожидает ${func.params.length} аргументов, получено ${block.args.length}`);
                }
                this.pushScope();
                for (let i = 0; i < func.params.length; i++) {
                    this.declareVariable(func.params[i], this.evaluateExpression(block.args[i]));
                }
                for (const subBlock of func.body) {
                    this.executeBlock(subBlock);
                }
                this.popScope();
                break;
            }

        }
    }

    getVariables(): Map<string, Value> {
        const all = new Map<string, Value>();
        for (const scope of this.scopes) {
            for (const [k, v] of scope) {
                all.set(k, v);
            }
        }
        return all;
    }

    getArrays(): Map<string, Value[]> {
        return this.arrays;
    }

    execute (program: Program): void {
        for (const block of program.blocks) {
            this.executeBlock(block);
        }
    }
}
