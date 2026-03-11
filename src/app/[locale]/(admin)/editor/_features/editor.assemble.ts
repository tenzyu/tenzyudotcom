import { revalidatePath } from 'next/cache'
import type {
  EditorCollectionId,
  RevalidatePathTarget,
  EditorRepository,
  EditorState,
} from '@/lib/editor/editor.port'
import { getEditorCollectionDescriptor } from './editor.collections'
import { editorRepository } from '@/lib/editor/editor.contract'

export class LoadEditorCollectionUseCase {
  constructor(private repository: EditorRepository) {}

  async execute<K extends EditorCollectionId>(
    collectionId: K,
  ): Promise<EditorState<K>> {
    const descriptor = getEditorCollectionDescriptor(collectionId)
    return this.repository.loadState(descriptor)
  }
}

export class SaveEditorCollectionUseCase {
  constructor(private repository: EditorRepository) {}

  async execute(
    collectionId: EditorCollectionId,
    rawJson: string,
    expectedVersion?: string,
  ): Promise<{ version: string }> {
    const descriptor = getEditorCollectionDescriptor(collectionId)
    const result = await this.repository.save(
      descriptor,
      rawJson,
      expectedVersion,
    )

    // Revalidate paths
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
