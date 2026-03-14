import type { Block, Program, Expression, Condition } from './types';

export class Interpreter {
    
    private variables: Map<string, number>;
    private arrays: Map<string, number[]>;

    constructor() {
        this.variables = new Map();
        this.arrays = new Map();
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

    private evaluateExpression (expr: Expression): number{
        switch (expr.type) {
            case "Number":
                return expr.value;
            case "Variable":
                const val = this.variables.get(expr.name);
                if (val === undefined){
                    throw new Error(`Переменная ${expr.name} не объявлена`);
                }
                return val;
            case "ArrayAccess": {
                const arr = this.arrays.get(expr.name);
                if (!arr) throw new Error(`Массив ${expr.name} не объявлен`);
                const idx = this.evaluateExpression(expr.index);
                if (idx < 0 || idx >= arr.length) throw new Error(`Индекс ${idx} за пределами массива ${expr.name}[${arr.length}]`);
                return arr[idx];
            }
            case "BinaryOp":
                const left = this.evaluateExpression(expr.left);
                const right = this.evaluateExpression(expr.right);
                switch (expr.operator){
                    case "+":
                        return left + right;
                    case "-":
                        return left - right;
                    case "*":
                        return left * right;
                    case "/":
                        if (right === 0) {
                            throw new Error("Деление на ноль");
                        }
                        return Math.floor(left / right);
                    case "%":
                        return left % right;
                }
                throw new Error(`Неизвестный тип выражения`);
        }       
    }
        
    

    private executeBlock (block:Block): void{
        switch (block.type) {
            case "VarDeclaration":
                for (const name of block.variables) {
                    this.variables.set(name,0);
                }
                break;
            case "Assignment":
                const value = this.evaluateExpression(block.expression);
                this.variables.set(block.variable,value);
                break;
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
                const from = this.evaluateExpression(block.from);
                const to = this.evaluateExpression(block.to);
                for (let i = from; i <= to; i++) {
                    this.variables.set(block.variable, i);
                    for (const subBlock of block.body) {
                        this.executeBlock(subBlock);
                    }
                }
                break;
            }
            case "ArrayDeclaration": {
                const size = this.evaluateExpression(block.size);
                this.arrays.set(block.name, new Array(size).fill(0));
                break;
            }
            case "ArrayAssignment": {
                const arr = this.arrays.get(block.name);
                if (!arr) throw new Error(`Массив ${block.name} не объявлен`);
                const idx = this.evaluateExpression(block.index);
                if (idx < 0 || idx >= arr.length) throw new Error(`Индекс ${idx} за пределами массива ${block.name}[${arr.length}]`);
                arr[idx] = this.evaluateExpression(block.expression);
                break;
            }

        }
    }
    
    getVariables(): Map<string, number> {
        return this.variables;
    }

    getArrays(): Map<string, number[]> {
        return this.arrays;
    }

    execute (program: Program): void {
        for (const block of program.blocks) {
            this.executeBlock(block);
        }
    }
}   