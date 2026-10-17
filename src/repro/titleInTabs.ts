import config from '@payload-config'
import { getPayload } from 'payload'

await getPayload({ config })
console.log('\nOK: the config with `useAsTitle` in an unnamed tab loaded.\n')

process.exit(0)
