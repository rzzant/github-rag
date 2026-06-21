import fs from 'fs/promises';
import path from 'path';
import simpleGit from 'simple-git';
import { config } from '../config';
import { getCloneUrl } from '../utils/github';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export class GitHubService {
  async ensureReposDir(): Promise<void> {
    await fs.mkdir(config.reposDir, { recursive: true });
  }

  getRepoPath(owner: string, repo: string): string {
    return path.join(config.reposDir, `${owner}__${repo}`);
  }

  async cloneRepository(
    owner: string,
    repo: string,
    branch?: string
  ): Promise<{ localPath: string; branch: string }> {
    await this.ensureReposDir();
    const localPath = this.getRepoPath(owner, repo);
    const cloneUrl = getCloneUrl(owner, repo);

    const exists = await this.pathExists(localPath);
    if (exists) {
      logger.info(`Repository already cloned at ${localPath}, pulling latest`);
      const git = simpleGit(localPath);
      await git.pull('origin', branch || 'main').catch(async () => {
        await git.pull('origin', 'master').catch(() => {
          logger.warn('Could not pull latest changes');
        });
      });
      const currentBranch = (await git.branch()).current;
      return { localPath, branch: currentBranch };
    }

    logger.info(`Cloning ${cloneUrl} to ${localPath}`);
    const git = simpleGit();
    try {
      await git.clone(cloneUrl, localPath, branch ? ['--branch', branch] : []);
    } catch (error) {
      if (branch) {
        await git.clone(cloneUrl, localPath);
      } else {
        throw new AppError(400, `Failed to clone repository: ${(error as Error).message}`);
      }
    }

    const repoGit = simpleGit(localPath);
    const currentBranch = (await repoGit.branch()).current;
    return { localPath, branch: currentBranch };
  }

  async getReadme(localPath: string): Promise<string | null> {
    const candidates = ['README.md', 'readme.md', 'README.MD', 'Readme.md'];
    for (const name of candidates) {
      const readmePath = path.join(localPath, name);
      try {
        return await fs.readFile(readmePath, 'utf-8');
      } catch {
        continue;
      }
    }
    return null;
  }

  async deleteLocalRepo(owner: string, repo: string): Promise<void> {
    const localPath = this.getRepoPath(owner, repo);
    try {
      await fs.rm(localPath, { recursive: true, force: true });
    } catch {
      logger.warn(`Could not delete local repo at ${localPath}`);
    }
  }

  private async pathExists(p: string): Promise<boolean> {
    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  }
}

export const githubService = new GitHubService();
