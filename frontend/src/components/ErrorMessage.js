export default function ErrorMessage({ error }) {
  if (!error) return null;

  const message = typeof error === 'string'
    ? error
    : error.detail || error.error || JSON.stringify(error);

  return <div className="error-message">{message}</div>;
}
