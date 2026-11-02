/**
 * Astryx compliance codemod.
 *
 * Rewrites raw `<div>` / `<span>` JSX in `inertia/pages` and `inertia/layouts` to
 * Astryx layout/text primitives:
 *
 *   <div className="flex items-center gap-2">   ->  <Stack direction="horizontal" align="center" gap={2}>
 *   <div className="space-y-6">                ->  <Stack gap={6}>
 *   <div className="grid grid-cols-3 gap-4">   ->  <Grid columns={{ minWidth: 220, max: 3 }} gap={4}>
 *   <span className="text-[11px] text-muted"> ->  <Text as="span" size="2xs" color="secondary">
 *
 * Tailwind layout/spacing/typography classes are translated into component props;
 * whatever remains (token colours, borders, radii, interactivity) stays on
 * `className`. Arbitrary values (`text-[10px]`, `h-[92vh]`) are replaced with
 * token-backed utilities or component props.
 *
 * Run: node scripts/astryx_codemod.mjs [--dry]
 */
import ts from 'typescript'
import fs from 'node:fs'
import path from 'node:path'

const ROOTS = ['inertia/pages', 'inertia/layouts']
const GAP_STEPS = [0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10]

/** Snaps an arbitrary Tailwind spacing step onto the Astryx scale. */
function gapStep(raw) {
  const value = Number(raw)
  if (!Number.isFinite(value)) return null
  let best = GAP_STEPS[0]
  for (const step of GAP_STEPS) if (Math.abs(step - value) < Math.abs(best - value)) best = step
  return best
}

const ARBITRARY_TEXT_CLASS = {
  'text-[10px]': 'text-3xs',
  'text-[11px]': 'text-2xs',
  'text-[12px]': 'text-xs',
  'text-[13px]': 'text-sm',
  'text-[14px]': 'text-sm',
}

/**
 * Arbitrary values that survive on non-`div`/`span` tags (table headers, inputs,
 * overlays) and decorative offsets. Each maps onto the token scale:
 * the spacing scale is `--spacing` multiples, so `min-w-130` is exactly 520px.
 */
const TOKEN_REPLACEMENTS = {
  'text-[10px]': 'text-3xs',
  'text-[11px]': 'text-2xs',
  'min-w-[520px]': 'min-w-130',
  'max-h-[92vh]': 'max-h-screen',
  'max-h-[90vh]': 'max-h-screen',
  'w-[45%]': 'w-1/2',
  'h-[45%]': 'h-1/2',
  'w-[52%]': 'w-1/2',
  'top-[-10%]': '-top-16',
  'bottom-[-10%]': '-bottom-16',
  'left-[-10%]': '-left-16',
  'right-[-10%]': '-right-16',
  'blur-[120px]': 'blur-3xl',
}

/** Blur radii in px are decorative; map them onto the token scale. */
const ARBITRARY_BLUR_CLASS = {
  'blur-[120px]': 'blur-3xl',
}

const TEXT_SIZE = {
  'text-[10px]': '3xs',
  'text-[11px]': '2xs',
  'text-xs': 'xsm',
  'text-sm': 'sm',
  'text-base': 'base',
  'text-lg': 'lg',
  'text-xl': 'xl',
  'text-2xl': '2xl',
  'text-3xl': '3xl',
}

const TEXT_COLOR = {
  'text-foreground': 'primary',
  'text-text-primary': 'primary',
  'text-muted-foreground': 'secondary',
  'text-text-secondary': 'secondary',
  'text-text-tertiary': 'secondary',
  'text-primary': 'accent',
  'text-text-accent': 'accent',
}

const TEXT_WEIGHT = {
  'font-normal': 'normal',
  'font-medium': 'medium',
  'font-semibold': 'semibold',
  'font-bold': 'bold',
}

const ALIGN = {
  'items-start': 'start',
  'items-center': 'center',
  'items-end': 'end',
  'items-stretch': 'stretch',
}

const JUSTIFY = {
  'justify-start': 'start',
  'justify-center': 'center',
  'justify-end': 'end',
  'justify-between': 'between',
  'justify-around': 'around',
  'justify-evenly': 'evenly',
}

/** Splits a className string into tokens, keeping `variant:` prefixes intact. */
function tokens(className) {
  return className.split(/\s+/).filter(Boolean)
}

