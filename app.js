const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
//const nodemon = require('nodemeon')
let format = require('date-fns/format')
let isValid = require('date-fns/isValid')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

let startServerAnddb = async () => {
  try {
    db = await open({filename: dbPath, driver: sqlite3.Database})
    app.listen(3000, () => {
      console.log('The server is running at http://localhost:3000')
    })
  } catch (error) {
    console.log(`The error message is ${error.message}`)
    process.exit(1)
  }
}
startServerAnddb()

let values = [
  'HIGH',
  'MEDIUM',
  'LOW',
  'TO DO',
  'IN PROGRESS',
  'DONE',
  'WORK',
  'HOME',
  'LEARNING',
]
let isthere = value => {
  for (let eachItem of values) {
    if (eachItem === value) {
      return true
    }
  }
}

let convert = array => {
  let result = []
  for (let eachItem of array) {
    let object = {
      id: eachItem.id,
      todo: eachItem.todo,
      priority: eachItem.priority,
      status: eachItem.status,
      category: eachItem.category,
      dueDate: eachItem.due_date,
    }
    result.push(object)
  }
  return result
}

let todoConvert = todoObject => {
  let result = {
    id: todoObject.id,
    todo: todoObject.todo,
    priority: todoObject.priority,
    status: todoObject.status,
    category: todoObject.category,
    dueDate: todoObject.due_date,
  }
  return result
}

//API 1
app.get('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, due_date, search_q} =
    request.query
  if (priority !== undefined && status !== undefined) {
    const query = `SELECT * FROM todo WHERE priority = '${priority}' AND status = '${status}';`
    const dbResponse = await db.all(query)
    response.send(convert(dbResponse))
  } else if (category !== undefined && status !== undefined) {
    const query = `SELECT * FROM todo WHERE category = '${category}' AND status = '${status}'`
    const dbResponse = await db.all(query)
    response.send(convert(dbResponse))
  } else if (category !== undefined && priority !== undefined) {
    const query = `SELECT * FROM todo WHERE category = '${category}' AND priority = '${priority}'`
    const dbResponse = await db.all(query)
    response.send(convert(dbResponse))
  } else if (status !== undefined) {
    if (isthere(status)) {
      const query = `SELECT * FROM todo WHERE status = '${status}'`
      const dbResponse = await db.all(query)
      response.send(convert(dbResponse))
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else if (priority !== undefined) {
    if (isthere(priority)) {
      const query = `SELECT * FROM todo WHERE priority = '${priority}'`
      const dbResponse = await db.all(query)
      response.send(convert(dbResponse))
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
    }
  } else if (search_q !== undefined) {
    const query = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'`
    const dbResponse = await db.all(query)
    response.send(convert(dbResponse))
  } else if (category !== undefined) {
    if (isthere(category)) {
      const query = `SELECT * FROM todo WHERE category = '${category}';`
      const dbResponse = await db.all(query)
      response.send(convert(dbResponse))
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
    }
  }
})

//API 2
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const query = `SELECT * FROM todo WHERE id = ${todoId}`
  const dbResponse = await db.get(query)
  response.send(todoConvert(dbResponse))
})

//API 3
app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  let formatDate = (new Date(date), 'yyyy-MM-dd')
  if (isValid(new Date(formatDate))) {
    const query = `SELECT * FROM todo WHERE due_date = '${date}';`
    const dbResponse = await db.all(query)
    response.send(convert(dbResponse))
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

//API 4
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  if (isthere(priority) === undefined) {
    response.status(400)
    response.send('Invalid Todo Priority')
  } else if (isthere(status) === undefined) {
    response.status(400)
    response.send('Invalid Todo Status')
  } else if (isthere(category) === undefined) {
    response.status(400)
    response.send('Invalid Todo Category')
  } else if (isValid(new Date(dueDate)) === false) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    const query = `INSERT INTO todo (id,todo,priority,status,category,due_date) VALUES 
    (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`
    const dbResponse = await db.run(query)
    response.send('Todo Successfully Added')
  }
})
//API 5

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const {status, priority, todo, category, dueDate} = request.body
  if (status !== undefined) {
    if (isthere(status)) {
      const query = `UPDATE todo SET status = '${status}' WHERE id = ${todoId};`
      const dbResponse = await db.run(query)
      response.send('Status Updated')
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else if (priority !== undefined) {
    if (isthere(priority)) {
      const query = `UPDATE todo SET priority = '${priority}' WHERE id = ${todoId};`
      const dbResponse = await db.run(query)
      response.send('Priority Updated')
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
    }
  } else if (todo !== undefined) {
    const query = `UPDATE todo SET todo = '${todo}' WHERE id = ${todoId};`
    const dbResponse = await db.run(query)
    response.send('Todo Updated')
  } else if (category !== undefined) {
    if (isthere(category)) {
      const query = `UPDATE todo SET category = '${category}' WHERE id = ${todoId};`
      const dbResponse = await db.run(query)
      response.send('Category Updated')
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
    }
  } else if (dueDate !== undefined) {
    const {dueDate} = request.body
    if (isValid(new Date(dueDate))) {
      const query = `UPDATE  todo SET due_date = '${dueDate} WHERE id = {todoId}';`
      const dbResponse = await db.run(query)
      response.send('Due Date Updated')
    } else {
      response.status(400)
      response.send('Invalid Due Date')
    }
  }
})

//API 6
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const query = `DELETE FROM todo WHERE id = ${todoId};`
  const dbResponse = await db.run(query)
  response.send('Todo Deleted')
})

module.exports = app
