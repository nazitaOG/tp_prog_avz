import { InternalServerErrorException, Logger } from '@nestjs/common';

export function handleMailerErrors(error: any, message: string, logger?: Logger): never {
    if (error?.response?.includes('Invalid login')) {
        logger?.error(`${message}: Credenciales inválidas en el Mailer`);
        throw new InternalServerErrorException('Mailer: credenciales inválidas');
    }

    if (error?.code === 'EENVELOPE') {
        logger?.error(`${message}: Email de destino inválido`);
        throw new InternalServerErrorException('Mailer: email de destino inválido');
    }

    if (error?.code === 'EAUTH') {
        logger?.error(`${message}: Error de autenticación con el servicio SMTP`);
        throw new InternalServerErrorException('Mailer: autenticación fallida');
    }

    logger?.error(`${message}: Error desconocido al enviar email`, error.stack || error.message);
    throw new InternalServerErrorException(message);
}
