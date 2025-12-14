import { SVGProps } from 'react'

export function WarningFilledIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 20 20" {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 17L10 2L19 17H1ZM11 7V12H9V7H11ZM9.9999 15.1C10.6074 15.1 11.0999 14.6075 11.0999 14C11.0999 13.3925 10.6074 12.9 9.9999 12.9C9.39239 12.9 8.8999 13.3925 8.8999 14C8.8999 14.6075 9.39239 15.1 9.9999 15.1Z"
      />
    </svg>
  )
}
