function getVariable(key) {
  if (!Array.isArray(variables)) return undefined;
  const found = variables.find(v => v.key === key);
  return found ? found.value : undefined;
}

module.exports = { getVariable };
