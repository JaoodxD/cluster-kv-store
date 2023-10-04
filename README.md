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
  factor?: number;
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

## factor

`factor` defines how many shards (workers) will be created to distribute hash sub-storages.  
For `factor: n` there will be spawned `n` worker to distribute storage computational load.  
For `factor: 0` no workers will be spawned, so all the storage computations will be executed on the `main thread`.  
Default value: `0`.

# Interface

`hash-storage` implements 3 basic operations:

- `hset` to assign data to composite `(hash, key)` key;
- `hget` to retrieve data;
- `remove` to perform remove operation.

Also it has `shutdown` method to termiate all the underlying workers.

In terms of TypeScript types it implements following interface:

```ts
interface HashStorage<T> {
  hset: (hash: string, key: string, value: T) => Promise<void>;
  hget: (hash: string, key: string) => Promise<T | null>;
  remove: (hash: string, key: string) => Promise<void>;
  shutdown: () => void;
}
```

# Example of usage

```js
import hashStorage from "@jaood/hash-storage";

const storage = hashStorage({
  type: "object",
  TTL: 1000,
  norm: 0,
  factor: 1,
});

const info = { item: "Water", amount: 2 };

await storage.hset("store#1", "1001", info);
const res1 = await storage.hget("store#1", "1001");
console.log(res1); // { item: 'Water', amount: 2 }

setTimeout(async () => {
  const res2 = await storage.hget("store#1", "1001");
  console.log(res2); // null, as value has expired due to TTL setup
}, 1000);
```
