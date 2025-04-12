'use client'

import Image, { ImageProps } from 'next/image'
import { useState } from 'react'

type ImageWithLoadingProps = Omit<ImageProps, 'onLoad'> & {
  loadingComponent?: React.ReactNode
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void
}

export const ImageWithLoading = ({
  loadingComponent,
  className,
  style,
  onLoad: onLoadProp,
  ...props
}: ImageWithLoadingProps) => {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <>
      {isLoading && loadingComponent}
      <Image
        {...props}
        className={className}
        style={{
          ...style,
          opacity: isLoading ? 0 : 1,
        }}
        onLoad={(e) => {
          setIsLoading(false)
          onLoadProp?.(e)
        }}
      />
    </>
  )
}
