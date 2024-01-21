import fs from 'fs'
import path from 'path'
import { serializeObject } from 'serialize/serialize-object'

function defaultTemplatePath(): string {
    const TEMPLATE_FILE_NAME = 'default-template.js'
    return path.join(path.dirname(new URL(import.meta.url).pathname), TEMPLATE_FILE_NAME)
}

export function serializeWithTemplate(obj: unknown, templatePath: string | null, indent: number): string {
    const template = fs.readFileSync(templatePath ?? defaultTemplatePath(), 'utf8')
    const serialized = serializeObject(obj, indent)
    return template.replace('[RESULT]', serialized)
}
