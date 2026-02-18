export interface VarDeclarationBlock {
    type: "VarDeclaration";
    id: string;
    variables: string[];
}

 export interface AssignmentBlock {
    type: "Assignment";
    id: string;
    variable: string;
    expression: Expression;
}

export interface IfBlock {
    type:"If";
    id: string;
    condition: Condition;
    body: Block[];
    elseBody?: Block[];
}

export interface WhileBlock {
    type: "While";
    id: string;
    condition: Condition;
    body: Block[];
}

export type Expression = 
| { type: "Number"; value: number } 
| { type: "Variable"; name: string }
| { type: "BinaryOp";
    operator: "+"|"-"|"*"|"/"|"%";
    left: Expression;
    right: Expression;
}

export type Condition = {
    type: "Comparison";
    operator: ">"|"<"|">="|"<="|"=="|"!=";
    left: Expression;
    right: Expression;
}

export type Block = VarDeclarationBlock | AssignmentBlock | IfBlock | WhileBlock;

export interface Program {blocks: Block[]};