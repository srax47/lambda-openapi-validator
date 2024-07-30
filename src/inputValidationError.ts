import type { ErrorObject } from 'ajv'

/**
 * Represent an input validation error
 * errors field will include the `ajv` error
 */
export class InputValidationError extends Error {
  errors?: (string | ErrorObject)[]

  constructor(errors: ErrorObject[], beautifyErrors?: boolean) {
    super('Input validation error')

    if (beautifyErrors) {
      this.errors = parseAjvErrors(errors)
    } else {
      this.errors = errors
    }
  }
}

const parseAjvErrors = function (errors: ErrorObject[]) {
  return errors.map(
    (error) => `${buildInstancePath(error)} ${buildMessage(error)}`,
  )
}

const buildMessage = function (error: ErrorObject) {
  if (error.keyword === 'enum') {
    return `${error.message} [${error.params.allowedValues?.toString()}]`
  }

  if (error.keyword === 'additionalProperties') {
    return `${error.message} '${error.params.additionalProperty?.toString()}'`
  }

  return error.message
}

const buildInstancePath = function (error: ErrorObject) {
  if (error.instancePath.startsWith('/header')) {
    return (
      error.instancePath
        .replace('/', '')
        .replace('[', '/')
        .replace(']', '')
        // eslint-disable-next-line quotes
        .replace("'", '')
        // eslint-disable-next-line quotes
        .replace("'", '')
    )
  }

  if (error.instancePath.startsWith('/path')) {
    return error.instancePath.replace('/', '').replace('.', '/')
  }

  if (error.instancePath.startsWith('/query')) {
    return error.instancePath.replace('/', '').replace('.', '/')
  }

  const firstChar = error.instancePath.charAt(0)

  if (firstChar === '.') {
    return `body/${error.instancePath.replace('.', '').replace(/\//g, '.')}`
  }
  if (firstChar === '/') {
    return `body/${error.instancePath.replace(/\//g, '.').replace('.', '')}`
  }
  if (firstChar === '[') {
    return `body/${error.instancePath}`
  }

  if (error.instancePath === '') {
    return 'body'
  }
}
