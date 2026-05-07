/**
 * Credenciales — se leen de variables de entorno en tiempo de build.
 * Defaults seguros para desarrollo local.
 */
export const AUTH_USERNAME = import.meta.env.VITE_AUTH_USERNAME || 'eduardo';
export const AUTH_PASSWORD = import.meta.env.VITE_AUTH_PASSWORD || 'deb-tracker-edu-crack-1234567890';
