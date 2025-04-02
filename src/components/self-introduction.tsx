"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function SelfIntroduction() {
    return (
        <div className="w-full max-w-md mx-auto space-y-4">
            <Card>
                <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">自己紹介</h3>

                    <p className="text-lg font-medium mb-3">天珠 (テンジュ) といいます</p>

                    <ul className="space-y-2 list-disc pl-5 mb-4">
                        <li>2002年生まれの22歳です</li>
                        <li>osu! は 2021年の5月からプレイしています</li>
                        <li>配信する前はプログラマーでした</li>
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">目標</h3>

                    <div className="space-y-4">
                        <div>
                            <p className="mb-2">osu! の日本一を目指しています。</p>
                            <Button
                                variant="outline"
                                className="w-full flex items-center justify-center gap-2"
                                onClick={() => window.open("https://osu.ppy.sh/users/23318599", "_blank")}
                            >
                                <Image src="/osu-logo.png" alt="osu! logo" width={24} height={24} className="rounded-full" />
                                <span>tenzyu</span>
                            </Button>
                        </div>

                        <div>
                            <p className="mb-2">Twitch Partner を目指しています。</p>
                            <Button
                                variant="outline"
                                className="w-full flex items-center justify-center gap-2"
                                onClick={() => window.open("https://twitch.tv/tenzyudotcom", "_blank")}
                            >
                                <Image src="/twitch-logo.png" alt="Twitch logo" width={24} height={24} />
                                <span>tenzyudotcom</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">配信する理由</h3>
                    <ul className="space-y-2 list-disc pl-5">
                        <li>成長記録</li>
                        <li>osu のライバルを増やす</li>
                        <li>生活をする</li>
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">osu! settings</h3>

                        <Tabs defaultValue="tablet" className="mt-4">
                            
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="tablet">Tablet Area</TabsTrigger>
                                <TabsTrigger value="keyboard">Keystroke</TabsTrigger>
                            </TabsList>

                            <TabsContent value="tablet" className="p-4 border rounded-md mt-2">
                                <div
                                    className="relative bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden"
                                    style={{
                                        aspectRatio: "152/95",
                                        width: "100%",
                                        maxWidth: "400px",
                                        margin: "0 auto",
                                    }}
                                >
                                    <div className="absolute bottom-6 left-2 flex items-center justify-center text-sm text-gray-500">
                                        Wacom CTL-472 (152mm x 95mm)
                                    </div>

                                    <div
                                        className="absolute border-2 border-purple-500 rounded-sm"
                                        style={{
                                            left: `${((83.06 - 58.0/2) / 152) * 100}%`,
                                            top: `${((26.43 - 45.24/2)/ 95) * 100}%`,
                                            width: `${(58.0 / 152) * 100}%`,
                                            height: `${(45.24 / 95) * 100}%`,
                                        }}
                                    >
                                        <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-2 py-0.5 text-xs rounded z-30">
                                            Current: 58.0x45.24mm
                                        </div>
                                    </div>

                                    <div className="absolute bottom-2 right-2 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                        Rotation: 180°
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="keyboard" className="p-4 border rounded-md mt-2">
                                <div className="flex justify-center space-x-4">
                                    <div className="flex flex-col items-center">
                                        <div className="relative">
                                            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-xl font-bold border-2 border-purple-500">
                                                Z
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="relative">
                                            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-xl font-bold border-2 border-purple-500">
                                                X
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center mt-4 text-sm">
                                    <p className="font-medium">Current: QwQ</p>
                                    <div className="flex justify-center gap-4 mt-2">
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            <span>Actuation: 0.15mm</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                            <span>RT trigger: 0.20mm</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                            <span>RT release: 0.20mm</span>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}

