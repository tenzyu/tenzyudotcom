import { MY_LINKS } from "@/data/links"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { shortUrl: string } }) {
  const shortUrl = params.shortUrl
  const link = MY_LINKS.find((link) => link.shortenUrl === shortUrl)

  if (link) {
    return NextResponse.redirect(link.url)
  }

  return NextResponse.redirect(new URL("/", request.url))
}

