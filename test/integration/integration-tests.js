/* global test, expect */
import {localeTests} from './locale-integration'
import {contentTypeReadOnlyTests, contentTypeWriteTests} from './content-type-integration'
import {entryReadOnlyTests, entryWriteTests} from './entry-integration'
import {assetReadOnlyTests, assetWriteTests} from './asset-integration'
import webhookTests from './webhook-integration'
import spaceMembershipTests from './space-membership-integration'
import roleTests from './role-integration'
import apiKeyTests from './api-key-integration'
import generateRandomId from './generate-random-id'
import { createClient } from '../../dist/contentful-management'

const params = {
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN
}

const organization = process.env.CONTENTFUL_ORGANIZATION

if (process.env.API_INTEGRATION_TESTS) {
  params.host = '127.0.0.1:5000'
  params.insecure = true
}

const client = createClient(params)

test('Gets spaces', () => {
  return client.getSpaces()
  .then((response) => {
    expect(response.items).toBeTruthy()
    expect(response.total > 0).toBeTruthy()
  })
})

test('Gets organizations', () => {
  return client.getOrganizations()
  .then((response) => {
    expect(response.items.length >= 1).toBeTruthy()
  })
})

test('Gets space', () => {
  return client.getSpace('cfexampleapi')
  .then((response) => {
    expect(response.sys).toBeTruthy()
    expect(response.name).toBeTruthy()
  })
})

// @todo unskip test when api behaviour is fixed
// - https://github.com/contentful/contentful-management.js/issues/82
test.skip('Fails to get space', () => {
  return client.getSpace(generateRandomId('weirdrandomid'))
  .then(() => {}, (error) => {
    expect(error.name).toBe('NotFound')
    const errorData = JSON.parse(error.message)
    expect(errorData.status).toeBe(404)
  })
})

test('Creates, updates and deletes a space', () => {
  return client.createSpace({
    name: 'spacename'
  }, organization)
  .then((space) => {
    expect(space.names).toBe('spacename')
    space.name = 'updatedspacename'
    return space.update()
    .then((updatedSpace) => {
      expect(updatedSpace.name).toBe('updatedspacename')
      return updatedSpace.delete()
    })
  })
})

test('Gets space for read only tests', () => {
  return client.getSpace('cfexampleapi')
  .then((space) => {
    contentTypeReadOnlyTests(space)
    entryReadOnlyTests(space)
    assetReadOnlyTests(space)
  })
})

test('Create space for tests which create, change and delete data', () => {
  return client.createSpace({
    name: 'CMA JS SDK tests'
  }, organization)
  // When running these tests locally, create a specific space, uncomment and
  // use the line below to avoid running into the 10 space per hour creation limit.
  // Also comment the test.onFinish line below to avoid removing the space.
  // The below line also uses double quotes on purpose so it breaks the linter
  // in case someone forgets to comment this line again.
  // client.getSpace('a3f19zbn5ldg')
  .then((space) => {
    return space.createLocale({
      name: 'German (Germany)',
      code: 'de-DE'
    })
    .then(() => {
      return space
    })
  })
  .then((space) => {
    localeTests(space)
    contentTypeWriteTests(space)
    entryWriteTests(space)
    assetWriteTests(space)
    webhookTests(space)
    spaceMembershipTests(space)
    roleTests(space)
    apiKeyTests(space)
    // test.onFinish(() => space.delete())
  })
})
