import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { canVoteForProject } from '../src/hooks/voteEligibility.ts'

test('regular projects allow leaders to vote without a CV', () => {
  assert.equal(canVoteForProject('leader', 'team-1', false, false, false), true)
})

test('CV Required projects require uploaded CVs', () => {
  assert.equal(canVoteForProject('leader', 'team-1', false, true, false), false)
  assert.equal(canVoteForProject('leader', 'team-1', false, true, true), true)
})

test('vote insert policy only requires CVs for CV Required projects', () => {
  const sql = readFileSync(
    new URL('../supabase/migrations/20260711000000_make_cv_required_project_specific.sql', import.meta.url),
    'utf8',
  )

  assert.match(sql, /NOT pr\.cv_required OR t\.cv_url IS NOT NULL/)
})
