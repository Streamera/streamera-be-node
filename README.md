# Backend for Streamera
The code here manages all data related stuff for Streamera.

## How to run locally

1. Install postgresql.
2. Create a new DB.
3. Clone this repo.
4. Copy .env.example and rename it to .env.
5. Fill up .env, where DB_HOST=localhost, CORS_WHITELIST is unsused can be left as an empty array
6. Run `npm install`.
7. Install `typescript` if you haven't.
8. Under `./src/Seeders/index.ts`, edit the values for seed initial params.
9. Run `npm run migrate:seed`.
10. Run `npm restart`.
11. Any changes to the code should be restarted with `npm restart`.