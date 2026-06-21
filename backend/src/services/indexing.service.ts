import { IRepository, Repository } from '../models/Repository';
import { githubService } from './github.service';
import { parserService } from './parser.service';
import { chromaService } from './chroma.service';
import { getCollectionName, parseGitHubUrl } from '../utils/github';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export class IndexingService {
  async indexRepository(url: string): Promise<IRepository> {
    const { owner, repo, branch } = parseGitHubUrl(url);
    const collectionName = getCollectionName(owner, repo);
    const localPath = githubService.getRepoPath(owner, repo);

    let repository = await Repository.findOne({ owner, repo });

    if (repository?.status === 'ready') {
      return repository;
    }

    if (!repository) {
      repository = await Repository.create({
        owner,
        repo,
        url,
        branch: branch || 'main',
        status: 'pending',
        localPath,
        collectionName,
      });
    } else {
      repository.status = 'pending';
      repository.error = undefined;
      await repository.save();
    }

    this.processInBackground(repository._id.toString()).catch((error) => {
      logger.error('Background indexing failed', error);
    });

    return repository;
  }

  async reindex(repositoryId: string): Promise<IRepository> {
    const repository = await Repository.findById(repositoryId);
    if (!repository) throw new AppError(404, 'Repository not found');

    await chromaService.deleteCollection(repository.collectionName);
    repository.status = 'pending';
    repository.error = undefined;
    repository.fileCount = 0;
    repository.chunkCount = 0;
    await repository.save();

    this.processInBackground(repositoryId).catch((error) => {
      logger.error('Background reindexing failed', error);
    });

    return repository;
  }

  private async processInBackground(repositoryId: string): Promise<void> {
    const repository = await Repository.findById(repositoryId);
    if (!repository) return;

    try {
      await this.updateStatus(repository, 'cloning', 'Cloning repository...');
      const { localPath, branch } = await githubService.cloneRepository(
        repository.owner,
        repository.repo,
        repository.branch
      );
      repository.localPath = localPath;
      repository.branch = branch;
      await repository.save();

      await this.updateStatus(repository, 'parsing', 'Parsing source files...');
      const files = await parserService.parseRepository(localPath);
      repository.fileCount = files.length;
      repository.language = parserService.detectPrimaryLanguage(files);
      await repository.save();

      await this.updateStatus(repository, 'embedding', 'Generating embeddings...');
      const allChunks = files.flatMap((file) =>
        parserService.chunkFile(file, repositoryId)
      );

      await chromaService.addChunks(repository.collectionName, allChunks);
      repository.chunkCount = allChunks.length;

      const readme = await githubService.getReadme(localPath);
      if (readme) {
        repository.description = readme.split('\n').find((l) => l.trim() && !l.startsWith('#'))?.slice(0, 200);
      }

      repository.status = 'ready';
      repository.statusMessage = 'Indexing complete';
      repository.indexedAt = new Date();
      repository.error = undefined;
      await repository.save();

      logger.info(`Repository ${repository.owner}/${repository.repo} indexed successfully`);
    } catch (error) {
      repository.status = 'failed';
      repository.error = (error as Error).message;
      repository.statusMessage = 'Indexing failed';
      await repository.save();
      logger.error(`Indexing failed for ${repository.owner}/${repository.repo}`, error);
    }
  }

  private async updateStatus(
    repository: IRepository,
    status: IRepository['status'],
    message: string
  ): Promise<void> {
    repository.status = status;
    repository.statusMessage = message;
    await repository.save();
  }
}

export const indexingService = new IndexingService();