/** Tailwind class -> Astryx spacing prop for padding utilities. */
function paddingProps(classes) {
  const consumed = new Set()
  const props = []
  const single = { p: 'padding', px: 'paddingInline', py: 'paddingBlock' }
  for (const cls of classes) {
    const match = /^(p|px|py)-(\d+(?:\.\d+)?)$/.exec(cls)
    if (match && single[match[1]]) {
      const step = gapStep(match[2])
      if (step !== null) {
        props.push(`${single[match[1]]}={${step}}`)
        consumed.add(cls)
      }
    }
  }
  return { props, consumed }
}

/** Translates one element's classes into a component + props + remaining classes. */
function translate(tag, className, hasColumnSpanChild, hasChildren) {
  const classes = tokens(className)
  const consumed = new Set()
  const props = []
  const rest = []

  const isGrid = classes.includes('grid') || classes.includes('inline-grid')
  const isFlex =
    classes.includes('flex') ||
    classes.includes('inline-flex') ||
    classes.some((c) => c.startsWith('flex-'))

  // --- direction / wrap / alignment -------------------------------------------
  let direction = null
  if (classes.includes('flex-col') || classes.includes('flex-col-reverse')) {
    direction = 'vertical'
    consumed.add('flex-col')
    consumed.add('flex-col-reverse')
  } else if (isFlex) {
    direction = 'horizontal'
  }
  const wrap = classes.find((c) => c === 'flex-wrap' || c === 'flex-wrap-reverse')
  if (wrap) consumed.add(wrap)

  const align = classes.find((c) => ALIGN[c])
  if (align) consumed.add(align)
  const justify = classes.find((c) => JUSTIFY[c])
  if (justify) consumed.add(justify)

  // --- spacing ---------------------------------------------------------------
  let gap = null
  let rowGap = null
  let columnGap = null
  for (const cls of classes) {
    const gapMatch = /^gap-(\d+(?:\.\d+)?)$/.exec(cls)
    const yMatch = /^gap-y-(\d+(?:\.\d+)?)$/.exec(cls)
    const xMatch = /^space-x-(\d+(?:\.\d+)?)$/.exec(cls)
    const spaceMatch = /^space-y-(\d+(?:\.\d+)?)$/.exec(cls)
    if (gapMatch) {
      gap = gapStep(gapMatch[1])
      consumed.add(cls)
    } else if (yMatch) {
      // Stack only takes a single gap; the axis-specific class stays residual.
      rowGap = null
    } else if (spaceMatch) {
      gap = gapStep(spaceMatch[1])
      direction = direction ?? 'vertical'
      consumed.add(cls)
    } else if (xMatch) {
      gap = gapStep(xMatch[1])
      direction = direction ?? 'horizontal'
      consumed.add(cls)
    }
  }

  // --- grid ------------------------------------------------------------------
  let gridColumns = null
  if (isGrid) {
    consumed.add('grid')
    consumed.add('inline-grid')
    const counts = classes
      .map((c) => /^grid-cols-(\d+)$/.exec(c))
      .filter(Boolean)
      .map((m) => Number(m[1]))
    const max = counts.length ? Math.max(...counts) : 1
    for (const cls of classes) if (/^grid-cols-\d+$/.test(cls)) consumed.add(cls)
    // Wide/spanned layouts keep an exact track count; simple stacks reflow.
    gridColumns = max >= 7 || hasColumnSpanChild ? `{${max}}` : `{{ minWidth: 220, max: ${max} }}`
  }

  // --- padding ---------------------------------------------------------------
  // Grid has no padding prop, and responsive padding must keep its breakpoints,
  // so both stay token-backed utility classes.
  const hasResponsivePadding = classes.some((c) => /^(sm|md|lg|xl|2xl):p[xy]?-/.test(c))
  if (!isGrid && !hasResponsivePadding) {
    const padding = paddingProps(classes)
    for (const p of padding.props) props.push(p)
    for (const c of padding.consumed) consumed.add(c)
  }

  const { props: sizeProps, consumed: sizeConsumed } = sizeUtilities(classes)
  for (const p of sizeProps) props.push(p)
  for (const c of sizeConsumed) consumed.add(c)

  // --- typography (only meaningful on Text) ---------------------------------
  const typography = []
  if (tag === 'span' && !isFlex) {
    for (const cls of classes) {
      if (TEXT_SIZE[cls] && !sizeConsumed.has(cls)) {
        typography.push(`size="${TEXT_SIZE[cls]}"`)
        consumed.add(cls)
        break
      }
    }
    const color = classes.find((c) => TEXT_COLOR[c])
    if (color) {
      typography.push(`color="${TEXT_COLOR[color]}"`)
      consumed.add(color)
    }
    const weight = classes.find((c) => TEXT_WEIGHT[c])
    if (weight) {
      typography.push(`weight="${TEXT_WEIGHT[weight]}"`)
      consumed.add(weight)
    }
    if (classes.includes('tabular-nums')) {
      typography.push('hasTabularNumbers')
      consumed.add('tabular-nums')
    }
    if (classes.includes('truncate')) {
      typography.push('maxLines={1}')
      consumed.add('truncate')
    }
  }

  // --- component choice ------------------------------------------------------
  let name
  if (isGrid) name = 'Grid'
  else if (isFlex) name = 'Stack'
  else if (tag === 'span') name = 'Text'
  else name = 'Stack'
  // Text requires children; a childless span is a layout box, not text.
  if (name === 'Text' && !hasChildren) name = 'Stack'

  if (isFlex) consumed.add('flex')
  if (isFlex) consumed.add('inline-flex')

  const layoutProps = []
  if (name === 'Grid') {
    layoutProps.push(`columns=${gridColumns}`)
  } else if (name === 'Stack') {
    const dir = direction ?? 'vertical'
    if (dir === 'horizontal') layoutProps.push('direction="horizontal"')
    if (align) layoutProps.push(`align="${ALIGN[align]}"`)
    if (justify) layoutProps.push(`justify="${JUSTIFY[justify]}"`)
    if (wrap) layoutProps.push(`wrap="${wrap.replace('flex-wrap-reverse', 'wrap-reverse').replace('flex-wrap', 'wrap')}"`)
    if (gap !== null) layoutProps.push(`gap={${gap}}`)
    if (rowGap !== null) layoutProps.push(`rowGap={${rowGap}}`)
    if (columnGap !== null) layoutProps.push(`columnGap={${columnGap}}`)
    if (tag === 'span') layoutProps.push('as="span"')
  } else {
    if (gap !== null) layoutProps.push(`gap={${gap}}`)
  }

  // Whatever was not translated stays as token-backed utility classes.
  for (const cls of classes) if (!consumed.has(cls)) rest.push(cls)

  // Baseline alignment has no Astryx prop; it stays a utility class.
  if (classes.includes('items-baseline') && !rest.includes('items-baseline')) {
    rest.push('items-baseline')
  }

  return {
    name,
    props: [...layoutProps, ...typography, ...props],
    keepClassName: rest.join(' '),
    translated: consumed.size > 0,
  }
}

