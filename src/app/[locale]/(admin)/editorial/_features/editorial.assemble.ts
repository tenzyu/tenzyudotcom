import { revalidatePath } from 'next/cache'
import type {
  EditorialCollectionId,
  RevalidatePathTarget,
} from '@/lib/editorial/editorial.port'
import { getEditorialCollectionDescriptor } from '@/lib/editorial/editorial.contract'
import type {
  EditorialRepository,
  EditorialState,
} from '@/lib/editorial/editorial.port'
import { editorialRepository } from '@/lib/editorial/editorial.contract'

export class LoadEditorialCollectionUseCase {
  constructor(private repository: EditorialRepository) {}

  async execute<K extends EditorialCollectionId>(
    collectionId: K,
  ): Promise<EditorialState<K>> {
    return this.repository.loadState(collectionId)
  }
}

export class SaveEditorialCollectionUseCase {
  constructor(private repository: EditorialRepository) {}

  async execute(
    collectionId: EditorialCollectionId,
    rawJson: string,
    expectedVersion?: string,
  ): Promise<{ version: string }> {
    const result = await this.repository.save(
      collectionId,
      rawJson,
      expectedVersion,
    )

    // Revalidate paths
    const descriptor = getEditorialCollectionDescriptor(collectionId)
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
export function makeLoadEditorialCollectionUseCase() {
  return new LoadEditorialCollectionUseCase(editorialRepository)
}

export function makeSaveEditorialCollectionUseCase() {
  return new SaveEditorialCollectionUseCase(editorialRepository)
}
