import { MY_LINKS } from "@/data/links"
import { LinkCard } from "./link-card"
import { Card, CardContent } from "@/components/ui/card"

export function LinkList() {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="px-6">
        <div className="space-y-2">
          {MY_LINKS.map((link, index) => (
            <LinkCard key={index} link={link} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

