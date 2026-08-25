# Authentication And Authorization Workplan

## Addendum: Surveyor Barge Assignment Authorization

### Goal

Allow `super_admin` and `master` users to assign a barge to a surveyor login, and ensure a `surveyor` user can only see and update records for their assigned barge.

Current project context:

- `surveyors` already stores `barge_id`.
- `SurveyorController` already manages surveyor master data at `/surveyors/edit`.
- `SurveyingController@index` currently reads a public `?barge=` query parameter and returns matching pending/completed orders.
- `resources/js/pages/surveyor/dashboard.tsx` currently lets the user choose any barge from the full barge list.

The required change is not just UI filtering. Enforce the assignment on the backend for every surveyor-facing route.

### Data Model Plan

1. Add a nullable `user_id` column to `surveyors`.
   - Type: `ulid`.
   - Foreign key: references `users.id`.
   - Unique: one login user can be linked to only one surveyor profile.
   - Nullable during rollout so existing surveyor master records do not break immediately.
2. Keep `surveyors.barge_id` as the assigned barge.
   - It already references `barges.imo`.
   - Do not move this assignment to `users`; the assignment belongs to the surveyor operational profile, not authentication identity.
3. Update `App\Models\Surveyor`.
   - Add `user_id` to fillable fields.
   - Add `user(): BelongsTo` relation to `App\Models\User`.
4. Update `App\Models\User`.
   - Add `surveyor(): HasOne` relation to `App\Models\Surveyor`.
   - Keep `users.id` as the internal ULID source of truth.
   - Do not use the visual `users.user_id` for foreign keys or authorization checks.

### Assignment UI Plan

Use the existing `/surveyors/edit` screen rather than creating a separate assignment module.

1. Update `SurveyorController@edit`.
   - Continue returning surveyor records and barges.
   - Also return active users where `type = surveyor`, ordered by name.
   - Exclude users already linked to another surveyor record unless editing that linked record.
2. Update `resources/js/pages/surveyors/edit.tsx`.
   - Add a `User` select field for the surveyor login.
   - Keep the existing `Barge` select field as the barge assignment.
   - Show linked user name/email in the table.
3. Update `SurveyorController` validation.
   - `user_id`: nullable, exists in `users.id`.
   - Add a validation rule that the selected user has `type = surveyor`.
   - Add unique validation so the same user cannot be assigned to multiple surveyor profiles.
   - `barge_id`: keep nullable if the business accepts unassigned surveyors; otherwise make it required once rollout data is cleaned.

### Backend Authorization Plan

Create one central resolver so every surveyor-facing controller applies the same rule.

1. Add a helper method or service, for example `SurveyorAssignment`.
   - Input: authenticated `User`.
   - Output for `super_admin` and `master`: privileged access, no forced barge restriction.
   - Output for `surveyor`: assigned `Surveyor` record and assigned `barge_id`.
   - If a surveyor user has no linked surveyor record or no assigned barge, return no operational rows and block write actions.
2. Update `SurveyingController@index`.
   - For `super_admin` and `master`, keep the barge picker behavior.
   - For `surveyor`, ignore the request `?barge=` parameter completely.
   - For `surveyor`, force `$barge` from `auth()->user()->surveyor->barge_id`.
   - Return only that one barge in the `barges` prop, or return an `assignedBarge` prop and remove the picker for surveyor users.
3. Update `SurveyingController@update`.
   - Before updating BDN quantities, authorize that the order `barge_id` matches the authenticated surveyor's assigned `barge_id`.
   - Allow `super_admin` and `master`.
   - Deny surveyors with no assignment.
4. Update `SurveyingController@complete`.
   - Apply the same order/barge authorization before completing the order.
5. Update `BdnController@update`.
   - Apply the same order/barge authorization before saving BDN details.
   - For surveyor users, reject attempts to change `bdn.barge_id` to a different barge.
   - Prefer forcing the BDN barge to the order or assigned barge instead of trusting request input.
6. Update `BdnController@ebdn`.
   - If surveyors can open eBDNs, ensure the order belongs to their assigned barge.
   - Allow `super_admin` and `master`.
