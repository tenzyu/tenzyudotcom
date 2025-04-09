import Image from 'next/image'
import type { TwitterComponents } from 'react-tweet'

export const components: TwitterComponents = {
  AvatarImg: props => (
    <Image {...props} priority={false} loading='lazy' quality={75} />
  ),
  MediaImg: props => (
    <Image
      {...props}
      fill={true}
      unoptimized={true}
      priority={false}
      loading='lazy'
      quality={75}
    />
  ),
}
