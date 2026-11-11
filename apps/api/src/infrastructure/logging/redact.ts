const CONNECTION_URL = /postgres(?:ql)?:\/\/[^\s'")]+/gi;
const PASSWORD_PARAM = /\b(password|pwd)=([^\s&]+)/gi;

export function redactSecrets(value: string): string {
  return value
    .replace(CONNECTION_URL, "postgresql://***")
    .replace(PASSWORD_PARAM, "$1=***");
}
