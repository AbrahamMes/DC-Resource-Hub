# Autodesk ACC discovery

The application uses two Autodesk resource models:

- Data Management exposes hubs and the projects visible through Docs. ACC/BIM 360 hub IDs commonly use a `b.` prefix; the corresponding account ID is the hub ID without that prefix.
- ACC Admin exposes account projects, project users, and administrative metadata. These resources are not interchangeable with Data Management hubs.

Use a three-legged Autodesk login belonging to a user who can access the required account and projects. The configured OAuth scopes include `data:read`, `data:write`, and `account:read`. The app must be provisioned in the ACC account, and the user needs Docs access for Data Management discovery. Admin endpoints can additionally require account or project administrator permissions. Some company endpoints may require Autodesk app-context provisioning.

References:

- <https://aps.autodesk.com/developer/overview/data-management-api>
- <https://get-started.aps.autodesk.com/tutorials/acc-admin/data>
- <https://get-started.aps.autodesk.com/tutorials/acc-issues/admin/>

## Authentication

The commands use `APS_ACCESS_TOKEN` when supplied. Otherwise they renew the most recent Autodesk login in the persistent `sessions.db`. Log in through the application before using saved-session authentication.

Run commands inside the backend container so they use the persistent session volume:

```sh
docker compose exec backend npm run acc:list-hubs
```

Add `-- --json` to any command for machine-readable output.

## Commands

```sh
npm run acc:list-hubs
npm run acc:list-projects -- --hub b.ACCOUNT_ID
npm run acc:list-accounts
npm run acc:list-companies -- --account ACCOUNT_ID
npm run acc:list-project-users -- --account ACCOUNT_ID --project PROJECT_ID
npm run acc:find-company -- --account ACCOUNT_ID --name "Prime Controls"
npm run acc:inspect-assignees -- --project PROJECT_ID
npm run acc:list-asset-categories -- --project PROJECT_ID
npm run site:validate -- --config /app/config/sites.json
```

All listing commands follow Autodesk pagination. A `401` means the login must be renewed. A `403` usually means a missing scope, app provisioning, or user permission. A `404` can mean either an incorrect ID or an inaccessible resource.

## Mapping output to sites.json

| Discovered value | Site configuration field |
| --- | --- |
| Data Management project ID, without a leading `b.` if present | `accProjects[].id` |
| Project display name | `accProjects[].name` |
| Selected default project | `defaultAccProjectId` |
| Company ID | `primeControlsAssignedToIds[]` when issues can be assigned to the company |
| Project-user/member ID | `primeControlsAssignedToIds[]` |
| Asset category ID and name | `accAssetCategoryId`, `accAssetCategoryName` |

Do not copy hub IDs into project fields. Validate the completed file before restarting the service.
