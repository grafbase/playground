import { Source, parse } from 'graphql'

export const validateQuery = (source?: string | Source | null) => {
  if (!source) return false

  try {
    const docAST = parse(source)
    if (docAST) {
      return true
    }
  } catch {}

  return false
}
