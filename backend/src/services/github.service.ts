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
      const message = (error as Error).message;

      // Only fall back to the default branch when the failure is actually
      // about the branch not existing - not for every kind of clone failure.
      if (branch && this.isBranchNotFoundError(message)) {
        logger.warn(`Branch '${branch}' not found for ${owner}/${repo}, falling back to default branch`);
        try {
          await git.clone(cloneUrl, localPath);
        } catch (fallbackError) {
          throw this.classifyCloneError(fallbackError as Error, owner, repo);
        }
      } else {
        throw this.classifyCloneError(error as Error, owner, repo);
      }
    }

    const repoGit = simpleGit(localPath);
    const currentBranch = (await repoGit.branch()).current;
    return { localPath, branch: currentBranch };
  }

  private isBranchNotFoundError(message: string): boolean {
    return /not found in upstream|couldn't find remote ref/i.test(message);
  }

  /**
   * Converts a raw simple-git/git error into a clean, correctly-coded
   * AppError. The full underlying message (git stderr) is logged
   * server-side only - it is never forwarded to the client, since it can
   * include internal paths and isn't written for end users.
   */
  private classifyCloneError(error: Error, owner: string, repo: string): AppError {
    logger.error(`GitHub clone failed for ${owner}/${repo}`, error);
    const message = error.message;

    if (/could not read username|authentication failed|permission denied/i.test(message)) {
      return new AppError(
        404,
        `Repository ${owner}/${repo} was not found. It may not exist, be private, or the URL may be incorrect.`
      );
    }

    if (/could not resolve host|network is unreachable|connection (refused|timed out)/i.test(message)) {
      return new AppError(503, 'Could not reach GitHub. Check your network connection and try again.');
    }

    if (/not found in upstream|couldn't find remote ref/i.test(message)) {
      return new AppError(400, `Branch not found in ${owner}/${repo}.`);
    }

    return new AppError(
      400,
      `Failed to clone ${owner}/${repo}. Verify the repository URL is correct and publicly accessible.`
    );
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
