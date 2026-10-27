# Lanka IOC Guest House Management Implementation Plan

## 1. Purpose

This plan describes how to introduce FewohBee for two Lanka IOC guest houses in three controlled phases:

1. Configure and validate the capabilities already present in FewohBee.
2. Build the missing operational modules and reports.
3. Improve and brand the user interface after the workflows are stable.

The requirements source is `LIOC GH Details.xlsx`. The workbook currently contains detailed property and room information only for **Lanka IOC Guest House Colombo 03**. Configuration of the second guest house cannot be completed until its details are supplied.

## 2. Delivery principles

- Do not customize a feature until the equivalent existing FewohBee capability has been configured and tested.
- Represent both guest houses as FewohBee subsidiaries and keep operational records linked to a subsidiary.
- Avoid storing structured information only in remarks when it must later be filtered or reported.
- Use English for the Lanka IOC deployment while preserving the project's required English and German translations for new features.
- Protect guest information as personal data and do not place personal details in application logs.
- Test every phase with designated Lanka IOC users before proceeding to the next phase.
- Do not add new functionality to the legacy registration-book module.

## 3. Scope summary

### Existing capabilities to configure

- Multiple guest houses through subsidiaries
- Room categories, rooms, capacity and amenities
- Customer and guest records
- Reservations, availability, room blocks and reservation statuses
- Arrival and departure times
- Adult and child guest counts
- Front-desk and current-occupancy views
- Housekeeping status, assignment and notes
- Email correspondence and automated workflows
- PDF templates and invoices
- Users and functional roles
- Basic operations and statistics reports

### Capabilities requiring development

- Internal accommodation request and approval workflow
- Structured designation, nationality, dietary and arrival-meal fields
- Accommodation eligibility rules for guest categories
- Daily meal ordering, fulfilment, charges and collections
- Inventory purchases, issues, balances and low-stock alerts
- Laundry dispatch and receipt register
- Utility and operational expense allocation by guest house
- Detailed housekeeping checklist
- Fine-grained, property-scoped user permissions
- Missing management and finance reports
- Sri Lankan invoice and bank-account compatibility

## 4. Phase 0 — Preparation and missing information

Complete these items before changing production configuration.

### 4.1 Confirm the deployment environment

- [ ] Confirm whether the application runs through Docker, DDEV or native PHP.
- [ ] Confirm the production URL and HTTPS certificate.
- [ ] Confirm the database backup and restore procedure.
- [ ] Confirm outgoing SMTP server details.
- [ ] Configure scheduled jobs for calendar sync, workflows and log retention.
- [ ] Confirm the server/PHP timezone is `Asia/Colombo`.
- [ ] Confirm English as the deployment locale.

### 4.2 Collect missing guest-house data

- [ ] Name of the second guest house
- [ ] Full address and telephone number
- [ ] Person in charge and facilities manager
- [ ] Room numbers and capacities
- [ ] Room amenities
- [ ] Permanently assigned rooms and occupants
- [ ] Meal prices if different from Colombo 03
- [ ] Laundry provider if different from Colombo 03
- [ ] Utility and expense categories if different from Colombo 03
- [ ] Which manager may access each property

### 4.3 Collect user information

For each user listed in the workbook, collect:

- [ ] Full name
- [ ] Unique username
- [ ] Work email address
- [ ] Initial password delivery method
- [ ] Required role or roles
- [ ] Guest-house access scope
- [ ] Whether passkey login will be enabled

### 4.4 Confirm business rules

- [ ] Identify who can submit an accommodation request.
- [ ] Identify the primary and backup approvers.
- [ ] Decide whether requested rooms block availability before approval.
- [ ] Define cancellation and extension approval rules.
- [ ] Confirm whether permanently assigned rooms can ever be released.
- [ ] Clarify the restriction for touring officers, drivers and support staff.
- [ ] Confirm whether meal charges are paid by the guest, department or company.
- [ ] Confirm whether invoices are tax invoices and obtain Sri Lankan tax requirements.
- [ ] Confirm stock locations: central office, each guest house, or both.

### Phase 0 exit criteria

- [ ] A restorable database backup exists.
- [ ] All second-guest-house details have been supplied.
- [ ] User emails and role decisions are complete.
- [ ] Approval, billing and stock ownership rules are documented.

## 5. Phase 1 — Configure the existing system

