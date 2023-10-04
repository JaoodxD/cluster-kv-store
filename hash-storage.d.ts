type Options = {
  type?: 'object' | 'map'
  ttl?: number
  norm?: number
  max?: number,
  factor?: number
}

interface HashStorage<T> {
  hset: (hash: string, key: string, value: T) => Promise<void>
  hget: (hash: string, key: string) => Promise<T | null>
  remove: (hash: string, key: string) => Promise<void>
  shutdown: () => void
}

export declare function hashStorage<T>(opts: Options): HashStorage<T>
export default hashStorage
export = hashStorage
