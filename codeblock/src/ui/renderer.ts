import type { Block, Program, Expression, Condition } from '../core/types';
import { updateBlock, addBlockToChild, removeBlock } from '../app/state';

function parseExpression(expression:Expression): string{
    switch(expression.type){
        case "Number":{
            return String(expression.value);
        }

        case "String":{
            return `"${expression.value}"`;
        }

        case "Boolean":{
            return expression.value ? 'true' : 'false';
        }

        case "Variable":{
            return expression.name;
        }

        case "ArrayAccess":{
            return `${expression.name}[${parseExpression(expression.index)}]`;
        }

        case "FieldAccess":{
            return `${expression.object}.${expression.field}`;
        }

        case "BinaryOp":{
            const left = parseExpression(expression.left);
            const right = parseExpression(expression.right);
            const wrapL = expression.left.type === 'BinaryOp' ? `(${left})` : left;
            const wrapR = expression.right.type === 'BinaryOp' ? `(${right})` : right;
            return `${wrapL} ${expression.operator} ${wrapR}`;
        }
    }
}

function parseCondition (condition:Condition): string{
    switch (condition.type) {
        case "Comparison":
            return `${parseExpression(condition.left)} ${condition.operator} ${parseExpression(condition.right)}`;
        case "LogicalOp": {
            const left = parseCondition(condition.left);
            const right = parseCondition(condition.right);
            return `(${left}) ${condition.operator} (${right})`;
        }
        case "Not":
            return `NOT (${parseCondition(condition.operand)})`;
    }
}

function textToExpression(text:string): Expression{
    const operatorsLow = ['+', '-'];
    const operatorsHigh = ['*', '/','%'];

    text = text.trim();

    while (text[0] === '(' && text[text.length - 1] === ')') {
        let depth = 0, wraps = true;
        for (let i = 0; i < text.length - 1; i++) {
            if (text[i] === '(') depth++;
            else if (text[i] === ')') depth--;
            if (depth === 0) { wraps = false; break; }
        }
        if (!wraps) break;
        text = text.slice(1, -1).trim();
    }

    let splitIdx = -1;
    let splitOp = '';
    for (const ops of [operatorsLow, operatorsHigh]) {
        let depth = 0;
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '(') depth++;
            else if (text[i] === ')') depth--;
            else if (depth === 0) {
                for (const op of ops) {
                    if (text.substring(i, i + op.length) === op) {
                        splitIdx = i;
                        splitOp = op;
                    }
                }
            }
        }
        if (splitIdx !== -1) break;
    }

    if (splitIdx !== -1) {
        return {type:'BinaryOp', operator:splitOp,
            left:textToExpression(text.slice(0, splitIdx)),
            right:textToExpression(text.slice(splitIdx + splitOp.length))} as Expression;
    }

    if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
        return {type:"String", value: text.slice(1, -1)};
    }

    if (text === 'true') return {type:"Boolean", value: true};
    if (text === 'false') return {type:"Boolean", value: false};

    if (text !== '' && !isNaN(Number(text))) {
        return {type:"Number", value:Number(text)};
    }

    const bracketIdx = text.indexOf('[');
    if (bracketIdx !== -1 && text.endsWith(']')) {
        const name = text.slice(0, bracketIdx).trim();
        const indexExpr = text.slice(bracketIdx + 1, -1).trim();
        return {type:"ArrayAccess", name, index: textToExpression(indexExpr)};
    }

    if (text.includes('.') && !text.includes('[')) {
        const dotIdx = text.indexOf('.');
        return {type:"FieldAccess", object: text.slice(0, dotIdx).trim(), field: text.slice(dotIdx + 1).trim()};
    }

    return {type:"Variable", name:text};
}

