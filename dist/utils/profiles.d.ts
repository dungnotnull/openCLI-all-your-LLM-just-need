/**
 * Configuration Profiles System
 *
 * Manages named configuration profiles for different use cases.
 * Profiles store provider, model, budget, and tool preferences.
 */
/**
 * Configuration profile
 */
export interface ConfigProfile {
    name: string;
    description: string;
    provider: string;
    model?: string;
    budgetLimit?: number;
    enabledTools?: string[];
    preferences?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Configuration Profiles Manager
 */
export declare class ProfileManager {
    private storagePath;
    private storage;
    constructor();
    /**
     * Initialize profile manager
     */
    initialize(): Promise<void>;
    /**
     * List all profiles
     */
    listProfiles(): ConfigProfile[];
    /**
     * Get profile by name
     */
    getProfile(name: string): ConfigProfile | undefined;
    /**
     * Get active profile
     */
    getActiveProfile(): ConfigProfile;
    /**
     * Set active profile
     */
    setActiveProfile(name: string): Promise<void>;
    /**
     * Create a new profile
     */
    createProfile(profile: Omit<ConfigProfile, 'createdAt' | 'updatedAt'>): Promise<ConfigProfile>;
    /**
     * Update an existing profile
     */
    updateProfile(name: string, updates: Partial<Omit<ConfigProfile, 'name' | 'createdAt'>>): Promise<ConfigProfile>;
    /**
     * Delete a profile
     */
    deleteProfile(name: string): Promise<void>;
    /**
     * Save profiles to storage
     */
    private save;
    /**
     * Format profile for display
     */
    formatProfile(profile: ConfigProfile): string;
    /**
     * List profiles with active indicator
     */
    listProfilesFormatted(): string;
}
/**
 * Get or create profile manager instance
 */
export declare function getProfileManager(): Promise<ProfileManager>;
/**
 * Setup profile commands for CLI
 */
export declare function setupProfileCommands(program: any): void;
//# sourceMappingURL=profiles.d.ts.map