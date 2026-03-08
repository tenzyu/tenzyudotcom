'use client'

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type {
  DashboardSourceCategory,
  DashboardSourceLink,
} from '@/app/[locale]/(main)/pointers/_features/dashboard/dashboard.source'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { saveEditorialCollectionAction } from './actions'
import { moveItem } from './editor-utils'

type PointersEditorClientProps = {
  initialEntries: DashboardSourceCategory[]
  expectedVersion: string
  locale: string
  labels: {
    addLink: string
    save: string
    categoryTitleJa: string
    categoryTitleEn: string
    categoryDescriptionJa: string
    categoryDescriptionEn: string
    linkTitleJa: string
    linkTitleEn: string
    linkDescriptionJa: string
    linkDescriptionEn: string
    linkId: string
    url: string
    isApp: string
    moveUp: string
    moveDown: string
    remove: string
  }
}

function createEmptyLink(): DashboardSourceLink {
  return {
    id: '',
    title: { ja: '', en: '' },
    description: { ja: '', en: '' },
    url: '',
    isApp: false,
  }
}

export function PointersEditorClient({
  initialEntries,
  expectedVersion,
  locale,
  labels,
}: PointersEditorClientProps) {
  const [entries, setEntries] =
    useState<DashboardSourceCategory[]>(initialEntries)
  const sourceJson = JSON.stringify(entries, null, 2)

  return (
    <form action={saveEditorialCollectionAction} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="collectionId" value="pointers" />
      <input type="hidden" name="sourceJson" value={sourceJson} />
      <input type="hidden" name="expectedVersion" value={expectedVersion} />

      <div className="space-y-6">
        {entries.map((category, categoryIndex) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle>{category.id}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 text-sm">
                  <label htmlFor={`category-${categoryIndex}-title-ja`}>
                    {labels.categoryTitleJa}
                  </label>
                  <Input
                    id={`category-${categoryIndex}-title-ja`}
                    value={category.title.ja}
                    onChange={(event) => {
                      const value = event.target.value
                      setEntries((current) =>
                        current.map((currentCategory, currentIndex) =>
                          currentIndex === categoryIndex
                            ? {
                                ...currentCategory,
                                title: { ...currentCategory.title, ja: value },
                              }
                            : currentCategory,
                        ),
                      )
                    }}
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <label htmlFor={`category-${categoryIndex}-title-en`}>
                    {labels.categoryTitleEn}
                  </label>
                  <Input
                    id={`category-${categoryIndex}-title-en`}
                    value={category.title.en}
                    onChange={(event) => {
                      const value = event.target.value
                      setEntries((current) =>
                        current.map((currentCategory, currentIndex) =>
                          currentIndex === categoryIndex
                            ? {
                                ...currentCategory,
                                title: { ...currentCategory.title, en: value },
                              }
                            : currentCategory,
                        ),
                      )
                    }}
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <label htmlFor={`category-${categoryIndex}-description-ja`}>
                    {labels.categoryDescriptionJa}
                  </label>
                  <Textarea
                    id={`category-${categoryIndex}-description-ja`}
                    value={category.description.ja}
                    onChange={(event) => {
                      const value = event.target.value
                      setEntries((current) =>
                        current.map((currentCategory, currentIndex) =>
                          currentIndex === categoryIndex
                            ? {
                                ...currentCategory,
                                description: {
                                  ...currentCategory.description,
                                  ja: value,
                                },
                              }
                            : currentCategory,
                        ),
                      )
                    }}
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <label htmlFor={`category-${categoryIndex}-description-en`}>
                    {labels.categoryDescriptionEn}
                  </label>
                  <Textarea
                    id={`category-${categoryIndex}-description-en`}
                    value={category.description.en}
                    onChange={(event) => {
                      const value = event.target.value
                      setEntries((current) =>
                        current.map((currentCategory, currentIndex) =>
                          currentIndex === categoryIndex
                            ? {
                                ...currentCategory,
                                description: {
                                  ...currentCategory.description,
                                  en: value,
                                },
                              }
                            : currentCategory,
                        ),
                      )
                    }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">{category.id}</h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEntries((current) =>
                        current.map((currentCategory, currentIndex) =>
                          currentIndex === categoryIndex
                            ? {
                                ...currentCategory,
                                links: [
                                  ...currentCategory.links,
                                  createEmptyLink(),
                                ],
                              }
                            : currentCategory,
                        ),
                      )
                    }}
                  >
                    <Plus />
                    {labels.addLink}
                  </Button>
                </div>
                {category.links.map((link, linkIndex) => (
                  <Card key={`${category.id}-${link.id || linkIndex}`}>
                    <CardContent className="space-y-4 pt-6">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={linkIndex === 0}
                          aria-label={labels.moveUp}
                          onClick={() => {
                            setEntries((current) =>
                              current.map((currentCategory, currentIndex) =>
                                currentIndex === categoryIndex
                                  ? {
                                      ...currentCategory,
                                      links: moveItem(
                                        [...currentCategory.links],
                                        linkIndex,
                                        -1,
                                      ),
                                    }
                                  : currentCategory,
                              ),
                            )
                          }}
                        >
                          <ArrowUp />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={linkIndex === category.links.length - 1}
                          aria-label={labels.moveDown}
                          onClick={() => {
                            setEntries((current) =>
                              current.map((currentCategory, currentIndex) =>
                                currentIndex === categoryIndex
                                  ? {
                                      ...currentCategory,
                                      links: moveItem(
                                        [...currentCategory.links],
                                        linkIndex,
                                        1,
                                      ),
                                    }
                                  : currentCategory,
                              ),
                            )
                          }}
                        >
                          <ArrowDown />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={labels.remove}
                          onClick={() => {
                            setEntries((current) =>
                              current.map((currentCategory, currentIndex) =>
                                currentIndex === categoryIndex
                                  ? {
                                      ...currentCategory,
                                      links: currentCategory.links.filter(
                                        (_, currentLinkIndex) =>
                                          currentLinkIndex !== linkIndex,
                                      ),
                                    }
                                  : currentCategory,
                              ),
                            )
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 text-sm">
                          <label
                            htmlFor={`link-${categoryIndex}-${linkIndex}-id`}
                          >
                            {labels.linkId}
                          </label>
                          <Input
                            id={`link-${categoryIndex}-${linkIndex}-id`}
                            value={link.id}
                            onChange={(event) => {
                              const value = event.target.value
                              setEntries((current) =>
                                current.map((currentCategory, currentIndex) =>
                                  currentIndex === categoryIndex
                                    ? {
                                        ...currentCategory,
                                        links: currentCategory.links.map(
                                          (currentLink, currentLinkIndex) =>
                                            currentLinkIndex === linkIndex
                                              ? { ...currentLink, id: value }
                                              : currentLink,
                                        ),
                                      }
                                    : currentCategory,
                                ),
                              )
                            }}
                          />
                        </div>
                        <div className="space-y-2 text-sm">
                          <label
                            htmlFor={`link-${categoryIndex}-${linkIndex}-url`}
                          >
                            {labels.url}
                          </label>
                          <Input
                            id={`link-${categoryIndex}-${linkIndex}-url`}
                            value={link.url}
                            onChange={(event) => {
                              const value = event.target.value
                              setEntries((current) =>
                                current.map((currentCategory, currentIndex) =>
                                  currentIndex === categoryIndex
                                    ? {
                                        ...currentCategory,
                                        links: currentCategory.links.map(
                                          (currentLink, currentLinkIndex) =>
                                            currentLinkIndex === linkIndex
                                              ? { ...currentLink, url: value }
                                              : currentLink,
                                        ),
                                      }
                                    : currentCategory,
                                ),
                              )
                            }}
                          />
                        </div>
                        <div className="space-y-2 text-sm">
                          <label
                            htmlFor={`link-${categoryIndex}-${linkIndex}-title-ja`}
                          >
                            {labels.linkTitleJa}
                          </label>
                          <Input
                            id={`link-${categoryIndex}-${linkIndex}-title-ja`}
                            value={link.title.ja}
                            onChange={(event) => {
                              const value = event.target.value
                              setEntries((current) =>
                                current.map((currentCategory, currentIndex) =>
                                  currentIndex === categoryIndex
                                    ? {
                                        ...currentCategory,
                                        links: currentCategory.links.map(
                                          (currentLink, currentLinkIndex) =>
                                            currentLinkIndex === linkIndex
                                              ? {
                                                  ...currentLink,
                                                  title: {
                                                    ...currentLink.title,
                                                    ja: value,
                                                  },
                                                }
                                              : currentLink,
                                        ),
                                      }
                                    : currentCategory,
                                ),
                              )
                            }}
                          />
                        </div>
                        <div className="space-y-2 text-sm">
                          <label
                            htmlFor={`link-${categoryIndex}-${linkIndex}-title-en`}
                          >
                            {labels.linkTitleEn}
                          </label>
                          <Input
                            id={`link-${categoryIndex}-${linkIndex}-title-en`}
                            value={link.title.en}
                            onChange={(event) => {
                              const value = event.target.value
                              setEntries((current) =>
                                current.map((currentCategory, currentIndex) =>
                                  currentIndex === categoryIndex
                                    ? {
                                        ...currentCategory,
                                        links: currentCategory.links.map(
                                          (currentLink, currentLinkIndex) =>
                                            currentLinkIndex === linkIndex
                                              ? {
                                                  ...currentLink,
                                                  title: {
                                                    ...currentLink.title,
                                                    en: value,
                                                  },
                                                }
                                              : currentLink,
                                        ),
                                      }
                                    : currentCategory,
                                ),
                              )
                            }}
                          />
                        </div>
                        <div className="space-y-2 text-sm">
                          <label
                            htmlFor={`link-${categoryIndex}-${linkIndex}-description-ja`}
                          >
                            {labels.linkDescriptionJa}
                          </label>
                          <Textarea
                            id={`link-${categoryIndex}-${linkIndex}-description-ja`}
                            value={link.description.ja}
                            onChange={(event) => {
                              const value = event.target.value
                              setEntries((current) =>
                                current.map((currentCategory, currentIndex) =>
                                  currentIndex === categoryIndex
                                    ? {
                                        ...currentCategory,
                                        links: currentCategory.links.map(
                                          (currentLink, currentLinkIndex) =>
                                            currentLinkIndex === linkIndex
                                              ? {
                                                  ...currentLink,
                                                  description: {
                                                    ...currentLink.description,
                                                    ja: value,
                                                  },
                                                }
                                              : currentLink,
                                        ),
                                      }
                                    : currentCategory,
                                ),
                              )
                            }}
                          />
                        </div>
                        <div className="space-y-2 text-sm">
                          <label
                            htmlFor={`link-${categoryIndex}-${linkIndex}-description-en`}
                          >
                            {labels.linkDescriptionEn}
                          </label>
                          <Textarea
                            id={`link-${categoryIndex}-${linkIndex}-description-en`}
                            value={link.description.en}
                            onChange={(event) => {
                              const value = event.target.value
                              setEntries((current) =>
                                current.map((currentCategory, currentIndex) =>
                                  currentIndex === categoryIndex
                                    ? {
                                        ...currentCategory,
                                        links: currentCategory.links.map(
                                          (currentLink, currentLinkIndex) =>
                                            currentLinkIndex === linkIndex
                                              ? {
                                                  ...currentLink,
                                                  description: {
                                                    ...currentLink.description,
                                                    en: value,
                                                  },
                                                }
                                              : currentLink,
                                        ),
                                      }
                                    : currentCategory,
                                ),
                              )
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Switch
                          id={`link-${categoryIndex}-${linkIndex}-is-app`}
                          checked={link.isApp === true}
                          onCheckedChange={(checked) => {
                            setEntries((current) =>
                              current.map((currentCategory, currentIndex) =>
                                currentIndex === categoryIndex
                                  ? {
                                      ...currentCategory,
                                      links: currentCategory.links.map(
                                        (currentLink, currentLinkIndex) =>
                                          currentLinkIndex === linkIndex
                                            ? { ...currentLink, isApp: checked }
                                            : currentLink,
                                      ),
                                    }
                                  : currentCategory,
                              ),
                            )
                          }}
                        />
                        <label
                          htmlFor={`link-${categoryIndex}-${linkIndex}-is-app`}
                        >
                          {labels.isApp}
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button type="submit">{labels.save}</Button>
    </form>
  )
}
