// src/files/helpers/fileFilter.helper.ts
import { Request } from 'express';
import { BadRequestException } from '@nestjs/common';

const ALLOWED = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

export const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    callback: (error: any, acceptFile: boolean) => void,
) => {
    if (!file) {
        return callback(null, false);
    }

    if (!ALLOWED.includes(file.mimetype)) {
        return callback(
            new BadRequestException(
                `Invalid file type ${file.mimetype}. Only ${ALLOWED.join(', ')} are allowed.`
            ),
            false,
        );
    }

    callback(null, true);
};
