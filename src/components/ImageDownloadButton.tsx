import { Download } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface ImageDownloadButtonProps {
  imageUrl: string;
  imageName?: string;
  className?: string;
}

export const ImageDownloadButton = ({ imageUrl, imageName = 'image', className }: ImageDownloadButtonProps) => {
  const downloadImage = async () => {
    try {
      // For blob URLs (local files), we can download directly
      if (imageUrl.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${imageName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Image downloaded successfully!');
        return;
      }

      // For remote URLs, fetch and download
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      
      // Try to get file extension from URL or default to png
      const extension = imageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)?.[1] || 'png';
      link.download = `${imageName}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(url);
      
      toast.success('Image downloaded successfully!');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download image. Please try again.');
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={downloadImage}
      className={className}
      title="Download image"
    >
      <Download className="h-4 w-4" />
    </Button>
  );
};