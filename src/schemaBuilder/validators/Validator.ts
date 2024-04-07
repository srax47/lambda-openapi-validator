import type { ErrorObject } from 'ajv'

export type ValidatorFunc<T> = (
  // eslint-disable-next-line no-unused-vars
  ajvValidate: T,
  // eslint-disable-next-line no-unused-vars
  data: Record<string, unknown>,
) => {
  result: boolean
  errors?: ErrorObject[] | null
}

export class Validator<T> {
  errors?: ErrorObject[]
  schema: T
  validationFunction: ValidatorFunc<T>

  constructor(validationFunction: ValidatorFunc<T>, schema: T) {
    this.schema = schema
    this.validationFunction = validationFunction
  }

  validate(data: Record<string, unknown>) {
    const { result, errors } = this.validationFunction(this.schema, data)
    this.errors = errors || undefined
    return result
  }
}
