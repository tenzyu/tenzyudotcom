"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function ProfileCard() {
    return (
        <Card className="w-full max-w-2xl mx-auto overflow-hidden pt-0">
            <div className="aspect-[16/9] relative overflow-hidden">
                <Image src="/osu-gif.gif" alt="osu gameplay" fill className="object-cover" />
                <div className="absolute inset-0 bg-black/20"></div>
            </div>

            <CardContent className="pt-0 px-6 pb-6">
                <div className="flex flex-col items-center -mt-16 relative z-10">
                    <Image
                        src="/my-icon.png"
                        alt="tenzyu profile"
                        width={96}
                        height={96}
                        className="rounded-full border-4 border-background shadow-md bg-white"
                    />

                    <div className="flex items-center gap-4 mt-2">
                        <div className="flex flex-col items-center">
                            <div className="text-sm font-medium text-muted-foreground">世界ランキング</div>
                            <div className="text-2xl font-bold">#6,736</div>
                        </div>

                        <div className="h-8 w-px bg-border"></div>

                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1">
                                <span className="text-sm font-medium text-muted-foreground">国別ランキング</span>
                            </div>
                            <div className="text-2xl font-bold">#191</div>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-4">
                    <h1 className="text-2xl font-bold">天珠 (テンジュ)</h1>
                    <p className="text-base mt-2">osu! プレイヤー、ストリーマー、元プログラマー</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="space-y-2">
                        <p className="text-center">osu! の日本一を目指しています。</p>
                        <Button
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2"
                            asChild
                        >
                            <a href="https://osu.ppy.sh/users/23318599" target="_blank">
                                <Image src="/osu-logo.png" alt="osu! logo" width={20} height={20} className="rounded-full" />
                                <span>tenzyu</span>
                            </a>
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <p className="text-center">Twitch Partner を目指しています。</p>
                        <Button
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2"
                            asChild
                        >
                            <a href="https://tenzyu.com/u/twitch" target="_blank">
                                <Image src="/twitch-logo.png" alt="Twitch logo" width={20} height={20} />
                                <span>tenzyudotcom</span>
                            </a>
                        </Button>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t">
                    <h3 className="font-medium mb-2">fun facts: </h3>
                    <ul className="space-y-1 list-disc pl-5">
                        <li>2002年4月25日生まれです</li>
                        <li>osu! は2021年の5月からプレイしています</li>
                        <li>配信する前はプログラマーでした</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    )
}