7. Review `BdnController@index`.
   - If this route remains available to surveyors, filter rows to the assigned barge.
   - If not required, remove `surveyor` from the `bdns.index` route group or deny surveyor access in the controller.

### Frontend Surveyor Dashboard Plan

1. Update `resources/js/pages/surveyor/dashboard.tsx`.
   - Add an auth/role prop or use the shared auth page props if already available.
   - If role is `surveyor`, do not render the global barge selector.
   - Show the assigned barge name as read-only context.
   - If no barge is assigned, show an empty state and no action buttons.
2. Keep the barge selector for `super_admin` and `master`.
   - Their selected barge should continue to reload `pendingOrders` and `completedOrders`.
3. Update `resources/js/pages/surveyor/bdn-dialog.tsx`.
   - For surveyor users, render Barge as read-only or restrict the combobox to the assigned barge only.
   - Do not let surveyors submit a different `barge_id`.

### Route-Level Plan

Existing route group can remain:

```php
Route::middleware('role:super_admin,master,surveyor')->group(function () {
    Route::get('surveyor', [SurveyingController::class, 'index'])->name('surveyor');
    Route::patch('surveyor/{order}', [SurveyingController::class, 'update'])->name('surveyor.update');
    Route::patch('surveyor/{order}/complete', [SurveyingController::class, 'complete'])->name('surveyor.complete');
    Route::put('surveyor/{order}/bdn', [BdnController::class, 'update'])->name('surveyor.bdn.update');
    Route::get('bdns', [BdnController::class, 'index'])->name('bdns.index');
    Route::get('bdns/{order}/ebdn', [BdnController::class, 'ebdn'])->name('bdns.ebdn');
});
```

But controller-level checks are mandatory because the route middleware only checks role, not ownership of the barge/order.

### Testing Plan

Use Pest feature tests.

1. Migration/model tests.
   - A surveyor profile can be linked to a `surveyor` user.
   - The same user cannot be linked to two surveyor profiles.
   - A surveyor profile can be assigned a barge.
2. Surveyor dashboard tests.
   - A surveyor with assigned barge sees pending orders for that barge only.
   - A surveyor cannot see orders for another barge by passing `?barge=OTHER`.
   - A surveyor with no linked profile or no barge sees no operational orders.
   - `master` and `super_admin` can still filter by barge.
3. Surveyor write tests.
   - A surveyor can update BDN quantities for an order on their assigned barge.
   - A surveyor cannot update BDN quantities for another barge.
   - A surveyor cannot complete an order for another barge.
   - A surveyor cannot update BDN details for another barge.
   - A surveyor cannot submit a BDN payload that changes the barge away from their assignment.
4. Master assignment tests.
   - `master` can assign a surveyor user to a surveyor profile.
   - `master` can assign a barge to a surveyor profile.
   - Non-privileged roles cannot access `/surveyors/edit` or mutate surveyor assignments.
5. Regression tests.
   - Existing `super_admin` and `master` surveyor dashboard access still works.
   - Existing operations assignment of `orders.barge_id` still works.

Run:

```bash
php artisan test --compact --filter=Surveyor
php artisan test --compact --filter=Bdn
vendor/bin/pint --dirty --format agent
```

### Acceptance Criteria

- `master` can assign an active `surveyor` login to a surveyor profile.
- `master` can assign a barge to that surveyor profile.
- A logged-in `surveyor` sees only pending and completed orders for their assigned barge.
- A logged-in `surveyor` cannot bypass the restriction through query params, direct route calls, BDN updates, or complete-order actions.
- `super_admin` and `master` keep privileged visibility for operational oversight.
- All authorization is enforced server-side.

## Scope

Implement application authentication and role-based authorization for the existing Laravel 13 + Inertia React application.

Do not use the `fortify-development` skill for this work. Follow the existing Laravel, Inertia, Pest, Pint, Wayfinder, and project conventions in `AGENTS.md`.

User types:

- `super_admin`
- `master`
- `sales`
- `operations`
- `surveyor`
- `finance`

Hard requirements:

