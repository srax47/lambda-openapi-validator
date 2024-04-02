export interface ErrorDetails {
  dataPath: string
  keyword: string
  message: string
  params: Record<string, { allowedValues: string; additionalProperty: string }>
  schemaPath: string
  validation?: boolean
  errors: {
    message: string
  }
}

export interface format {
  name: string
  pattern: RegExp | string
}

export interface ajvValidatorOptions {
  ajvConfigBody?: Record<string, unknown>
  ajvConfigParams?: Record<string, unknown>
  beautifyErrors?: boolean
  contentTypeValidation?: boolean
  errorFormatter?: (
    // eslint-disable-next-line no-unused-vars
    errors: Array<ErrorDetails>,
    // eslint-disable-next-line no-unused-vars
    options: ajvValidatorOptions,
  ) => Error
  expectFormFieldsInBody?: boolean
  firstError?: boolean
  formats?: Array<format>
  keywords?: unknown
  makeOptionalAttributesNullable?: boolean
  skipOAIValidation?: boolean
  dereferenced?: boolean
  allowQueryAdditionalProperties?: boolean
}

export interface LambdaOptions {
  path: string
  httpMethod: 'get' | 'put' | 'post' | 'delete'
  queryStringParameters?: Record<string, unknown>
  body?: Record<string, unknown>
  pathParameters?: Record<string, unknown>
  headers?: Record<string, string>
}

export interface ValidatorParams {
  path: string
  method: string
  headers?: Record<string, string>
  params?: Record<string, unknown>
  query?: Record<string, unknown>
  body?: Record<string, unknown>
}
