import { ContentMDX } from '../../_features/content-mdx'
import { SCRAP_MDX_COMPONENTS } from './scrap-mdx-components'

type ScrapMdxRendererProps = {
  source: string
}

export async function ScrapMdxRenderer({ source }: ScrapMdxRendererProps) {
  return (
    <ContentMDX
      source={source}
      scope="scrap"
      additionalComponents={SCRAP_MDX_COMPONENTS}
    />
  )
}
