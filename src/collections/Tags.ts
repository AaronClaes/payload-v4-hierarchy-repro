import type { CollectionConfig } from 'payload'

export const Tags: CollectionConfig = {
  slug: 'tags',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'name',
  },
  tags: {
    // This join spans `tags` and `posts`. `defaultLimit: 0` ("no limit") crashes on MongoDB.
    // `pnpm repro:tag-delete` raises it, because deleting a tag also runs into that crash.
    joinField: { name: 'children', defaultLimit: Number(process.env.REPRO_JOIN_LIMIT ?? 0) },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
  ],
}