- Add `super_admin` to the existing `App\Enums\UserType` values. Keep the existing `master`, `sales`, `operations`, `surveyor`, and `finance` values stable.
- The app's `Admin` navigation section is an administrative section for `super_admin` and `master` users.
- `super_admin` has all rights and authorization available to `master`.
- The first `super_admin` account is the protected account.
- The first `super_admin` account must never be deleted, deactivated, self-deleted, self-deactivated, or demoted.
- `master` can create and manage users, but cannot create a `super_admin` and cannot upgrade any user to `super_admin`.
- `master` cannot view the `super_admin` user list or see `super_admin` rows in user-management screens.
- `super_admin` can set and edit the human-facing `user_id`.
- `master` can set and edit the human-facing `user_id` for non-`super_admin` users.
- The human-facing `user_id` must not be the source of truth.
- Maintain an internally generated ULID as the real user identity source of truth using Laravel `HasUlids`.
- Do not authorize only through hidden frontend UI. Every restricted action must be enforced on the backend.

## Route Access Matrix

Routes are based on `routes/web.php`.

### Guest

| Method | URI | Name |
| --- | --- | --- |
| GET | `/` | `home` |

### All Authenticated Users

| Method | URI | Name |
| --- | --- | --- |
| GET | `/settings/profile` | `profile.edit` |
| PATCH | `/settings/profile` | `profile.update` |
| GET | `/settings/security` | `security.edit` |
| PUT | `/settings/password` | `user-password.update` |

Do not allow ordinary users to delete their own profile until the first-super-admin and protected-account rules are implemented and tested.

### Super Admin

Super admin can access every authenticated route in `routes/web.php`, plus future user-management routes.

Restrictions:

- The first super admin cannot be deleted, deactivated, or demoted.
- The first super admin cannot self-delete or self-deactivate.

Additional capability:

- Can do everything `master` can do.
- Can create users.
- Can assign and edit the human-facing `user_id`.
- Can create or promote another `super_admin`.
- Cannot alter the internal ULID.

### Master

Master can access every authenticated route in `routes/web.php`, plus future user-management routes.

Restrictions:

- Cannot delete, deactivate, or demote the first super admin.
- Cannot view or list `super_admin` accounts.
- Cannot create a `super_admin`.
- Cannot upgrade any user to `super_admin`.
- Cannot self-delete.
- Cannot self-deactivate.

Additional capability:

- Can create users.
- Can assign and edit the human-facing `user_id` for non-`super_admin` users.
- Cannot alter the internal ULID.

### Sales

| Method | URI | Name |
| --- | --- | --- |
| GET | `/sales-dashboard` | `sales-dashboard` |
| GET | `/credit-management` | `credit-management` |
| GET | `/orders` | `orders` |
| PATCH | `/orders/{order}` | `orders.update` |
| PATCH | `/orders/{order}/cancel` | `orders.cancel` |
| GET | `/disputes` | `disputes` |
| POST | `/orders/{order}/disputes` | `disputes.store` |
| PATCH | `/disputes/{dispute}` | `disputes.update` |
| PATCH | `/disputes/{dispute}/close` | `disputes.close` |
| PATCH | `/disputes/{dispute}/reopen` | `disputes.reopen` |
| GET | `/enquiries` | `enquiries.index` |
| POST | `/enquiries` | `enquiries.store` |
| PATCH/PUT | `/enquiries/{enquiry}` | `enquiries.update` |
| PATCH | `/enquiries/{enquiry}/details` | `enquiries.details.update` |
| PATCH | `/enquiries/{enquiry}/lost` | `enquiries.lost` |
| POST | `/enquiries/{enquiry}/customers` | `enquiries.customers.store` |
| PATCH | `/enquiry-customers/{enquiryCustomer}` | `enquiry-customers.update` |
| PATCH | `/enquiry-customers/{enquiryCustomer}/status` | `enquiry-customers.update-status` |
| GET | `/customers` | `customers.index` |
| POST | `/customers` | `customers.store` |
| PATCH/PUT | `/customers/{customer}` | `customers.update` |
| DELETE | `/customers/{customer}` | `customers.destroy` |
| GET | `/agents` | `agents.index` |
| GET | `/agent-pics` | `agent-pics.index` |

