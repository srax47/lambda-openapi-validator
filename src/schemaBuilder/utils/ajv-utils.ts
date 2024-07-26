import type Ajv from 'ajv'
import type { format, keyword } from '../../types'

// uuid: http://tools.ietf.org/html/rfc4122
const uuidRegix = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i

export function addCustomKeyword(
  ajv: Ajv,
  formats?: format[],
  keywords?: keyword[],
) {
  ajv.addFormat('uuid', uuidRegix)

  formats?.forEach(function (format) {
    ajv.addFormat(format.name, format.pattern)
  })

  keywords?.forEach((keyword) => {
    if (typeof keyword === 'function') {
      return keyword(ajv)
    }

    if (typeof keyword === 'object') {
      const name = keyword.name
      const definition = keyword.definition
      if (name && definition) {
        return ajv.addKeyword(name, definition)
      }
    }
  })
}
