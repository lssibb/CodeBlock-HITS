import type { Block, Program, Expression, Condition } from './types';

export class Interpreter {
    
    private variables: Map<string, number>;

    constructor() {
        this.variables = new Map();
    }

    private evaluateCondition (cond: Condition): boolean{
        const left = this.evaluateExpression(cond.left);
        const right = this.evaluateExpression(cond.right);
        switch (cond.operator){
            case ">": 
                return left > right;
            case "<":
                return left  < right;
            case ">=":
                return left >= right;
            case "<=": 
                return left <= right;
            case "==": 
                return left === right;
            case "!=": 
                return left !== right;
            default:
                throw new Error(`Неизвестный оператор сравнения: ${cond.operator}`);
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
        }
    }

    execute (program: Program): void {
        for (const block of program.blocks) {
            this.executeBlock(block);
        }
    }
}   