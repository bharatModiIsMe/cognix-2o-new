import { Play } from 'lucide-react';
import { YouTubeVideo } from '../services/youtubeService';

interface YouTubeVideoGridProps {
  videos: YouTubeVideo[];
  onVideoClick: (video: YouTubeVideo) => void;
}

export const YouTubeVideoGrid = ({ videos, onVideoClick }: YouTubeVideoGridProps) => {
  if (videos.length === 0) return null;

  return (
    <div className="mb-4 p-4 bg-card rounded-lg border">
      <h3 className="text-sm font-medium mb-3 text-muted-foreground">Related Videos</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {videos.map((video) => (
          <div
            key={video.id}
            onClick={() => onVideoClick(video)}
            className="group cursor-pointer bg-background rounded-lg overflow-hidden border hover:border-primary/50 transition-all duration-200 hover:shadow-md"
          >
            <div className="relative aspect-video bg-muted">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
                <div className="bg-white/90 rounded-full p-2 group-hover:scale-110 transition-transform duration-200">
                  <Play className="h-4 w-4 text-black fill-black ml-0.5" />
                </div>
              </div>
            </div>
            <div className="p-3">
              <h4 className="text-sm font-medium line-clamp-2 mb-1">
                {video.title}
              </h4>
              <p className="text-xs text-muted-foreground">
                {video.channelTitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};