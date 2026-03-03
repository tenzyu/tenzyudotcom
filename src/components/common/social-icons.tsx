import Image from 'next/image'

type XIconProps = {
  className?: string
}
export function XIcon(props: XIconProps) {
  return (
    <div className={props.className}>
      <Image
        src="/icons/x.svg"
        alt="X"
        width={24}
        height={24}
        className={props.className}
      />
    </div>
  )
}
