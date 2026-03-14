import { moveBlockToChild, insertBlockAt, insertBlockToChild } from '../app/state';
import type { Block } from '../core/types';

export function initDragDrop(): void {
    const workspace = document.getElementById('workspace')!;

    const observer = new MutationObserver(() => {
        setupBlockDragging();
    });
    observer.observe(workspace, { childList: true, subtree: true });

    workspace.addEventListener('dragover', (e) => {
        e.preventDefault();
        const hasNew = e.dataTransfer!.types.includes('application/codeblock-new');
        e.dataTransfer!.dropEffect = hasNew ? 'copy' : 'move';

        const context = getDropContext(e, workspace);
        clearDropIndicators(workspace);
        if (!context) return;

        const { targetEl, container } = getDropIndexInContainer(e, context.container);
        if (targetEl) {
            targetEl.classList.add('drop-above');
        } else {
            container.classList.add('drop-end');
        }
    });

    workspace.addEventListener('dragleave', () => {
        clearDropIndicators(workspace);
    });

    workspace.addEventListener('drop', (e) => {
        e.preventDefault();
        clearDropIndicators(workspace);

        const context = getDropContext(e, workspace);
        if (!context) return;

        const { index } = getDropIndexInContainer(e, context.container);
        const newBlockData = e.dataTransfer!.getData('application/codeblock-new');
        if (newBlockData) {
            const block = JSON.parse(newBlockData) as Block;
            if (context.targetType === 'root') {
                insertBlockAt(block, index);
            } else {
                insertBlockToChild(context.parentId!, block, context.targetType, index);
            }
            return;
        }

        const blockId = e.dataTransfer!.getData('application/codeblock-move');
        if (blockId) {
            moveBlockToChild(blockId, context.parentId, context.targetType, index);
        }
    });
}

function setupBlockDragging(): void {
    const workspace = document.getElementById('workspace')!;
    const blocks = workspace.querySelectorAll('.block');

    for (const el of blocks) {
        const element = el as HTMLElement;
        if (element.draggable) continue;

        element.draggable = true;
        element.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            const id = element.dataset.blockId;
            if (id) {
                e.dataTransfer!.setData('application/codeblock-move', id);
                e.dataTransfer!.effectAllowed = 'move';
                element.classList.add('dragging');
            }
        });
        element.addEventListener('dragend', () => {
            element.classList.remove('dragging');
        });
    }
}

function getDropContext(e: DragEvent, workspace: HTMLElement): { container: HTMLElement; parentId: string | null; targetType: 'body' | 'elseBody' | 'root' } | null {
    let el = e.target as HTMLElement | null;
    while (el && el !== workspace) {
        if (el.classList.contains('block-body') && el.dataset.parentId) {
            const target = (el.dataset.target as 'body' | 'elseBody') ?? 'body';
            return { container: el, parentId: el.dataset.parentId, targetType: target };
        }
        el = el.parentElement;
    }
    return { container: workspace, parentId: null, targetType: 'root' };
}

function getDropIndexInContainer(e: DragEvent, container: HTMLElement): { index: number; targetEl: HTMLElement | null; container: HTMLElement } {
    const blocks = Array.from(container.children).filter((c) => (c as HTMLElement).classList.contains('block')) as HTMLElement[];
    let idx = 0;
    for (const el of blocks) {
        const rect = el.getBoundingClientRect();
        if (e.clientY < rect.top + rect.height / 2) {
            return { index: idx, targetEl: el, container };
        }
        idx++;
    }

    return { index: idx, targetEl: null, container };
}

function clearDropIndicators(workspace: HTMLElement): void {
    workspace.classList.remove('drop-end');
    const all = workspace.querySelectorAll('.drop-above, .drop-end');
    all.forEach((el) => el.classList.remove('drop-above', 'drop-end'));
}
