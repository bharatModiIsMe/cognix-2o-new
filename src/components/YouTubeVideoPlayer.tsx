import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { YouTubeVideo } from '../services/youtubeService';

interface YouTubeVideoPlayerProps {
  video: YouTubeVideo | null;
  onClose: () => void;
}

export const YouTubeVideoPlayer = ({ video, onClose }: YouTubeVideoPlayerProps) => {
  const [analysis, setAnalysis] = useState<string>('');

  const analyzeVideo = () => {
    if (!video) return;
    
    // Generate analysis based on video metadata
    const analysisText = `
**Video Analysis**

**Title**: ${video.title}

**Channel**: ${video.channelTitle}

**Published**: ${new Date(video.publishedAt).toLocaleDateString()}

**Description**: ${video.description.slice(0, 200)}...

**Key Points**:
- Educational content related to the topic
- Visual demonstration of concepts
- Step-by-step guidance
- Real-world applications

**Relevance**: This video provides practical insights and visual learning opportunities for the discussed topic.
    `;
    
    setAnalysis(analysisText);
  };

  if (!video) return null;

  return (
    <Dialog open={!!video} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] p-0">
        <DialogTitle className="sr-only">{video.title}</DialogTitle>
        <div className="flex h-full">
          {/* Video Player - Left Side */}
          <div className="flex-1 bg-black relative">
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
            <iframe
              src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
              title={video.title}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={analyzeVideo}
            />
          </div>
          
          {/* Analysis - Right Side */}
          <div className="w-80 bg-background border-l p-4">
            <ScrollArea className="h-full">
              <h3 className="font-semibold mb-4 text-lg">Video Analysis</h3>
              {analysis ? (
                <div className="prose prose-sm max-w-none">
                  {analysis.split('\n').map((line, index) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return (
                        <h4 key={index} className="font-semibold mt-3 mb-1">
                          {line.replace(/\*\*/g, '')}
                        </h4>
                      );
                    }
                    if (line.startsWith('- ')) {
                      return (
                        <li key={index} className="ml-4 mb-1">
                          {line.substring(2)}
                        </li>
                      );
                    }
                    if (line.trim()) {
                      return (
                        <p key={index} className="mb-2 text-sm">
                          {line}
                        </p>
                      );
                    }
                    return <br key={index} />;
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Loading video analysis...
                </p>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};