Keep `agents` and `agent-pics` mutation super-admin/master-only unless the product owner confirms sales owns master-data maintenance.

### Operations

| Method | URI | Name |
| --- | --- | --- |
| GET | `/operations` | `operations` |
| PATCH | `/operations/{order}` | `operations.update` |
| GET | `/orders` | `orders` |
| GET | `/bdns` | `bdns.index` |
| GET | `/bdns/{order}/ebdn` | `bdns.ebdn` |
| GET | `/barges/edit` | `barges.edit` |
| POST | `/barges` | `barges.store` |
| PATCH/PUT | `/barges/{barge}` | `barges.update` |
| DELETE | `/barges/{barge}` | `barges.destroy` |
| GET | `/agents` | `agents.index` |
| GET | `/agent-pics` | `agent-pics.index` |
| GET | `/surveyors/edit` | `surveyors.edit` |
| POST | `/surveyors` | `surveyors.store` |
| PATCH/PUT | `/surveyors/{surveyor}` | `surveyors.update` |
| DELETE | `/surveyors/{surveyor}` | `surveyors.destroy` |

Operations may need limited `orders.update` for operational fields only. If granted, enforce field-level validation in a dedicated request or policy branch.

### Surveyor

| Method | URI | Name |
| --- | --- | --- |
| GET | `/surveyor` | `surveyor` |
| PATCH | `/surveyor/{order}` | `surveyor.update` |
| PATCH | `/surveyor/{order}/complete` | `surveyor.complete` |
| PUT | `/surveyor/{order}/bdn` | `surveyor.bdn.update` |
| GET | `/bdns/{order}/ebdn` | `bdns.ebdn` |

Optional after confirmation:

| Method | URI | Name |
| --- | --- | --- |
| GET | `/bdns` | `bdns.index` |

### Finance

| Method | URI | Name |
| --- | --- | --- |
| GET | `/finance` | `finance` |
| POST | `/finance/{order}/payments` | `finance.payments.store` |
| PATCH | `/finance/{order}/close` | `finance.close` |
| GET | `/invoices` | `invoices.index` |
| PATCH/PUT | `/invoices/{order}` | `invoices.update` |
| GET | `/payments` | `payments.index` |
| PATCH/PUT | `/payments/{payment}` | `payments.update` |
| DELETE | `/payments/{payment}` | `payments.destroy` |
| GET | `/orders` | `orders` |
| GET | `/bdns` | `bdns.index` |
| GET | `/bdns/{order}/ebdn` | `bdns.ebdn` |
| GET | `/disputes` | `disputes` |
| GET | `/disputes/all` | `disputes.table` |

Finance should not update sales, operations, surveyor, or master-data records unless explicitly allowed later.

### Super Admin And Master Only

| Method | URI | Name |
| --- | --- | --- |
| GET | `/admin` | `admin` |
| GET | `/orders/all` | `orders.table` |
| PATCH | `/orders/all/{order}` | `orders.table.update` |
| GET | `/enquiries/edit` | `enquiries.edit` |
| POST | `/enquiries/edit` | `enquiries.edit.store` |
| PATCH | `/enquiries/edit/{enquiry}` | `enquiries.edit.update` |
| DELETE | `/enquiries/edit/{enquiry}` | `enquiries.edit.destroy` |
| GET | `/ports` | `ports.index` |
| POST | `/ports` | `ports.store` |
| PATCH/PUT | `/ports/{port}` | `ports.update` |
| DELETE | `/ports/{port}` | `ports.destroy` |
| POST | `/agents` | `agents.store` |
| PATCH/PUT | `/agents/{agent}` | `agents.update` |
| DELETE | `/agents/{agent}` | `agents.destroy` |
| POST | `/agent-pics` | `agent-pics.store` |
| PATCH/PUT | `/agent-pics/{agent_pic}` | `agent-pics.update` |
| DELETE | `/agent-pics/{agent_pic}` | `agent-pics.destroy` |

