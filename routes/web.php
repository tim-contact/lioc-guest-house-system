<?php

use App\Http\Controllers\AgentController;
use App\Http\Controllers\AgentPicController;
use App\Http\Controllers\BargeController;
use App\Http\Controllers\BdnController;
use App\Http\Controllers\CreditManagementController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DisputeController;
use App\Http\Controllers\EnquiryController;
use App\Http\Controllers\EnquiryCustomerController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\OperationController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PortController;
use App\Http\Controllers\SurveyingController;
use App\Http\Controllers\SurveyorController;
use App\Http\Controllers\UserManagementController;
use Illuminate\Support\Facades\Route;

// Guest routes.
Route::redirect('/', '/login')->name('home')->middleware('guest');

// All authenticated active users.
Route::middleware(['auth', 'verified', 'active'])->group(function () {

    // --- Admin section: super_admin and master only ---
    Route::middleware('role:super_admin,master')->group(function () {
        Route::inertia('admin', 'admin')->name('admin');

        // User management.
        Route::get('users', [UserManagementController::class, 'index'])->name('users.index');
        Route::post('users', [UserManagementController::class, 'store'])->name('users.store');
        Route::patch('users/{user}', [UserManagementController::class, 'update'])->name('users.update');
        Route::patch('users/{user}/deactivate', [UserManagementController::class, 'deactivate'])->name('users.deactivate');
        Route::patch('users/{user}/activate', [UserManagementController::class, 'activate'])->name('users.activate');
        Route::delete('users/{user}', [UserManagementController::class, 'destroy'])->name('users.destroy');

        // Order table (all orders).
        Route::get('orders/all', [OrderController::class, 'table'])->name('orders.table');
        Route::patch('orders/all/{order}', [OrderController::class, 'tableUpdate'])->name('orders.table.update');

        // Enquiry edit (admin).
        Route::get('enquiries/edit', [EnquiryController::class, 'edit'])->name('enquiries.edit');
        Route::post('enquiries/edit', [EnquiryController::class, 'editStore'])->name('enquiries.edit.store');
        Route::patch('enquiries/edit/{enquiry}', [EnquiryController::class, 'editUpdate'])->name('enquiries.edit.update');
        Route::delete('enquiries/edit/{enquiry}', [EnquiryController::class, 'destroy'])->name('enquiries.edit.destroy');

        // Dispute table (all disputes).
        Route::get('disputes/all', [DisputeController::class, 'table'])->name('disputes.table');

        // CRUD management.
        Route::resource('customers', CustomerController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::resource('ports', PortController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::get('barges/edit', [BargeController::class, 'edit'])->name('barges.edit');
        Route::resource('barges', BargeController::class)->only(['store', 'update', 'destroy']);
        Route::resource('agents', AgentController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::resource('agent-pics', AgentPicController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::get('surveyors/edit', [SurveyorController::class, 'edit'])->name('surveyors.edit');
        Route::resource('surveyors', SurveyorController::class)->only(['store', 'update', 'destroy']);
    });

    // --- Sales section: super_admin, master, sales ---
    Route::middleware('role:super_admin,master,sales')->group(function () {
        Route::inertia('sales-dashboard', 'sales/dashboard')->name('sales-dashboard');
        Route::get('credit-management', [CreditManagementController::class, 'index'])->name('credit-management');
        Route::get('orders', [OrderController::class, 'index'])->name('orders');
        Route::patch('orders/{order}', [OrderController::class, 'update'])->name('orders.update');
        Route::patch('orders/{order}/cancel', [OrderController::class, 'cancel'])->name('orders.cancel');
        Route::get('disputes', [DisputeController::class, 'index'])->name('disputes');
        Route::post('orders/{order}/disputes', [DisputeController::class, 'store'])->name('disputes.store');
        Route::patch('disputes/{dispute}', [DisputeController::class, 'update'])->name('disputes.update');
        Route::patch('disputes/{dispute}/close', [DisputeController::class, 'close'])->name('disputes.close');
        Route::patch('disputes/{dispute}/reopen', [DisputeController::class, 'reopen'])->name('disputes.reopen');
        Route::delete('disputes/{dispute}', [DisputeController::class, 'destroy'])->name('disputes.destroy');
        Route::resource('enquiries', EnquiryController::class)->only(['index', 'store', 'update']);
        Route::patch('enquiries/{enquiry}/details', [EnquiryController::class, 'updateDetails'])->name('enquiries.details.update');
        Route::patch('enquiries/{enquiry}/lost', [EnquiryController::class, 'markLost'])->name('enquiries.lost');
        Route::post('enquiries/{enquiry}/customers', [EnquiryCustomerController::class, 'store'])->name('enquiries.customers.store');
        Route::patch('enquiry-customers/{enquiryCustomer}', [EnquiryCustomerController::class, 'update'])->name('enquiry-customers.update');
        Route::patch('enquiry-customers/{enquiryCustomer}/status', [EnquiryCustomerController::class, 'updateStatus'])->name('enquiry-customers.update-status');
    });

    // --- Operations section: super_admin, master, operations ---
    Route::middleware('role:super_admin,master,operations')->group(function () {
        Route::get('operations', [OperationController::class, 'index'])->name('operations');
        Route::patch('operations/{order}', [OperationController::class, 'update'])->name('operations.update');
    });

    // --- Surveyor section: super_admin, master, surveyor ---
    Route::middleware('role:super_admin,master,surveyor')->group(function () {
        Route::get('surveyor', [SurveyingController::class, 'index'])->name('surveyor');
        Route::patch('surveyor/{order}', [SurveyingController::class, 'update'])->name('surveyor.update');
        Route::patch('surveyor/{order}/complete', [SurveyingController::class, 'complete'])->name('surveyor.complete');
        Route::put('surveyor/{order}/bdn', [BdnController::class, 'update'])->name('surveyor.bdn.update');
        Route::get('bdns', [BdnController::class, 'index'])->name('bdns.index');
        Route::get('bdns/{order}/ebdn', [BdnController::class, 'ebdn'])->name('bdns.ebdn');
    });

    // --- Finance section: super_admin, master, finance ---
    Route::middleware('role:super_admin,master,finance')->group(function () {
        Route::get('finance', [FinanceController::class, 'index'])->name('finance');
        Route::post('finance/{order}/payments', [FinanceController::class, 'storePayment'])->name('finance.payments.store');
        Route::patch('finance/{order}/close', [FinanceController::class, 'close'])->name('finance.close');
        Route::resource('invoices', InvoiceController::class)->only(['index', 'update'])->parameters(['invoices' => 'order']);
        Route::resource('payments', PaymentController::class)->only(['index', 'update', 'destroy']);
    });
});

require __DIR__.'/settings.php';
