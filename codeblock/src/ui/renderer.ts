import type { Block, Program, Expression, Condition } from '../core/types';


function parseExpression(expression:Expression): string{
    switch(expression.type){
        case "Number":{
            return String(expression.value);
        }

        case "Variable":{
            return expression.name;
        }

        case "BinaryOp":{
            return `${parseExpression(expression.left)} ${expression.operator} ${parseExpression(expression.right)}`;
        }
    }
}

function parseCondition (condition:Condition): string{
    return `${parseExpression(condition.left)} ${condition.operator} ${parseExpression(condition.right)}`;
}


export function createBlockElement(block:Block): HTMLElement {
    switch (block.type){

        case "VarDeclaration":{
            const div = document.createElement('div');
            div.textContent = `Объявить ${block.variables.join(', ')}`;
            return div;
        }

        case "Assignment":{
            const div = document.createElement('div');
            div.textContent = `${block.variable} = ${parseExpression(block.expression)}`;
            return div;
        }
        
        case "If":{
            const div = document.createElement('div');
            const firstHeader = document.createElement(`div`);
            const ifBody = document.createElement(`div`);
            const secondHeader = document.createElement(`div`);
            const elseBody = document.createElement(`div`);

            firstHeader.textContent = `Если ${parseCondition(block.condition)}, то`;
            div.appendChild(firstHeader);

            for (const subBlock of block.body ){
                ifBody.appendChild(createBlockElement(subBlock));
            }
            div.appendChild(ifBody);

            if(block.elseBody){
                secondHeader.textContent = `Иначе`;
                for (const subBlock of block.elseBody){
                    elseBody.appendChild(createBlockElement(subBlock));
                }
                div.appendChild(secondHeader);
                div.appendChild(elseBody);                
            }

            return div;
        }

        case "While":{
            const div = document.createElement('div');
            const header = document.createElement(`div`);
            const body = document.createElement(`div`);

            header.textContent = `Пока ${parseCondition(block.condition)}, `
            div.appendChild(header);
            
            for (const subBlock of block.body){
                body.appendChild(createBlockElement(subBlock));
            }
            div.appendChild(body);
            return div;
        }
        
        default: {
            throw new Error(`Неизвестный тип блока`);
        }
    }
}

export function render (program: Program): void{
    const container = document.getElementById('app')!
    container.innerHTML = '' 

    for(const block of program.blocks){
        container.appendChild(createBlockElement(block));
    }
}