import config from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })

await payload.db.connection.dropDatabase()

const news = await payload.create({
  collection: 'tags',
  data: { name: 'News' },
  overrideAccess: true,
})
const sport = await payload.create({
  collection: 'tags',
  data: { name: 'Sport' },
  overrideAccess: true,
})
const post = await payload.create({
  collection: 'posts',
  data: { title: 'Hello', _h_tags: [news.id, sport.id] },
  overrideAccess: true,
})

console.log('\n--- Deleting one tag clears every tag on a post ---\n')

await payload.delete({ collection: 'tags', id: sport.id, overrideAccess: true })
const postAfterDelete = await payload.findByID({
  collection: 'posts',
  id: post.id,
  depth: 0,
  overrideAccess: true,
})

console.log(`post tags before deleting "Sport": ${JSON.stringify([news.id, sport.id])}`)
console.log(`post tags after deleting "Sport":  ${JSON.stringify(postAfterDelete._h_tags)}`)
console.log(`expected:                         ${JSON.stringify([news.id])}\n`)

process.exit(0)
