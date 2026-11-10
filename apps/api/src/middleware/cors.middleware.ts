import cors from "cors";

const allowedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const allowedHeaders = ["Content-Type", "Authorization"];

export function corsMiddleware(frontendOrigin: string) {
  return cors({
    // An array uses origin matching. A string would send the allowed origin
    // on every response, including requests from other sites.
    origin: [frontendOrigin],
    methods: allowedMethods,
    allowedHeaders,
    // Cookies are not used yet. A bearer token can travel in Authorization
    // without credentialed CORS. Cookie auth would require credentials: true
    // and this same specific origin, never *.
    credentials: false,
  });
}
