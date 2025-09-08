(async function() {
    // Trigger event: beforeCreate
    if (input?.eventName === 'Contact.beforeCreate') {
      const nameModified = input?.doc?.firstName + ' modified';
      _.set(input, 'doc.firstName', nameModified);
    // Trigger event: beforeUpdate
    } else if (input?.eventName === 'Contact.beforeUpdate') {
      const nameModified = input?.doc?.firstName + ' updated';
      _.set(input, 'doc.firstName', nameModified);
    // Trigger event: afterCreate
    } else if(input?.eventName === 'Contact.afterCreate') {
      console.log('1. Log Contact.afterCreate Event');
    // Trigger event: afterUpdate
    } else if(input?.eventName === 'Contact.afterUpdate') {
      console.log('2. Log Contact.afterUpdate Event');
    // Trigger event: beforeDelete
    } else if(input?.eventName === 'Contact.beforeDelete') {
      console.log('3. Log Contact.beforeDelete Event');
    // Trigger event: afterDelete
    } else if(input?.eventName === 'Contact.afterDelete') {
      console.log('4. Log Contact.afterDelete Event');
    }
    // Trigger: error
    if (input?.doc?.throwError === 'Got Error') {
      throw new Error('Something Invalid');
    }
})();
