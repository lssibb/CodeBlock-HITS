import type { Block, Program, Expression, Condition } from '../core/types';
import { updateBlock } from '../app/state';

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

function textToExpression(text:string): Expression{
    const operatorsLow = ['+', '-'];
    const operatorsHigh = ['*', '/','%'];

    text = text.trim();

    let op = operatorsLow.find(o => text.includes(o));
    if(op==undefined) op = operatorsHigh.find(o => text.includes(o));
    
    

    if (op !== undefined) {
        const idx = text.indexOf(`${op}`);
            return {type:'BinaryOp',operator:`${op}`,left:textToExpression(text.slice(0,idx)),right:textToExpression(text.slice(idx+1))} as Expression;
    } 

    else {
        if(text !== '' && !isNaN(Number(text))){
            return {type:"Number",value:Number(text)};
        }
        else{
            return {type:"Variable",name:text};
        }
    }
}

function textToСondition(text:string): Condition{
    const operatorsDouble = ['<=', '>=', '==', '!='];
    const operators = ['<', '>'];

    text = text.trim();

    let op = operatorsDouble.find(o => text.includes(o));
    if(op==undefined) op = operators.find(o => text.includes(o));
    
    

    if (op !== undefined) {
        const idx = text.indexOf(`${op}`);
            return {type:'Comparison',operator:`${op}`,left:textToExpression(text.slice(0,idx)),right:textToExpression(text.slice(idx+1))} as Condition;
    } 

    else throw new Error('Некорректное условие: оператор сравнения не найден');
}

export function createBlockElement(block:Block): HTMLElement {
    switch (block.type){

        case "VarDeclaration":{
            const div = document.createElement('div');
            div.className = 'block';
            const span1 = document.createElement('span');
            const span2 = document.createElement('span');

            span1.textContent = `Объявить `;
            span2.textContent = block.variables.length > 0 
                ? block.variables.join(', ')
                : 'Введите названия...';

            span2.className = 'editable';

            div.appendChild(span1)
            div.appendChild(span2)

            span2.addEventListener('click',() =>{
                span2.innerHTML = '';
                const input = document.createElement('input');
                input.value = `${block.variables.join(', ')}`;
                span2.appendChild(input);
                input.focus();

                input.addEventListener('blur',()=>{

                    const newVariables=input.value.split(', ').filter(v => v.trim() !== '');

                    updateBlock(block.id,{variables:newVariables});
                    

                })
            })
            return div;
        }

        case "Assignment":{
            const div = document.createElement('div');
            div.className = 'block';
            const span1 = document.createElement('span');
            const span2 = document.createElement('span');
            const span3 = document.createElement('span');

            span1.textContent = `${block.variable}`;
            span2.textContent = ' = ';
            span3.textContent = `${parseExpression(block.expression)}`;

            div.appendChild(span1);
            div.appendChild(span2);
            div.appendChild(span3);

            span1.className = 'editable';
            span3.className = 'editable';

            span1.addEventListener('click',() =>{
                span1.innerHTML = '';
                const input = document.createElement('input');
                input.value = `${block.variable}`;
                span1.appendChild(input);
                input.focus();

                input.addEventListener('blur',()=>{
                    
                    const newVariable=input.value.trim();

                    updateBlock(block.id,{variable:newVariable});
                    

                })
            })
            
            span3.addEventListener('click',() =>{
                span3.innerHTML = '';
                const input = document.createElement('input');
                input.value = `${parseExpression(block.expression)}`;
                span3.appendChild(input);
                input.focus();

                input.addEventListener('blur',()=>{
                    
                    updateBlock(block.id,{expression:textToExpression(input.value)})

                })
            })
            return div;
        }
        
        case "If":{
            const div = document.createElement('div');
            div.className = 'block';
            const firstHeader = document.createElement(`div`);
            const ifBody = document.createElement(`div`);
            const secondHeader = document.createElement(`div`);
            const elseBody = document.createElement(`div`);
            const span1 = document.createElement('span');
            const span2 = document.createElement('span');
            const span3 = document.createElement('span');

            span1.textContent = 'Если ';
            span2.textContent = `${parseCondition(block.condition)}`;
            span3.textContent = ', то';

            span2.className = 'editable';

            firstHeader.appendChild(span1);
            firstHeader.appendChild(span2);
            firstHeader.appendChild(span3);

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

            span2.addEventListener('click',() =>{
                span2.innerHTML = '';
                const input = document.createElement('input');
                input.value = `${parseCondition(block.condition)}`;
                span2.appendChild(input);
                input.focus();

                input.addEventListener('blur',()=>{
                    
                    updateBlock(block.id,{condition:textToСondition(input.value)})

                })
            })



            return div;
        }

        case "While":{
            const div = document.createElement('div');
            div.className = 'block';
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
    const container = document.getElementById('workspace')!
    container.innerHTML = '' 

    for(const block of program.blocks){
        container.appendChild(createBlockElement(block));
    }
}