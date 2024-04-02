import memoize from 'nano-memoize'
import type { ErrorDetails } from './types'

export const getMethodSchema = memoize(getMethodSchemaInternal, { maxAge: -1 })

export interface Validator {
  // eslint-disable-next-line no-unused-vars
  validate: (params: Record<string, unknown> | undefined) => boolean
  errors: ErrorDetails[]
}

export interface MethodSchema {
  body?: Record<string, Validator> | Validator
  parameters?: Validator
}

function getMethodSchemaInternal(
  schemas: Record<string, { get: MethodSchema }>,
  routesArr: string[][],
  path: string,
  method: string,
) {
  const pathArr = path.split('/')
  const routePath = pathMatcherInternal(routesArr, pathArr)
  if (routePath) {
    return schemas[routePath]?.[method as keyof (typeof schemas)[number]]
  }
}

function pathMatcherInternal(routesArr: string[][], pathArr: string[]) {
  let partialMatch: string | undefined

  const exactMatch = routesArr.find((routeArr) => {
    if (routeArr.length !== pathArr.length) return false

    return routeArr.every((seg, idx) => {
      if (seg === pathArr[idx]) return true

      // if current path segment is param
      if (!partialMatch && seg.startsWith(':') && pathArr[idx]) {
        partialMatch = routeArr.join('/')
      }

      return false
    })
  })

  return exactMatch?.join('/') || partialMatch
}
