type Options = {
  type?: 'object' | 'map'
  TTL?: number
  norm?: number
  max?: number,
  factor?: number
}

interface HashMap<T> {
  [key: string]: T
}
interface HashStorage<T> {
  hset: (hash: string, key: string, value: T) => Promise<void>
  hget: (hash: string, key: string) => Promise<T | null>
  hgetall: (hash: string) => Promise<HashMap<T>>
  hdel: (hash: string, key: string) => Promise<void>
  shutdown: () => void
}

export declare function hashStorage<T>(opts: Options): HashStorage<T>
export default hashStorage
export = hashStorage
