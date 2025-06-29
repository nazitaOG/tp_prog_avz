
import { Logger } from '@nestjs/common';
import {
    registerDecorator,
    ValidationOptions,
    ValidationArguments,
} from 'class-validator';

const logger = new Logger('AtLeastOneField');

export function AtLeastOneField(
    fields: string[],
    validationOptions?: ValidationOptions,
) {
    return function (constructor: Function) {
        registerDecorator({
            name: 'atLeastOneField',
            target: constructor,
            propertyName: 'atLeastOneField',
            constraints: fields,
            options: validationOptions,
            validator: {
                validate(_: any, args: ValidationArguments) {
                    const object = args.object as Record<string, any>;
                    const valid = fields.some((field) => object[field] !== undefined);

                    if (!valid) {
                        logger.warn(
                            `Validation failed on ${constructor.name}. None of the required fields [${fields.join(
                                ', ',
                            )}] were provided.`,
                        );
                    }

                    return valid;
                },

                defaultMessage(args: ValidationArguments) {
                    return `At least one of the following fields must be provided: ${args.constraints.join(
                        ', ',
                    )}`;
                },
            },
        });
    };
}
