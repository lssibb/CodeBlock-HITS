import { Interpreter } from './core/interpreter';
import type { Program } from './core/types';
import { render } from './ui/renderer'

const program1: Program = {
  blocks: [
    {type: "VarDeclaration", id: "1", variables: ["x", "y"]},
    {type: "Assignment", id: "2", variable: "x", expression: {type: "Number", value: 10}},
    {type: "Assignment",
       id: "3",
      variable: "y",
      expression: {
        type: "BinaryOp",
        operator:"+",
        left:{type:"Variable", name: "x"},
        right: {type: "Number", value: 5
        }
      }
    }
  ] 
}

const program2: Program = {
  blocks: [
    {type:"VarDeclaration", id:"1",variables:["x","result"]},
    {type: "Assignment", id: "2", variable:"x",expression:{type:"Number", value:15}},
    {type: "If",
       id: "3",
        condition: {type: "Comparison", operator:">", left:{type:"Variable", name:"x"}, right:{type:"Number", value:10}},
         body: [
      {type:"Assignment", id: "4", variable:"result", expression:{type:"Number", value:1}},
    ],
    elseBody: [
      {type:"Assignment", id: "5", variable:"result", expression:{type:"Number", value:0}},
    ]
  }],
}

const interp1 = new Interpreter();
interp1.execute(program1);
render(program1);
console.log("Тест 1:", interp1.getVariables());

const interp2 = new Interpreter();
interp2.execute(program2);
render(program2);
console.log("Тест 2:", interp2.getVariables());

