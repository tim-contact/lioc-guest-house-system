# Guest dietary preferences

Staff can enter an optional dietary preference and notes in the Additional section of the guest form. Suggestions include vegetarian, non-vegetarian and Jain; staff can enter another preference. The values belong to the guest profile and are visible in guest details and reservation guest lists. They are not meal orders and do not create daily kitchen counts or charges.

The preference is limited to 100 characters and notes to 1,000. Empty values clear the corresponding field. Older form submissions that omit these fields leave saved values intact. Guest access follows the existing customer and reservation permissions.

Dietary values are redacted in entity audit records. The customer GDPR PDF export adds them even when its editable template predates these fields. Template authors can also use `customer.dietaryPreference` and `customer.dietaryNotes`; existing custom GDPR templates that already include them may show them twice.
