# Hash KV storage clustered within workers

`hash-storage` is `Promise`-based Key-Value storage with composite "two-level" key.

# Configuration

In general configuration object has following structure:

```ts
type Options = {
  type?: "object" | "map";
  TTL?: number;
  norm?: number;
  max?: number;
  concurrency?: number;
};
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
  hset: (hash: string, key: string, value: unknown) => Promise<void>;
  hget: (hash: string, key: string) => Promise<unknown>;
  hgetall: (hash: string) => Promise<HashMap>;
  hdel: (hash: string, key: string) => Promise<void>;
  shutdown: () => void;
}

interface HashMap {
  [key: string]: unknown;
}
```

# Example of usage

```js
import hashStorage from "@jaood/hash-storage";
import { setTimeout } from "node:timers/promises";

const storage = hashStorage({
  type: "object",
  TTL: 1000,
  concurrency: 1,
});

const info = { item: "Water", amount: 2 };

await storage.hset("store#1", "1001", info);
const res1 = await storage.hget("store#1", "1001");
console.log(res1); // { item: 'Water', amount: 2 }

await setTimeout(1000); // wait till TTL expires

const res2 = await storage.hget("store#1", "1001");
console.log(res2); // null, as value has expired due to TTL setup

```
