export const Scroll = {
    delayMs: 100,
    durationMs: 1000,

    toElement(element, viewportOffset, onComplete, edge = "top") {
        clearTimeout(this.timer);
        cancelAnimationFrame(this.frame);
        if (!element) {
            return;
        }
        this.timer = setTimeout(() => {
            if (!element.isConnected) {
                return;
            }
            const start = window.scrollY;
            const target = Math.max(0, start + element.getBoundingClientRect()[edge]
                - window.innerHeight * viewportOffset);
            const startedAt = performance.now();
            const animate = (now) => {
                const progress = Math.min(1, (now - startedAt) / this.durationMs);
                const eased = progress < 0.5
                    ? 32 * progress ** 6
                    : 1 - (-2 * progress + 2) ** 6 / 2;
                window.scrollTo({ top: start + (target - start) * eased, behavior: "instant" });
                if (progress < 1) {
                    this.frame = requestAnimationFrame(animate);
                } else {
                    onComplete?.();
                }
            };
            this.frame = requestAnimationFrame(animate);
        }, this.delayMs);
    },
};
