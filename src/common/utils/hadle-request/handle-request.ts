import { HttpException, InternalServerErrorException, Logger } from '@nestjs/common';
import { handleBase } from './handle-request.base';
import { handlePrismaErrors } from './handle-request.prisma';
import { handleCloudinaryErrors } from './handle-request.cloudinary';
import { handleMulterErrors } from './handle-request.multer';
import { handleMailerErrors } from './handle-request-mailer';
import { handleNotificationErrors } from './handle-request-notification';

const errorHandlers = [
  handleMulterErrors,
  handleCloudinaryErrors,
  handlePrismaErrors,
  handleMailerErrors,
  handleNotificationErrors,
];

export async function handleRequest<T>(
  callback: () => Promise<T>,
  errorMessage: string,
  logger?: Logger,
): Promise<T> {
  return handleBase(callback, errorMessage, async (error, msg, log) => {
    if (error instanceof HttpException) {
      log?.error(`${msg}: ${error.message}`);
      throw error;
    }

    for (const handler of errorHandlers) {
      try {
        return await handler(error, msg, log);
      } catch (e) {
        if (e instanceof HttpException) throw e;
      }
    }

    log?.error(`${msg}: Unknown error`, error.stack || error.message);
    throw new InternalServerErrorException(msg);
  }, logger);
}
