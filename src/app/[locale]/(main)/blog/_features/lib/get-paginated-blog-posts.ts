import { getBlogPosts } from '@/lib/blog/getBlogPosts'

const PAGE_SIZE = 6

export type BlogListItem = Awaited<ReturnType<typeof getBlogPosts>>[number]

export type PaginatedBlogPosts = {
  currentPage: number
  pageItems: BlogListItem[]
  totalPages: number
}

export async function getPaginatedBlogPosts(
  rawPage?: string,
): Promise<PaginatedBlogPosts> {
  const posts = await getBlogPosts()
  const totalPages = Math.ceil(posts.length / PAGE_SIZE)
  const pageParam = Number(rawPage ?? 1)
  const currentPage = Number.isFinite(pageParam)
    ? Math.min(Math.max(pageParam, 1), Math.max(totalPages, 1))
    : 1
  const startIndex = (currentPage - 1) * PAGE_SIZE

  return {
    currentPage,
    pageItems:
      totalPages > 0 ? posts.slice(startIndex, startIndex + PAGE_SIZE) : [],
    totalPages,
  }
}
