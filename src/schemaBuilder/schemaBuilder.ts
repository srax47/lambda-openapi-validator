import Ajv from 'ajv'
import {
  buildRequestBodyValidation,
  buildPathParameters,
} from './parsers/open-api3'
import { addCustomKeyword } from './utils/ajv-utils'
import type { ajvValidatorOptions } from '../types'
import { SimpleValidator } from './validators/SimpleValidator'
import type { OpenAPIV3 } from 'openapi-types'

export function buildSchemaSync(
  schema: OpenAPIV3.Document,
  options: ajvValidatorOptions,
) {
  const schemas: Record<string, unknown> = {}

  Object.keys(schema.paths).forEach((currentPath) => {
    const operationSchemas: Record<string, unknown> = {}
    const methods = schema.paths[currentPath]
    if (!methods) return

    Object.keys(methods).forEach((currentMethod) => {
      const parsedMethod = currentMethod.toLowerCase()
      operationSchemas[parsedMethod] = buildRequestValidator(
        methods[
          currentMethod as OpenAPIV3.HttpMethods
        ] as OpenAPIV3.OperationObject,
        currentPath,
        currentMethod,
        options,
      )
    })

    const normalizedPath = currentPath.replace(/{(\w+)}/g, ':$1')
    schemas[normalizedPath] = operationSchemas
  })

  return schemas
}

function buildRequestValidator(
  schema: OpenAPIV3.OperationObject,
  currentPath: string,
  currentMethod: string,
  options: ajvValidatorOptions,
) {
  const localParameters = buildPathParameters(
    (schema.parameters || []) as OpenAPIV3.ParameterObject[],
  )

  return {
    body: buildRequestBodyValidation(schema, options),
    parameters: buildParametersValidation(localParameters, options),
  }
}

function buildParametersValidation(
  parameters: OpenAPIV3.ParameterObject[],
  options: ajvValidatorOptions,
) {
  const ajv = new Ajv({
    allErrors: true,
    coerceTypes: 'array',
    ...options.ajvConfigParams,
  })

  addCustomKeyword(ajv, options.formats, options.keywords)

  const ajvParametersSchema: OpenAPIV3.SchemaObject = {
    title: 'HTTP parameters',
    type: 'object',
    additionalProperties: false,
    properties: {
      headers: {
        title: 'HTTP headers',
        type: 'object',
        properties: {},
        additionalProperties: true,
      },
      path: {
        title: 'HTTP path',
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      query: {
        title: 'HTTP query',
        type: 'object',
        properties: {},
        additionalProperties: options.allowQueryAdditionalProperties || false,
      },
    },
  }

  parameters.forEach((parameter) => {
    const { name, in: paramIn, required, ...data } = parameter

    const inHeader = paramIn === 'header'
    const source = (inHeader ? 'headers' : paramIn) as
      | 'headers'
      | 'path'
      | 'query'
    const key = inHeader ? name.toLowerCase() : name

    const destination = (
      ajvParametersSchema.properties as Record<string, OpenAPIV3.SchemaObject>
    )[source]

    if (required) {
      destination.required = destination.required || []
      destination.required.push(key)
    }

    ;(destination.properties as Record<string, OpenAPIV3.SchemaObject>)[key] =
      data
  })

  return new SimpleValidator(ajv.compile(ajvParametersSchema))
}
