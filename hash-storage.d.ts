type Options = {
  type?: 'object' | 'map'
  TTL?: number
  norm?: number
  max?: number
  concurrency?: number
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

export declare function hashStorage(opts: Options): HashStorage
export default hashStorage
export = hashStorage
