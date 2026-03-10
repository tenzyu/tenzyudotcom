import { revalidatePath } from 'next/cache'
import type {
  EditorCollectionId,
  RevalidatePathTarget,
} from '@/lib/editor/editor.port'
import { getEditorCollectionDescriptor } from '@/lib/editor/editor.contract'
import type {
  EditorRepository,
  EditorState,
} from '@/lib/editor/editor.port'
import { editorRepository } from '@/lib/editor/editor.contract'

export class LoadEditorCollectionUseCase {
  constructor(private repository: EditorRepository) {}

  async execute<K extends EditorCollectionId>(
    collectionId: K,
  ): Promise<EditorState<K>> {
    return this.repository.loadState(collectionId)
  }
}

export class SaveEditorCollectionUseCase {
  constructor(private repository: EditorRepository) {}

  async execute(
    collectionId: EditorCollectionId,
    rawJson: string,
    expectedVersion?: string,
  ): Promise<{ version: string }> {
    const result = await this.repository.save(
      collectionId,
      rawJson,
      expectedVersion,
    )

    // Revalidate paths
    const descriptor = getEditorCollectionDescriptor(collectionId)
    for (const path of descriptor.publicPaths) {
      const target = path as RevalidatePathTarget
      if (target.type) {
        revalidatePath(target.path, target.type)
      } else {
        revalidatePath(target.path)
      }
    }

    return result
  }
}

// Factories
export function makeLoadEditorCollectionUseCase() {
  return new LoadEditorCollectionUseCase(editorRepository)
}

export function makeSaveEditorCollectionUseCase() {
  return new SaveEditorCollectionUseCase(editorRepository)
}
