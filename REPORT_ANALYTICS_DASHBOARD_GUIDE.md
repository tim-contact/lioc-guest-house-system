# Report Analytics Dashboard Guide

This guide explains the KPI cards, charts, and formulas used in the Report Analytics dashboard.

Dashboard route: `/reports/analytics`

Access: Admin section users who can access the `super_admin` or `master` role group.

Data source: the dashboard reads from existing `enquiries` and `orders` records. It does not create, update, or delete business data.

## Main Purpose

The dashboard is designed to answer four business questions:

1. How many enquiries are entering the business?
2. How many enquiries are converting into orders?
3. How many orders are reaching completion?
4. Which statuses, ports, products, and customers are driving activity and value?

## KPI Cards

### Enquiries

What it shows: the total number of enquiry records in the system.

Formula:

```text
Enquiries = count(all enquiries)
```

How to explain it: this is the top of the commercial pipeline. Every potential bunkering request starts here.

### Orders

What it shows: the total number of order records in the system.

Formula:

```text
Orders = count(all orders)
```

How to explain it: this shows how many enquiries or customer requests have progressed into confirmed operational work.

### Completed

What it shows: the number of orders considered completed for this dashboard.

Completed statuses used:

```text
Delivered
Closed
```

Formula:

```text
Completed = count(orders where status is Delivered or Closed)
```

How to explain it: these are orders that have passed the active execution stage and are treated as completed deliveries or closed business cases.

### Conversion

What it shows: the percentage of enquiries that became orders.

Formula:

```text
Conversion Rate = (Orders / Enquiries) * 100
```

If there are no enquiries:

```text
Conversion Rate = 0
```

Rounding: one decimal place.

Example:

```text
Enquiries = 100
Orders = 35
Conversion Rate = 35.0%
```

How to explain it: this measures sales pipeline effectiveness. A higher percentage means more enquiries are being converted into confirmed orders.

### Received

What it shows: the total payment amount received across all orders.

Formula:

```text
Received = sum(order.amount_received)
```

Rounding: two decimal places.

How to explain it: this indicates how much money has already been collected against orders.

### Outstanding

What it shows: the total unpaid balance across all orders.

Formula:

```text
Outstanding = sum(max(order.balance_amount, 0))
```

Rounding: two decimal places.

Important note: negative balances are treated as zero in this KPI so overpayments do not reduce the total outstanding amount.

How to explain it: this is the amount still to be collected. It is useful for finance follow-up and credit control.

## Header Completion Rate

What it shows: the percentage of orders that reached a completed state.

Formula:

```text
Completion Rate = (Completed Orders / Orders) * 100
```

If there are no orders:

```text
Completion Rate = 0
```

Rounding: one decimal place.

How to explain it: this measures how much of the order book has moved through to delivered or closed status.

## Graphs And Visualizations

### Enquiry Conversion Funnel

Chart type: funnel chart.

Stages shown:

```text
Enquiries -> Orders -> Completed
```

Stage formulas:

```text
Enquiries = count(all enquiries)
Orders = count(all orders)
Completed = count(orders where status is Delivered or Closed)
```

Percentage logic: the first funnel stage is treated as 100%. Later stages are shown as a percentage of the first stage.

```text
Orders Funnel Percentage = (Orders / Enquiries) * 100
Completed Funnel Percentage = (Completed / Enquiries) * 100
```

How to explain it: the funnel shows pipeline drop-off. It starts with all enquiries, narrows to confirmed orders, then narrows again to completed orders.

Business interpretation:

- A large drop from Enquiries to Orders may indicate pricing, availability, customer follow-up, or credit approval issues.
- A large drop from Orders to Completed may indicate operational delays, cancelled work, or pending deliveries.

### Order Status Breakdown

Chart type: horizontal progress-bar breakdown.

Statuses shown:

```text
Pending
Delivered
Cancelled
Closed
```

Formula for each status:

```text
Status Count = count(orders where order.status = selected status)
```

Bar width formula:

```text
Bar Width = (Status Count / Highest Status Count) * 100
```

How to explain it: this shows where orders currently sit in the process. It helps identify whether the pipeline is mostly pending, completed, cancelled, or closed.

### Six-Month Trend

Chart type: grouped vertical bar chart.

Time range: current month plus the previous five months.

Series shown per month:

```text
Enquiries
Orders
Completed
```

Monthly enquiry formula:

```text
Monthly Enquiries = count(enquiries where enquiry.created_at is in that month)
```

Monthly order formula:

```text
Monthly Orders = count(orders where order.order_date is in that month)
```

Monthly completed formula:

```text
Monthly Completed = count(orders where order.order_date is in that month and status is Delivered or Closed)
```

Bar height formula:

```text
Bar Height = (Monthly Value / Highest Value In Six-Month Chart) * 100
```

How to explain it: this chart shows whether pipeline activity is increasing, stable, or slowing down over the last six months.

Business interpretation:

- Enquiries rising while orders stay flat can indicate weak conversion.
- Orders rising while completed stays flat can indicate operational backlog.
- Completed rising with orders indicates healthy throughput.

### Top Ports

Chart type: ranked horizontal progress-bar breakdown.

Formula:

```text
Top Ports = group orders by port name
Port Value = count(orders for that port)
```

Sorting:

```text
Sort by Port Value descending
Show top 5
```

Fallback label:

```text
If an order has no port, it is grouped as "Unassigned"
```

How to explain it: this identifies the ports handling the highest number of orders.

### Product Mix

Chart type: horizontal progress-bar breakdown.

Products shown:

```text
VLSFO
MGO
HSFO
```

Formula for each fuel grade:

```text
Product Quantity = sum(order.{fuel_grade}_bdn_qty)
```

Fallback logic:

```text
If {fuel_grade}_bdn_qty is not available, use {fuel_grade}_final_qty
```

Expanded examples:

```text
VLSFO = sum(order.vlsfo_bdn_qty or order.vlsfo_final_qty)
MGO   = sum(order.mgo_bdn_qty or order.mgo_final_qty)
HSFO  = sum(order.hsfo_bdn_qty or order.hsfo_final_qty)
```

Rounding: three decimal places.

How to explain it: this shows the quantity split by product, using BDN quantity first because BDN quantity is the delivery-confirmed quantity. Final quantity is used only as a fallback.

### Top Customers

Chart type: ranked horizontal progress-bar breakdown.

Formula:

```text
Top Customers = group orders by customer name
Customer Value = sum(invoice_value for that customer)
```

Sorting:

```text
Sort by Customer Value descending
Show top 5
```

Fallback label:

```text
If an order has no customer, it is grouped as "Unassigned"
```

How to explain it: this shows which customers contribute the highest invoiced value.

## Display Notes

Some numbers are formatted compactly in the user interface.

Examples:

```text
1,200 may display as 1.2K
1,500,000 may display as 1.5M
```

Money values are displayed in compact USD format.

Examples:

```text
150000 may display as $150K
1200000 may display as $1.2M
```

For progress bars, the dashboard keeps a small minimum visible bar height or width so very small non-zero values remain visible.

## Presentation Summary

Use this short explanation when presenting the dashboard:

The dashboard tracks the full enquiry-to-completion journey. The KPI cards summarize total enquiries, orders, completed orders, conversion, received cash, and outstanding balances. The funnel shows how many enquiries become orders and how many reach completion. The supporting charts explain the pipeline by status, recent monthly trend, busiest ports, product quantity mix, and highest-value customers.
