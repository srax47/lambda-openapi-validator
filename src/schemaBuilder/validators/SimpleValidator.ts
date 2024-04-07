import type { ValidateFunction } from 'ajv'
import { Validator } from './Validator'

export class SimpleValidator extends Validator<ValidateFunction> {
  constructor(schema: ValidateFunction) {
    super(simple, schema)
  }
}

function simple(ajvValidate: ValidateFunction, data: unknown) {
  const result = ajvValidate(data)
  return { result, errors: ajvValidate.errors }
}
