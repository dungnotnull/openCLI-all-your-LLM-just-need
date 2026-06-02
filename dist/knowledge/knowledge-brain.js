/**
 * Knowledge Brain Manager
 *
 * Main interface for the self-improving knowledge system.
 * Manages crawling, parsing, embedding, and retrieval of knowledge.
 */
import { crawlSources, getDefaultCrawlSources, } from './crawler.js';
import { parseBatch } from './parser.js';
import { getEmbedder } from './embedder.js';
import { getVectorStore } from './vector-store.js';
import { logger } from '../utils/logger.js';
import { promises } from 'fs';
/**
 * Knowledge brain manager
 */
export class KnowledgeBrain {
    config;
    embedder;
    entries = new Map();
    vectorStore;
    initialized = false;
    constructor(config) {
        this.config = {
            storagePath: process.env.HOME + '/.opencli/SECOND-KNOWLEDGE-BRAIN.md',
            indexPath: process.env.HOME + '/.opencli/knowledge-index/',
            maxEntries: 1000,
            crawlSources: getDefaultCrawlSources(),
            autoCrawlEnabled: false, // Disabled by default
            ...config,
        };
        this.embedder = getEmbedder();
        this.vectorStore = getVectorStore(false); // Use in-memory by default
    }
    /**
     * Initialize the knowledge brain
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        logger.info('Initializing Knowledge Brain...');
        try {
            // Create directories if they don't exist
            await promises.mkdir(this.config.indexPath, { recursive: true });
            // Load existing entries from storage
            await this.loadFromStorage();
            this.initialized = true;
            logger.info({ entryCount: this.entries.size }, 'Knowledge Brain initialized');
        }
        catch (error) {
            logger.error({ error }, 'Failed to initialize Knowledge Brain');
            throw error;
        }
    }
    /**
     * Run knowledge crawl
     */
    async crawl(sources) {
        await this.initialize();
        const sourcesToCrawl = sources || this.config.crawlSources;
        logger.info({ sourceCount: sourcesToCrawl.length }, 'Starting knowledge crawl');
        // Step 1: Crawl sources
        const rawContents = await crawlSources(sourcesToCrawl);
        logger.info({ contentCount: rawContents.length }, 'Content crawled');
        // Step 2: Parse contents
        const parseResults = await parseBatch(rawContents);
        logger.info({ parsedCount: parseResults.length }, 'Content parsed');
        // Step 3: Create knowledge entries
        let addedCount = 0;
        for (let i = 0; i < rawContents.length; i++) {
            const content = rawContents[i];
            const result = parseResults[i];
            if (!result || result.confidence < 0.5) {
                continue; // Skip low-confidence results
            }
            const entry = await this.createEntry(content, result.entry);
            if (entry) {
                this.entries.set(entry.id, entry);
                await this.vectorStore.addEntry(entry);
                addedCount++;
            }
        }
        logger.info({ addedCount }, 'New entries added');
        // Step 4: Save to storage
        await this.saveToStorage();
        return addedCount;
    }
    /**
     * Search knowledge for relevant entries
     */
    async search(query, limit = 5) {
        await this.initialize();
        logger.info({ query, limit }, 'Searching knowledge');
        // Use vector store for semantic search
        return await this.vectorStore.search(query, limit);
    }
    /**
     * Get knowledge entries relevant to a task
     */
    async getRelevantForTask(task, limit = 5) {
        const results = await this.search(task, limit);
        return results.map(r => r.entry);
    }
    /**
     * Inject relevant knowledge into system prompt
     */
    async injectIntoSystemPrompt(systemPrompt, task) {
        const relevantEntries = await this.getRelevantForTask(task, 5);
        if (relevantEntries.length === 0) {
            return systemPrompt;
        }
        const knowledgeSection = `
## Relevant Knowledge

${relevantEntries.map(entry => `
### ${entry.title}
**Source:** ${entry.source}
**Key Insight:** ${entry.keyInsight}
**Relevance:** ${entry.relevance}
${entry.appliedIn ? `**Applied In:** ${entry.appliedIn}` : ''}
`).join('\n')}

---

`;
        // Inject after system prompt intro
        const lines = systemPrompt.split('\n');
        const insertIndex = Math.min(3, lines.length);
        lines.splice(insertIndex, 0, knowledgeSection.trim());
        return lines.join('\n');
    }
    /**
     * Create knowledge entry from raw content and parsed data
     */
    async createEntry(content, parsed) {
        const id = this.generateId(content);
        // Check if entry already exists
        if (this.entries.has(id)) {
            return null;
        }
        const entry = {
            id,
            title: content.title,
            source: content.url,
            category: parsed.category,
            keyInsight: parsed.keyInsight,
            relevance: parsed.relevance,
            appliedIn: parsed.appliedIn,
            crawledAt: content.crawledAt,
        };
        // Generate embedding
        const textToEmbed = `${entry.title} ${entry.keyInsight} ${entry.relevance}`;
        entry.embedding = await this.embedder.embed(textToEmbed);
        return entry;
    }
    /**
     * Generate unique ID for entry
     */
    generateId(content) {
        const hash = this.simpleHash(content.url + content.title);
        return `ke-${hash}`;
    }
    /**
     * Simple hash function for IDs
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }
    /**
     * Load entries from storage (SECOND-KNOWLEDGE-BRAIN.md)
     */
    async loadFromStorage() {
        try {
            const content = await promises.readFile(this.config.storagePath, 'utf-8');
            // TODO: Parse markdown format
            // For now, entries are stored in memory only
            // Rebuild vector store with loaded entries
            for (const entry of this.entries.values()) {
                if (entry.embedding) {
                    await this.vectorStore.addEntry(entry);
                }
            }
        }
        catch (error) {
            // File doesn't exist yet, that's fine
            logger.debug('No existing knowledge storage found');
        }
    }
    /**
     * Save entries to storage
     */
    async saveToStorage() {
        // TODO: Write in markdown format per CLAUDE.md spec
        const markdown = this.formatAsMarkdown();
        await promises.writeFile(this.config.storagePath, markdown);
        logger.info({ path: this.config.storagePath }, 'Knowledge saved to storage');
    }
    /**
     * Format entries as markdown (per CLAUDE.md spec)
     */
    formatAsMarkdown() {
        const lines = [];
        lines.push('# SECOND-KNOWLEDGE-BRAIN.md');
        lines.push('');
        lines.push('> Self-improving knowledge corpus. Updated automatically by knowledge crawler.');
        lines.push('');
        lines.push('---');
        lines.push('');
        // Group by category
        const byCategory = new Map();
        for (const entry of this.entries.values()) {
            if (!byCategory.has(entry.category)) {
                byCategory.set(entry.category, []);
            }
            byCategory.get(entry.category).push(entry);
        }
        for (const [category, entries] of byCategory) {
            lines.push(`## ${category} — Updated: ${new Date().toISOString().split('T')[0]}`);
            lines.push('');
            for (const entry of entries) {
                lines.push(`### ${entry.title} (${entry.source})`);
                lines.push(`**Key Insight:** ${entry.keyInsight}`);
                lines.push(`**Relevance:** ${entry.relevance}`);
                if (entry.appliedIn) {
                    lines.push(`**Applied In:** ${entry.appliedIn}`);
                }
                lines.push('');
                lines.push('---');
                lines.push('');
            }
        }
        return lines.join('\n');
    }
    /**
     * Get statistics
     */
    getStats() {
        return {
            totalEntries: this.entries.size,
            byCategory: this.getCategoryCounts(),
            config: this.config,
        };
    }
    /**
     * Get entry counts by category
     */
    getCategoryCounts() {
        const counts = {};
        for (const entry of this.entries.values()) {
            counts[entry.category] = (counts[entry.category] || 0) + 1;
        }
        return counts;
    }
}
/**
 * Singleton instance
 */
let brainInstance = null;
/**
 * Get or create knowledge brain instance
 */
export function getKnowledgeBrain(config) {
    if (!brainInstance) {
        brainInstance = new KnowledgeBrain(config);
    }
    return brainInstance;
}
//# sourceMappingURL=knowledge-brain.js.map