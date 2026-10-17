# Payload v4 hierarchy / tags reproduction

Payload's blank template at `v4.0.0-beta.2`, plus:

- `src/collections/Tags.ts`: the template's `tags: true` collection, with a `children` join (`defaultLimit: 0`)
- `src/collections/Posts.ts`: `createTagField({ relationTo: 'tags' })`
- `src/collections/Sections.ts`: a hierarchy collection with `useAsTitle` inside a tab
- `src/repro/*.ts`: one script per problem, run with `payload run`

`tags` and `posts` allow public reads, so the API URLs below work without logging in.

## Setup

Needs a local MongoDB. Each script drops and refills the `payload-v4-hierarchy-repro` database.

```bash
cp .env.example .env
pnpm install
```

## 1. A join over several collections with `limit: 0` crashes

```bash
pnpm repro:join-limit
```

```
find tags, joins: { children: { limit: 0 } }  (expected: all children)
  THROWS: the limit must be positive

find tags without a joins argument, so joinField.defaultLimit: 0 applies
  THROWS: the limit must be positive

delete tags by `where`, which has no `joins` option  (expected: deletes nothing, no error)
  THROWS: the limit must be positive

find posts at the default depth, so each tag is filled in with its `children` join
  THROWS: the limit must be positive
```

`packages/db-mongodb/src/utilities/buildJoinAggregation.ts`: for a join whose `collection` is an array, the pipeline always adds `$limit: limitJoin` (line 168) and `$slice: [limitJoin]` (line 240). The single-collection branch skips both when the limit is `0`.

In the admin (`pnpm dev`, after running the script once and creating a user):

- The **Tags** sidebar tab is empty. The server log shows the error from `getInitialTreeData` → `HierarchySidebarTabServer`.
- Clicking a tag in the Tags list opens a blank page, with `the limit must be positive` in `handleHierarchy` (`@payloadcms/ui/src/views/List/handleHierarchy.ts:133`).
- `GET /api/tags` and `GET /api/posts` return 500. `GET /api/tags?joins[children][limit]=5` and `GET /api/posts?depth=0` work.

A bulk delete has no `joins` option, and `collections/operations/delete.ts` calls `payload.db.find` without one, so the default join runs and every bulk delete on the collection throws.

## 2. A join over several collections never returns documents from a `hasMany` field

Same command, first check:

```
find tags, joins: { children: { limit: 5 } }  (expected: News has 1 child, the post)
  OK, News has 0 children
```

With `pnpm dev`, the same shows up at:

- `/api/posts?depth=0`: the post has `_h_tags: [newsId, sportId]`
- `/api/tags?joins[children][limit]=5&where[name][equals]=News`: `children.docs` is `[]`
- With `REPRO_JOIN_LIMIT=10 pnpm dev`, the News edit view shows "No Results." in its `children` field

The post is stored with `_h_tags: [newsId, sportId]`. The multi-collection branch matches with `$expr: { $eq: ['$_h_tags', '$$root_id_'] }`, which compares the whole array to one id. The single-collection branch uses `localField`/`foreignField`, which does match an id inside an array. `createTagField` is `hasMany` by default, so tagged documents never show up in the tag's `children` join.

## 3. Deleting one tag clears every tag on a document

```bash
pnpm repro:tag-delete
```

```
post tags before deleting "Sport": ["…87","…89"]
post tags after deleting "Sport":  []
expected:                         ["…87"]
```

`hierarchy/hooks/collectionAfterDelete.ts` sets `[fieldName]: null` on every document that references the deleted tag. For a `hasMany` field it should only remove the deleted id.

In the admin: start it with `REPRO_JOIN_LIMIT=10 pnpm dev`, open a tag's edit view, choose **Delete** in the `…` menu, then open a post that had that tag and another one. Its Tags field is empty.

This script raises the join's `defaultLimit` to 10 (`REPRO_JOIN_LIMIT`), because deleting a tag otherwise runs into problem 1 first.

## 4. Hierarchy can't find `useAsTitle` inside the first of several unnamed tabs

```bash
pnpm repro:title-in-tabs
```

```
Error: The hierarchy title field "name" was not found. It cannot be nested within named fields i.e. named groups, named tabs, etc.
```

`Sections` has `useAsTitle: 'name'`, and `name` sits in the first of two unnamed tabs, which the error message says is allowed. In `hierarchy/utils/findUseAsTitle.ts`, the search into the second tab (which has no `name`) throws instead of returning nothing, so the match in the first tab is never used. The collection is only added with `REPRO_TITLE_IN_TABS=1`, so the other scripts can boot.

## Versions

- `payload` and `@payloadcms/*`: `4.0.0-beta.2`
- `next`: `16.4.2`
- Node `24.15.0`, MongoDB 8
