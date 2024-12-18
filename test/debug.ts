/*
    debug.ts - Just for debug

    Edit your test case here and invoke via: "jest debug"

    Or run VS Code in the top level directory and just run.
 */
import { Client, Table } from './utils/init'

jest.setTimeout(7200 * 1000)

//  Change with your schema
const schema = {
    version: '0.0.1',
    indexes: {
        primary: {hash: 'pk', sort: 'sk'},
        gs1: {hash: 'gs1pk', sort: 'gs1sk', project: 'all'},
    },
    params: {
        createdField: 'createdAt',
        updatedField: 'updatedAt',
        isoDates: true,
        timestamps: true,
        separator: '#',
        warn: false,
    },
    models: {
        User: {
            pk: { type: String, value: 'user#' },
            sk: { type: String, value: 'user#${email}' },
            email: { type: String, required: true },
            address: {
              type: Object,
              default: {},
              schema: {
                  street: {type: String},
                  city: {type: String},
                  zip: {type: String, required: false},
              },
            },
            updatedAt: {type: Date },
        }
    } as const,
}

//  Change your table params as required
const table = new Table({
    name: 'DebugTable',
    client: Client,
    partial: false,
    schema,
    logger: true,
})

//  This will create a local table
test('Create Table', async () => {
    if (!(await table.exists())) {
        await table.createTable()
        expect(await table.exists()).toBe(true)
    }
})

test('Update sub property to null should not throw?', async () => {
  let User = table.getModel('User')

  await User.create({email: 'roadrunner@acme.com'})

  // throws "OneTable execute failed \"update\" for \"User\", Invalid UpdateExpression: Two document paths overlap with each other; must remove or rewrite one of these paths; path one: [address, zip], path two: [address]"
  // because it tries to remove the `zip` and set the `address` in the same update
  await expect(      
    User.update({email: 'roadrunner@acme.com', address: { street: 'aStreet', city: 'aCity', zip: null as unknown as undefined }})
  ).resolves.not.toThrow();
})

test('Update date field with set should not throw', async () => {
  let User = table.getModel('User')

  await User.create({email: 'roadrunner@acme.com'})

  // throws: Unsupported type passed: Mon Oct 07 2024 16:21:29 GMT+0200 (Central European Summer Time). Pass options.convertClassInstanceToMap=true to marshall typeof object as map attribute. 
  await expect(
     User.update({email: 'roadrunner@acme.com'},{ set: { updatedAt: new Date()  }})
  ).resolves.not.toThrow()


  // if setting options.convertClassInstanceToMap=true as suggested by the error it gets worse and the date gets set to `Invalid Date`for the local DDB and an empty object/DDB-Map in a real DDB
})

test('Destroy Table', async () => {
    await table.deleteTable('DeleteTableForever')
    expect(await table.exists()).toBe(false)
})