function textToCondition(text:string): Condition{
    text = text.trim();

    while (text.startsWith('(') && text.endsWith(')')) {
        let depth = 0, wraps = true;
        for (let i = 0; i < text.length - 1; i++) {
            if (text[i] === '(') depth++;
            else if (text[i] === ')') depth--;
            if (depth === 0) { wraps = false; break; }
        }
        if (!wraps) break;
        text = text.slice(1, -1).trim();
    }

    if (text.toUpperCase().startsWith('NOT ')) {
        return { type: 'Not', operand: textToCondition(text.slice(4)) };
    }

    let depth = 0;
    let lastOr = -1;
    let lastAnd = -1;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '(') depth++;
        else if (text[i] === ')') depth--;
        else if (depth === 0) {
            if (text.substring(i, i + 3).toUpperCase() === 'OR ' || text.substring(i, i + 2).toUpperCase() === 'OR') {
                if (i + 2 <= text.length && (i + 2 === text.length || text[i+2] === ' ' || text[i+2] === '(')) {
                    lastOr = i;
                }
            }
            if (text.substring(i, i + 4).toUpperCase() === 'AND ' || text.substring(i, i + 3).toUpperCase() === 'AND') {
                if (i + 3 <= text.length && (i + 3 === text.length || text[i+3] === ' ' || text[i+3] === '(')) {
                    lastAnd = i;
                }
            }
        }
    }

    if (lastOr !== -1) {
        return {
            type: 'LogicalOp', operator: 'OR',
            left: textToCondition(text.slice(0, lastOr)),
            right: textToCondition(text.slice(lastOr + 2))
        };
    }

    if (lastAnd !== -1) {
        return {
            type: 'LogicalOp', operator: 'AND',
            left: textToCondition(text.slice(0, lastAnd)),
            right: textToCondition(text.slice(lastAnd + 3))
        };
    }

    const operatorsDouble = ['<=', '>=', '==', '!='];
    const operatorsSingle = ['<', '>'];

    let op = operatorsDouble.find(o => text.includes(o));
    if (op === undefined) op = operatorsSingle.find(o => text.includes(o));

    if (op !== undefined) {
        const idx = text.indexOf(op);
        return {type:'Comparison', operator: op, left:textToExpression(text.slice(0,idx)), right:textToExpression(text.slice(idx+op.length))} as Condition;
    }

    throw new Error('Некорректное условие: оператор сравнения не найден');
}

