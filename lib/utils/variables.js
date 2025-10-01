/* global variables */

function getVariable(key) {
  if (!Array.isArray(variables)) return undefined;
  const found = variables.find(v => v.key === key);
  return found ? found.value : undefined;
}

/**
 * Gets multiple variables and validates they all exist
 * @param {Object} requiredVarsObj - Object with key: variableName pairs
 * @returns {Object} Object with the same keys but with variable values
 * @throws {Error} If any required variables are missing
 */
function getRequiredVars(requiredVarsObj) {
  const keys = Object.keys(requiredVarsObj);
  const missingVars = [];
  const result = {};
  
  keys.forEach(key => {
    const variableName = requiredVarsObj[key];
    const value = getVariable(variableName);
    
    if (!value) {
      missingVars.push(`'${variableName}'`);
    } else {
      result[key] = value;
    }
  });
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required variables: ${missingVars.join(', ')}`);
  }
  
  return result;
}

module.exports = { getVariable, getRequiredVars };