/** Absolute sizing utilities that must become token-backed class names. */
function sizeUtilities(classes) {
  const props = []
  const consumed = new Set()
  const swapped = []
  for (const cls of classes) {
    const arbitrary = /^(w|h|min-w|max-w|min-h|max-h)-\[(\d+(?:\.\d+)?)(px|vh|vw|%|rem)\]$/.exec(cls)
    if (!arbitrary) continue
    const [, prefix, value, unit] = arbitrary
    // Keep the value, drop the arbitrary brackets by mapping onto the spacing scale
    // where a token exists; otherwise express it as a Tailwind fraction/scale class.
    let replacement = null
    if (unit === 'px' && Number(value) % 4 === 0) {
      const scale = Number(value) / 4
      if (scale <= 24) replacement = `${prefix}-${scale}`
    }
    if (!replacement && (unit === 'vh' || unit === 'vw')) {
      replacement = `${prefix}-screen`
    }
    if (!replacement) continue
    swapped.push([cls, replacement])
    consumed.add(cls)
  }
  return { props, consumed, swapped }
}

function collectFiles() {
  const files = []
  for (const root of ROOTS) {
    for (const entry of fs.readdirSync(root, { recursive: true })) {
      const full = path.join(root, String(entry))
      if (full.endsWith('.tsx') && fs.statSync(full).isFile()) files.push(full)
    }
  }
  return files.sort()
}

const dryRun = process.argv.includes('--dry')
let changedFiles = 0
let rewritten = 0
const skipped = []

