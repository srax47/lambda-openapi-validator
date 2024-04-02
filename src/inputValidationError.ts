import type { ErrorDetails } from './types'

/**
 * Represent an input validation error
 * errors field will include the `ajv` error
 */
export class InputValidationError extends Error {
  error?: string
  errors?: (string | ErrorDetails)[]

  constructor(
    errors: ErrorDetails[],
    options: { beautifyErrors?: boolean; firstError?: boolean } = {},
  ) {
    super('Input validation error')

    if (options.beautifyErrors && options.firstError) {
      this.error = parseAjvError(errors[0])
    } else if (options.beautifyErrors) {
      this.errors = parseAjvErrors(errors)
    } else {
      this.errors = errors
    }
  }
}

const parseAjvError = function (error: ErrorDetails) {
  return `${buildDataPath(error)} ${buildMessage(error)}`
}

const parseAjvErrors = function (errors: ErrorDetails[]) {
  return errors.map(parseAjvError)
}

const buildMessage = function (error: ErrorDetails) {
  if (error.keyword === 'enum') {
    return `${error.message} [${error.params.allowedValues.toString()}]`
  }

  if (error.keyword === 'additionalProperties') {
    return `${error.message} '${error.params.additionalProperty.toString()}'`
  }

  if (error.validation) {
    return error.errors.message
  }

  return error.message
}

const buildDataPath = function (error: ErrorDetails) {
  if (error.dataPath.startsWith('.header')) {
    return (
      error.dataPath
        .replace('.', '')
        .replace('[', '/')
        .replace(']', '')
        // eslint-disable-next-line quotes
        .replace("'", '')
        // eslint-disable-next-line quotes
        .replace("'", '')
    )
  }

  if (error.dataPath.startsWith('.path')) {
    return error.dataPath.replace('.', '').replace('.', '/')
  }

  if (error.dataPath.startsWith('.query')) {
    return error.dataPath.replace('.', '').replace('.', '/')
  }

  if (error.dataPath.startsWith('.')) {
    return error.dataPath.replace('.', 'body/')
  }

  if (error.dataPath.startsWith('[')) {
    return `body/${error.dataPath}`
  }

  if (error.dataPath === '') {
    return 'body'
  }
}
