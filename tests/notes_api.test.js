const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('../tests/test_helpers')
const app = require('../app')
const api = supertest(app)
const Note = require('../models/note')

beforeEach(async () => {
  await Note.deleteMany({})
  // console.log('cleared')
  
  for(let note of helper.initialNotes) {
    let noteObject = new Note(note)
    await noteObject.save()
    // console.log('saved')
  }
  // console.log('done')
})

describe('when there is initially some notes saved', () => {
  test('notes are returned as json', async () => {
    // console.log('entered test')
    await api
      .get('/api/notes')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  }, 30000)
  // the third parameter sets a timeout

  test('all notes are returned', async () => {
    const response = await api.get('/api/notes')
    // execution gets here only after the HTTP request is complete
    // the result of HTTP request is saved in variable response
    expect(response.body).toHaveLength(helper.initialNotes.length)
  })

  test('a specific note is within the returned notes', async () => {
    const response = await api.get('/api/notes')
  
    const contents = response.body.map(r => r.content)
    expect(contents).toContain('Browser can execute only JavaScript')
  })

})

describe('viewing a specific note', () => {
  test('succeeds with a valid id', async () => {
    const noteAtStart = await helper.notesInDb()
  
    const noteToView = noteAtStart[0]
  
    const retultNote = await api
      .get(`/api/notes/${noteToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)
  
    expect(retultNote.body).toEqual(noteToView)
  })

  test('fails with statuscode 404 if note does not exist', async () => {
    const validNonexistingId = await helper.nonExistingId()

    await api
      .get(`/api/notes/${validNonexistingId}`)
      .expect(404)
  })

  test('fails with statuscode 400 if id is invalid', async () => {
    const invalidId = '5a3d5da59070081a82a3445'

    await api
      .get(`/api/notes/${invalidId}`)
      .expect(400)
  })
})

describe('addition of a new note', () => {
  test('succeds with valid data', async () => {
    const newNote = {
      content: 'async/await simplifies making async calls',
      important: true,
    }
  
    await api
      .post('/api/notes')
      .send(newNote)
      .expect(201)
      .expect('Content-Type', /application\/json/)
    
    const notesAtEnd = await helper.notesInDb()
    expect(notesAtEnd).toHaveLength(helper.initialNotes.length + 1)
  
    const contents = notesAtEnd.map(n => n.content)
    expect(contents).toContain('async/await simplifies making async calls')
  })

  test('fails with status code 400 if data is invalid', async () => {
  const newNote = {
    important: true
  }

  await api
    .post('/api/notes')
    .send(newNote)
    .expect(400)

  const notesAtEnd = await helper.notesInDb()

  expect(notesAtEnd).toHaveLength(helper.initialNotes.length)
})
})

describe('deletion of a note', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const notesAtStart = await helper.notesInDb()
    const noteToDelete = notesAtStart[0]
  
    await api
      .delete(`/api/notes/${noteToDelete.id}`)
      .expect(204)
  
    const notesAtEnd = await helper.notesInDb()
    expect(notesAtEnd).toHaveLength(helper.initialNotes.length - 1)
  
    const contents = notesAtEnd.map(r => r.content)
    expect(contents).not.toContain(noteToDelete.content)
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})