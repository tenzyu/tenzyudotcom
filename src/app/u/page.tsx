import { LinkList } from "@/components/link-list"
import { Header } from "@/components/header"

export default function LinkTreePage() {
    return (
        <>
            <Header />
            <main className="flex min-h-screen flex-col items-center p-4 bg-gradient-to-b from-background to-muted/50">
                <div className="container flex flex-col items-center gap-8 px-4 pb-16 pt-8">
                    <h1 className="text-3xl font-bold tracking-tight text-center">My Links</h1>
                    <LinkList />
                </div>
            </main>
        </>
    )
}

