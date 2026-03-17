'use client'

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type {
  Platform,
  PuzzleCategory,
  PuzzleLink,
} from '@/app/[locale]/(main)/puzzles/_features/puzzles.domain'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { saveEditorCollectionAction } from './actions'
import { moveItem } from './editor-utils'

type PuzzlesEditorClientProps = {
  initialEntries: PuzzleCategory[]
  expectedVersion: string
  locale: string
  labels: {
    addPuzzle: string
    addLink: string
    save: string
    title: string
    primaryUrl: string
    linkUrl: string
    platform: string
    moveUp: string
    moveDown: string
    remove: string
  }
}

const PLATFORMS: Platform[] = [
  'web',
  'ios',
  'android',
  'steam',
  'switch',
  'other',
]

function createEmptyPuzzleLink(): PuzzleLink {
  return {
    platform: 'web',
    url: '',
  }
}

function createEmptyPuzzle() {
  return {
    title: '',
    url: '',
    links: [createEmptyPuzzleLink()],
  }
}

export function PuzzlesEditorClient({
  initialEntries,
  expectedVersion,
  locale,
  labels,
}: PuzzlesEditorClientProps) {
  const [entries, setEntries] = useState<PuzzleCategory[]>(initialEntries)
  const sourceJson = JSON.stringify(entries, null, 2)

  return (
    <form action={saveEditorCollectionAction} className="space-y-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="collectionId" value="puzzles" />
      <input type="hidden" name="sourceJson" value={sourceJson} />
      <input type="hidden" name="expectedVersion" value={expectedVersion} />

      <div className="space-y-6">
        {entries.map((category, categoryIndex) => (
          <Card key={category.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>{category.id}</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEntries((current) =>
                      current.map((currentCategory, currentIndex) =>
                        currentIndex === categoryIndex
                          ? {
                              ...currentCategory,
                              puzzles: [
                                ...currentCategory.puzzles,
                                createEmptyPuzzle(),
                              ],
                            }
                          : currentCategory,
                      ),
                    )
                  }}
                >
                  <Plus />
                  {labels.addPuzzle}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {category.puzzles.map((puzzle, puzzleIndex) => (
                <Card key={`${category.id}-${puzzle.title || puzzleIndex}`}>
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={puzzleIndex === 0}
                        aria-label={labels.moveUp}
                        onClick={() => {
                          setEntries((current) =>
                            current.map((currentCategory, currentIndex) =>
                              currentIndex === categoryIndex
                                ? {
                                    ...currentCategory,
                                    puzzles: moveItem(
                                      [...currentCategory.puzzles],
                                      puzzleIndex,
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
                        disabled={puzzleIndex === category.puzzles.length - 1}
                        aria-label={labels.moveDown}
                        onClick={() => {
                          setEntries((current) =>
                            current.map((currentCategory, currentIndex) =>
                              currentIndex === categoryIndex
                                ? {
                                    ...currentCategory,
                                    puzzles: moveItem(
                                      [...currentCategory.puzzles],
                                      puzzleIndex,
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
                                    puzzles: currentCategory.puzzles.filter(
                                      (_, currentPuzzleIndex) =>
                                        currentPuzzleIndex !== puzzleIndex,
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
                          htmlFor={`puzzle-${categoryIndex}-${puzzleIndex}-title`}
                        >
                          {labels.title}
                        </label>
                        <Input
                          id={`puzzle-${categoryIndex}-${puzzleIndex}-title`}
                          value={puzzle.title}
                          onChange={(event) => {
                            const value = event.target.value
                            setEntries((current) =>
                              current.map((currentCategory, currentIndex) =>
                                currentIndex === categoryIndex
                                  ? {
                                      ...currentCategory,
                                      puzzles: currentCategory.puzzles.map(
                                        (currentPuzzle, currentPuzzleIndex) =>
                                          currentPuzzleIndex === puzzleIndex
                                            ? { ...currentPuzzle, title: value }
                                            : currentPuzzle,
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
                          htmlFor={`puzzle-${categoryIndex}-${puzzleIndex}-url`}
                        >
                          {labels.primaryUrl}
                        </label>
                        <Input
                          id={`puzzle-${categoryIndex}-${puzzleIndex}-url`}
                          value={puzzle.url ?? ''}
                          onChange={(event) => {
                            const value = event.target.value
                            setEntries((current) =>
                              current.map((currentCategory, currentIndex) =>
                                currentIndex === categoryIndex
                                  ? {
                                      ...currentCategory,
                                      puzzles: currentCategory.puzzles.map(
                                        (currentPuzzle, currentPuzzleIndex) =>
                                          currentPuzzleIndex === puzzleIndex
                                            ? {
                                                ...currentPuzzle,
                                                url: value || undefined,
                                              }
                                            : currentPuzzle,
                                      ),
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
                        <h4 className="text-sm font-medium">Links</h4>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEntries((current) =>
                              current.map((currentCategory, currentIndex) =>
                                currentIndex === categoryIndex
                                  ? {
                                      ...currentCategory,
                                      puzzles: currentCategory.puzzles.map(
                                        (currentPuzzle, currentPuzzleIndex) =>
                                          currentPuzzleIndex === puzzleIndex
                                            ? {
                                                ...currentPuzzle,
                                                links: [
                                                  ...currentPuzzle.links,
                                                  createEmptyPuzzleLink(),
                                                ],
                                              }
                                            : currentPuzzle,
                                      ),
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
                      {puzzle.links.map((link, linkIndex) => (
                        <div
                          key={`${category.id}`}
                          className="grid gap-4 md:grid-cols-[1fr_200px_auto]"
                        >
                          <div className="space-y-2 text-sm">
                            <label
                              htmlFor={`puzzle-${categoryIndex}-${puzzleIndex}-link-${linkIndex}-url`}
                            >
                              {labels.linkUrl}
                            </label>
                            <Input
                              id={`puzzle-${categoryIndex}-${puzzleIndex}-link-${linkIndex}-url`}
                              value={link.url}
                              onChange={(event) => {
                                const value = event.target.value
                                setEntries((current) =>
                                  current.map(
                                    (currentCategory, currentIndex) =>
                                      currentIndex === categoryIndex
                                        ? {
                                            ...currentCategory,
                                            puzzles:
                                              currentCategory.puzzles.map(
                                                (
                                                  currentPuzzle,
                                                  currentPuzzleIndex,
                                                ) =>
                                                  currentPuzzleIndex ===
                                                  puzzleIndex
                                                    ? {
                                                        ...currentPuzzle,
                                                        links:
                                                          currentPuzzle.links.map(
                                                            (
                                                              currentLink,
                                                              currentLinkIndex,
                                                            ) =>
                                                              currentLinkIndex ===
                                                              linkIndex
                                                                ? {
                                                                    ...currentLink,
                                                                    url: value,
                                                                  }
                                                                : currentLink,
                                                          ),
                                                      }
                                                    : currentPuzzle,
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
                              htmlFor={`puzzle-${categoryIndex}-${puzzleIndex}-link-${linkIndex}-platform`}
                            >
                              {labels.platform}
                            </label>
                            <select
                              id={`puzzle-${categoryIndex}-${puzzleIndex}-link-${linkIndex}-platform`}
                              className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
                              value={link.platform}
                              onChange={(event) => {
                                const value = event.target.value as Platform
                                setEntries((current) =>
                                  current.map(
                                    (currentCategory, currentIndex) =>
                                      currentIndex === categoryIndex
                                        ? {
                                            ...currentCategory,
                                            puzzles:
                                              currentCategory.puzzles.map(
                                                (
                                                  currentPuzzle,
                                                  currentPuzzleIndex,
                                                ) =>
                                                  currentPuzzleIndex ===
                                                  puzzleIndex
                                                    ? {
                                                        ...currentPuzzle,
                                                        links:
                                                          currentPuzzle.links.map(
                                                            (
                                                              currentLink,
                                                              currentLinkIndex,
                                                            ) =>
                                                              currentLinkIndex ===
                                                              linkIndex
                                                                ? {
                                                                    ...currentLink,
                                                                    platform:
                                                                      value,
                                                                  }
                                                                : currentLink,
                                                          ),
                                                      }
                                                    : currentPuzzle,
                                              ),
                                          }
                                        : currentCategory,
                                  ),
                                )
                              }}
                            >
                              {PLATFORMS.map((platform) => (
                                <option key={platform} value={platform}>
                                  {platform}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={labels.remove}
                              onClick={() => {
                                setEntries((current) =>
                                  current.map(
                                    (currentCategory, currentIndex) =>
                                      currentIndex === categoryIndex
                                        ? {
                                            ...currentCategory,
                                            puzzles:
                                              currentCategory.puzzles.map(
                                                (
                                                  currentPuzzle,
                                                  currentPuzzleIndex,
                                                ) =>
                                                  currentPuzzleIndex ===
                                                  puzzleIndex
                                                    ? {
                                                        ...currentPuzzle,
                                                        links:
                                                          currentPuzzle.links.filter(
                                                            (
                                                              _,
                                                              currentLinkIndex,
                                                            ) =>
                                                              currentLinkIndex !==
                                                              linkIndex,
                                                          ),
                                                      }
                                                    : currentPuzzle,
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
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button type="submit">{labels.save}</Button>
    </form>
  )
}
