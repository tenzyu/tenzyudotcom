import {
  loadJsonCollection as load,
  saveJsonCollection as save,
  type JsonCollectionStorage,
} from '@tenzyu/revisioned-content/json-document'
import {
  loadGitHubTextFile,
  loadGitHubTextFileFresh,
  saveGitHubTextFile,
} from './github-content.infra'

const storage: JsonCollectionStorage = {
  load: loadGitHubTextFile,
  loadFresh: loadGitHubTextFileFresh,
  save: saveGitHubTextFile,
}

export function loadJsonCollection<T>(
  pathname: string,
  parse: (raw: unknown) => T,
  getDefaultValue: () => T,
) {
  return load(pathname, parse, getDefaultValue, storage)
}

export function saveJsonCollection<T>(
  pathname: string,
  rawJson: string,
  parse: (raw: unknown) => T,
  expectedVersion?: string,
) {
  return save(pathname, rawJson, parse, expectedVersion, storage)
}
