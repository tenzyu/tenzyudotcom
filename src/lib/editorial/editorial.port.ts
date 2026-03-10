import type {
  EditorialCollectionData,
  EditorialCollectionId,
} from './registry'

export type EditorialState<K extends EditorialCollectionId> = {
  collection: EditorialCollectionData[K]
  serialized: string
  version: string
}

export interface EditorialRepository {
  loadState<K extends EditorialCollectionId>(
    collectionId: K,
  ): Promise<EditorialState<K>>

  save(
    collectionId: EditorialCollectionId,
    rawJson: string,
    expectedVersion?: string,
  ): Promise<{
    version: string
  }>
}
