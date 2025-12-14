import { PropertyPreview } from '@/components/PropertyPreview'
import { ValuePreview } from '@/components/ValuePreview'
import { usePropertyComputedValue } from '@/hooks/usePropertyComputedValue'
import { useValueContext } from '@/hooks/useValueContext'
import { getDisplayObjectProperties } from '@/lib/getDisplayObjectProperties'
import { isRevived } from '@/lib/revived'
import { SYNTHETIC_PROPERTY_KEY_ENTRIES, SYNTHETIC_PROPERTY_KEY_PROTOTYPE } from '@/lib/synthetic'
import { cn } from '@/lib/utils'
import { ExceptionKind, Property } from '@/types'
import { SideEffectInfo } from '@jsconsole/interpreter'
import { HistoryIcon, InfoIcon } from 'lucide-react'
import { useId, useMemo, useState } from 'react'

type ValueTreeViewProps = {
  value: unknown
  renderStringAsPlainText?: boolean
  exception?: ExceptionKind
}

export function ValueTreeView({ value, renderStringAsPlainText, exception }: ValueTreeViewProps) {
  const isRevivedValue = isRevived(value)
  const isExpandable = isValueExpandable(value)

  return (
    <div className="inline-block align-top">
      <TreeItem
        isExpandable={isExpandable}
        header={
          <>
            <ValuePreview
              value={value}
              placement="top"
              renderStringAsPlainText={renderStringAsPlainText}
              exception={exception}
            />
            {isRevivedValue && (
              <span
                className={cn(
                  'text-muted-foreground ml-1.5 inline-flex items-center',
                  isExpandable && 'group-[[aria-expanded="false"]]/label:hidden',
                )}
                title="This value was retrieved from a former session. Some properties and prototype chain may not be preserved."
              >
                <HistoryIcon size={13} />
              </span>
            )}
            {!isRevivedValue && isExpandable && (
              <span
                className="text-muted-foreground ml-1.5 inline-flex items-center group-[[aria-expanded='false']]/label:hidden"
                title="This value was evaluated upon first expanding. It may have changed since then."
              >
                <InfoIcon size={12} />
              </span>
            )}
          </>
        }
      >
        <ValueChildren value={value} owner={value} />
      </TreeItem>
    </div>
  )
}

function TreeItem({
  isExpandable,
  header,
  children,
  initiallyExpanded = false,
}: {
  header: React.ReactNode
  isExpandable: boolean
  children: React.ReactNode
  initiallyExpanded?: boolean
}) {
  return isExpandable ? (
    <LazyExpandable header={header} initiallyExpanded={initiallyExpanded}>
      {children}
    </LazyExpandable>
  ) : (
    header
  )
}

function ValueChildren({ value, owner }: { value: unknown; owner: unknown }) {
  if (isObject(value)) {
    return <ObjectValueChildren value={value} owner={owner} />
  }

  return null
}

function ObjectValueChildren({ value, owner }: { value: object; owner: unknown }) {
  const context = useValueContext()
  const props = useMemo(() => getDisplayObjectProperties(value, context), [value, context])

  return (
    <ol className="group/list pl-9">
      {props.map((prop) => (
        <li key={String(prop.name)}>
          <PropertyItem property={prop} owner={owner} sideEffectInfo={context.sideEffectInfo} />
        </li>
      ))}
      {!props.length && <li className="token-muted token-emphasis py-1">No properties</li>}
    </ol>
  )
}

type PropertyItemProps = {
  property: Property
  owner: unknown
  sideEffectInfo: SideEffectInfo
}

function PropertyItem({ property, owner, sideEffectInfo }: PropertyItemProps) {
  const computed = usePropertyComputedValue(property.descriptor, owner, sideEffectInfo)
  const isExpandable = isValueExpandable(computed.value)

  return (
    <TreeItem
      isExpandable={isExpandable}
      initiallyExpanded={property.name === SYNTHETIC_PROPERTY_KEY_ENTRIES}
      header={<PropertyPreview property={property} computed={computed} />}
    >
      <ValueChildren
        value={computed.value}
        owner={property.name === SYNTHETIC_PROPERTY_KEY_PROTOTYPE ? owner : computed.value}
      />
    </TreeItem>
  )
}

function LazyExpandable({
  header,
  children,
  initiallyExpanded = false,
}: {
  header: React.ReactNode
  children: React.ReactNode
  initiallyExpanded?: boolean
}) {
  const btnId = useId()
  const contentId = useId()
  const [expanded, setExpanded] = useState(initiallyExpanded)
  const [childrenHasRendered, setChildrenHasRendered] = useState(false)

  const shouldRenderChildren = expanded || childrenHasRendered

  const toggle = () => {
    setExpanded((x) => !x)
    setChildrenHasRendered(true)
  }

  return (
    <div className="-ml-2 group-[ol]/list:-ml-5">
      <span className="group/expander flex items-start">
        <button id={btnId} onClick={toggle} aria-expanded={expanded} aria-controls={contentId}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 15 15"
            className={`transition-transform ${expanded ? 'rotate-90' : ''} group-hover/expander:text-accent-foreground`}
          >
            <path d="M6 11L6 4L10.5 7.5L6 11Z" fill="currentColor"></path>
          </svg>
        </button>
        <label
          htmlFor={btnId}
          className="group/label flex flex-1"
          aria-expanded={expanded}
          aria-controls={contentId}
        >
          {header}
        </label>
      </span>
      <div id={contentId} hidden={!expanded}>
        {shouldRenderChildren && children}
      </div>
    </div>
  )
}

function isValueExpandable(value: unknown): value is object {
  return isObject(value)
}

function isObject(value: unknown): value is object {
  return value !== null && (typeof value === 'object' || typeof value === 'function')
}
