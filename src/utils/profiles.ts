/**
 * Configuration Profiles System
 *
 * Manages named configuration profiles for different use cases.
 * Profiles store provider, model, budget, and tool preferences.
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { logger } from './logger.js';

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
 * Profiles storage
 */
interface ProfilesStorage {
  activeProfile?: string;
  profiles: ConfigProfile[];
}

/**
 * Default profiles
 */
const DEFAULT_PROFILES: ConfigProfile[] = [
  {
    name: 'default',
    description: 'Default configuration',
    provider: 'deepseek',
    model: 'deepseek-v3',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'fast',
    description: 'Fast responses with smaller models',
    provider: 'qwen',
    model: 'qwen-turbo',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'budget-conscious',
    description: 'Cost-optimized configuration with budget limits',
    provider: 'qwen',
    model: 'qwen-turbo',
    budgetLimit: 5.0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'power',
    description: 'Maximum capabilities for complex tasks',
    provider: 'deepseek',
    model: 'deepseek-v3',
    budgetLimit: 50.0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

/**
 * Configuration Profiles Manager
 */
export class ProfileManager {
  private storagePath: string;
  private storage: ProfilesStorage;

  constructor() {
    this.storagePath = join(homedir(), '.opencli', 'profiles.json');
    this.storage = {
      profiles: DEFAULT_PROFILES,
    };
  }

  /**
   * Initialize profile manager
   */
  async initialize(): Promise<void> {
    try {
      const data = await fs.readFile(this.storagePath, 'utf-8');
      this.storage = JSON.parse(data);
      logger.info('Profiles loaded from storage');
    } catch (error) {
      // File doesn't exist, use defaults
      logger.info('Using default profiles');
    }
  }

  /**
   * List all profiles
   */
  listProfiles(): ConfigProfile[] {
    return this.storage.profiles;
  }

  /**
   * Get profile by name
   */
  getProfile(name: string): ConfigProfile | undefined {
    return this.storage.profiles.find(p => p.name === name);
  }

  /**
   * Get active profile
   */
  getActiveProfile(): ConfigProfile {
    const activeName = this.storage.activeProfile || 'default';
    return this.getProfile(activeName) || this.getProfile('default')!;
  }

  /**
   * Set active profile
   */
  async setActiveProfile(name: string): Promise<void> {
    const profile = this.getProfile(name);

    if (!profile) {
      throw new Error(`Profile not found: ${name}`);
    }

    this.storage.activeProfile = name;
    await this.save();

    logger.info({ profile: name }, 'Active profile changed');
  }

  /**
   * Create a new profile
   */
  async createProfile(profile: Omit<ConfigProfile, 'createdAt' | 'updatedAt'>): Promise<ConfigProfile> {
    if (this.getProfile(profile.name)) {
      throw new Error(`Profile already exists: ${profile.name}`);
    }

    const newProfile: ConfigProfile = {
      ...profile,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.storage.profiles.push(newProfile);
    await this.save();

    logger.info({ profile: newProfile.name }, 'Profile created');

    return newProfile;
  }

  /**
   * Update an existing profile
   */
  async updateProfile(name: string, updates: Partial<Omit<ConfigProfile, 'name' | 'createdAt'>>): Promise<ConfigProfile> {
    const index = this.storage.profiles.findIndex(p => p.name === name);

    if (index === -1) {
      throw new Error(`Profile not found: ${name}`);
    }

    const updated: ConfigProfile = {
      ...this.storage.profiles[index]!,
      ...updates,
      name,
      updatedAt: new Date(),
    };

    this.storage.profiles[index] = updated;
    await this.save();

    logger.info({ profile: name }, 'Profile updated');

    return updated;
  }

  /**
   * Delete a profile
   */
  async deleteProfile(name: string): Promise<void> {
    if (name === 'default') {
      throw new Error('Cannot delete default profile');
    }

    const index = this.storage.profiles.findIndex(p => p.name === name);

    if (index === -1) {
      throw new Error(`Profile not found: ${name}`);
    }

    this.storage.profiles.splice(index, 1);

    // Reset to default if active profile was deleted
    if (this.storage.activeProfile === name) {
      this.storage.activeProfile = 'default';
    }

    await this.save();

    logger.info({ profile: name }, 'Profile deleted');
  }

  /**
   * Save profiles to storage
   */
  private async save(): Promise<void> {
    await fs.mkdir(join(this.storagePath, '..'), { recursive: true });
    await fs.writeFile(this.storagePath, JSON.stringify(this.storage, null, 2));
  }

  /**
   * Format profile for display
   */
  formatProfile(profile: ConfigProfile): string {
    const lines: string[] = [];

    lines.push(`📝 ${profile.name} ${profile.name === this.storage.activeProfile ? '(active)' : ''}`);
    lines.push(`   ${profile.description}`);
    lines.push(`   Provider: ${profile.provider}`);
    if (profile.model) {
      lines.push(`   Model: ${profile.model}`);
    }
    if (profile.budgetLimit) {
      lines.push(`   Budget: $${profile.budgetLimit.toFixed(2)}`);
    }
    if (profile.enabledTools && profile.enabledTools.length > 0) {
      lines.push(`   Tools: ${profile.enabledTools.join(', ')}`);
    }

    return lines.join('\n');
  }

  /**
   * List profiles with active indicator
   */
  listProfilesFormatted(): string {
    const profiles = this.listProfiles();
    const lines: string[] = [];

    lines.push('🔧 Configuration Profiles\n');

    for (const profile of profiles) {
      lines.push(this.formatProfile(profile));
      lines.push('');
    }

    return lines.join('\n');
  }
}

/**
 * Singleton instance
 */
let profileManagerInstance: ProfileManager | null = null;

/**
 * Get or create profile manager instance
 */
export async function getProfileManager(): Promise<ProfileManager> {
  if (!profileManagerInstance) {
    profileManagerInstance = new ProfileManager();
    await profileManagerInstance.initialize();
  }
  return profileManagerInstance;
}

/**
 * Setup profile commands for CLI
 */
export function setupProfileCommands(program: any): void {
  const profileCmd = program
    .command('profile')
    .description('Manage configuration profiles');

  profileCmd
    .command('list')
    .description('List all profiles')
    .action(async () => {
      const manager = await getProfileManager();
      console.log(manager.listProfilesFormatted());
    });

  profileCmd
    .command('use <name>')
    .description('Set active profile')
    .action(async (name: string) => {
      const manager = await getProfileManager();
      await manager.setActiveProfile(name);
      console.log(`✓ Now using profile: ${name}`);
    });

  profileCmd
    .command('create')
    .description('Create a new profile')
    .option('-n, --name <name>', 'Profile name')
    .option('-d, --description <text>', 'Profile description')
    .option('-p, --provider <name>', 'Provider')
    .option('-m, --model <name>', 'Model')
    .option('-b, --budget <amount>', 'Budget limit in USD')
    .action(async (options: any) => {
      const manager = await getProfileManager();
      const profile = await manager.createProfile({
        name: options.name,
        description: options.description,
        provider: options.provider,
        model: options.model,
        budgetLimit: parseFloat(options.budget),
      });
      console.log(`✓ Profile created: ${profile.name}`);
    });

  profileCmd
    .command('delete <name>')
    .description('Delete a profile')
    .action(async (name: string) => {
      const manager = await getProfileManager();
      await manager.deleteProfile(name);
      console.log(`✓ Profile deleted: ${name}`);
    });
}
