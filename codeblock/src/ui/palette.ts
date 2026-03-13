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
            const el = document.querySelector(`.block[data-id="${id}"]`);
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
        const vars = interpreter ? Object.fromEntries(interpreter.getVariables()) : {};
        highlightBlock(null);
        interpreter = null;
        blockIndex = 0;
        showDebugButtons(false);
        alert(JSON.stringify(vars, null, 2));
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
            const interp = new Interpreter();
            interp.execute(state.program);
            alert(JSON.stringify(Object.fromEntries(interp.getVariables()), null, 2));
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