Phase 1 uses existing functionality only. Any temporary workaround must be labelled and must not be mistaken for the final module.

### Step 1 — Establish a safe configuration baseline

1. Back up the database and uploaded files.
2. Confirm all migrations are applied.
3. Confirm production asset compilation is working.
4. Confirm scheduled commands are installed.
5. Create one administrator account for configuration and recovery.
6. Record configuration decisions without recording passwords or secrets.

Validation:

- [ ] Administrator can sign in.
- [ ] Application loads without production errors.
- [ ] Backup restoration procedure has been checked.
- [ ] Scheduled workflow command is running.

### Step 2 — Configure global application settings

Open **Settings → General** (`/settings/general`) and configure:

- [ ] Currency code: `LKR`
- [ ] Currency symbol: `Rs` or the approved Lanka IOC display form
- [ ] Invoice PDF filename pattern
- [ ] Default invoice number pattern
- [ ] Customer salutations
- [ ] Notification email
- [ ] Mail sender name and address
- [ ] SMTP host, port, encryption, username and password
- [ ] Return-path and mail-copy preference

Run the SMTP test after saving.

Validation:

- [ ] Currency is displayed correctly on prices and invoices.
- [ ] SMTP test reaches an approved internal mailbox.
- [ ] Credentials are stored through application settings and are not committed to Git.

### Step 3 — Create the two guest houses

Open **Settings → Subsidiaries/Objects** (`/settings/objects`).

Create the first subsidiary:

- Name: `Lanka IOC Guest House Colombo 03`
- Description: operational address and public contact summary
- Invoice number pattern: set only if this guest house needs a separate number range

Create the second subsidiary using the information collected in Phase 0.

Notes:

- The subsidiary description is free text, not a structured property profile.
- Structured issuer address and contact fields are configured separately in invoice settings.

Validation:

- [ ] Both properties appear in room, housekeeping, front-desk and report filters.
- [ ] Their names are unambiguous in all dropdowns.

### Step 4 — Configure room categories and amenities

Open **Settings → Room categories** (`/settings/category`).

Create at least:

- [ ] `Double Room`, normal capacity 2
- [ ] `Single Room`, normal capacity 1

Assign the available amenities that match the workbook:

- [ ] Private bathroom
- [ ] Air conditioning
- [ ] Wi-Fi
- [ ] Television
- [ ] Kettle
- [ ] Tea/coffee facility where represented by the existing amenity catalogue

Use category details for explanatory text. Do not create duplicate categories unless their capacity, amenities or pricing genuinely differ.

Validation:

- [ ] Category names and amenities display correctly.
- [ ] No Lanka IOC-specific assumption is hardcoded into the application.

### Step 5 — Create Colombo 03 rooms

Open **Settings → Apartments/Rooms** (`/settings/apartments`).

Create:

| Room | Capacity | Category | Initial use |
|---|---:|---|---|
| 01 | 2 | Double Room | Permanently assigned |
| 02 | 2 | Double Room | General allocation |
| 03 | 2 | Double Room | Permanently assigned |
| 04 | 1 | Single Room | General allocation |

For every room:

- [ ] Assign `Lanka IOC Guest House Colombo 03` as the subsidiary.
- [ ] Keep the room active.
- [ ] Leave multiple occupancy disabled unless separate unrelated bookings may share one physical room.
- [ ] Enter a short, useful room description.

Repeat this step for the second guest house after its room details are supplied.

Validation:

- [ ] All rooms appear under the correct property.
- [ ] Capacity validation prevents overbooking.
- [ ] Availability and housekeeping views show the correct room set.

### Step 6 — Configure guest categories

Open **Settings → Guest categories** (`/settings/guest-category`).

Configure categories used for occupancy and pricing, initially:

- [ ] Adult
- [ ] Child

Do not use pricing guest categories to represent corporate eligibility categories such as touring officer, driver or support staff. That restriction requires a separate feature in Phase 2.

Validation:

- [ ] Adult and child counts sum correctly to room occupancy.
- [ ] Capacity rules work for both single and double rooms.

### Step 7 — Configure reservation statuses

Open **Settings → Reservation statuses** (`/settings/status`).

Recommended initial statuses:

| Status | Blocks room | Purpose |
|---|---:|---|
| Requested | No | Request received but not approved |
| Awaiting approval | No | Awaiting VP or delegated approval |
| Approved / Confirmed | Yes | Approved booking with allocated room |
| Checked in | Yes | Guest currently resident |
| Checked out | No | Completed stay |
| Cancelled | No | Cancelled request or booking |

