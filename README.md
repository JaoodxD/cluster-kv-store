# Hash KV storage clustered within workers

`hash-storage` is `Promise`-based Key-Value storage with composite "two-level" key.

# Example of usage

```js
import hashStorage from '@jaood/hash-storage'
import { setTimeout } from 'node:timers/promises'

const storage = hashStorage({
  type: 'object',
  TTL: 1000,
  concurrency: 1
})

const info = { item: 'Water', amount: 2 }

await storage.hset('store#1', '1001', info)
const res1 = await storage.hget('store#1', '1001')
console.log(res1) // { item: 'Water', amount: 2 }

await setTimeout(1000) // wait till TTL expires

const res2 = await storage.hget('store#1', '1001')
console.log(res2) // null, as value has expired due to TTL setup
```

# Configuration

In general configuration object has following structure:

```ts
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
```

And a little bit of parameters explanation.

## type

`type` defines inner storage engine for each hash shard.  
It can be either `object` (for plain JS object) or `map` (for `Map`).  
Default value: `object`.

## TTL

`TTL` defines "time to live" in `milliseconds` for each value.  
When set to `0`, lifetime of value becomes `Infinity`.  
Default value: `0`.

## norm

`norm` defines amount of default pre-allocated storage units pool per shard (per thread).  
Default value: `0`.

## max

`max` defines of max pool-size for storage units pool.  
Default value: `Infinity`.

## concurrency

`concurrency` defines how many shards (workers) will be created to distribute hash sub-storages.  
For `concurrency: n` there will be spawned `n` worker to distribute storage computational load.  
For `concurrency: 0` no workers will be spawned, so all the storage computations will be executed on the `main thread`.  
Default value: `0`.

## onEvict

`onEvict(hash, key, reason)` is an optional callback invoked whenever a value
leaves storage. A single hook covers every eviction path; the `reason` tells
them apart:

- `'ttl'` — the value's `TTL` expired;
- `'manual'` — the value was removed by an explicit `hdel` call;
- `'capacity'` — reserved for values dropped to satisfy a `max` limit. **Not
  emitted yet**: there is currently no capacity-based key eviction (`max` only
  caps the internal storage-unit pool, not the number of live keys). The reason
  exists in the type for forward compatibility.

The callback runs only on eviction — never on the `hset`/`hget` hot path — so it
adds no overhead to normal reads and writes. It is fully optional and backward
compatible: when omitted, storage behaves exactly as before. Errors thrown from
the callback are caught internally and never disrupt storage.

When `concurrency > 0`, evictions happen inside worker threads; the worker
forwards each one to the main thread (functions can't cross the worker
boundary), and your callback is always invoked on the main thread.

```js
import hashStorage from '@jaood/hash-storage'

const storage = hashStorage({
  TTL: 2 * 60 * 1000,
  sweepInterval: 30 * 1000, // proactively expire TTL values every 30s
  onEvict (hash, key, reason) {
    if (reason === 'ttl' || reason === 'capacity') {
      lockedOrdersGauge.dec()
    }
    // 'manual' evictions are already accounted for by the explicit-remove path
  }
})
```

Default value: `undefined`.

## sweepInterval

`sweepInterval` defines, in `milliseconds`, how often a background timer
proactively scans for and evicts TTL-expired values.

By default TTL eviction is **lazy**: a value expires (and fires `onEvict` with
`reason: 'ttl'`) only when it is next read via `hget`/`hgetall`. A value that is
never read again is never evicted and holds its memory until overwritten.

Set `sweepInterval` to a positive value to add an opt-in proactive sweep. The
sweep evicts expired values — and fires `onEvict('ttl')` — without waiting for a
read, which reclaims memory and keeps `onEvict` timely (e.g. so a metrics gauge
decrements promptly). The timer is `unref`-ed, so it never keeps the process
alive on its own, and it only runs when both `sweepInterval > 0` and `TTL > 0`.

When unset (the default) there is no background timer and behavior is identical
to previous versions.  
Default value: `0` (lazy expiry only).

# Interface

`hash-storage` implements 4 basic operations:

- `hset` to assign data to composite `(hash, key)` key;
- `hget` to retrieve data;
- `hgetall` to retrieve all corresponding data associated with the same hash;
- `hdel` to perform remove operation.

Also it has `shutdown` method to termiate all the underlying workers.

In terms of TypeScript types it implements following interface:

```ts
interface HashStorage {
  hset: (hash: string, key: string, value: unknown) => Promise<void>
  hget: (hash: string, key: string) => Promise<unknown>
  hgetall: (hash: string) => Promise<HashMap>
  hdel: (hash: string, key: string) => Promise<void>
  shutdown: () => void
}

interface HashMap {
  [key: string]: unknown
}
```
