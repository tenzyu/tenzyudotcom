import type { EditorRepository } from '@/lib/editor/editor.port'
import type { MyLink } from './links.domain'
import type { LinksRepository } from './links.port'
import { LINKS_COLLECTION_DESCRIPTOR } from '@/features/editor-collections/links'

export class EditorLinksRepository implements LinksRepository {
  constructor(private readonly editorRepository: EditorRepository) {}

  async loadAll(): Promise<readonly MyLink[]> {
    const { collection } = await this.editorRepository.loadState(
      LINKS_COLLECTION_DESCRIPTOR,
    )
    return collection
  }
}
