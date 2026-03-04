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
    ]
    for(const button of buttonTypes){
        const element = document.createElement('button');
        element.textContent=button.label;
        element.addEventListener('click', ()=>{
            addBlock(button.block);
        })
        palette.appendChild(element);
    }

        const executeButton = document.createElement('button');
        executeButton.className = 'exec-btn';
        executeButton.textContent='Выполнить';
        executeButton.addEventListener('click', ()=>{
            const interpreter = new Interpreter();
            interpreter.execute(state.program);
            alert(JSON.stringify(Object.fromEntries(interpreter.getVariables()), null, 2))
        })
        palette.appendChild(executeButton);


    

}