This status configuration provides visibility only. It does not enforce approval authority or record who approved a request.

Validation:

- [ ] Only approved and checked-in reservations block availability.
- [ ] Cancelled and checked-out reservations do not block rooms.
- [ ] Status colours are easy to distinguish.

### Step 8 — Configure reservation origins

Open **Settings → Reservation origins** (`/settings/reservationorigin`).

Create:

- [ ] HOD request
- [ ] Managing Director request
- [ ] Admin entry
- [ ] Other approved source, if required

Origins indicate where a request came from; they do not constitute approval.

### Step 9 — Create permanent occupant records

Create customer records for the current expatriate officers and record available contact information.

Then create long-running reservations for Rooms 01 and 03:

- [ ] Use an approved/confirmed blocking status.
- [ ] Record the actual start date.
- [ ] Use an agreed review date as the end date.
- [ ] Set an internal calendar reminder to renew or close the reservation.
- [ ] Add the designation and nationality temporarily to the customer or reservation remark, clearly labelled as a temporary workaround.

A reservation is preferable to a room block here because named occupants then appear in front-desk, occupancy and meal-checklist views.

Validation:

- [ ] Rooms 01 and 03 are unavailable for conflicting reservations.
- [ ] Both occupants appear in the current-occupancy view.
- [ ] Their personal data is visible only to authorized roles.

### Step 10 — Configure reservation pricing and temporary meal extras

Open **Settings → Prices** (`/settings/prices`).

Configure accommodation pricing if Lanka IOC needs room charges. If lodging itself is not charged, confirm how zero-value accommodation should appear on invoices.

The following may be created as temporary optional price extras for billing only:

| Extra | Price per person |
|---|---:|
| Breakfast | LKR 800 |
| Lunch — vegetarian | LKR 1,500 |
| Lunch — non-vegetarian | LKR 1,750 |
| Dinner — vegetarian | LKR 1,500 |
| Dinner — non-vegetarian | LKR 1,750 |
| Plain tea/coffee | LKR 80 |
| Milk tea/coffee | LKR 100 |

Limitations of this workaround:

- It does not identify a meal date or service period.
- It does not track prepared, served or collected quantities.
- It does not capture Jain or other dietary requirements.
- It must not be treated as the final meal-management module.

Validation:

- [ ] A test reservation can include a selected meal extra.
- [ ] The extra appears correctly on a draft invoice.
- [ ] Calculations use LKR and the intended per-person basis.

### Step 11 — Configure invoice issuer data

Open **Invoices → Settings** (`/invoices/settings`).

Create a default issuer or one issuer per subsidiary, depending on the accounting decision. Configure:

- [ ] Company name and registration details
- [ ] Address and country
- [ ] Contact name, department, telephone and email
- [ ] Invoice email
- [ ] Payment terms
- [ ] Invoice number range
- [ ] Lanka IOC logo in the invoice PDF template

Known blocker:

FewohBee currently requires a valid IBAN in invoice settings. Sri Lankan domestic accounts generally do not use IBAN. Do not enter fabricated banking information. Either use a legitimately available valid IBAN or defer production invoice activation until the Sri Lankan invoice adaptation in Phase 2.

Validation:

- [ ] Draft PDF shows the correct company, property, guest and logo.
- [ ] No German/EU-only wording appears in the customer-facing PDF unless legally required.
- [ ] Finance approves the sample invoice before production use.

### Step 12 — Configure customer and reservation email templates

Open **Settings → Templates** (`/settings/templates`).

Create or adapt:

- [ ] Reservation received email
- [ ] Reservation approved/confirmed email
- [ ] Reservation changed email
- [ ] Reservation cancelled email
- [ ] Arrival information email
- [ ] Invoice PDF template
- [ ] Invoice email template

Confirmation content should include:

- Guest name
- Guest house and room
- Arrival and departure date/time
- Guest-house address and telephone
- Contact person
- Approved meal information only where reliable
- Cancellation/contact instructions

Preview every template with test data before enabling automation.

### Step 13 — Configure safe email workflows

Open **Settings → Workflows** (`/settings/workflows`).

Recommended initial workflows:

