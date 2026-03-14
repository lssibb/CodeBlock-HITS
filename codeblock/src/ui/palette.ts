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

    let debugMode = false;
    const toggleButton = document.createElement('button');
    toggleButton.className = 'exec-btn';
    toggleButton.textContent = 'Отладка: ВЫКЛ';
    toggleButton.style.backgroundColor = '#888';
    toggleButton.addEventListener('click', () => {
        debugMode = !debugMode;
        toggleButton.textContent = debugMode ? 'Отладка: ВКЛ' : 'Отладка: ВЫКЛ';
        toggleButton.style.backgroundColor = debugMode ? '#e8a020' : '#888';
    });

    const executeButton = document.createElement('button');
    executeButton.className = 'exec-btn';
    executeButton.textContent='Выполнить';

    const stepButton = document.createElement('button');
    stepButton.className = 'exec-btn';
    stepButton.textContent='Шаг';
    stepButton.style.display = 'none';

    const autoButton = document.createElement('button');
    autoButton.className = 'exec-btn';
    autoButton.textContent='Авто';
    autoButton.style.display = 'none';

    const stopButton = document.createElement('button');
    stopButton.className = 'exec-btn';
    stopButton.textContent='Стоп';
    stopButton.style.display = 'none';
    stopButton.style.backgroundColor = '#d32f2f';

    let interpreter: Interpreter | null = null;
    let blockIndex = 0;
    let autoTimer: number | null = null;

    function highlightBlock(id: string | null) {
        document.querySelectorAll('.block.active').forEach(el => el.classList.remove('active'));
        if (id) {
            const el = document.querySelector(`.block[data-block-id="${id}"]`);
            if (el) el.classList.add('active');
        }
    }

    function showDebugButtons(visible: boolean) {
        executeButton.style.display = visible ? 'none' : '';
        stepButton.style.display = visible ? '' : 'none';
        autoButton.style.display = visible ? '' : 'none';
        stopButton.style.display = visible ? '' : 'none';
    }

    function finishDebug() {
        if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
        highlightBlock(null);
        const interp = interpreter;
        interpreter = null;
        blockIndex = 0;
        showDebugButtons(false);

        if (interp) {
            const vars = interp.getVariables();
            const obj = Object.fromEntries(vars);
            let result = '';
            for (const key in obj) {
                result += `${key} = ${obj[key]}\n`;
            }
            const arrays = interp.getArrays();
            for (const [name, arr] of arrays) {
                result += `${name} = [${arr.join(', ')}]\n`;
            }
            alert(result || 'Нет переменных');
        }
    }

    function doStep() {
        if (!interpreter) return;
        const blocks = state.program.blocks;
        if (blockIndex < blocks.length) {
            interpreter.executeBlock(blocks[blockIndex]);
            blockIndex++;
        }
        if (blockIndex < blocks.length) {
            highlightBlock(blocks[blockIndex].id);
        } else {
            finishDebug();
        }
    }

    executeButton.addEventListener('click', () => {
        if (state.program.blocks.length === 0) return;
        if (!debugMode) {
            try {
                const interp = new Interpreter();
                interp.execute(state.program);
                const vars = interp.getVariables();
                const obj = Object.fromEntries(vars);
                let result = '';
                for (const key in obj) {
                    result += `${key} = ${obj[key]}\n`;
                }
                const arrays = interp.getArrays();
                for (const [name, arr] of arrays) {
                    result += `${name} = [${arr.join(', ')}]\n`;
                }
                alert(result || 'Нет переменных');
            } catch (error) {
                alert(`Ошибка выполнения: ${error instanceof Error ? error.message : String(error)}`);
            }
        } else {
            interpreter = new Interpreter();
            blockIndex = 0;
            showDebugButtons(true);
            highlightBlock(state.program.blocks[0].id);
        }
    });

    stepButton.addEventListener('click', doStep);

    autoButton.addEventListener('click', () => {
        if (autoTimer) { clearInterval(autoTimer); autoTimer = null; autoButton.textContent = 'Авто'; return; }
        autoButton.textContent = 'Пауза';
        autoTimer = setInterval(doStep, 500);
    });

    stopButton.addEventListener('click', () => {
        if (!interpreter) return;
        finishDebug();
    });

    palette.appendChild(toggleButton);
    palette.appendChild(executeButton);
    palette.appendChild(stepButton);
    palette.appendChild(autoButton);
    palette.appendChild(stopButton);
}
