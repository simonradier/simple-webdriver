import { randomUUID } from 'crypto'

export interface CDPRemoteHandle {
  objectId: string
  nodeId?: number
  frameId?: string
}

/**
 * Per-session registry that hides CDP-specific object ids from the public API.
 * External callers (tests, the user) see an opaque UUID; internally we keep
 * the Runtime.RemoteObject objectId so we can call back into the browser.
 */
export class ElementRefStore {
  private readonly _byUuid = new Map<string, CDPRemoteHandle>()
  private readonly _byObjectId = new Map<string, string>()

  register(handle: CDPRemoteHandle): string {
    const existing = this._byObjectId.get(handle.objectId)
    if (existing) {
      Object.assign(this._byUuid.get(existing)!, handle)
      return existing
    }
    const uuid = randomUUID()
    this._byUuid.set(uuid, { ...handle })
    this._byObjectId.set(handle.objectId, uuid)
    return uuid
  }

  resolve(uuid: string): CDPRemoteHandle | undefined {
    return this._byUuid.get(uuid)
  }

  release(uuid: string): void {
    const handle = this._byUuid.get(uuid)
    if (!handle) return
    this._byUuid.delete(uuid)
    this._byObjectId.delete(handle.objectId)
  }

  clear(): void {
    this._byUuid.clear()
    this._byObjectId.clear()
  }

  get size(): number {
    return this._byUuid.size
  }
}