1. Reservation created → notify the central administration mailbox.
2. Reservation status changed to Approved/Confirmed → send the confirmation template to the booker.
3. Reservation changed → notify administration for manual review.
4. Selected number of days before arrival → send arrival information to the booker.

Start with workflows disabled, use the preview, then enable them one at a time.

Validation:

- [ ] Emails are sent only when the booker has a valid email address.
- [ ] A status change does not send duplicate confirmation messages.
- [ ] Workflow logs show success or a clear skipped reason.
- [ ] Test messages contain no data belonging to another guest.

### Step 14 — Create users and assign existing roles

Open **Settings → Users** (`/settings/users`).

Initial role mapping:

| Workbook group | Initial FewohBee roles | Limitation |
|---|---|---|
| Admin Division | `ROLE_ADMIN` | Grants all major application permissions, including settings |
| Guest House Manager | `ROLE_OPERATIONS`, `ROLE_RESERVATIONS` | Not restricted to one property |
| Finance Staff | `ROLE_INVOICES`, `ROLE_CASHJOURNAL` as required | Cannot be limited to meal collections |

Apply least privilege. Do not assign `ROLE_ADMIN` merely to provide access to one operational report.

Validation:

- [ ] Each test user sees only the intended functional sections.
- [ ] Read-only users cannot mutate reservations.
- [ ] Finance cannot access settings unless explicitly authorized.
- [ ] The lack of property-level access is recorded for Phase 2.

### Step 15 — Configure housekeeping operations

Use **Operations → Housekeeping** to validate:

- [ ] Daily room status
- [ ] Assigned employee
- [ ] Notes
- [ ] Property filter
- [ ] Occupancy filter
- [ ] Reservation-status filter
- [ ] Daily and weekly exports

Until the detailed checklist is developed, use a standard note format only as a temporary measure:

`Linen: yes/no; Bathroom: yes/no; Floor: yes/no; Curtain last cleaned: YYYY-MM-DD`

### Step 16 — Validate existing reports

Validate the following available views and PDFs for each guest house separately and for all properties:

- [ ] Current occupancy/in-house guests
- [ ] Arrivals
- [ ] Departures
- [ ] Room availability/calendar
- [ ] Housekeeping day view
- [ ] Housekeeping week view
- [ ] Front-desk checklist
- [ ] Room list
- [ ] Basic meals checklist
- [ ] Monthly occupancy statistics

Record the workbook reports that remain unavailable:

- Inventory balance
- Low-stock items
- Monthly purchasing cost
- Food cost
- Cleaning and laundry cost
- Cost per guest house
- Laundry register
- Monthly expense report by guest house
- Meal collection report
- Data-driven daily meal count

### Step 17 — Phase 1 user acceptance test

Run an end-to-end scenario in a safe test environment:

1. Create a request reservation.
2. Change it to approved and allocate a room.
3. Send the confirmation email.
4. Verify room availability changed.
5. Check the guest into the operational view.
6. Assign and update housekeeping.
7. Add a temporary meal extra.
8. Generate a draft invoice PDF.
9. Verify arrival, occupancy and housekeeping reports.
10. Cancel a second test reservation and confirm that the room becomes available.

### Phase 1 exit criteria

- [ ] Both guest houses and all rooms are configured.
- [ ] Current permanent occupants are represented correctly.
- [ ] Users can sign in with least-privilege roles.
- [ ] Reservation confirmation email works.
- [ ] Front-desk and housekeeping teams approve the baseline workflow.
- [ ] Finance approves or formally defers invoice use due to the IBAN issue.
- [ ] Every limitation and temporary workaround has an owner.
- [ ] A production backup is taken after approved configuration.

## 6. Phase 2 — Build required modules

Each work package must include database migrations, authorization, validation, English and German translations, unit tests, functional tests and documentation.

### Work package 2.1 — Property-scoped authorization foundation

Goal: ensure users can be restricted to one or both guest houses before new sensitive modules are introduced.

Deliverables:

- User-to-subsidiary access assignments
- Voters or equivalent centralized authorization checks
- Property filtering in reservations, customers, operations and reports
- Explicit cross-property access for authorized administration users
- IDOR regression tests

Acceptance criteria:

- A manager assigned only to Guest House A cannot view or modify Guest House B data.
- Central administrators can work across both guest houses.
- API access follows the same property restrictions.

### Work package 2.2 — Accommodation request and approval

Deliverables:

