// === Core Agent Types ===
export class ModelProvider {
    supportsMCP() {
        return false;
    }
    supportsTools() {
        return true;
    }
    maxContextWindow() {
        return this.models[0]?.contextWindow ?? 0;
    }
}
export class Tool {
}
//# sourceMappingURL=index.js.map