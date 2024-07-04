import Ajv from 'ajv'
import { addCustomKeyword } from '../utils/ajv-utils'
import { Node } from '../data_structures/tree'
import { addOAI3Support } from '../utils/schemaUtils'
import { SimpleValidator } from '../validators/SimpleValidator'
import { DiscriminatorValidator } from '../validators/DiscriminatorValidator'
import type { DiscriminatorValue, ajvValidatorOptions } from '../../types'
import type { OpenAPIV3 } from 'openapi-types'

const RECURSIVE__MAX_DEPTH = 20

export function buildRequestBodyValidation(
  schema: OpenAPIV3.OperationObject,
  options: ajvValidatorOptions,
) {
  const contentTypes = (
    schema.requestBody as OpenAPIV3.RequestBodyObject | undefined
  )?.content
  if (!contentTypes) {
    return
  }

  // Add validators for all content types
  const schemaWithValidators = Object.keys(contentTypes).reduce(
    (result, contentType) => {
      const bodySchema = contentTypes[contentType].schema
      if (!bodySchema) {
        return result
      }

      result[contentType] = handleBodyValidation(
        bodySchema as OpenAPIV3.SchemaObject,
        options,
      )
      return result
    },
    {} as Record<string, unknown>,
  )

  return schemaWithValidators
}

function handleBodyValidation(
  schema: OpenAPIV3.SchemaObject,
  options: ajvValidatorOptions,
) {
  const ajv = new Ajv({
    allErrors: true,
    ...options.ajvConfigBody,
  })

  addCustomKeyword(ajv, options.formats, options.keywords)

  if (schema.discriminator) {
    const tree = new Node()
    recursiveDiscriminatorBuilder(ajv, tree, schema, '')
    return new DiscriminatorValidator(tree)
  } else {
    // currently these features won't be supported in objects with discriminators
    const newSchema = addOAI3Support(schema)
    return new SimpleValidator(ajv.compile(newSchema))
  }
}

export function buildPathParameters(parameters: OpenAPIV3.ParameterObject[]) {
  return parameters.map((parameter) => {
    const clonedParameter = structuredClone(parameter)
    const schema = parameter.schema
    if (schema) {
      delete clonedParameter.schema
      Object.assign(clonedParameter, schema)
    }
    return clonedParameter
  })
}

function recursiveDiscriminatorBuilder(
  ajv: Ajv,
  ancestor: Node,
  { discriminator, ...schema }: OpenAPIV3.SchemaObject,
  allowedValue: string,
  propertiesAcc = {
    required: [] as string[],
    properties: {} as Record<string, OpenAPIV3.SchemaObject>,
  },
  depth = RECURSIVE__MAX_DEPTH,
) {
  if (depth === 0) {
    throw new Error(
      `swagger schema exceed maximum supported depth of ${RECURSIVE__MAX_DEPTH} for swagger definitions inheritance`,
    )
  }

  if (!discriminator) {
    // need to stop and just add validator on ancesstor;
    const newSchema = structuredClone(schema)
    newSchema.required = newSchema.required || []
    newSchema.required.push(...(propertiesAcc.required || []))
    newSchema.properties = Object.assign(
      newSchema.properties || {},
      propertiesAcc.properties,
    )

    const ancesstorValue = ancestor.getValue() as DiscriminatorValue
    ancesstorValue.validators[allowedValue] = ajv.compile(newSchema)
    return
  }

  propertiesAcc = structuredClone(propertiesAcc)
  propertiesAcc.required.push(...(schema.required || []))
  propertiesAcc.properties = Object.assign(
    propertiesAcc.properties,
    schema.properties,
  )

  const propertyName = discriminator.propertyName

  const discriminatorObject: DiscriminatorValue = {
    validator: undefined,
    validators: {},
    discriminator: propertyName,
  }

  const currentDiscriminatorNode = new Node(discriminatorObject)
  if (!ancestor.getValue()) {
    ancestor.setData(currentDiscriminatorNode)
  } else {
    ancestor.addChild(currentDiscriminatorNode, allowedValue)
  }

  const subDiscriminator = propertyName.startsWith('.')
  if (subDiscriminator) {
    const subPropertyName = propertyName.replace('.', '')

    const subSchema = schema.properties?.[subPropertyName] as
      | OpenAPIV3.ArraySchemaObject
      | undefined
    if (!subSchema || subSchema.type !== 'array') {
      throw new Error('sub discriminator must be on array type')
    }

    const parentSchema = structuredClone(schema)
    ;(
      (parentSchema.properties as Record<string, OpenAPIV3.SchemaObject>)[
        subPropertyName
      ] as OpenAPIV3.ArraySchemaObject
    ).items = { type: 'object' }
    discriminatorObject.validator = ajv.compile(parentSchema)

    recursiveDiscriminatorBuilder(
      ajv,
      currentDiscriminatorNode,
      subSchema.items as OpenAPIV3.SchemaObject,
      allowedValue,
    )
    return
  }

  if (!schema.oneOf) {
    throw new Error('oneOf must be part of discriminator')
  }

  const oneOf = schema.oneOf as OpenAPIV3.SchemaObject[]
  discriminatorObject.allowedValues = oneOf
    .map((refObject) => {
      const prop = refObject.properties?.[propertyName] as
        | OpenAPIV3.SchemaObject
        | undefined
      return prop?.enum
    })
    .filter(Boolean)
    .flat()

  oneOf.map((refObject) => {
    const prop = refObject.properties?.[propertyName] as
      | OpenAPIV3.SchemaObject
      | undefined

    prop?.enum?.forEach((allowedValue) => {
      recursiveDiscriminatorBuilder(
        ajv,
        currentDiscriminatorNode,
        refObject,
        allowedValue,
        propertiesAcc,
        depth - 1,
      )
    })
  })
}
