/* eslint-disable no-unused-vars */
declare module 'api-schema-builder' {
  export function buildSchemaSync(
    openapiSchema: Record<string, unknown>,
    options: ajvValidatorOptions,
  ): Record<string, { get: MethodSchema }>
}

declare module 'lambda-openapi-validator'