## Implementation Phases

### Phase 1: Confirm Existing Auth Baseline

1. Inspect:
   - `routes/web.php`
   - `routes/settings.php`
   - `app/Models/User.php`
   - `database/migrations/*users*`
   - existing auth pages under `resources/js/pages/auth`
   - existing settings pages under `resources/js/pages/settings`
   - existing auth tests under `tests/Feature/Auth`
2. Run:
   - `php artisan route:list --except-vendor`
   - `php artisan test --compact tests/Feature/Auth`
3. Record any pre-existing failures before changing files.

### Phase 2: User Identity Model

Target shape:

- Internal primary key: `users.id`, ULID string, generated by `HasUlids`.
- Human-facing editable ID: `users.user_id`, unique string, nullable only during transition if needed.
- Role: `users.type`, enum-backed.
- Status: active/inactive flag for deactivation.
- First-super-admin protection marker: deterministic rule based on the earliest super-admin user, not a mutable checkbox.

Implementation steps:

1. Update or migrate the users table depending on project state:
   - If this project has no production data, update the base users migration so `id` is a ULID primary key.
   - If data may already exist, create a forward migration that safely introduces ULID identity without data loss. Do not rewrite old migrations that may have run outside local development.
2. Add or confirm columns:
   - `id` ULID primary key.
   - `user_id` unique nullable/string initially, then required once seeded data is fixed.
   - `type` string enum value.
   - `is_active` boolean default true.
   - `deactivated_at` timestamp nullable.
3. Update `App\Models\User`:
   - Use `Illuminate\Database\Eloquent\Concerns\HasUlids`.
   - Ensure `$keyType = 'string'`.
   - Ensure `$incrementing = false`.
   - Keep `type` cast to `UserType::class`.
   - Cast `is_active` to boolean and `deactivated_at` to datetime.
   - Keep `user_id` fillable only through authorized user-management requests.
4. Ensure route model binding and relationships use internal `id`, not `user_id`.
5. Never expose internal `id` as an editable form field.

### Phase 3: Role Enum

Update `app/Enums/UserType.php` to include exactly:

- `SuperAdmin`
- `Master`
- `Sales`
- `Operations`
- `Surveyor`
- `Finance`

Rules:

- Enum values must remain stable lowercase strings matching the current app:
  - `super_admin`
  - `master`
  - `sales`
  - `operations`
  - `surveyor`
  - `finance`
- Add `label()` for UI display.
- Add helpers:
  - `isPrivileged(): bool` for `super_admin` and `master`.
  - `canManageUsers(): bool` for `super_admin` and `master`.
  - `canManageSuperAdmins(): bool` for `super_admin` only.

### Phase 4: Authorization Middleware

Create middleware similar to `EnsureUserHasRole`.

Behavior:

1. Reject unauthenticated users through existing auth middleware.
2. Reject inactive users with logout or 403 behavior.
3. Allow `super_admin` and `master` as privileged roles where explicitly configured.
4. Accept route middleware args:
   - `role:super_admin`
   - `role:super_admin,master`
   - `role:master`
   - `role:sales`
   - `role:operations`
   - `role:surveyor`
   - `role:finance`
5. Return 403 for unauthorized access.
6. Register middleware alias in `bootstrap/app.php`.

Do not rely on frontend navigation hiding for enforcement.

### Phase 5: Route Grouping

Refactor `routes/web.php` from one large `auth,verified` group into nested role groups.

Recommended shape:

```php
Route::middleware(['auth', 'verified', 'active'])->group(function () {
    Route::middleware('role:super_admin,master')->group(function () {
        // admin-section and user-management routes
    });

    Route::middleware('role:super_admin,master,sales')->group(function () {
        // sales routes
    });

    Route::middleware('role:super_admin,master,operations')->group(function () {
        // operations routes
    });

    Route::middleware('role:super_admin,master,surveyor')->group(function () {
        // surveyor routes
    });

    Route::middleware('role:super_admin,master,finance')->group(function () {
        // finance routes
    });
});
```

Avoid duplicate route definitions. If one route is shared by many roles, put all allowed roles in one middleware declaration.

