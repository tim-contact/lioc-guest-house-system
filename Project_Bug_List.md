# Project Bug List

1. **Port to Supply Location relationship is pending deployment and data verification.**
   The application previously did not maintain supply locations as records under each port. This can affect enquiry and order accuracy because users may select or enter inconsistent supply locations for the same port.

2. **Legacy free-text supply location fields still exist in enquiries, orders, and BDNs.**
   Some older database fields still store supply location as plain text. This can cause mismatch between old records and the new supply location table if historical data is not migrated properly.

3. **Surveyor to barge relationship supports only one assigned barge.**
   A surveyor can currently be linked to only one barge. This may affect operations when one surveyor needs to handle multiple barges or when barge assignments change during active deliveries.

4. **Unassigned surveyor users may be able to view all BDN records.**
   If a surveyor account is not correctly linked to a barge, the BDN listing may not be restricted correctly. This can expose delivery records that the surveyor should not access.

5. **Surveyor actions may fail incorrectly when an order has no assigned barge.**
   Some surveyor workflows expect every order to already have a barge. If the barge is missing, the system may show an error instead of giving a clear message or blocking the action properly.

6. **Rolling back erroneous inputs is not currently supported.**
   When users enter incorrect values, the system overwrites the existing data without keeping a proper edit history. This makes it difficult to trace who changed data, restore previous values, or audit mistakes.

7. **Agents, surveyors, and customers do not fully support multiple phone numbers and email addresses.**
   Contact details are mostly stored as single text fields. This may cause incomplete contact records when a company or person has multiple emails, mobile numbers, billing emails, or operational contacts.
   (testing still goes with the single text fields, seperating values by semi-colons or commas)

8. **Payments are linked by order number instead of order ID.**
   Payments are connected to orders using the order number, which can be edited. If an order number changes, payment records may become inconsistent or prevent the order from being updated. causes database errors when editing an order number after payments are recorded

9. **Some relationships rely on application validation instead of database constraints.**
The frontend and backend validation prevent most invalid selections during normal use. However, because some relationships are not enforced at the database level, invalid or orphaned records can still be created through imports, direct database edits, 

