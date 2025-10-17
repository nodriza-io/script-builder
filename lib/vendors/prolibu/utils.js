function handleAxiosError(err) {
  let errorType, status, message, details;
  
  if (err.response) {
    // Error de respuesta del servidor (4xx, 5xx)
    errorType = 'http';
    status = err.response.status;
    message = err.response.data?.error || err.response.statusText || 'HTTP error';
    details = err.response.data || null;
  } else if (err.request) {
    // No hubo respuesta del servidor
    errorType = 'network';
    status = null;
    message = 'No response from server';
    details = null;
  } else {
    // Error de configuración o desconocido
    errorType = 'unknown';
    status = null;
    message = err.message || 'Unknown error';
    details = null;
  }
  
  // Crear Error nativo (serializable)
  const formattedMessage = `[${errorType}${status ? ' ' + status : ''}] ${message}`;
  const error = new Error(formattedMessage);
  
  // Agregar metadata como propiedades
  error.type = errorType;
  error.statusCode = status;
  error.details = details;
  error.originalError = err;
  
  return error;
}

module.exports = { handleAxiosError };