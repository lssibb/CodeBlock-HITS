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
| { type: "ArrayAccess"; name: string; index: Expression }
| { type: "BinaryOp";
    operator: "+"|"-"|"*"|"/"|"%";
    left: Expression;
    right: Expression;
}

export type Condition =
| {
    type: "Comparison";
    operator: ">"|"<"|">="|"<="|"=="|"!=";
    left: Expression;
    right: Expression;
}
| {
    type: "LogicalOp";
    operator: "AND"|"OR";
    left: Condition;
    right: Condition;
}
| {
    type: "Not";
    operand: Condition;
}

export interface BeginEndBlock {
    type: "BeginEnd";
    id: string;
    body: Block[];
}

export interface ForBlock {
    type: "For";
    id: string;
    variable: string;
    from: Expression;
    to: Expression;
    body: Block[];
}

export interface ArrayDeclarationBlock {
    type: "ArrayDeclaration";
    id: string;
    name: string;
    size: Expression;
}

export interface ArrayAssignmentBlock {
    type: "ArrayAssignment";
    id: string;
    name: string;
    index: Expression;
    expression: Expression;
}

export interface FunctionDeclarationBlock {
    type: "FunctionDeclaration";
    id: string;
    name: string;
    params: string[];
    body: Block[];
}

export interface FunctionCallBlock {
    type: "FunctionCall";
    id: string;
    name: string;
    args: Expression[];
}

export type Block = VarDeclarationBlock | AssignmentBlock | IfBlock | WhileBlock | BeginEndBlock | ForBlock | ArrayDeclarationBlock | ArrayAssignmentBlock | FunctionDeclarationBlock | FunctionCallBlock;

export interface Program {blocks: Block[]};