import { addBlock, state } from "../app/state.ts";
import type { Block} from '../core/types';
import {Interpreter} from '../core/interpreter.ts'


export function initPalette():void{

    const palette = document.getElementById('palette')!;
    const buttonTypes: Array<{ label: string, block: Block }> = [
        {label:'Объявить переменную', block:{type:'VarDeclaration',id:"",variables:[]}},
        {label:'Присвоить значение', block:{type:'Assignment',id:"",variable:'{укажите переменную}',expression:{type:'Number',value:0}}},
        {label:'Условие', block:{type:'If',id:"",condition:{type: "Comparison",left:{type:'Number',value:0},right:{type:'Number',value:0},operator:"=="},body:[]}},
        {label:'Цикл пока',block:{type:'While',id:"",condition:{type: "Comparison",left:{type:'Number',value:0},right:{type:'Number',value:0},operator:"=="},body:[]}},
        {label:'Блок Begin-End', block:{type:'BeginEnd', id:"", body:[]}},
        {label:'Цикл для', block:{type:'For', id:"", variable:'i', from:{type:'Number',value:1}, to:{type:'Number',value:10}, body:[]}},
        {label:'Объявить массив', block:{type:'ArrayDeclaration', id:"", name:'arr', size:{type:'Number',value:10}}},
        {label:'Запись в массив', block:{type:'ArrayAssignment', id:"", name:'arr', index:{type:'Number',value:0}, expression:{type:'Number',value:0}}}

    ]
    for(let i = 0; i < buttonTypes.length; i++){
        const button = buttonTypes[i];
        const element = document.createElement('button');
        element.textContent=button.label;
        element.draggable = true;
        element.addEventListener('click', ()=>{
            addBlock(button.block);
        })
        element.addEventListener('dragstart', (e) => {
            e.dataTransfer!.setData('application/codeblock-new', JSON.stringify(button.block));
            e.dataTransfer!.effectAllowed = 'copyMove';
        });
        palette.appendChild(element);
    }

        const executeButton = document.createElement('button');
        executeButton.className = 'exec-btn';
        executeButton.textContent='Выполнить';
        executeButton.addEventListener('click', ()=>{
            try {const interpreter = new Interpreter();
            interpreter.execute(state.program);
            const vars = interpreter.getVariables();
            const obj = Object.fromEntries(vars);
            let result = '';
            for (const key in obj) {
                result += `${key} = ${obj[key]}\n`;
            }
            const arrays = interpreter.getArrays();
            for (const [name, arr] of arrays) {
                result += `${name} = [${arr.join(', ')}]\n`;
            }
            alert(result || 'Нет переменных');

            } catch (error) { alert(`Ошибка выполнения: ${error instanceof Error ? error.message : String(error)}`);}
        })
        palette.appendChild(executeButton);


    

}