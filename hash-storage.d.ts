declare function hashStorage (opts?: hashStorage.Options): hashStorage.HashStorage

declare namespace hashStorage {
  type EvictReason = 'ttl' | 'capacity' | 'manual'

  type Options = {
    type?: 'object' | 'map'
    TTL?: number
    norm?: number
    max?: number
    concurrency?: number
    sweepInterval?: number
    onEvict?: (hash: string, key: string, reason: EvictReason) => void
  }

  interface HashMap {
    [key: string]: unknown
  }

  interface HashStorage {
    hset: (hash: string, key: string, value: unknown) => Promise<void>
    hget: (hash: string, key: string) => Promise<unknown>
    hgetall: (hash: string) => Promise<HashMap>
    hdel: (hash: string, key: string) => Promise<void>
    shutdown: () => void
  }
}

export = hashStorage
