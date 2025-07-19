
import { uploadFile } from './databaseService';

export interface ImageUpload {
  file: File;
  url: string;
  name: string;
  size: number;
}

export class ImageService {
  static async processImageFiles(files: File[], userId: string): Promise<ImageUpload[]> {
    console.log('ImageService: Processing image files:', files.length);
    
    const processedImages: ImageUpload[] = [];
    
    for (const file of files) {
      try {
        console.log('ImageService: Uploading file:', file.name);
        // Upload to Firebase Storage
        const uploadedUrl = await uploadFile(file, userId, 'chat-images');
        console.log('ImageService: File uploaded successfully:', uploadedUrl);
        
        const imageUpload: ImageUpload = {
          file,
          url: uploadedUrl,
          name: file.name,
          size: file.size
        };
        
        processedImages.push(imageUpload);
        console.log('ImageService: Image processed successfully:', file.name);
      } catch (error) {
        console.error('ImageService: Failed to process image:', file.name, error);
        throw new Error(`Failed to process image: ${file.name}`);
      }
    }
    
    console.log('ImageService: All images processed:', processedImages.length);
    return processedImages;
  }

  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        console.log('ImageService: File converted to base64, size:', result.length);
        resolve(result);
      };
      reader.onerror = error => {
        console.error('ImageService: Error converting file to base64:', error);
        reject(error);
      };
    });
  }

  static async urlToBase64(url: string): Promise<string> {
    try {
      console.log('ImageService: Converting URL to base64:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      const blob = await response.blob();
      const file = new File([blob], 'image.jpg', { type: blob.type });
      const base64 = await this.fileToBase64(file);
      console.log('ImageService: URL converted to base64 successfully');
      return base64;
    } catch (error) {
      console.error('ImageService: Error converting URL to base64:', error);
      throw error;
    }
  }

  static createImagePreview(file: File): string {
    const url = URL.createObjectURL(file);
    console.log('ImageService: Created preview URL:', url);
    return url;
  }

  static revokeImagePreview(url: string): void {
    URL.revokeObjectURL(url);
    console.log('ImageService: Revoked preview URL:', url);
  }
}
