import { test } from '@japa/runner'
import { csvCell } from '../../app/utils/csv.js'

test.group('CSV export safety', () => {
  test('quotes fields and neutralizes spreadsheet formulas', ({ assert }) => {
    assert.equal(csvCell('hello,"world"'), '"hello,""world"""')
    assert.equal(csvCell('=HYPERLINK("bad")'), '"\'=HYPERLINK(""bad"")"')
    assert.equal(csvCell('  +SUM(1,2)'), '"\'  +SUM(1,2)"')
  })
})
