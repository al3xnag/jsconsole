import { SVGProps } from 'react'

export function ChevronLeftFromDot(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m14 18-6-6 6-6" />
      <circle cx="17" cy="12" r="1" />
    </svg>
  )
}
