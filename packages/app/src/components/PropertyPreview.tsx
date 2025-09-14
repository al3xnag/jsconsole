import { ValuePreview } from '@/components/ValuePreview'
import { PropertyComputedData } from '@/hooks/usePropertyComputedValue'
import { PropertyContext } from '@/lib/PropertyContext'
import { SYNTHETIC_PROPERTY_KEY_ENTRIES } from '@/lib/synthetic'
import { cn } from '@/lib/utils'
import { Property } from '@/types'

type PropertyPreviewProps = {
  property: Property
  computed: PropertyComputedData
}

export function PropertyPreview({ property, computed }: PropertyPreviewProps) {
  const displayName: string = property.isSynthetic
    ? property.name.description!
    : property.name.toString()
  const shouldDisplayValue = property.name !== SYNTHETIC_PROPERTY_KEY_ENTRIES

  return (
    <span>
      <span
        className={cn(
          !property.isSynthetic && 'token-tag',
          property.isOwn && 'token-strong',
          property.isSynthetic && 'token-meta',
          !property.isSynthetic && !property.descriptor.enumerable && 'opacity-60',
        )}
      >
        {displayName}
      </span>

      {shouldDisplayValue && (
        <PropertyContext.Provider value={property}>
          <span>:&nbsp;</span>
          {!computed.hasComputed ? (
            <PropertyGetter compute={computed.compute} />
          ) : computed.isException ? (
            <>
              <span className="mr-2 text-red-500 italic">[getter raised an exception]</span>
              <ValuePreview value={computed.value} placement="item" />
            </>
          ) : (
            <ValuePreview value={computed.value} placement="item" />
          )}
        </PropertyContext.Provider>
      )}
    </span>
  )
}

function PropertyGetter({ compute }: { compute: () => void }) {
  return (
    <button
      onClick={compute}
      className="underline-offset-2 hover:underline"
      title="Invoke property getter"
    >
      (...)
    </button>
  )
}
