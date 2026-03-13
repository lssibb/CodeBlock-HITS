import type { Block, IfBlock, Program, WhileBlock } from "../core/types"



import { render } from "../ui/renderer";

export const state: { program: Program } = {
    program: { blocks: [] }
}

export function addBlock(block:Block): void{
    const newBlock = { ...block };
    newBlock.id=crypto.randomUUID();
    state.program.blocks.push(newBlock);
    render(state.program);
}

export function addBlockToChild(parentId: string,block:Block, target: 'body' | 'elseBody'): void{
    const parentBlock = state.program.blocks.find( b => b.id ==parentId) as IfBlock | WhileBlock;
    if (parentBlock){
        block.id=crypto.randomUUID();
        if (target === 'body') {
            parentBlock.body.push(block);
        } 
        else {
        const ifParent = parentBlock as IfBlock;
        if (!ifParent.elseBody) ifParent.elseBody = [];
        ifParent.elseBody.push(block);

        }
            render(state.program);
    }
}

export function removeBlock(id:string):void{
    state.program.blocks = state.program.blocks.filter(b => b.id !== id);
    render(state.program);
}

export function updateBlock(id: string, changes: Partial<Block>): void {
    const block = state.program.blocks.find(b => b.id === id)
    if (block) {
        Object.assign(block, changes)
        render(state.program)
    }
}

export function findBlockById(blocks: Block[], id: string): Block | undefined {
    for (const block of blocks) {
        
        if (block.id === id) {
            return block;
        }
        if (block.type === 'If' || block.type === 'While') {
            const result = findBlockById(block.body, id);
            if (result) return result;
        }
        
        if (block.type === 'If' && block.elseBody) {
            const result = findBlockById(block.elseBody, id);
            if (result) return result;
        }
    }
    
    return undefined;
}
