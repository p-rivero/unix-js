import fs from 'fs'
import path from 'path'
import { serializeObject } from 'serialize/serialize-object'

function defaultTemplate(templateFileName: string): string {
    return path.join(path.dirname(new URL(import.meta.url).pathname), templateFileName)
}

function getTemplatePath(input: string): string {
    switch (input.toLowerCase()) {
        case 'commonjs':
            return defaultTemplate('template-commonjs.js')
        case 'module':
            return defaultTemplate('template-module.js')
        default:
            return input
    }
}

function getTemplate(template: string): string {
    try {
        return fs.readFileSync(getTemplatePath(template), 'utf8')
    } catch (e) {
        throw new Error(`Failed to find template file "${template}"`)
    }
}

export function serializeWithTemplate(obj: unknown, template: string, indent: number): string {
    const templateBody = getTemplate(template)
    const serializedResult = serializeObject(obj, indent)
    return templateBody.replace('[RESULT]', serializedResult)
}
