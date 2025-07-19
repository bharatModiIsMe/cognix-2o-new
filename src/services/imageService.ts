
import { uploadFile } from './databaseService';

export interface ImageUpload {
  file: File;
  url: string;
  name: string;
  size: number;
}

export class ImageService {
  static async processImageFiles(files: File[], userId: string): Promise<ImageUpload[]> {
    console.log('Processing image files:', files.length);
    
    const processedImages: ImageUpload[] = [];
    
    for (const file of files) {
      try {
        // Upload to Firebase Storage
        const uploadedUrl = await uploadFile(file, userId, 'chat-images');
        
        const imageUpload: ImageUpload = {
          file,
          url: uploadedUrl,
          name: file.name,
          size: file.size
        };
        
        processedImages.push(imageUpload);
        console.log('Image processed successfully:', file.name);
      } catch (error) {
        console.error('Failed to process image:', file.name, error);
        throw new Error(`Failed to process image: ${file.name}`);
      }
    }
    
    return processedImages;
  }

  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  static async urlToBase64(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], 'image.jpg', { type: blob.type });
      return this.fileToBase64(file);
    } catch (error) {
      console.error('Error converting URL to base64:', error);
      throw error;
    }
  }

  static createImagePreview(file: File): string {
    return URL.createObjectURL(file);
  }

  static revokeImagePreview(url: string): void {
    URL.revokeObjectURL(url);
  }
}
