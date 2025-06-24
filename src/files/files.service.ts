import { Injectable, Inject, Logger, InternalServerErrorException } from '@nestjs/common';
import { UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class FilesService {
    private readonly logger = new Logger(FilesService.name);

    constructor(@Inject('CLOUDINARY') private cloudinary: any) { }

    async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
        return new Promise((resolve, reject) => {
            const uploadStream = this.cloudinary.uploader.upload_stream(
                { folder: 'banners' },
                (error: any, result: UploadApiResponse) => {
                    if (error) {
                        this.logger.error('Cloudinary upload failed', error);
                        return reject(new InternalServerErrorException('Cloudinary upload failed'));
                    }
                    resolve(result);
                },
            );
            Readable.from(file.buffer).pipe(uploadStream);
        });
    }

    async deleteImage(publicId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.cloudinary.uploader.destroy(publicId, (error: any, result: any) => {
                if (error) {
                    this.logger.error(`Cloudinary delete failed for ${publicId}`, error);
                    return reject(new InternalServerErrorException('Failed to delete image from Cloudinary'));
                }
                resolve();
            });
        });
    }
}