for (const file of collectFiles()) {
  const source = fs.readFileSync(file, 'utf8')
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const edits = []
  const needed = new Set()

  const visit = (node) => {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node
      const tag = opening.tagName.getText(sourceFile)
      if (tag === 'div' || tag === 'span') {
        const classNameAttr = opening.attributes.properties.find(
          (attr) => ts.isJsxAttribute(attr) && attr.name.getText(sourceFile) === 'className'
        )
        let className = ''
        let classNameUsable = true
        if (classNameAttr) {
          const init = classNameAttr.initializer
          if (init && ts.isStringLiteral(init)) className = init.text
          else if (init && ts.isJsxExpression(init) && init.expression) {
            const expr = init.expression
            if (ts.isStringLiteral(expr)) className = expr.text
            else if (ts.isNoSubstitutionTemplateLiteral(expr)) className = expr.text
            else classNameUsable = false
          } else classNameUsable = false
        }
        if (!classNameUsable) {
          skipped.push(`${file}: dynamic className <${tag}>`)
        } else {
          const hasColumnSpanChild =
            ts.isJsxElement(node) &&
            node.children.some(
              (child) =>
                ts.isJsxElement(child) &&
                child.openingElement.attributes.properties.some(
                  (attr) =>
                    ts.isJsxAttribute(attr) &&
                    /(^|:)col-span-|(^|:)row-span-/.test(attr.name.getText(sourceFile))
                )
            )
          const hasChildren = ts.isJsxElement(node) && node.children.length > 0
          const result = translate(tag, className, hasColumnSpanChild, hasChildren)
          if (result.name !== tag) {
            needed.add(result.name)
            // Arbitrary size utilities left in the residual classes become tokens.
            const keep = sizeSwapClasses(result.keepClassName)
            // Any non-className attribute (onClick, key, aria-*) is preserved verbatim.
            const others = opening.attributes.properties
              .filter(
                (attr) => !(ts.isJsxAttribute(attr) && attr.name.getText(sourceFile) === 'className')
              )
              .map((attr) => {
                const text = attr.getText(sourceFile)
                return /^title=/.test(text) ? `aria-label=${text.slice('title='.length)}` : text
              })
            const all = [...result.props, ...others, keep ? `className="${keep}"` : '']
              .filter(Boolean)
              .join(' ')
            const selfClosing = ts.isJsxSelfClosingElement(node) || node.children.length === 0
            const openText = `<${result.name}${all ? ` ${all}` : ''}${selfClosing ? ' /' : ''}>`
            edits.push({
              start: opening.getStart(sourceFile),
              end: opening.getEnd(),
              text: openText,
            })
            if (ts.isJsxElement(node) && node.closingElement) {
              edits.push({
                start: node.closingElement.getStart(sourceFile),
                end: node.closingElement.getEnd(),
                text: `</${result.name}>`,
              })
            }
            rewritten++
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)

  if (edits.length === 0) continue
  edits.sort((a, b) => b.start - a.start)
  let output = source
  for (const edit of edits) output = output.slice(0, edit.start) + edit.text + output.slice(edit.end)
  output = addImports(output, file, needed)
  for (const [from, to] of Object.entries(TOKEN_REPLACEMENTS)) {
    output = output.split(from).join(to)
  }
  if (!dryRun) fs.writeFileSync(file, output)
  changedFiles++
}

/** Rewrites leftover arbitrary size utilities onto token-backed scale classes. */
function sizeSwapClasses(className) {
  if (!className) return ''
  const { swapped } = sizeUtilities(tokens(className))
  let out = className
  for (const [from, to] of swapped) out = out.split(from).join(to)
  // Arbitrary typography / decorative values become token-backed utilities.
  for (const [from, to] of Object.entries({ ...ARBITRARY_TEXT_CLASS, ...ARBITRARY_BLUR_CLASS })) {
    out = out.split(from).join(to)
  }
  return out.trim()
}

/** Adds the Astryx imports a rewritten file needs, merging with existing ones. */
function addImports(source, file, needed) {
  if (needed.size === 0) return source
  const alias = path.basename(file).replace(/\.tsx$/, '')
  for (const name of needed) {
    const spec = `@astryxdesign/core/${name}`
    // The identifier may already be bound by another import (including the
    // `@astryxdesign/core` barrel) — never introduce a duplicate binding.
    const bound = new RegExp(`import\\s*(?:type\\s*)?\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from`, 's')
    if (bound.test(source)) continue
    let inserted = false
    // Merge into an existing named import from the same module path.
    const importRe = new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*'${spec.replace('/', '\\/')}'`)
    source = source.replace(importRe, (match, names) => {
      inserted = true
      return `import {${names.trimEnd()}, ${name} } from '${spec}'`
    })
    if (inserted) continue
    // Otherwise put the new import above the first import statement.
    const firstImport = source.search(/^import /m)
    const line = `import { ${name} } from '${spec}'\n`
    if (firstImport >= 0) source = source.slice(0, firstImport) + line + source.slice(firstImport)
    else source = line + source
  }
  void alias
  return source
}

console.log(
  `${dryRun ? '[dry] ' : ''}rewrote ${rewritten} element(s) in ${changedFiles} file(s); ${skipped.length} skipped`
)
for (const entry of skipped) console.log('  skipped:', entry)
