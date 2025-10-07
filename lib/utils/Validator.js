module.exports = {
  isRequired(fields, errorMessage = '`Missing required fields:') {
    const missingFields = [];
    for (const [key, value] of Object.entries(fields)) {
      if (!value) {
        missingFields.push(key);
      }
    }
    if (missingFields.length) {
      throw new Error(`${errorMessage} ${missingFields.join(', ')}`);
    }
  }
}
