import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const pat = process.env.SUPABASE_PAT
const ref = process.env.SUPABASE_PROJECT_REF

if (!url || !pat || !ref) {
  console.error('Missing VITE_SUPABASE_URL, SUPABASE_PAT, or SUPABASE_PROJECT_REF in .env')
  process.exit(1)
}

const sql = process.argv[2]
if (!sql) {
  console.error('Usage: node --env-file .env scripts/run-sql.mjs "SQL statement"')
  process.exit(1)
}

const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${pat}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
})

const result = await response.text()

if (!response.ok) {
  console.error('Error:', result)
  process.exit(1)
}

try {
  const parsed = JSON.parse(result)
  console.log(JSON.stringify(parsed, null, 2))
} catch {
  console.log(result)
}
