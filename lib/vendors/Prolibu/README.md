


# Prolibu REST API Client Libraries

This folder provides robust, production-ready libraries for interacting with Prolibu's REST API from your scripts. All modules are designed for advanced usage, error handling, and extensibility.

## How the REST Library Works

The `Rest` library provides a unified interface for CRUD operations and advanced queries on any Prolibu model. All methods use a global `authAxios` instance for authenticated requests and return parsed data directly. Errors are always thrown as standardized objects with type, status, message, details, and a readable `toString()` method.

### Supported Query Parameters
- `page`: Page number (integer)
- `limit`: Items per page (integer)
- `sort`: Sort order (string, e.g. '-createdAt')
- `select`: Fields to include/exclude (string)
- `xquery`: Advanced filter object (will be JSON.stringified)
- `populatePath`: Deep populate related models (array, will be JSON.stringified)
- Any other query param supported by the API

## REST Library Examples

```js
const Rest = require('../../../lib/vendors/Prolibu/Rest');

(async function() {
	try {
		// CREATE: Add a new contact
		const newContact = await Rest.create('contact', {
			firstName: 'John',
			lastName: 'Doe',
			email: 'john.doe@example.com',
			company: '68cc14992f2804dba04f3973'
		});
		console.log('Created contact:', newContact);

		// UPDATE: Update a contact by ID
		const updatedContact = await Rest.update('contact', newContact._id, {
			lastName: 'Smith'
		});
		console.log('Updated contact:', updatedContact);

		// FINDONE: Get a contact by ID with deep populate and select
		const contact = await Rest.findOne('contact', newContact._id, {
			populatePath: [
				{ path: 'company', select: 'companyName' }
			],
			select: 'firstName lastName company'
		});
		console.log('Contact:', contact);

		// FIND: Get contacts with pagination, sorting, and filtering
		const contacts = await Rest.find('contact', {
			page: 1,
			limit: 10,
			sort: '-createdAt',
			xquery: { status: 'active' },
			select: 'firstName lastName',
			populatePath: [ { path: 'company', select: 'companyName' } ]
		});
		console.log('Contacts:', contacts);

		// DELETE: Remove a contact by ID
		const deleted = await Rest.delete('contact', newContact._id);
		console.log('Deleted contact:', deleted);

		// SEARCH: Search contacts by term with extra query params
		const searchResults = await Rest.search('contact', 'john', {
			limit: 5,
			sort: 'lastName',
			select: 'firstName lastName',
		});
		console.log('Search results:', searchResults);

	} catch (err) {
		// Standardized error handling
		console.error('API call error:', err.toString());
		// Access err.type, err.status, err.details for diagnostics
	}
})();
```

## User Library Example

```js
const User = require('../../../lib/vendors/Prolibu/User');

(async function() {
	try {
		const me = await User.me();
		console.log('Current user:', me);
	} catch (err) {
		console.error('API call error:', err.toString());
	}
})();
```

## Utilities

### getVariable(key)
Get the value of a variable from the execution context.

## Error Handling
All methods throw standardized errors with properties:
- `type`: 'http', 'network', 'unknown'
- `status`: HTTP code if applicable
- `message`: readable message
- `details`: server response body if present
- `toString()`: prints the error in a readable format

## Requirements
The environment must provide a global `authAxios` instance configured with domain and API key.

---
For questions, improvements, or advanced usage, review the source code of each module.
