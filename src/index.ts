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

export { InputValidationError }

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

  async validate(ctx: LambdaOptions) {
    const requestOptions = this.#getParameters(ctx)
    const errors = this.#validateRequest(requestOptions)
    if (errors) {
      throw errors
    }
  }

  #getParameters(ctx: LambdaOptions): ValidatorParams {
    let path = ctx.path.replace(/{/g, ':').replace(/}/g, '')
    path = path.endsWith('/') ? path.substring(0, path.length - 1) : path

    return {
      path,
      headers: ctx.headers,
      params: ctx.pathParameters,
      query: ctx.queryStringParameters,
      method: ctx.httpMethod.toLowerCase(),
      body: ctx.body,
    }
  }

  #getContentType(headers?: Record<string, string>) {
    // This is to filter out things like charset
    const contentType = headers?.['content-type']
    // default to application/json
    return contentType ? contentType.split(';')[0].trim() : 'application/json'
  }

  #validateRequest(requestOptions: ValidatorParams) {
    const paramValidationErrors = this.#validateParams(requestOptions)
    const bodyValidationErrors = this.#validateBody(requestOptions)

    const errors = paramValidationErrors.concat(bodyValidationErrors)
    if (!errors.length) return

    if (this.options.errorFormatter) {
      return this.options.errorFormatter(errors, this.options)
    }

    return new InputValidationError(errors, {
      beautifyErrors: this.options.beautifyErrors,
      firstError: this.options.firstError,
    })
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
