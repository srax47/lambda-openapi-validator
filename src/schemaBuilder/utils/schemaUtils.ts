import type { OpenAPIV3 } from 'openapi-types'

/**
 * recursively omit prop with the given name and if it equals to the given value
 */
export function addOAI3Support(schema: OpenAPIV3.SchemaObject) {
  const schemaType = getSchemaType(schema)

  const newSchema = { ...schema }

  if (schemaType) {
    // anyOf/oneOf/allOf handling
    newSchema[schemaType] = schema[schemaType]?.map((schema) =>
      addOAI3Support(schema as OpenAPIV3.SchemaObject),
    )
    return newSchema
  } else if (schema.properties) {
    // object handling
    newSchema.properties = { ...schema.properties }

    for (const propName of Object.keys(newSchema.properties)) {
      addRWOnlySupport(
        newSchema as OpenAPIV3.SchemaObject & {
          properties: Record<string, OpenAPIV3.SchemaObject>
        },
        propName,
      )
    }
    return newSchema
  } else if (
    schema.type === 'array' &&
    (schema.items as OpenAPIV3.SchemaObject).properties
  ) {
    // array handling
    ;(newSchema as OpenAPIV3.ArraySchemaObject).items = addOAI3Support({
      ...(schema.items as OpenAPIV3.SchemaObject),
    })
    return newSchema
  } else {
    // other datatypes handling
    return schema
  }
}

/**
 * add missing readOnly support to AJV
 */
function addRWOnlySupport(
  schema: OpenAPIV3.SchemaObject & {
    properties: Record<string, OpenAPIV3.SchemaObject>
  },
  propName: string,
) {
  const { properties } = schema

  if (properties[propName].readOnly === true) {
    // delete the prop from properties object so it wouldn't be accepted in case of additionalProperties: true
    delete properties[propName]

    // delete the prop from the required props
    if (!schema.required) return

    const propIndex = schema.required.indexOf(propName)
    if (propIndex >= 0) {
      schema.required.splice(propIndex, 1)
    }
  } else if (properties[propName].properties) {
    // if the current prop is an object we need to recursively look for omitByPropName occurrences
    properties[propName] = addOAI3Support(properties[propName])
  }
}

/**
 * returns the type of the given dereferenced schema object (anyOf, oneOf, allOf)
 */
function getSchemaType(schema: OpenAPIV3.SchemaObject) {
  if (schema.anyOf) {
    return 'anyOf'
  }
  if (schema.allOf) {
    return 'allOf'
  }
  if (schema.oneOf) {
    return 'oneOf'
  }
}
