import { Validator, type ValidatorFunc } from './Validator'
import { allowedValuesError } from './validator-utils'
import type { Node } from '../data_structures/tree'
import type { DiscriminatorValue } from '../../types'
import type { ErrorObject } from 'ajv'

export class DiscriminatorValidator extends Validator<Node> {
  constructor(schema: Node) {
    super(discriminator, schema)
  }
}

function findSchemaValidation(tree: Node, data: Record<string, unknown>) {
  const currentValue = tree.getValue() as DiscriminatorValue
  if (currentValue.discriminator) {
    if (currentValue.discriminator.startsWith('.')) {
      return { schema: tree, data }
    }

    const discriminatorValue = data[currentValue.discriminator] as
      | string
      | number
    if (!currentValue.allowedValues?.includes(discriminatorValue)) {
      return {
        error: allowedValuesError(
          currentValue.discriminator,
          currentValue.allowedValues,
        ),
      }
    }

    if (currentValue.validators[discriminatorValue]) {
      return { validator: currentValue.validators[discriminatorValue] }
    }

    const newNode = tree.childrenAsKeyValue[discriminatorValue]
    return findSchemaValidation(newNode, data)
  }

  throw new Error('DEBUG: there is no discriminator on current value')
}

function discriminator(
  schemas: Node,
  data: Record<string, unknown>,
): ReturnType<ValidatorFunc<unknown>> {
  const currentValue = schemas.getValue() as DiscriminatorValue
  const subDiscriminator = currentValue.discriminator?.startsWith('.')

  let result = false
  let errors = undefined

  if (!subDiscriminator) {
    const {
      validator,
      error,
      schema,
      data: subData,
    } = findSchemaValidation(schemas, data)

    if (schema) {
      const res = discriminator(schema, subData)
      result = res.result
      errors = res.errors
    } else if (validator) {
      result = validator(data)
      errors = validator.errors
    } else if (error) {
      errors = [error]
    }

    return { result, errors }
  }

  if (currentValue.validator) {
    result = currentValue.validator(data)
    errors = currentValue.validator.errors
  }
  if (!result) return { result, errors }

  const key = currentValue.discriminator.replace('.', '')
  schemas = Object.values(schemas.childrenAsKeyValue)[0]
  const subData = data[key] as Record<string, unknown>[]
  errors = errors || []

  for (let index = 0; index < subData.length; index++) {
    const {
      validator,
      error,
      schema,
      data: validationData,
    } = findSchemaValidation(schemas, subData[index])

    if (schema) {
      const res = discriminator(schema, validationData)
      result = res.result
      errors = res.errors || errors || []
    } else if (validator) {
      const subResult = validator(subData[index])
      result = result && subResult
      if (validator.errors) {
        errors.push(...addErrorPrefix(validator.errors, key + `[${index}]`))
      }
    } else if (error) {
      errors.push(...addErrorPrefix([error], key + `[${index}]`))
      result = false
    }
  }

  return { result, errors: errors.length ? errors.flat() : null }
}

function addErrorPrefix(errors: ErrorObject[], prefix: string) {
  errors.forEach((error) => {
    error.instancePath = '.' + prefix + error.instancePath
    error.schemaPath = error.schemaPath.replace('#', '#/' + prefix)
  })
  return errors
}
