"use client"

import type { MyLink } from "@/data/links"
import { Button } from "@/components/ui/button"
import { ShareDialog } from "./share-dialog"

interface LinkCardProps {
    link: MyLink
}

export function LinkCard({ link }: LinkCardProps) {
    return (
        <div className="flex items-center justify-between border border-md rounded-md">
            <Button variant="ghost" className="flex-1 justify-start px-4 py-4 h-auto font-medium hover:bg-muted/50" asChild>
                <a href={`/u/${link.shortenUrl}`} target="_blank" rel="noreferrer">
                    {link.title}
                </a>
            </Button>
            <ShareDialog title={link.title} shortenUrl={link.shortenUrl} />
        </div>
    )
}

