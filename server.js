'use strict'

const http = require('http')
const ClusteredStorage = require('./lib/storage/clusteredStorage.js')

async function main () {
  const storage = ClusteredStorage({
    type: 'object',
    TTL: 0,
    norm: 1,
    factor: 2
  })

  const server = http.createServer(async (req, res) => {
    const { url } = req
    const params = url
      .substring(1)
      .split('&')
      .reduce((acc, param) => {
        const [key, value] = param.split('=')
        acc[key] = value
        return acc
      }, {})
    const { crm, key, value, action } = params
    const data = await storage[action](crm, key, value)
    // const crm = 'CRM#1';
    // const key = '1001';
    // const defaultValue = { locked: true, count: 0 };
    // const data = await storage.hget(crm, key) || defaultValue;
    // data.count++;
    // await storage.hset(crm, key, data);
    res.end(JSON.stringify(data))
  })
  server.listen(3000)
  console.log('listening on http://localhost:3000/')
}

main()
