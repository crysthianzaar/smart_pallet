import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { adminStorage } from '../../../lib/firebase-admin';
import { IFileRepository } from '../../repo/interfaces';

export class FirebaseFileRepository implements IFileRepository {
  async uploadFile(path: string, file: Buffer | Uint8Array, contentType: string): Promise<string> {
    try {
      const bucket = adminStorage.bucket();
      const fileRef = bucket.file(path);
      
      await fileRef.save(file, {
        metadata: {
          contentType,
        },
      });

      // Make the file publicly readable
      await fileRef.makePublic();
      
      return `https://storage.googleapis.com/${bucket.name}/${path}`;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  async getDownloadUrl(path: string): Promise<string> {
    try {
      const bucket = adminStorage.bucket();
      const fileRef = bucket.file(path);
      
      const [url] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      });
      
      return url;
    } catch (error) {
      console.error('Error getting download URL:', error);
      throw new Error('Failed to get download URL');
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      const bucket = adminStorage.bucket();
      const fileRef = bucket.file(path);
      
      await fileRef.delete();
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  async generateSignedUploadUrl(path: string, contentType: string): Promise<{ uploadUrl: string; downloadUrl: string }> {
    try {
      const bucket = adminStorage.bucket();
      const fileRef = bucket.file(path);
      
      const [uploadUrl] = await fileRef.getSignedUrl({
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType,
      });

      const [downloadUrl] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      });
      
      return { uploadUrl, downloadUrl };
    } catch (error) {
      console.error('Error generating signed URLs:', error);
      throw new Error('Failed to generate signed URLs');
    }
  }
}
