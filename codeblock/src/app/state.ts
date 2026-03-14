import type { Block, IfBlock, Program, WhileBlock, BeginEndBlock, ForBlock, FunctionDeclarationBlock } from "../core/types"



import { render } from "../ui/renderer";

export const state: { program: Program } = {
    program: { blocks: [] }
}

export function addBlock(block:Block): void{
    const newBlock = JSON.parse(JSON.stringify(block)) as Block;
    newBlock.id=crypto.randomUUID();
    state.program.blocks.push(newBlock);
    render(state.program);
}

export function addBlockToChild(parentId: string, block: Block, target: 'body' | 'elseBody'): void {
    const parentBlock = findBlockById(state.program.blocks, parentId) as IfBlock | WhileBlock | BeginEndBlock | ForBlock | FunctionDeclarationBlock;
    if (parentBlock) {
        block.id = crypto.randomUUID();
        if (target === 'body') {
            parentBlock.body.push(block);
        } else {
            const ifParent = parentBlock as IfBlock;
            if (!ifParent.elseBody) ifParent.elseBody = [];
            ifParent.elseBody.push(block);
        }
        render(state.program);
    }
}

export function insertBlockToChild(parentId: string, block: Block, target: 'body' | 'elseBody', index: number): void {
    const parentBlock = findBlockById(state.program.blocks, parentId) as IfBlock | WhileBlock | BeginEndBlock | ForBlock | FunctionDeclarationBlock;
    if (parentBlock) {
        const newBlock = JSON.parse(JSON.stringify(block)) as Block;
        newBlock.id = crypto.randomUUID();

        if (target === 'body') {
            const list = parentBlock.body;
            const clampedIndex = Math.max(0, Math.min(index, list.length));
            list.splice(clampedIndex, 0, newBlock);
        } else {
            const ifParent = parentBlock as IfBlock;
            if (!ifParent.elseBody) ifParent.elseBody = [];
            const list = ifParent.elseBody;
            const clampedIndex = Math.max(0, Math.min(index, list.length));
            list.splice(clampedIndex, 0, newBlock);
        }

        render(state.program);
    }
}

export function removeBlock(id:string):void{
    state.program.blocks = removeBlockRecursive(state.program.blocks, id);
render(state.program);

}

export function updateBlock(id: string, changes: Partial<Block>): void {
    const block = findBlockById(state.program.blocks, id)

    if (block) {
        Object.assign(block, changes)
        render(state.program)
    }
}

export function findBlockById(blocks: Block[], id: string): Block | undefined {
    for (const block of blocks) {

    const { id: blockId, type } = block;

        
        if (blockId === id) {
            return block;
        }
        if (type === 'If' || type === 'While' || type === 'BeginEnd' || type === 'For' || type === 'FunctionDeclaration') {
            const result = findBlockById(block.body, id);
            if (result) return result;
        }
        
        if (type === 'If' && block.elseBody) {
            const result = findBlockById(block.elseBody, id);
            if (result) return result;
        }
    }
    
    return undefined;
}
export function moveBlock(fromId: string, toIndex: number): void {
    const block = findBlockById(state.program.blocks, fromId);
    if (!block) return;
    state.program.blocks = removeBlockRecursive(state.program.blocks, fromId);
    state.program.blocks.splice(toIndex, 0, block);
    render(state.program);
}

export function moveBlockToChild(fromId: string, parentId: string | null, target: 'body' | 'elseBody' | 'root', index: number): void {
    if (target === 'root') {
        moveBlock(fromId, index);
        return;
    }

    const block = findBlockById(state.program.blocks, fromId);
    if (!block) return;

    state.program.blocks = removeBlockRecursive(state.program.blocks, fromId);

    const parentBlock = findBlockById(state.program.blocks, parentId!) as IfBlock | WhileBlock | BeginEndBlock | ForBlock | FunctionDeclarationBlock;
    if (!parentBlock) {
        render(state.program);
        return;
    }

    const list = target === 'body'
        ? parentBlock.body
        : ((parentBlock as IfBlock).elseBody ?? ((parentBlock as IfBlock).elseBody = []));

    const clampedIndex = Math.max(0, Math.min(index, list.length));
    list.splice(clampedIndex, 0, block);
    render(state.program);
}

export function insertBlockAt(block: Block, index: number): void {
    block.id = crypto.randomUUID();
    state.program.blocks.splice(index, 0, block);
    render(state.program);
}

export function removeBlockRecursive(blocks: Block[], id: string): Block[] {
    return blocks.filter(b => b.id !== id).map(b => {
        if (b.type === 'If' || b.type === 'While'|| b.type === 'BeginEnd' || b.type === 'For' || b.type === 'FunctionDeclaration') {
            b.body = removeBlockRecursive(b.body, id);
        }
        if (b.type === 'If' && b.elseBody) {
            b.elseBody = removeBlockRecursive(b.elseBody, id);
        }
        return b;
    });
}

