const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const app = express()
const dbPath = path.join(__dirname, 'covid19India.db')

app.use(express.json())

let db = null

const initailizeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initailizeDBAndServer()

const convertToStateObj = eachState => {
  return {
    stateId: eachState.state_id,
    stateName: eachState.state_name,
    population: eachState.population,
  }
}
const convertToStatNameObj = eachState => {
  return {
    stateName: eachState.state_name,
  }
}
const convertToDistrictObj = eachdistrict => {
  return {
    districtId: eachdistrict.district_id,
    districtName: eachdistrict.district_name,
    stateId: eachdistrict.state_id,
    cases: eachdistrict.cases,
    cured: eachdistrict.cured,
    active: eachdistrict.active,
    deaths: eachdistrict.deaths,
  }
}
const convertToSumObj = sumObj => {
  return {
    totalCases: sumObj.totalCases,
    totalCured: sumObj.totalCured,
    totalActive: sumObj.totalActive,
    totalDeaths: sumObj.totalDeaths,
  }
}
//GET all states
app.get('/states/', async (request, response) => {
  const getstatesQuery = `SELECT *
        FROM state;`
  const stateArray = await db.all(getstatesQuery)
  response.send(stateArray.map(eachState => convertToStateObj(eachState)))
})

//GET One state
app.get('/states/:stateId', async (request, response) => {
  const {stateId} = request.params
  const getstateQuery = `SELECT *
        FROM state WHERE state_id=${stateId};`
  const state = await db.get(getstateQuery)
  response.send(convertToStateObj(state))
})

//add Post district
app.post('/districts/', async (request, response) => {
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const adddistrictquery = `INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
    VALUES("${districtName}",${stateId},${cases},${cured},${active},${deaths});`
  await db.run(adddistrictquery)
  response.send('District Successfully Added')
})

//GET One district
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getdistrictQuery = `SELECT *
        FROM district WHERE district_id=${districtId};`
  const eachdistrict = await db.get(getdistrictQuery)
  response.send(convertToDistrictObj(eachdistrict))
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deletedistrictQuery = `DELETE 
        FROM district WHERE district_id=${districtId};`
  await db.run(deletedistrictQuery)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const deletedistrictQuery = `UPDATE 
       district SET
       district_name="${districtName}",
       state_id=${stateId},
       cases=${cases},
       cured=${cured},
       active=${active},
       deaths=${deaths};`
  await db.run(deletedistrictQuery)
  response.send('District Details Updated')
})

//GET Sum INFO of district
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getsumQuery = `SELECT SUM(cases) as totalCases,SUM(cured) as  totalCured,SUM(active) as  totalActive,SUM(deaths) as totalDeaths
        FROM district WHERE state_id=${stateId};`
  const sumObj = await db.get(getsumQuery)
  response.send(convertToSumObj(sumObj))
})

//GET Sum INFO of district
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getstateNameQuery = `SELECT state_name FROM state JOIN district WHERE district_id=${districtId};`
  const stateNAME = await db.get(getstateNameQuery)
  response.send(convertToStatNameObj(stateNAME))
})

module.exports = app
