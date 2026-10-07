# AccDoo CRM Frontend

Frontend application for the AccDoo CRM system.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- ESLint

## Project Structure

The application uses the Next.js App Router with the `src` directory structure.


## Environment Configuration

Configure environment variables in `.env` based on `.env.example`:

- `BACKEND_API_URL`: The URL of the FastAPI backend service.
  - **Local Development**: `http://127.0.0.1:8000`
  - **Container/Production Deployments**: Set to the reachable service name or domain (e.g., `http://backend:8000` or `https://api.crm.yourdomain.com`). Do not assume `127.0.0.1` when services run in isolated containers.
- `DEV_AUTH_ENABLED`: Enables development session simulation at `/setup`. Must be disabled (`false` or omitted) in production.