export function initZoom(): void {
    const viewport = document.getElementById('viewport')!;
    const workspace = document.getElementById('workspace')!;

    let scale = 1;
    const MIN_SCALE = 0.3;
    const MAX_SCALE = 2;
    const STEP = 0.1;

    viewport.addEventListener('wheel', (e) => {
        if (!e.ctrlKey) return;
        e.preventDefault();

        const oldScale = scale;
        if (e.deltaY < 0) {
            scale = Math.min(MAX_SCALE, scale + STEP);
        } else {
            scale = Math.max(MIN_SCALE, scale - STEP);
        }

        if (scale !== oldScale) {
            workspace.style.transform = `scale(${scale})`;
        }
    }, { passive: false });
}