### Phase 6: User Management

Add super-admin/master user-management screens and backend.

Suggested routes:

| Method | URI | Name | Roles |
| --- | --- | --- | --- |
| GET | `/users` | `users.index` | super_admin, master |
| POST | `/users` | `users.store` | super_admin, master |
| PATCH | `/users/{user}` | `users.update` | super_admin, master |
| PATCH | `/users/{user}/deactivate` | `users.deactivate` | super_admin, master |
| PATCH | `/users/{user}/activate` | `users.activate` | super_admin, master |
| DELETE | `/users/{user}` | `users.destroy` | super_admin, master |

Listing visibility:

- `super_admin` sees all users, including other `super_admin` users.
- `master` sees only non-`super_admin` users.
- `master` must receive 404 or 403 when trying to access a direct URL for a `super_admin` user.
- Do not send `super_admin` rows to the frontend for a `master` actor and hide them client-side. Filter at the query/policy layer.

Controller requirements:

1. Use Form Request classes:
   - `StoreUserRequest`
   - `UpdateUserRequest`
   - `DeactivateUserRequest` if needed.
2. Allow `super_admin` to set `user_id` for any user.
3. Allow `master` to set `user_id` for non-`super_admin` users.
4. Treat `user_id` as human-facing only:
   - unique
   - editable by super-admin/master according to the rules above
   - never used as primary key
   - never used for route model binding
5. Protect the first super admin:
   - cannot be deleted
   - cannot be deactivated
   - cannot have role changed away from super admin
6. Enforce super-admin assignment rules:
   - master cannot create a user with `type = super_admin`
   - master cannot update any user to `type = super_admin`
   - only `super_admin` may create or promote another `super_admin`
7. Enforce super-admin visibility rules:
   - user index query must exclude `super_admin` rows when the actor is `master`
   - policies must block `master` from viewing, editing, activating, deactivating, deleting, changing role, or changing `user_id` for any `super_admin`
   - frontend role options shown to `master` must not include `super_admin`
8. Prevent self-destruction:
   - users cannot delete themselves
   - super-admin and master users cannot deactivate themselves
   - first super admin cannot self-delete or self-deactivate under any path
9. Prefer deactivation over hard delete where audit/history matters.

First-super-admin detection:

```php
$firstSuperAdminId = User::where('type', UserType::SuperAdmin)
    ->orderBy('created_at')
    ->orderBy('id')
    ->value('id');
```

Use this rule in a policy or domain service. Do not trust a request flag.

### Phase 7: Policies And Gates

Create `UserPolicy` with:

- `viewAny(User $actor): bool`
- `create(User $actor): bool`
- `update(User $actor, User $target): bool`
- `delete(User $actor, User $target): bool`
- `deactivate(User $actor, User $target): bool`
- `activate(User $actor, User $target): bool`
- `changeRole(User $actor, User $target): bool`
- `changeUserId(User $actor, User $target): bool`

Policy rules:

- Super admin and master can manage users.
- Super admin can create or promote `super_admin` users.
- Master cannot create or promote `super_admin` users.
- Master cannot view/list `super_admin` users.
- Master cannot update, deactivate, activate, delete, role-change, or change `user_id` for `super_admin` users.
- Super admin can set `user_id` for any user.
- Master can set `user_id` for non-`super_admin` users.
- Nobody can delete/deactivate first super admin.
- Nobody can role-change first super admin away from super admin.
- Nobody can delete themselves.
- Inactive users cannot perform protected actions.

Use controller-level `$this->authorize(...)` or request `authorize()` methods. Keep policy checks close to the operation they protect.

### Phase 8: Frontend Integration

1. Update shared auth types in `resources/js/types/auth.ts`.
2. Ensure the shared Inertia auth payload includes:
   - internal `id` for identity display only if needed
   - `user_id`
   - `name`
   - `email`
   - `type`
   - `type_label`
   - `is_active`
