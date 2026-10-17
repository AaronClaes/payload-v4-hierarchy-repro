import type { CollectionConfig } from 'payload'

// `useAsTitle` lives in the first of two unnamed tabs. Only loaded with REPRO_TITLE_IN_TABS=1,
// because the config fails to build with it.
export const Sections: CollectionConfig = {
  slug: 'sections',
  admin: {
    useAsTitle: 'name',
  },
  hierarchy: {
    parentFieldName: 'parent',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
            },
          ],
        },
        {
          label: 'Details',
          fields: [
            {
              name: 'description',
              type: 'textarea',
            },
          ],
        },
      ],
    },
  ],
}
