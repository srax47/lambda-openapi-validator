import type Ajv from 'ajv'
import type { format, keyword } from '../../types'
import addFormats from 'ajv-formats'

export function addCustomKeyword(
  ajv: Ajv,
  formats?: format[],
  keywords?: keyword[],
) {
  addFormats(ajv, ['uuid'])

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
