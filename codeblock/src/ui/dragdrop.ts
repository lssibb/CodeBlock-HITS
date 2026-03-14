import { moveBlock, insertBlockAt } from '../app/state';
import type { Block } from '../core/types';

export function initDragDrop(): void {
    const workspace = document.getElementById('workspace')!;

    // Make existing blocks draggable after each render
    const observer = new MutationObserver(() => {
        setupBlockDragging();
    });
    observer.observe(workspace, { childList: true });

    // Workspace is a drop target
    workspace.addEventListener('dragover', (e) => {
        e.preventDefault();
        const hasNew = e.dataTransfer!.types.includes('application/codeblock-new');
        e.dataTransfer!.dropEffect = hasNew ? 'copy' : 'move';

        const target = getDropTarget(e, workspace);
        clearDropIndicators(workspace);
        if (target) {
            target.classList.add('drop-above');
        } else {
            workspace.classList.add('drop-end');
        }
    });

    workspace.addEventListener('dragleave', () => {
        clearDropIndicators(workspace);
    });

    workspace.addEventListener('drop', (e) => {
        e.preventDefault();
        clearDropIndicators(workspace);

        const dropIndex = getDropIndex(e, workspace);

        // From palette (new block)
        const newBlockData = e.dataTransfer!.getData('application/codeblock-new');
        if (newBlockData) {
            const block = JSON.parse(newBlockData) as Block;
            insertBlockAt(block, dropIndex);
            return;
        }

        // Reorder existing block
        const blockId = e.dataTransfer!.getData('application/codeblock-move');
        if (blockId) {
            moveBlock(blockId, dropIndex);
        }
    });
}

function setupBlockDragging(): void {
    const workspace = document.getElementById('workspace')!;
    const blocks = workspace.children;

    for (let i = 0; i < blocks.length; i++) {
        const el = blocks[i] as HTMLElement;
        if (!el.classList.contains('block')) continue;
        if (el.draggable) continue;

        el.draggable = true;
        el.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            const id = el.dataset.blockId;
            if (id) {
                e.dataTransfer!.setData('application/codeblock-move', id);
                e.dataTransfer!.effectAllowed = 'move';
                el.classList.add('dragging');
            }
        });
        el.addEventListener('dragend', () => {
            el.classList.remove('dragging');
        });
    }
}

function getDropTarget(e: DragEvent, workspace: HTMLElement): HTMLElement | null {
    const blocks = workspace.children;
    for (let i = 0; i < blocks.length; i++) {
        const el = blocks[i] as HTMLElement;
        if (!el.classList.contains('block')) continue;
        const rect = el.getBoundingClientRect();
        if (e.clientY < rect.top + rect.height / 2) {
            return el;
        }
    }
    return null;
}

function getDropIndex(e: DragEvent, workspace: HTMLElement): number {
    const blocks = workspace.children;
    let idx = 0;
    for (let i = 0; i < blocks.length; i++) {
        const el = blocks[i] as HTMLElement;
        if (!el.classList.contains('block')) continue;
        const rect = el.getBoundingClientRect();
        if (e.clientY < rect.top + rect.height / 2) {
            return idx;
        }
        idx++;
    }
    return idx;
}

function clearDropIndicators(workspace: HTMLElement): void {
    workspace.classList.remove('drop-end');
    const blocks = workspace.querySelectorAll('.drop-above');
    blocks.forEach(b => b.classList.remove('drop-above'));
}
