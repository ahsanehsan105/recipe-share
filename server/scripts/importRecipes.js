const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const ExcelJS = require('exceljs')
const mongoose = require('mongoose')
const database = require('../config/database')
const connectDatabase = typeof database === 'function' ? database : database.connectDatabase
const Recipe = require('../models/Recipe')

const BATCH_SIZE = 500
const REQUIRED_COLUMNS = [
  '_id',
  'name',
  'sharedBy',
  'category',
  'diet',
  'description',
  'ingredients',
  'instructions',
  'prepTime',
  'cookTime',
  'servings',
  'imagePath',
]

function cellText(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object' && Array.isArray(value.richText)) {
    return value.richText.map((part) => part.text).join('').trim()
  }
  if (typeof value === 'object' && value.text) return String(value.text).trim()
  return String(value).trim()
}

function splitIngredients(value) {
  return value.split(/\s*,\s*/).filter(Boolean)
}

function splitInstructions(value) {
  return value.split(/\s*(?:->|→)\s*/).map((step) => step.trim()).filter(Boolean)
}

function recipeFromRow(row, columns, worksheetRow) {
  const raw = Object.fromEntries(REQUIRED_COLUMNS.map((column) => [column, cellText(row.getCell(columns[column]).value)]))
  const invalid = (message) => ({ worksheetRow, error: message })

  if (!/^[0-9a-f]{24}$/i.test(raw._id)) return invalid('ID must be a 24-character MongoDB ObjectId.')
  if (!raw.name || raw.name.length > 100) return invalid('Name is missing or longer than 100 characters.')
  if (!raw.sharedBy || raw.sharedBy.length > 60) return invalid('sharedBy is missing or longer than 60 characters.')
  if (!raw.description || raw.description.length < 10 || raw.description.length > 600) return invalid('Description must be between 10 and 600 characters.')
  if (!raw.category || !raw.diet || !raw.imagePath) return invalid('Category, diet, and imagePath are required.')

  const ingredients = splitIngredients(raw.ingredients)
  const instructions = splitInstructions(raw.instructions)
  if (!ingredients.length) return invalid('At least one ingredient is required.')
  if (!instructions.length) return invalid('At least one instruction step is required.')

  const recipe = new Recipe({
    _id: new mongoose.Types.ObjectId(raw._id),
    name: raw.name,
    sharedBy: raw.sharedBy,
    email: `imported-${raw._id}@recipes.invalid`,
    category: raw.category,
    diet: raw.diet,
    description: raw.description,
    ingredients,
    instructions,
    prepTime: Number(raw.prepTime),
    cookTime: Number(raw.cookTime),
    servings: Number(raw.servings),
    imagePath: raw.imagePath,
  })

  const validationError = recipe.validateSync()
  if (validationError) return invalid(validationError.message)
  return recipe
}

async function importRecipes() {
  const args = process.argv.slice(2)
  const commit = args.includes('--commit')
  const workbookArgument = args.find((argument) => argument !== '--commit')

  if (!workbookArgument) {
    throw new Error('Provide the workbook path. Use --commit to write; without it this command only validates.')
  }

  const workbookPath = path.resolve(workbookArgument)
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(workbookPath)
  const worksheet = workbook.worksheets[0]
  if (!worksheet) throw new Error('The workbook has no worksheets.')

  const columns = {}
  worksheet.getRow(1).eachCell((cell, columnNumber) => {
    columns[cellText(cell.value)] = columnNumber
  })

  const missingColumns = REQUIRED_COLUMNS.filter((column) => !columns[column])
  if (missingColumns.length) throw new Error(`Missing required columns: ${missingColumns.join(', ')}`)

  const recipes = []
  const invalidRows = []
  const workbookIds = new Set()
  const duplicateRows = []

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber)
    if (row.values.slice(1).every((value) => !cellText(value))) continue

    const recipe = recipeFromRow(row, columns, rowNumber)
    if (!(recipe instanceof Recipe)) {
      invalidRows.push(recipe)
      continue
    }

    const id = recipe._id.toString()
    if (workbookIds.has(id)) {
      duplicateRows.push(rowNumber)
      continue
    }
    workbookIds.add(id)
    recipes.push(recipe)
  }

  if (duplicateRows.length) invalidRows.push(...duplicateRows.map((worksheetRow) => ({ worksheetRow, error: 'Duplicate ID in workbook.' })))
  if (invalidRows.length) {
    console.error(`Validation failed for ${invalidRows.length} row(s); no recipes were written.`)
    for (const item of invalidRows.slice(0, 20)) console.error(`Row ${item.worksheetRow}: ${item.error}`)
    if (invalidRows.length > 20) console.error(`...and ${invalidRows.length - 20} more invalid rows.`)
    process.exitCode = 1
    return
  }

  console.log(`Validated ${recipes.length} recipes from ${workbookPath}.`)
  if (!commit) {
    console.log('Dry run only; no database changes were made. Re-run with --commit to import, skipping existing IDs.')
    return
  }

  await connectDatabase()
  let inserted = 0
  let existing = 0
  try {
    for (let start = 0; start < recipes.length; start += BATCH_SIZE) {
      const batch = recipes.slice(start, start + BATCH_SIZE)
      const operations = batch.map((recipe) => ({
        updateOne: {
          filter: { _id: recipe._id },
          update: { $setOnInsert: recipe.toObject() },
          upsert: true,
        },
      }))
      const result = await Recipe.bulkWrite(operations, { ordered: false })
      inserted += result.upsertedCount
      existing += result.matchedCount
      console.log(`Processed ${Math.min(start + batch.length, recipes.length)} / ${recipes.length}`)
    }
    console.log(`Import complete: inserted ${inserted}; skipped existing IDs ${existing}.`)
  } finally {
    await mongoose.disconnect()
  }
}

importRecipes().catch((error) => {
  console.error(`Recipe import failed: ${error.message}`)
  process.exitCode = 1
})