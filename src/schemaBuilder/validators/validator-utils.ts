import type { ErrorObject } from 'ajv'

export function allowedValuesError(
  discriminator: string,
  allowedValues?: (string | number)[],
): ErrorObject {
  return {
    message: 'should be equal to one of the allowed values',
    instancePath: '.' + discriminator,
    keyword: 'enum',
    params: { allowedValues },
    schemaPath: '#/properties/' + discriminator,
  }
}
