"use client"

import type { MyLink } from "@/data/links"
import { Card, CardContent } from "@/components/ui/card"
import { ShareDialog } from "./share-dialog"

interface LinkCardProps {
    link: MyLink
}

export function LinkCard({ link }: LinkCardProps) {
    return (
        <Card className="w-full overflow-hidden transition-all hover:shadow-md py-0 border-none shadow-sm">
            <CardContent className="px-1">
                <div className="flex items-center justify-between">
                    <button
                        className="flex-1 p-4 text-left transition-colors"
                    >
                        <a href={`/u/${link.shortenUrl}`} target="_blank">
                            <h3 className="font-medium">{link.title}</h3>
                        </a>
                    </button>
                              <div className="pr-2">

                    <ShareDialog title={link.title} shortenUrl={link.shortenUrl} />
                              </div>
                </div>
            </CardContent>
        </Card>
    )
}

