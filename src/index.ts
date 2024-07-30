import {
  getMethodSchema,
  type Validator,
  type MethodSchema,
} from './schemaEndpointResolver'
import { InputValidationError } from './inputValidationError'
import type {
  LambdaOptions,
  ValidatorParams,
  ajvValidatorOptions,
} from './types'
import { buildSchemaSync } from './schemaBuilder/schemaBuilder'
import type { OpenAPIV3 } from 'openapi-types'

export default class SchemaValidator {
  options: ajvValidatorOptions
  schemas: Record<string, { get: MethodSchema }>
  routesArr: string[][]
  cache: Record<string, MethodSchema | undefined>

  constructor(options: ajvValidatorOptions) {
    this.schemas = {}
    this.routesArr = []
    this.options = options
    this.cache = {}
  }

  init(openapiSchema: Record<string, unknown>) {
    this.schemas = buildSchemaSync(
      openapiSchema as unknown as OpenAPIV3.Document,
      this.options,
    ) as Record<string, { get: MethodSchema }>
    this.routesArr = Object.keys(this.schemas).map((route) => route.split('/'))
  }

  async validate(path: string, ctx: LambdaOptions) {
    const requestOptions = {
      path,
      headers: ctx.headers || {},
      params: ctx.pathParameters || {},
      query: ctx.queryStringParameters || {},
      method: ctx.httpMethod.toLowerCase(),
      body: ctx.body,
    }

    const paramValidationErrors = this.#validateParams(requestOptions)
    const bodyValidationErrors = this.#validateBody(requestOptions)

    const errors = paramValidationErrors.concat(bodyValidationErrors)
    if (!errors.length) return

    return new InputValidationError(errors, this.options.beautifyErrors)
  }

  #getContentType(headers?: Record<string, string>) {
    // This is to filter out things like charset
    const contentType = headers?.['content-type']
    // default to application/json
    return contentType ? contentType.split(';')[0].trim() : 'application/json'
  }

  #validateBody(requestOptions: ValidatorParams) {
    const { body, path, method } = requestOptions
    const contentType = this.#getContentType(requestOptions.headers)
    const methodSchema = this.#getMethodSchema(path, method)

    if (methodSchema?.body) {
      const validator =
        ((contentType &&
          methodSchema.body[
            contentType as keyof typeof methodSchema.body
          ]) as Validator) || (methodSchema.body as Validator)
      if (!validator.validate(body)) {
        return validator.errors || []
      }
    }

    return []
  }

  #validateParams(requestOptions: ValidatorParams) {
    const { headers, params: pathParams, query, path, method } = requestOptions
    const methodSchema = this.#getMethodSchema(path, method)

    if (
      !methodSchema?.parameters?.validate({ query, headers, path: pathParams })
    ) {
      return methodSchema?.parameters?.errors || []
    }

    return []
  }

  #getMethodSchema(path: string, method: string) {
    const key = path + method

    if (!this.cache[key]) {
      this.cache[key] = getMethodSchema(
        this.schemas,
        this.routesArr,
        path,
        method,
      )
    }

    return this.cache[key]
  }
}
