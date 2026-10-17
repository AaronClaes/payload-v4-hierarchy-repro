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
  // At the default depth the response fills in each tag with its `children` join, which hits bug 1.
  depth: 0,
  overrideAccess: true,
})

async function check(label: string, run: () => Promise<string>) {
  try {
    console.log(`${label}\n  ${await run()}\n`)
  } catch (error) {
    console.log(`${label}\n  THROWS: ${error instanceof Error ? error.message : String(error)}\n`)
  }
}

function countNewsChildren(docs: { id: string; children?: { docs?: unknown[] } }[]) {
  return `OK, News has ${docs.find((tag) => tag.id === news.id)?.children?.docs?.length} children`
}

console.log(
  '\n--- Joins over several collections (the tag `children` join spans tags and posts) ---\n',
)

await check(
  'find tags, joins: { children: { limit: 5 } }  (expected: News has 1 child, the post)',
  async () => {
    const result = await payload.find({
      collection: 'tags',
      joins: { children: { limit: 5 } },
      overrideAccess: true,
    })
    return countNewsChildren(result.docs)
  },
)

await check('find tags, joins: { children: { limit: 0 } }  (expected: all children)', async () => {
  const result = await payload.find({
    collection: 'tags',
    joins: { children: { limit: 0 } },
    overrideAccess: true,
  })
  return countNewsChildren(result.docs)
})

await check(
  'find tags without a joins argument, so joinField.defaultLimit: 0 applies',
  async () => {
    const result = await payload.find({ collection: 'tags', overrideAccess: true })
    return countNewsChildren(result.docs)
  },
)

await check(
  'delete tags by `where`, which has no `joins` option  (expected: deletes nothing, no error)',
  async () => {
    const result = await payload.delete({
      collection: 'tags',
      where: { name: { equals: 'does not exist' } },
      overrideAccess: true,
    })
    return `OK, deleted ${result.docs.length}`
  },
)

await check(
  'find posts at the default depth, so each tag is filled in with its `children` join',
  async () => {
    const result = await payload.find({ collection: 'posts', overrideAccess: true })
    return `OK, found ${result.docs.length} post`
  },
)

process.exit(0)