- Accommodation request entity or clearly separated request state
- Requester/HOD and department
- Approver and approval timestamps
- Approval, rejection and cancellation notes
- Requested room or room type
- Auditable status transitions
- Approval notifications
- Room allocation after approval
- Extension and cancellation workflow
- Printable booking request form

Acceptance criteria:

- Only authorized approvers can approve or reject.
- The audit history identifies who performed each decision.
- Unapproved requests follow the agreed availability-blocking rule.
- Approved requests become normal reservations without duplicated data.

### Work package 2.3 — Guest profile extensions and eligibility

Deliverables:

- Designation
- Nationality distinct from postal address country
- Dietary preference with an extensible option set
- WhatsApp-capable contact flag or normalized contact channel
- Corporate guest category/eligibility classification
- Configurable eligibility validation for additional accommodation
- GDPR export coverage for all new personal fields

Acceptance criteria:

- Touring officers, drivers and support staff follow the approved accommodation policy.
- Overrides require an authorized user and an audit reason.
- New personal fields are not written to logs.

### Work package 2.4 — Meals management

Deliverables:

- Configurable meal types, service windows and prices
- Meal request linked to reservation, guest, room, date and subsidiary
- Vegetarian, non-vegetarian, Jain and configurable dietary choices
- Quantities and per-person calculation
- Prepared/served/collected/cancelled lifecycle
- Invoice integration
- Daily kitchen count
- Meal-count sheet
- Meal collection report
- Duplicate and date-range validation

Acceptance criteria:

- Kitchen totals agree with active meal requests.
- Meal charges agree with invoice positions.
- Cancelled meals are excluded according to the agreed cutoff rule.
- Reports can be filtered by guest house and period.

### Work package 2.5 — Inventory and purchasing

Deliverables:

- Item catalogue and categories
- Consumable/non-consumable classification
- Units of measure
- Stock locations for office and each guest house
- Purchase receipt transactions
- Stock issue/usage transactions
- Adjustments with reason and audit user
- Current stock balance
- Reorder level and low/out-of-stock status
- Supplier information where required
- Monthly purchase-cost report

Acceptance criteria:

- Stock is calculated from immutable movements rather than an editable balance.
- Negative stock follows an explicitly approved rule.
- Low-stock results are location-specific.
- Every adjustment is auditable.

### Work package 2.6 — Laundry, utilities and operating costs

Deliverables:

- Laundry service providers
- Laundry batches with sent and received dates
- Item-level sent and received quantities
- Missing/damaged quantity handling
- Laundry charge and invoice/reference
- Configurable utility and operating-expense categories
- Expense amount, billing period, supplier and guest house
- Optional attachment through existing storage services
- Cost allocation by guest house

Acceptance criteria:

- Outstanding laundry is visible until received or resolved.
- Costs can be summarized by category, month and guest house.
- Financial records link to the booking journal where appropriate without duplicating accounting logic.

### Work package 2.7 — Detailed housekeeping checklist

Deliverables:

- Configurable checklist definitions
- Room-day checklist responses
- Linen replacement
- Bathroom cleaning
- Floor cleaning
- Curtain cleaning date
- Assignee and inspector sign-off
- Notes and exception reporting
- Mobile-friendly update flow

Acceptance criteria:

- Checklist completion and overall room status cannot silently contradict each other.
- Historical entries retain the checklist definition used on that date.
- Reports show incomplete and overdue tasks by property.

### Work package 2.8 — Sri Lankan invoice compatibility

Deliverables:

- Country-appropriate bank account fields without mandatory IBAN
- Configurable Sri Lankan tax/registration labels
- Lanka IOC-approved invoice wording and numbering
- LKR formatting verification
- Separation of optional European e-invoice fields from normal PDF invoicing

Acceptance criteria:

- Finance approves a representative invoice.
- No fabricated IBAN or European identifier is required.
- Existing EN 16931/XRechnung users remain compatible.

### Work package 2.9 — Required reports and dashboards

Deliver reports from authoritative module data:

- [ ] Current occupancy
- [ ] Available rooms
- [ ] Expected arrivals and departures
- [ ] Daily meal count
- [ ] Inventory balance
- [ ] Low-stock items
- [ ] Monthly purchasing cost
- [ ] Food cost
- [ ] Cleaning and laundry cost
- [ ] Cost per guest house
- [ ] Housekeeping status
- [ ] Booking request form
- [ ] Meal-count sheet
- [ ] Room list
- [ ] Current occupant list
- [ ] Laundry register
- [ ] Monthly expense report
- [ ] Meal collection report

