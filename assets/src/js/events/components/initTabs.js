export function initTabs({
    root = document,
    tabSelector,
    contentSelector,
    activeClass = 'active',
    onBeforeChange,
    onAfterChange
}) {
    const container = root;

    const tabs = container.querySelectorAll(tabSelector);
    const contents = container.querySelectorAll(contentSelector);

    if (!tabs.length || !contents.length) return;

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const currentContent = contents[index];

            if (onBeforeChange) {
                onBeforeChange({
                    container,
                    tabs,
                    contents,
                    currentIndex: index
                });
            }

            tabs.forEach(t => t.classList.remove(activeClass));
            contents.forEach(c => c.classList.remove(activeClass));

            tab.classList.add(activeClass);
            currentContent?.classList.add(activeClass);

            if (onAfterChange) {
                onAfterChange({
                    container,
                    tabs,
                    contents,
                    currentIndex: index,
                    currentContent
                });
            }
        });
    });
}