import type Ajv from 'ajv'
import type { ErrorObject, KeywordDefinition, ValidateFunction } from 'ajv'

export interface format {
  name: string
  pattern: RegExp | string
}

export type keyword =
  | { name: string; definition: KeywordDefinition }
  // eslint-disable-next-line no-unused-vars
  | ((ajv: Ajv) => unknown)

export interface ajvValidatorOptions {
  ajvConfigBody?: Record<string, unknown>
  ajvConfigParams?: Record<string, unknown>
  beautifyErrors?: boolean
  contentTypeValidation?: boolean
  errorFormatter?: (
    // eslint-disable-next-line no-unused-vars
    errors: Array<ErrorObject>,
    // eslint-disable-next-line no-unused-vars
    options: ajvValidatorOptions,
  ) => Error
  expectFormFieldsInBody?: boolean
  firstError?: boolean
  formats?: Array<format>
  keywords?: keyword[]
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

export type NonDiscriminatorValue = {
  validator: unknown
}

export type DiscriminatorValue = {
  validator?: ValidateFunction
  allowedValues?: (string | number)[]
  validators: Record<string, ValidateFunction>
  discriminator: string
}

export type NodeValue = NonDiscriminatorValue | DiscriminatorValue
