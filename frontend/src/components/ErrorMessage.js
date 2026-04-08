export default function ErrorMessage({ error }) {
  if (!error) return null;

  const message = typeof error === 'string'
    ? error
    : error.detail || error.error || error.message
      || Object.values(error).flat().join(' ')
      || 'Une erreur est survenue';

  return <div className="error-message">{message}</div>;
}
