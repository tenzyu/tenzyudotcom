import { MY_LINKS } from "@/data/links"
import { LinkCard } from "./link-card"

export function LinkList() {
  return (
    <div className="space-y-4 w-full max-w-md mx-auto p-6 rounded-xl shadow-lg backdrop-blur-sm">
      {MY_LINKS.map((link, index) => (
        <LinkCard key={index} link={link} />
      ))}
    </div>
  )
}

