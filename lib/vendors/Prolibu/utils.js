function handleAxiosError(err) {
  let errorObj;
  if (err.response) {
    // Error de respuesta del servidor (4xx, 5xx)
    errorObj = {
      type: 'http',
      status: err.response.status,
      message: err.response.statusText || 'HTTP error',
      details: err.response.data || null,
    };
  } else if (err.request) {
    // No hubo respuesta del servidor
    errorObj = {
      type: 'network',
      status: null,
      message: 'No response from server',
      details: null,
    };
  } else {
    // Error de configuración o desconocido
    errorObj = {
      type: 'unknown',
      status: null,
      message: err.message || 'Unknown error',
      details: null,
    };
  }
  errorObj.toString = function() {
    return `[${this.type}${this.status ? ' ' + this.status : ''}] ${this.message}` + (this.details ? ` | Details: ${JSON.stringify(this.details)}` : '');
  };
  return errorObj;
}

module.exports = { handleAxiosError };