export function createBlockElement(block:Block): HTMLElement {
    switch (block.type){

        case "VarDeclaration":{
            const div = document.createElement('div');
            div.className = 'block';
            div.dataset.type = 'var';
            div.dataset.blockId = block.id;
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
            const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'x';
                deleteBtn.className = 'delete-btn';
                deleteBtn.addEventListener('click', () => {
                removeBlock(block.id);
                });
                div.appendChild(deleteBtn);
            return div;
        }

        case "Assignment":{
            const div = document.createElement('div');
            div.className = 'block';
            div.dataset.type = 'assign';
            div.dataset.blockId = block.id;
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
                if (block.expression.type === 'Number') input.type = 'number';
                input.value = `${parseExpression(block.expression)}`;
                span3.appendChild(input);
                input.focus();

                input.addEventListener('blur',()=>{
                    updateBlock(block.id,{expression:textToExpression(input.value)})
                })
            })
            const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'x';
                deleteBtn.className = 'delete-btn';
                deleteBtn.addEventListener('click', () => {
                removeBlock(block.id);
                });
                div.appendChild(deleteBtn);
            return div;
        }

        case "If":{
            const div = document.createElement('div');
            div.className = 'block';
            div.dataset.type = 'condition';
            div.dataset.blockId = block.id;
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

            const addIfBodyBtn = document.createElement('button');
            addIfBodyBtn.textContent = '+ Добавить блок';
            addIfBodyBtn.addEventListener('click', () => {
                const newBlock = {
                    type: 'Assignment', id: '',
                    variable: '{укажите переменную}',
                    expression: {type:'Number', value:0}
                } as Block;
                addBlockToChild(block.id, newBlock, 'body');
            });
            ifBody.appendChild(addIfBodyBtn);
            div.appendChild(ifBody);

            if(block.elseBody){
                secondHeader.textContent = `Иначе`;
                for (const subBlock of block.elseBody){
                    elseBody.appendChild(createBlockElement(subBlock));
                }
                const addElseBodyBtn = document.createElement('button');
                addElseBodyBtn.textContent = '+ Добавить блок';
                addElseBodyBtn.addEventListener('click', () => {
                    const newBlock = {
                        type: 'Assignment', id: '',
                        variable: '{укажите переменную}',
                        expression: {type:'Number', value:0}
                    } as Block;
                    addBlockToChild(block.id, newBlock, 'elseBody');
                });
                elseBody.appendChild(addElseBodyBtn);
                div.appendChild(secondHeader);
                div.appendChild(elseBody);
            } else {
                const addElseBtn = document.createElement('button');
                addElseBtn.textContent = '+ Добавить иначе';
                addElseBtn.addEventListener('click', () => {
                    updateBlock(block.id, { elseBody: [] });
                });
                div.appendChild(addElseBtn);
            }

            span2.addEventListener('click',() =>{
                span2.innerHTML = '';
                const input = document.createElement('input');
                input.value = `${parseCondition(block.condition)}`;
                span2.appendChild(input);
                input.focus();

                input.addEventListener('blur',()=>{
                    updateBlock(block.id,{condition:textToCondition(input.value)})
                })
            })

            const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'x';
                deleteBtn.className = 'delete-btn';
                deleteBtn.addEventListener('click', () => {
                removeBlock(block.id);
                });
                div.appendChild(deleteBtn);
            return div;
        }

        case "While":{
            const div = document.createElement('div');
            div.className = 'block';
            div.dataset.type = 'loop';
            div.dataset.blockId = block.id;
            const header = document.createElement(`div`);
            const body = document.createElement(`div`);

            const span1 = document.createElement('span');
            const span2 = document.createElement('span');
            const span3 = document.createElement('span');

            span1.textContent = 'Пока ';
            span2.textContent = `${parseCondition(block.condition)}`;
            span3.textContent = ', ';

            span2.className = 'editable';

            header.appendChild(span1);
            header.appendChild(span2);
            header.appendChild(span3);

            span2.addEventListener('click',() =>{
                span2.innerHTML = '';
                const input = document.createElement('input');
                input.value = `${parseCondition(block.condition)}`;
                span2.appendChild(input);
                input.focus();

                input.addEventListener('blur',()=>{
                    updateBlock(block.id,{condition:textToCondition(input.value)})
                })
            })

            div.appendChild(header);

            for (const subBlock of block.body){
                body.appendChild(createBlockElement(subBlock));
            }

            const addButton = document.createElement('button');
            addButton.textContent = '+ Добавить блок';
            addButton.addEventListener('click', () => {
                const newBlock = {
                    type: 'Assignment',
                    id: '',
                    variable: '{укажите переменную}',
                    expression: {type:'Number', value:0}
                } as Block;
                addBlockToChild(block.id, newBlock, 'body');
            });
            body.appendChild(addButton);

            div.appendChild(body);
            const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'x';
                deleteBtn.className = 'delete-btn';
                deleteBtn.addEventListener('click', () => {
                removeBlock(block.id);
                });
                div.appendChild(deleteBtn);
            return div;
        }

        case "BeginEnd":{
            const div = document.createElement('div');
            div.className = 'block';
            div.dataset.type = 'group';
            div.dataset.blockId = block.id;
            const header = document.createElement('div');
            const body = document.createElement('div');

            header.textContent = 'Начало';
            div.appendChild(header);

            for (const subBlock of block.body){
                body.appendChild(createBlockElement(subBlock));
            }

            const addButton = document.createElement('button');
            addButton.textContent = '+ Добавить блок';
            addButton.addEventListener('click', () => {
                const newBlock = {
                    type: 'Assignment',
                    id: '',
                    variable: '{укажите переменную}',
                    expression: {type:'Number', value:0}
                } as Block;
                addBlockToChild(block.id, newBlock, 'body');
            });
            body.appendChild(addButton);
            div.appendChild(body);

            const footer = document.createElement('div');
            footer.textContent = 'Конец';
            div.appendChild(footer);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'x';
            deleteBtn.className = 'delete-btn';
            deleteBtn.addEventListener('click', () => {
                removeBlock(block.id);
            });
            div.appendChild(deleteBtn);
            return div;
        }

        case "For": {
            const div = document.createElement('div');
            div.className = 'block';
            div.dataset.type = 'loop';
            div.dataset.blockId = block.id;
            const header = document.createElement('div');
            const body = document.createElement('div');

            const span1 = document.createElement('span');
            const spanVar = document.createElement('span');
            const span2 = document.createElement('span');
            const spanFrom = document.createElement('span');
            const span3 = document.createElement('span');
            const spanTo = document.createElement('span');

            span1.textContent = 'Для ';
            spanVar.textContent = block.variable;
            spanVar.className = 'editable';
            span2.textContent = ' от ';
            spanFrom.textContent = parseExpression(block.from);
            spanFrom.className = 'editable';
            span3.textContent = ' до ';
            spanTo.textContent = parseExpression(block.to);
            spanTo.className = 'editable';

            header.appendChild(span1);
            header.appendChild(spanVar);
            header.appendChild(span2);
            header.appendChild(spanFrom);
            header.appendChild(span3);
            header.appendChild(spanTo);

            spanVar.addEventListener('click', () => {
                spanVar.innerHTML = '';
                const input = document.createElement('input');
                input.value = block.variable;
                spanVar.appendChild(input);
                input.focus();
                input.addEventListener('blur', () => {
                    updateBlock(block.id, { variable: input.value.trim() });
                });
            });

            spanFrom.addEventListener('click', () => {
                spanFrom.innerHTML = '';
                const input = document.createElement('input');
                input.value = parseExpression(block.from);
                spanFrom.appendChild(input);
                input.focus();
                input.addEventListener('blur', () => {
                    updateBlock(block.id, { from: textToExpression(input.value) });
                });
            });

            spanTo.addEventListener('click', () => {
                spanTo.innerHTML = '';
                const input = document.createElement('input');
                input.value = parseExpression(block.to);
                spanTo.appendChild(input);
                input.focus();
                input.addEventListener('blur', () => {
                    updateBlock(block.id, { to: textToExpression(input.value) });
                });
            });

            div.appendChild(header);

            for (const subBlock of block.body) {
                body.appendChild(createBlockElement(subBlock));
            }

            const addButton = document.createElement('button');
            addButton.textContent = '+ Добавить блок';
            addButton.addEventListener('click', () => {
                const newBlock = {
                    type: 'Assignment',
                    id: '',
                    variable: '{укажите переменную}',
                    expression: { type: 'Number', value: 0 }
                } as Block;
                addBlockToChild(block.id, newBlock, 'body');
            });
            body.appendChild(addButton);
            div.appendChild(body);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'x';
            deleteBtn.className = 'delete-btn';
            deleteBtn.addEventListener('click', () => {
                removeBlock(block.id);
            });
            div.appendChild(deleteBtn);
            return div;
        }

        case "ArrayDeclaration": {
            const div = document.createElement('div');
            div.className = 'block';
            div.dataset.type = 'array';
            div.dataset.blockId = block.id;
            const span1 = document.createElement('span');
            const spanName = document.createElement('span');
            const span2 = document.createElement('span');
            const spanSize = document.createElement('span');

            span1.textContent = 'Массив ';
            spanName.textContent = block.name;
            spanName.className = 'editable';
            span2.textContent = ' размер ';
            spanSize.textContent = parseExpression(block.size);
            spanSize.className = 'editable';

            div.appendChild(span1);
            div.appendChild(spanName);
            div.appendChild(span2);
            div.appendChild(spanSize);

            spanName.addEventListener('click', () => {
                spanName.innerHTML = '';
                const input = document.createElement('input');
                input.value = block.name;
                spanName.appendChild(input);
                input.focus();
                input.addEventListener('blur', () => {
                    updateBlock(block.id, { name: input.value.trim() });
                });
            });

            spanSize.addEventListener('click', () => {
                spanSize.innerHTML = '';
                const input = document.createElement('input');
                input.type = 'number';
                input.value = parseExpression(block.size);
                spanSize.appendChild(input);
                input.focus();
                input.addEventListener('blur', () => {
                    updateBlock(block.id, { size: textToExpression(input.value) });
                });
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'x';
            deleteBtn.className = 'delete-btn';
            deleteBtn.addEventListener('click', () => {
                removeBlock(block.id);
            });
            div.appendChild(deleteBtn);
            return div;
        }

        case "ArrayAssignment": {
            const div = document.createElement('div');
            div.className = 'block';
            div.dataset.type = 'array';
            div.dataset.blockId = block.id;
            const spanName = document.createElement('span');
            const spanIdx = document.createElement('span');
            const span2 = document.createElement('span');
            const spanExpr = document.createElement('span');

            spanName.textContent = `${block.name}`;
            spanName.className = 'editable';
            spanIdx.textContent = `[${parseExpression(block.index)}]`;
            spanIdx.className = 'editable';
            span2.textContent = ' = ';
            spanExpr.textContent = parseExpression(block.expression);
            spanExpr.className = 'editable';

            div.appendChild(spanName);
            div.appendChild(spanIdx);
            div.appendChild(span2);
            div.appendChild(spanExpr);

            spanName.addEventListener('click', () => {
                spanName.innerHTML = '';
                const input = document.createElement('input');
                input.value = block.name;
                spanName.appendChild(input);
                input.focus();
                input.addEventListener('blur', () => {
                    updateBlock(block.id, { name: input.value.trim() });
                });
            });

            spanIdx.addEventListener('click', () => {
                spanIdx.innerHTML = '';
                const input = document.createElement('input');
                input.value = parseExpression(block.index);
                spanIdx.appendChild(input);
                input.focus();
                input.addEventListener('blur', () => {
                    updateBlock(block.id, { index: textToExpression(input.value) });
                });
            });

            spanExpr.addEventListener('click', () => {
                spanExpr.innerHTML = '';
                const input = document.createElement('input');
                input.value = parseExpression(block.expression);
                spanExpr.appendChild(input);
                input.focus();
                input.addEventListener('blur', () => {
                    updateBlock(block.id, { expression: textToExpression(input.value) });
                });
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'x';
            deleteBtn.className = 'delete-btn';
            deleteBtn.addEventListener('click', () => {
                removeBlock(block.id);
            });
            div.appendChild(deleteBtn);
            return div;
        }

        case "FunctionDeclaration": {
            const div = document.createElement('div');
            div.className = 'block';
            div.dataset.type = 'func';
            div.dataset.blockId = block.id;
            const header = document.createElement('div');
            const body = document.createElement('div');

            const span1 = document.createElement('span');
            const spanName = document.createElement('span');
            const span2 = document.createElement('span');
            const spanParams = document.createElement('span');

            span1.textContent = 'Функция ';
            spanName.textContent = block.name;
            spanName.className = 'editable';
            span2.textContent = '(';
            spanParams.textContent = block.params.length > 0 ? block.params.join(', ') : 'параметры...';
            spanParams.className = 'editable';

            header.appendChild(span1);
            header.appendChild(spanName);
            header.appendChild(span2);
            header.appendChild(spanParams);
            header.appendChild(document.createTextNode(')'));

            spanName.addEventListener('click', () => {
                spanName.innerHTML = '';
                const input = document.createElement('input');
                input.value = block.name;
                spanName.appendChild(input);
                input.focus();
                input.addEventListener('blur', () => {
                    updateBlock(block.id, { name: input.value.trim() });
                });
            });

            spanParams.addEventListener('click', () => {
                spanParams.innerHTML = '';
                const input = document.createElement('input');
                input.value = block.params.join(', ');
                spanParams.appendChild(input);
                input.focus();
                input.addEventListener('blur', () => {
                    const newParams = input.value.split(',').map(s => s.trim()).filter(s => s !== '');
                    updateBlock(block.id, { params: newParams });
                });
            });

            div.appendChild(header);

            for (const subBlock of block.body) {
                body.appendChild(createBlockElement(subBlock));
            }

            const addButton = document.createElement('button');
            addButton.textContent = '+ Добавить блок';
            addButton.addEventListener('click', () => {
                const newBlock = {
                    type: 'Assignment',
                    id: '',
                    variable: '{укажите переменную}',
                    expression: { type: 'Number', value: 0 }
                } as Block;
                addBlockToChild(block.id, newBlock, 'body');
            });
            body.appendChild(addButton);
            div.appendChild(body);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'x';
            deleteBtn.className = 'delete-btn';
            deleteBtn.addEventListener('click', () => {
                removeBlock(block.id);
            });
            div.appendChild(deleteBtn);
            return div;
        }

        case "FunctionCall": {
            const div = document.createElement('div');
            div.className = 'block';
            div.dataset.type = 'func';
            div.dataset.blockId = block.id;

            const span1 = document.createElement('span');
            const spanName = document.createElement('span');
            const span2 = document.createElement('span');
            const spanArgs = document.createElement('span');

            span1.textContent = 'Вызов ';
            spanName.textContent = block.name;
            spanName.className = 'editable';
            span2.textContent = '(';
            spanArgs.textContent = block.args.length > 0 ? block.args.map(a => parseExpression(a)).join(', ') : 'аргументы...';
            spanArgs.className = 'editable';

            div.appendChild(span1);
            div.appendChild(spanName);
            div.appendChild(span2);
            div.appendChild(spanArgs);
            div.appendChild(document.createTextNode(')'));

            spanName.addEventListener('click', () => {
                spanName.innerHTML = '';
                const input = document.createElement('input');
                input.value = block.name;
                spanName.appendChild(input);
                input.focus();
                input.addEventListener('blur', () => {
                    updateBlock(block.id, { name: input.value.trim() });
                });
            });

            spanArgs.addEventListener('click', () => {
                spanArgs.innerHTML = '';
                const input = document.createElement('input');
                input.value = block.args.map(a => parseExpression(a)).join(', ');
                spanArgs.appendChild(input);
                input.focus();
                input.addEventListener('blur', () => {
                    const newArgs = input.value.split(',').map(s => textToExpression(s.trim())).filter(Boolean);
                    updateBlock(block.id, { args: newArgs });
                });
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'x';
            deleteBtn.className = 'delete-btn';
            deleteBtn.addEventListener('click', () => {
                removeBlock(block.id);
            });
            div.appendChild(deleteBtn);
            return div;
        }

        case "StructDeclaration": {
            const div = document.createElement('div');
            div.className = 'block';
            div.dataset.type = 'struct';
            div.dataset.blockId = block.id;

            const span1 = document.createElement('span');
            const spanName = document.createElement('span');
            const span2 = document.createElement('span');
            const spanFields = document.createElement('span');

            span1.textContent = 'Структура ';
            spanName.textContent = block.name;
            spanName.className = 'editable';
            span2.textContent = ' { ';
            spanFields.textContent = block.fields.length > 0 ? block.fields.join(', ') : 'поля...';
            spanFields.className = 'editable';

            div.appendChild(span1);
            div.appendChild(spanName);
            div.appendChild(span2);
            div.appendChild(spanFields);
            div.appendChild(document.createTextNode(' }'));

            spanName.addEventListener('click', () => {
                spanName.innerHTML = '';
                const input = document.createElement('input');
                input.value = block.name;
                spanName.appendChild(input);
                input.focus();
                input.addEventListener('blur', () => {
                    updateBlock(block.id, { name: input.value.trim() });
                });
            });

            spanFields.addEventListener('click', () => {
                spanFields.innerHTML = '';
                const input = document.createElement('input');
                input.value = block.fields.join(', ');
                spanFields.appendChild(input);
                input.focus();
                input.addEventListener('blur', () => {
                    const newFields = input.value.split(',').map(s => s.trim()).filter(s => s !== '');
                    updateBlock(block.id, { fields: newFields });
                });
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'x';
            deleteBtn.className = 'delete-btn';
            deleteBtn.addEventListener('click', () => {
                removeBlock(block.id);
            });
            div.appendChild(deleteBtn);
            return div;
        }

        case "StructCreate": {
            const div = document.createElement('div');
            div.className = 'block';
            div.dataset.type = 'struct';
            div.dataset.blockId = block.id;

            const spanVar = document.createElement('span');
            const span1 = document.createElement('span');
            const spanStruct = document.createElement('span');

            spanVar.textContent = block.variable;
            spanVar.className = 'editable';
            span1.textContent = ' = новый ';
            spanStruct.textContent = block.structName;
            spanStruct.className = 'editable';

            div.appendChild(spanVar);
            div.appendChild(span1);
            div.appendChild(spanStruct);

            spanVar.addEventListener('click', () => {
                spanVar.innerHTML = '';
                const input = document.createElement('input');
                input.value = block.variable;
                spanVar.appendChild(input);
                input.focus();
                input.addEventListener('blur', () => {
                    updateBlock(block.id, { variable: input.value.trim() });
                });
            });

            spanStruct.addEventListener('click', () => {
                spanStruct.innerHTML = '';
                const input = document.createElement('input');
                input.value = block.structName;
                spanStruct.appendChild(input);
                input.focus();
                input.addEventListener('blur', () => {
                    updateBlock(block.id, { structName: input.value.trim() });
                });
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'x';
            deleteBtn.className = 'delete-btn';
            deleteBtn.addEventListener('click', () => {
                removeBlock(block.id);
            });
            div.appendChild(deleteBtn);
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