Every report must support the relevant date and guest-house filters, PDF or CSV export where appropriate, and role/property authorization.

### Phase 2 exit criteria

- [ ] All workbook requirements have an implemented source of truth.
- [ ] No final report depends on free-text remarks for structured data.
- [ ] Property-scoped authorization tests pass.
- [ ] Unit tests pass.
- [ ] Functional tests pass through `bin/run-tests.sh`.
- [ ] PHPStan level 6 passes.
- [ ] English and German translation keys match.
- [ ] Data migrations have reviewed `up()` and `down()` paths.
- [ ] Operations, finance and administration approve the workflows.

## 7. Phase 3 — UI and branding enhancement

Begin this phase only after Phase 2 workflows and data structures are stable.

### Work package 3.1 — Branding foundation

- [ ] Lanka IOC logo variants for light and dark backgrounds
- [ ] Login-page branding
- [ ] Application header and favicon
- [ ] Approved corporate colours represented through reusable CSS variables
- [ ] Branded PDF and email templates
- [ ] Remove obsolete FewohBee-facing brand references where legally and operationally appropriate
- [ ] Keep upstream licence and attribution requirements intact

### Work package 3.2 — Role-focused dashboards

Admin dashboard:

- Occupancy and availability
- Arrivals/departures
- Meal totals
- Stock alerts
- Monthly costs
- Approval queue

Guest-house manager dashboard:

- Today's arrivals/departures
- Current guests
- Meal tasks
- Housekeeping status
- Low stock
- Outstanding laundry

Finance dashboard:

- Meal collections
- Invoices and payment status
- Monthly expenses
- Cost by guest house and category

### Work package 3.3 — Workflow-oriented screens

- Simplified accommodation request form
- Approval inbox
- Fast room allocation
- Daily meal grid
- Stock receive/issue screens
- Laundry send/receive screen
- Mobile housekeeping checklist
- Report centre organized by operational responsibility

### Work package 3.4 — Usability and accessibility

- [ ] Responsive layouts for desktop, tablet and phone
- [ ] Keyboard navigation
- [ ] Clear validation and recovery messages
- [ ] Accessible colour contrast and status indicators
- [ ] Consistent Bootstrap components
- [ ] No inline JavaScript; use Stimulus controllers
- [ ] Turbo-compatible page behaviour
- [ ] User testing with representatives from all three workbook user groups

### Phase 3 exit criteria

- [ ] Lanka IOC branding is consistent across login, application, email and PDF output.
- [ ] Each user group can complete its main daily tasks without unnecessary navigation.
- [ ] Responsive and accessibility checks pass.
- [ ] Existing security and functional tests remain green.

## 8. Suggested delivery milestones

| Milestone | Outcome |
|---|---|
| M0 — Decisions complete | Missing property, user and business-rule information collected |
| M1 — PMS baseline | Two properties, rooms, users, reservations, email and housekeeping configured |
| M2 — Controlled booking | Property permissions and request approval implemented |
| M3 — Guest services | Guest extensions and meal management implemented |
| M4 — Facilities operations | Inventory, laundry, utilities and detailed housekeeping implemented |
| M5 — Management information | All required reports implemented and reconciled |
| M6 — Lanka IOC experience | Branded, role-focused and responsive UI delivered |

## 9. Change-control checklist for every development work package

- [ ] Requirement and acceptance criteria approved before coding
- [ ] Existing service/repository patterns reviewed
- [ ] Controller kept thin
- [ ] Authorization and property ownership enforced
- [ ] CSRF and input validation included
- [ ] Personal data excluded from logs
- [ ] Database migration reviewed for live data safety
- [ ] English and German translations completed together
- [ ] Unit and functional tests added
- [ ] PHPStan passes without suppression
- [ ] User documentation updated
- [ ] Deployment and rollback steps documented
- [ ] User acceptance test signed off

## 10. Immediate next action

Start Phase 0 and Phase 1 interactively. The first working session should:

1. Confirm the deployment method and backup procedure.
2. Inspect the current database configuration without exposing secrets.
3. Confirm the existing administrator account.
4. Set the global locale, timezone, LKR and SMTP settings.
5. Create and verify the two subsidiary records, stopping for the missing second-property details if they have not yet been supplied.

