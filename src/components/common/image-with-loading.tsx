'use client'

import Image from 'next/image'
import { useState } from 'react'

import { cn } from '@/lib/utils'

type ImageWithLoadingProps = {
  loadingComponent: React.ReactNode
} & React.ComponentProps<typeof Image>

export const ImageWithLoading = ({
  loadingComponent,
  className,
  ...props
}: ImageWithLoadingProps) => {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <>
      {isLoading && loadingComponent}
      <Image
        {...props}
        className={cn(
          className,
          'transition-opacity duration-200',
          isLoading ? 'opacity-0' : 'opacity-100',
        )}
        onLoad={(e) => {
          setIsLoading(false)
          props.onLoad?.(e)
        }}
      />
    </>
  )
}