3. Update navigation in `resources/js/lib/navigation.ts` to hide routes the user cannot access.
4. Keep frontend hiding as convenience only. Backend middleware and policies remain authoritative.
5. Add a user-management page under `resources/js/pages/users/index.tsx`.
6. Use Wayfinder route imports for all links/forms.
7. After adding routes/controllers, run Wayfinder generation if project convention requires generated files.

### Phase 9: Database Seeding

Update `database/seeders/DatabaseSeeder.php` or create a focused seeder.

Seeder requirements:

1. Create first super admin with:
   - internal ULID id
   - `user_id`, for example `SUPER-ADMIN-001`
   - `type = super_admin`
   - active status
2. Create optional demo users for:
   - master
   - sales
   - operations
   - surveyor
   - finance
3. Never create more than one first-super-admin candidate.
4. Seeder must be idempotent.

### Phase 10: Tests

Use Pest tests. Add or update tests before considering the work complete.

Required tests:

1. `UserIdentityTest`
   - users receive ULID primary keys
   - `user_id` is unique
   - `user_id` can change without changing internal id
2. `RoleMiddlewareTest`
   - guests redirect/are rejected
   - inactive users are rejected
   - each role can access only its route set
   - super admin and master can access privileged routes
3. `UserManagementControllerTest`
   - super admin can create users
   - master can create users
   - super admin can create or promote another `super_admin`
   - master cannot create a `super_admin`
   - master cannot promote any user to `super_admin`
   - master cannot see `super_admin` users in `/users`
   - master cannot access direct URLs/actions for `super_admin` users
   - super admin can set `user_id`
   - master can set `user_id` for non-`super_admin` users
   - unauthorized roles cannot create users
   - first super admin cannot be deleted
   - first super admin cannot be deactivated
   - first super admin cannot be role-changed away from super admin
   - user cannot delete self
4. Existing feature tests
   - update existing controller tests to authenticate as a role allowed for the route under test
   - add forbidden assertions for at least one disallowed role per route group
5. Frontend/type checks
   - run TypeScript checks after updating auth types and navigation.

Recommended route authorization dataset:

- Super-admin/master route sample: `/admin`, `/orders/all`, `/ports`
- Sales route sample: `/sales-dashboard`, `/enquiries`, `/credit-management`
- Operations route sample: `/operations`, `/barges/edit`
- Surveyor route sample: `/surveyor`
- Finance route sample: `/finance`, `/invoices`, `/payments`

### Phase 11: Verification Commands

Run the minimum relevant commands as the implementation progresses:

```bash
php artisan test --compact tests/Feature/Auth
php artisan test --compact --filter=RoleMiddlewareTest
php artisan test --compact --filter=UserManagementControllerTest
php artisan test --compact
vendor/bin/pint --dirty --format agent
npm run types:check
```

If generated Wayfinder route files change, verify the generated output is committed/kept with the frontend code.

### Phase 12: Rollout Notes

1. Introduce authorization middleware after tests are ready, otherwise most existing feature tests will fail at once.
2. Convert existing tests by authenticating as the smallest allowed role for each route.
3. Keep user deletion conservative:
   - prefer deactivate for accounts with historical records
   - hard delete only when there are no dependent records or policy permits it
4. Add a clear inactive-account experience:
   - logout and redirect with message, or
   - 403 page
5. Document the final role matrix in this file whenever route access changes.

## Acceptance Criteria

- User internal IDs are ULIDs generated by Laravel `HasUlids`.
- `user_id` exists, is unique, and is editable by super-admin/master without changing internal identity.
- First super admin cannot be deleted, deactivated, or role-changed away from super admin.
- Master cannot create or promote any user to `super_admin`.
- Master cannot view/list or manage `super_admin` users.
- Backend authorization blocks disallowed roles for every route group.
- Navigation only shows routes available to the current user.
- User-management UI works for super-admin/master.
- Existing business workflow tests authenticate with valid roles and pass.
- New auth/authorization tests cover role access, inactive users, first-super-admin protection, super-admin assignment restrictions, and user ID behavior.
- `php artisan test --compact` passes.
- `vendor/bin/pint --dirty --format agent` has been run after PHP changes.
- `npm run types:check` passes after frontend changes.
