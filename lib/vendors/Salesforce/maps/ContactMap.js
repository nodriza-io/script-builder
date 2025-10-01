/*
Prolibu Contact Schema:

{
  _id: {
    type: [Function: ObjectId] {
      schemaName: 'ObjectId',
      defaultOptions: {},
      get: [Function (anonymous)],
      set: [Function: set],
      _checkRequired: [Function (anonymous)],
      _cast: [Function: castObjectId],
      cast: [Function: cast],
      _defaultCaster: [Function (anonymous)],
      checkRequired: [Function (anonymous)]
    },
    default: [Function: default],
    hidden: true,
    avoid: 'update',
    description: 'The date and time the document was created.',
    faker: 'custom.objectId',
    _type: 'objectid'
  },
  createdAt: {
    type: [Function: Date],
    default: [Function: now],
    avoid: 'always',
    description: 'The date and time the document was created.',
    _type: 'date'
  },
  updatedAt: {
    type: [Function: Date],
    default: [Function: now],
    avoid: 'always',
    description: 'The date and time the document was last updated.',
    _type: 'date'
  },
  createdBy: {
    type: [Function: ObjectId] {
      schemaName: 'ObjectId',
      defaultOptions: {},
      get: [Function (anonymous)],
      set: [Function: set],
      _checkRequired: [Function (anonymous)],
      _cast: [Function: castObjectId],
      cast: [Function: cast],
      _defaultCaster: [Function (anonymous)],
      checkRequired: [Function (anonymous)]
    },
    ref: 'User',
    avoid: 'always',
    description: 'The user who created the document.',
    required: true,
    _type: 'objectid'
  },
  updatedBy: {
    type: [Function: ObjectId] {
      schemaName: 'ObjectId',
      defaultOptions: {},
      get: [Function (anonymous)],
      set: [Function: set],
      _checkRequired: [Function (anonymous)],
      _cast: [Function: castObjectId],
      cast: [Function: cast],
      _defaultCaster: [Function (anonymous)],
      checkRequired: [Function (anonymous)]
    },
    ref: 'User',
    avoid: 'always',
    description: 'The user who last updated the document.',
    required: true,
    _type: 'objectid'
  },
  workspace: {
    type: [Function: ObjectId] {
      schemaName: 'ObjectId',
      defaultOptions: {},
      get: [Function (anonymous)],
      set: [Function: set],
      _checkRequired: [Function (anonymous)],
      _cast: [Function: castObjectId],
      cast: [Function: cast],
      _defaultCaster: [Function (anonymous)],
      checkRequired: [Function (anonymous)]
    },
    ref: 'Workspace',
    hidden: true,
    description: 'The workspace the document belongs to.',
    compoundIndex: 1,
    _type: 'objectid'
  },
  refId: {
    type: [Function: Mixed] {
      schemaName: 'Mixed',
      defaultOptions: {},
      get: [Function (anonymous)],
      set: [Function: set]
    },
    hidden: true,
    _type: 'mixed'
  },
  refUrl: { type: [Function: String], hidden: true, _type: 'string' },
  firstName: {
    type: [Function: String],
    displayName: true,
    textIndex: true,
    example: 'John',
    faker: 'person.firstName',
    _type: 'string'
  },
  lastName: {
    type: [Function: String],
    displayName: true,
    textIndex: true,
    example: 'Doe',
    faker: 'person.lastName',
    _type: 'string'
  },
  email: {
    type: [Function: String],
    compoundIndex: 0,
    required: true,
    displayName: true,
    primaryKey: true,
    textIndex: true,
    faker: 'internet.email',
    set: [Function: set],
    _type: 'string'
  },
  jobTitle: {
    type: [Function: String],
    example: 'Manager',
    faker: 'person.jobTitle',
    _type: 'string'
  },
  companyName: {
    type: [Function: String],
    hidden: true,
    uiCom: 'CompanyAssociator',
    faker: 'company.name',
    _type: 'string'
  },
  company: {
    type: [Function: ObjectId] {
      schemaName: 'ObjectId',
      defaultOptions: {},
      get: [Function (anonymous)],
      set: [Function: set],
      _checkRequired: [Function (anonymous)],
      _cast: [Function: castObjectId],
      cast: [Function: cast],
      _defaultCaster: [Function (anonymous)],
      checkRequired: [Function (anonymous)]
    },
    ref: 'Company',
    extendSearch: true,
    _type: 'objectid',
    displayName: true,
    example: 'pets-co'
  },
  numberOfEmployees: { type: [Function: Number], _type: 'number' },
  website: {
    type: [Function: String],
    example: 'www.example.com',
    eg: 'https://www.acme.com',
    faker: 'internet.domainName',
    _type: 'string'
  },
  mobile: {
    type: [Function: String],
    textIndex: true,
    example: '+57 311 521 3449',
    eg: '+1 212 456 7890',
    faker: 'phone.number',
    _type: 'string'
  },
  whatsapp: {
    type: [Function: String],
    validate: {
      validator: [Function: validator],
      message: 'Invalid phone number format. It should be in international format, e.g. "+1 408 XXX XXXX" or "573115213448".'
    },
    example: '+573115213448',
    set: [Function: set],
    faker: 'phone.number',
    fakerArgs: [ '+57 ### ### ####' ],
    _type: 'string'
  },
  address: {
    street: {
      type: [Function: String],
      example: '2719 Hyperion Ave',
      faker: 'location.streetAddress',
      _type: 'string'
    },
    neighborhood: {
      type: [Function: String],
      example: 'Silver Lake',
      faker: 'location.county',
      _type: 'string'
    },
    city: {
      type: [Function: String],
      example: 'Los Angeles',
      faker: 'location.city',
      _type: 'string'
    },
    state: {
      type: [Function: String],
      example: 'CA',
      faker: 'location.state',
      _type: 'string'
    },
    postalCode: {
      type: [Function: String],
      example: '90027',
      faker: 'location.zipCode',
      _type: 'string'
    },
    country: {
      type: [Function: String],
      enum: [Array],
      example: 'US',
      faker: 'custom.randItem',
      fakerArgs: [Array],
      _type: 'string'
    },
    location: { lat: [Object], long: [Object] }
  },
  socialNetworks: {
    linkedIn: { type: [Function: String], _type: 'string' },
    x: { type: [Function: String], _type: 'string' },
    youtube: { type: [Function: String], _type: 'string' },
    facebook: { type: [Function: String], _type: 'string' },
    instagram: { type: [Function: String], _type: 'string' },
    slackChannel: { type: [Function: String], _type: 'string' },
    telegramChatId: { type: [Function: String], _type: 'string' },
    discordChannel: { type: [Function: String], _type: 'string' }
  },
  identification: {
    docType: {
      type: [Function: String],
      description: 'Document ID Type',
      example: 'identification Card',
      _type: 'string'
    },
    docId: {
      type: [Function: String],
      textIndex: true,
      displayName: true,
      description: 'Document ID',
      example: '80103085',
      faker: 'number.int',
      fakerArgs: [Array],
      _type: 'string'
    }
  },
  assignmentGroup: {
    type: [Function: ObjectId] {
      schemaName: 'ObjectId',
      defaultOptions: {},
      get: [Function (anonymous)],
      set: [Function: set],
      _checkRequired: [Function (anonymous)],
      _cast: [Function: castObjectId],
      cast: [Function: cast],
      _defaultCaster: [Function (anonymous)],
      checkRequired: [Function (anonymous)]
    },
    ref: 'UserGroup',
    description: 'User group responsible for handling the reception of this contact',
    _type: 'objectid'
  },
  phones: {
    type: [ [Function] ],
    uiCom: 'objectEditor',
    objectShape: { name: [Object], number: [Object] },
    _type: [ 'mixed' ]
  },
  otherEmails: {
    type: [ [Function] ],
    uiCom: 'objectEditor',
    objectShape: { name: [Object], email: [Object] },
    _type: [ 'mixed' ]
  },
  tags: {
    type: [ [Function] ],
    ref: 'Tag',
    extendSearch: true,
    uiCom: 'TagsCom',
    _type: [ 'objectid' ]
  },
  profilePicture: {
    type: [Function: ObjectId] {
      schemaName: 'ObjectId',
      defaultOptions: {},
      get: [Function (anonymous)],
      set: [Function: set],
      _checkRequired: [Function (anonymous)],
      _cast: [Function: castObjectId],
      cast: [Function: cast],
      _defaultCaster: [Function (anonymous)],
      checkRequired: [Function (anonymous)]
    },
    uiCom: 'ProfilePicture',
    isPublic: true,
    ref: 'File',
    _type: 'objectid'
  },
  adCampaign: {
    type: [Function: ObjectId] {
      schemaName: 'ObjectId',
      defaultOptions: {},
      get: [Function (anonymous)],
      set: [Function: set],
      _checkRequired: [Function (anonymous)],
      _cast: [Function: castObjectId],
      cast: [Function: cast],
      _defaultCaster: [Function (anonymous)],
      checkRequired: [Function (anonymous)]
    },
    ref: 'AdCampaign',
    description: 'Campaign where the entry was obtained from.',
    _type: 'objectid'
  },
  source: {
    type: [Function: String],
    description: 'Source where the entry was obtained from.',
    _type: 'string'
  },
  notes: {
    type: [ [Function] ],
    ref: 'Note',
    uiCom: 'NotesCom',
    avoidDuplicates: true,
    cascadeDelete: true,
    avoid: 'always',
    _type: [ 'objectid' ]
  },
  tasks: {
    type: [ [Function] ],
    uiCom: 'TasksCom',
    ref: 'Task',
    avoidDuplicates: true,
    cascadeDelete: true,
    avoid: 'always',
    _type: [ 'objectid' ]
  },
  calls: {
    type: [ [Function] ],
    ref: 'Call',
    avoidDuplicates: true,
    cascadeDelete: true,
    avoid: 'always',
    _type: [ 'objectid' ]
  },
  meetings: {
    type: [ [Function] ],
    ref: 'Meeting',
    avoidDuplicates: true,
    cascadeDelete: true,
    avoid: 'always',
    _type: [ 'objectid' ]
  },
  assignee: {
    type: [Function: ObjectId] {
      schemaName: 'ObjectId',
      defaultOptions: {},
      get: [Function (anonymous)],
      set: [Function: set],
      _checkRequired: [Function (anonymous)],
      _cast: [Function: castObjectId],
      cast: [Function: cast],
      _defaultCaster: [Function (anonymous)],
      checkRequired: [Function (anonymous)]
    },
    ref: 'User',
    _type: 'objectid'
  },
  collaborators: {
    type: [ [Function] ],
    ref: 'User',
    avoidDuplicates: true,
    _type: [ 'objectid' ]
  },
  group: {
    type: [Function: ObjectId] {
      schemaName: 'ObjectId',
      defaultOptions: {},
      get: [Function (anonymous)],
      set: [Function: set],
      _checkRequired: [Function (anonymous)],
      _cast: [Function: castObjectId],
      cast: [Function: cast],
      _defaultCaster: [Function (anonymous)],
      checkRequired: [Function (anonymous)]
    },
    ref: 'Group',
    _type: 'objectid'
  },
  assignedAt: { type: [Function: Date], avoid: 'always', _type: 'date' },
  assignedBy: {
    type: [Function: ObjectId] {
      schemaName: 'ObjectId',
      defaultOptions: {},
      get: [Function (anonymous)],
      set: [Function: set],
      _checkRequired: [Function (anonymous)],
      _cast: [Function: castObjectId],
      cast: [Function: cast],
      _defaultCaster: [Function (anonymous)],
      checkRequired: [Function (anonymous)]
    },
    ref: 'User',
    avoid: 'always',
    _type: 'objectid'
  },
  stage: {
    type: [Function: ObjectId] {
      schemaName: 'ObjectId',
      defaultOptions: {},
      get: [Function (anonymous)],
      set: [Function: set],
      _checkRequired: [Function (anonymous)],
      _cast: [Function: castObjectId],
      cast: [Function: cast],
      _defaultCaster: [Function (anonymous)],
      checkRequired: [Function (anonymous)]
    },
    ref: 'Stage',
    _type: 'objectid',
    faker: 'custom.randItem',
    fakerArgs: [ [Array] ]
  },
  stageMovedAt: { type: [Function: Date], avoid: 'always', _type: 'date' },
  priority: {
    type: [Function: ObjectId] {
      schemaName: 'ObjectId',
      defaultOptions: {},
      get: [Function (anonymous)],
      set: [Function: set],
      _checkRequired: [Function (anonymous)],
      _cast: [Function: castObjectId],
      cast: [Function: cast],
      _defaultCaster: [Function (anonymous)],
      checkRequired: [Function (anonymous)]
    },
    ref: 'Stage',
    _type: 'objectid'
  },
  pipelineStages: {
    type: [Function: Mixed] {
      schemaName: 'Mixed',
      defaultOptions: {},
      get: [Function (anonymous)],
      set: [Function: set]
    },
    hidden: true,
    objectShape: { index: [Object], movedAt: [Object], movedBy: [Object] },
    example: { stage: [Object], leadStatus: [Object] },
    _type: 'mixed'
  },
  adCampaignMeta: {
    type: [Function: Mixed] {
      schemaName: 'Mixed',
      defaultOptions: {},
      get: [Function (anonymous)],
      set: [Function: set]
    },
    hidden: true,
    _type: 'mixed'
  },
  meta: {
    type: [Function: Mixed] {
      schemaName: 'Mixed',
      defaultOptions: {},
      get: [Function (anonymous)],
      set: [Function: set]
    },
    hidden: true,
    _type: 'mixed'
  },
  termsAndConditionsAcceptedAt: { type: [Function: Date], avoid: 'always', _type: 'date' },
  termsAndConditionsEvidence: {
    type: [Function: Mixed] {
      schemaName: 'Mixed',
      defaultOptions: {},
      get: [Function (anonymous)],
      set: [Function: set]
    },
    avoid: 'always',
    _type: 'mixed'
  },
  emails: {
    type: [ [Function] ],
    ref: 'Email',
    avoid: 'always',
    uiCom: 'EmailsCom',
    _type: [ 'objectid' ]
  },
  allowEveryone: {
    view: {
      type: [Function: Boolean],
      default: false,
      description: 'Indicates if everyone is allowed to view this document.',
      _type: 'boolean'
    },
    edit: {
      type: [Function: Boolean],
      default: false,
      description: 'Indicates if everyone is allowed to edit this document.',
      _type: 'boolean'
    }
  },
  indented: {
    stage: {
      type: [Function],
      ref: 'Stage',
      hidden: true,
      description: 'Key generated in dev and test env to test indented stage fields',
      _type: 'objectid'
    }
  }
}
  
*/