import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VideosService, createVideosService } from './videos.service';
import { VideosRepository } from './videos.repository';
import * as videosRepoModule from './videos.repository';
import { ValidationError, NotFoundError } from '@/shared/api';

const mockVideosRepo = {
  findVideos: vi.fn(),
  findById: vi.fn(),
  createVideo: vi.fn(),
  updateVideo: vi.fn(),
  deleteVideo: vi.fn(),
} as unknown as VideosRepository;

vi.mock('./videos.repository', () => ({
  createVideosRepository: vi.fn(),
}));

describe('VideosService', () => {
  let service: VideosService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new VideosService(mockVideosRepo);
  });

  describe('listVideos', () => {
    it('should call repository to list videos with optional category', async () => {
      vi.mocked(mockVideosRepo.findVideos).mockResolvedValueOnce([{ id: 1 }] as any);
      const result = await service.listVideos('training');
      expect(mockVideosRepo.findVideos).toHaveBeenCalledWith('training');
      expect(result).toHaveLength(1);
    });
  });

  describe('getVideo', () => {
    it('should throw NotFoundError if video does not exist', async () => {
      vi.mocked(mockVideosRepo.findById).mockResolvedValueOnce(undefined as any);
      await expect(service.getVideo(1)).rejects.toThrow(NotFoundError);
    });

    it('should return video if it exists', async () => {
      vi.mocked(mockVideosRepo.findById).mockResolvedValueOnce({ id: 1 } as any);
      const result = await service.getVideo(1);
      expect(result.id).toBe(1);
    });
  });

  describe('createVideo', () => {
    const validData = {
      title: ' Match Highlights ',
      youtube_url: 'https://youtube.com/watch?v=123',
      description: ' Desc ',
    };

    it('should throw ValidationError if title is missing or empty', async () => {
      await expect(service.createVideo({ ...validData, title: '   ' })).rejects.toThrow('title is required');
      await expect(service.createVideo({ ...validData, title: undefined as any })).rejects.toThrow('title is required');
    });

    it('should throw ValidationError if youtube_url is missing or empty', async () => {
      await expect(service.createVideo({ ...validData, youtube_url: '   ' })).rejects.toThrow('youtube_url is required');
    });

    it('should throw ValidationError if youtube_url is invalid format', async () => {
      await expect(service.createVideo({ ...validData, youtube_url: 'https://vimeo.com/123' })).rejects.toThrow('youtube_url must be a valid YouTube URL');
    });

    it('should successfully create and trim inputs, defaulting category to general', async () => {
      vi.mocked(mockVideosRepo.createVideo).mockResolvedValueOnce({ id: 1 } as any);
      const result = await service.createVideo(validData, 'u1');

      expect(mockVideosRepo.createVideo).toHaveBeenCalledWith({
        title: 'Match Highlights',
        youtube_url: 'https://youtube.com/watch?v=123',
        description: 'Desc',
        category: 'general',
        created_by: 'u1',
      });
      expect(result.id).toBe(1);
    });
  });

  describe('updateVideo', () => {
    beforeEach(() => {
      vi.mocked(mockVideosRepo.findById).mockResolvedValue({ id: 1 } as any);
    });

    it('should throw NotFoundError if video not found', async () => {
      vi.mocked(mockVideosRepo.findById).mockResolvedValueOnce(undefined as any);
      await expect(service.updateVideo(1, {})).rejects.toThrow(NotFoundError);
    });

    it('should validate partial youtube_url updates', async () => {
      await expect(service.updateVideo(1, { youtube_url: 'invalid' })).rejects.toThrow('youtube_url must be a valid YouTube URL');
    });

    it('should successfully update valid data', async () => {
      vi.mocked(mockVideosRepo.updateVideo).mockResolvedValueOnce({ id: 1, title: 'New' } as any);
      const result = await service.updateVideo(1, { title: 'New' });
      expect(mockVideosRepo.updateVideo).toHaveBeenCalledWith(1, { title: 'New' });
      expect(result.title).toBe('New');
    });
  });

  describe('deleteVideo', () => {
    it('should throw NotFoundError if video not found', async () => {
      vi.mocked(mockVideosRepo.findById).mockResolvedValueOnce(undefined as any);
      await expect(service.deleteVideo(1)).rejects.toThrow(NotFoundError);
    });

    it('should successfully delete video', async () => {
      vi.mocked(mockVideosRepo.findById).mockResolvedValueOnce({ id: 1 } as any);
      vi.mocked(mockVideosRepo.deleteVideo).mockResolvedValueOnce(true);
      const result = await service.deleteVideo(1);
      expect(mockVideosRepo.deleteVideo).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });
  });

  describe('createVideosService', () => {
    it('should initialize repository and return instance', async () => {
      vi.mocked(videosRepoModule.createVideosRepository).mockResolvedValueOnce(mockVideosRepo as any);
      const srv = await createVideosService();
      expect(srv).toBeInstanceOf(VideosService);
      expect(videosRepoModule.createVideosRepository).toHaveBeenCalled();
    });
  });
});
