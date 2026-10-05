# Serendib & Metshu DMC — 6-Stage Reservation Engine Backend Guide

This documentation specifies the complete architecture, database schema, service layer, and REST API controllers for the **End-to-End Destination Management Company (DMC) Reservation Life Cycle**.

```
Stage 1: Lead Intake ──> Stage 2: Itinerary & Resources ──> Stage 3: Costing & Quotation ──> Stage 4: Billing & Payments ──> Stage 5: Vouchers & QR ──> Stage 6: Client Docs & Post-Trip
```

---

## 1. Complete Database Schema (Migrations)

### `create_bookings_table.php`
```php
Schema::create('bookings', function (Blueprint $table) {
    $table->id();
    $table->string('booking_number')->unique(); // e.g. "ABC-2026-0001"
    $table->foreignId('agent_id')->constrained('agents')->onDelete('cascade');
    $table->string('guest_name');
    $table->string('nationality');
    $table->integer('pax_adults')->default(2);
    $table->integer('pax_children')->default(0);
    $table->integer('pax_infants')->default(0);
    $table->date('arrival_date');
    $table->date('departure_date');
    $table->string('arrival_flight')->default('UL504 @ 12:40 PM');
    $table->string('departure_flight')->default('UL503 @ 02:15 PM');
    $table->string('transport_type')->default('Luxury AC Van (Toyota KDH)');
    $table->string('driver_guide')->default('Samantha Bandara (National Guide)');
    $table->string('driver_phone')->nullable();
    $table->string('driver_language')->default('English');
    $table->string('status')->default('In Operation'); // "In Operation", "Confirmed", "Completed", "Cancelled"
    $table->enum('lifecycle_stage', [
        'inquiry_intake',
        'itinerary_customization',
        'quotation_billing',
        'confirmation_vouchers',
        'operations_dispatch',
        'post_trip'
    ])->default('inquiry_intake');
    $table->enum('payment_status', ['pending', 'deposit_paid', 'fully_paid', 'cancelled'])->default('pending');
    $table->text('special_requests')->nullable();
    $table->decimal('revenue_lkr', 14, 2);
    $table->decimal('revenue_usd', 10, 2)->nullable();
    $table->decimal('markup_percentage', 5, 2)->default(25.00);
    $table->decimal('expenses_hotels', 14, 2)->default(0);
    $table->decimal('expenses_transport', 14, 2)->default(0);
    $table->decimal('expenses_guide', 14, 2)->default(0);
    $table->decimal('expenses_activities', 14, 2)->default(0);
    $table->decimal('expenses_other', 14, 2)->default(0);
    $table->timestamps();
});
```

### `create_booking_days_table.php` (Itinerary Days)
```php
Schema::create('booking_days', function (Blueprint $table) {
    $table->id();
    $table->foreignId('booking_id')->constrained('bookings')->onDelete('cascade');
    $table->integer('day_number');
    $table->date('date');
    $table->string('destination');
    $table->string('hotel_name');
    $table->string('room_category')->default('Deluxe Room');
    $table->enum('meal_plan', ['RO', 'BB', 'HB', 'FB', 'AI'])->default('HB');
    $table->string('meals');
    $table->text('activities');
    $table->string('transport');
    $table->text('notes')->nullable();
    $table->timestamps();
});
```

### `create_payments_table.php`
```php
Schema::create('payments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('booking_id')->constrained('bookings')->onDelete('cascade');
    $table->decimal('amount', 14, 2);
    $table->string('currency', 3)->default('LKR');
    $table->enum('type', ['deposit', 'balance', 'full']);
    $table->enum('method', ['stripe', 'payhere', 'bank_transfer']);
    $table->string('reference');
    $table->date('payment_date');
    $table->text('notes')->nullable();
    $table->timestamps();
});
```

### `create_vouchers_table.php`
```php
Schema::create('vouchers', function (Blueprint $table) {
    $table->id();
    $table->foreignId('booking_id')->constrained('bookings')->onDelete('cascade');
    $table->enum('type', ['hotel_checkin', 'transport_duty_slip', 'safari_pass']);
    $table->string('title');
    $table->string('supplier_name');
    $table->string('verification_token')->unique();
    $table->text('service_details');
    $table->date('valid_date');
    $table->string('qr_data');
    $table->timestamps();
});
```

---

## 2. Service Layer: `ReservationEngineService.php`

Encapsulates all financial calculations, markup rules, and document generation logic:

```php
namespace App\Services;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\Voucher;
use Illuminate\Support\Str;

class ReservationEngineService
{
    /**
     * Stage 3: Calculate gross tour pricing with DMC markup
     */
    public function calculateQuote(Booking $booking, float $markupPercentage = 25.0, string $currency = 'LKR'): array
    {
        $daysCount = $booking->itineraryDays()->count() ?: 7;
        
        $netHotels = $daysCount * 140000;
        $netTransport = $daysCount * 45000;
        $netGuide = $daysCount * 18000;
        $netActivities = $daysCount * 25000;
        
        $netTotal = $netHotels + $netTransport + $netGuide + $netActivities;
        $markupAmount = round($netTotal * ($markupPercentage / 100));
        $grossTotalLKR = $netTotal + $markupAmount;
        $grossTotalUSD = round($grossTotalLKR / 300);

        $booking->update([
            'revenue_lkr'        => $grossTotalLKR,
            'revenue_usd'        => $grossTotalUSD,
            'markup_percentage'  => $markupPercentage,
            'expenses_hotels'    => $netHotels,
            'expenses_transport' => $netTransport,
            'expenses_guide'     => $netGuide,
            'expenses_activities'=> $netActivities,
            'lifecycle_stage'    => 'quotation_billing'
        ]);

        return [
            'net_total'        => $netTotal,
            'markup_amount'    => $markupAmount,
            'gross_total_lkr'  => $grossTotalLKR,
            'gross_total_usd'  => $grossTotalUSD,
            'deposit_required' => round($grossTotalLKR * 0.3)
        ];
    }

    /**
     * Stage 4: Record payment and advance state machine
     */
    public function recordPayment(Booking $booking, array $paymentData): Payment
    {
        $payment = $booking->payments()->create([
            ...$paymentData,
            'payment_date' => now()->toDateString()
        ]);

        $totalPaid = $booking->payments()->sum('amount');
        if ($totalPaid >= ($booking->revenue_lkr * 0.98)) {
            $booking->update([
                'payment_status'  => 'fully_paid',
                'lifecycle_stage' => 'confirmation_vouchers'
            ]);
        } elseif ($totalPaid > 0) {
            $booking->update([
                'payment_status'  => 'deposit_paid',
                'lifecycle_stage' => 'confirmation_vouchers'
            ]);
        }

        return $payment;
    }

    /**
     * Stage 5: Issue Hotel Vouchers and Driver Duty Slips with QR tokens
     */
    public function generateVouchers(Booking $booking): array
    {
        $vouchers = [];

        // Hotel checkin vouchers
        $distinctHotels = $booking->itineraryDays->unique('hotel_name')->where('hotel_name', '!=', 'Departure');
        foreach ($distinctHotels as $day) {
            $token = "VOUCH-{$booking->booking_number}-{$day->day_number}-" . strtoupper(Str::random(4));
            $vouchers[] = Voucher::firstOrCreate([
                'booking_id'         => $booking->id,
                'supplier_name'      => $day->hotel_name,
            ], [
                'type'               => 'hotel_checkin',
                'title'              => "Hotel Check-in Voucher: {$day->hotel_name}",
                'verification_token' => $token,
                'service_details'    => "Accommodation for {$booking->pax_adults} Adults. Plan: {$day->meal_plan}.",
                'valid_date'         => $day->date,
                'qr_data'            => "https://metshutravels.com/verify?token={$token}"
            ]);
        }

        // Driver Duty Slip
        $transToken = "TRANS-{$booking->booking_number}-DUTY";
        $vouchers[] = Voucher::firstOrCreate([
            'booking_id'         => $booking->id,
            'type'               => 'transport_duty_slip'
        ], [
            'title'              => "Chauffeur Duty Slip: {$booking->transport_type}",
            'supplier_name'      => 'Metshu & Serendib Executive Fleet',
            'verification_token' => $transToken,
            'service_details'    => "Allocated Chauffeur: {$booking->driver_guide} ({$booking->driver_phone})",
            'valid_date'         => $booking->arrival_date,
            'qr_data'            => "https://metshutravels.com/verify?token={$transToken}"
        ]);

        return $vouchers;
    }
}
```

---

## 3. REST API Routes (`routes/api.php`)

```php
use App\Http\Controllers\API\BookingLifecycleController;
use App\Http\Controllers\API\AgentController;
use App\Http\Controllers\API\InquiryController;

Route::prefix('v1')->group(function () {
    // Stage 1: Lead Capture & Reservation Init
    Route::post('/bookings', [BookingLifecycleController::class, 'store']);
    Route::get('/bookings', [BookingLifecycleController::class, 'index']);
    Route::get('/bookings/{id}', [BookingLifecycleController::class, 'show']);

    // Stage 2: Itinerary & Resource Allocation
    Route::put('/bookings/{id}/itinerary', [BookingLifecycleController::class, 'updateItinerary']);
    Route::put('/bookings/{id}/allocations', [BookingLifecycleController::class, 'updateAllocations']);

    // Stage 3: Financial Costing & Quotation
    Route::post('/bookings/{id}/calculate-quote', [BookingLifecycleController::class, 'calculateQuote']);

    // Stage 4: Invoicing & Payment Processing
    Route::post('/bookings/{id}/payments', [BookingLifecycleController::class, 'recordPayment']);
    Route::get('/bookings/{id}/payments', [BookingLifecycleController::class, 'getPayments']);

    // Stage 5: Service Vouchers & QR Verification
    Route::get('/bookings/{id}/vouchers', [BookingLifecycleController::class, 'getVouchers']);

    // Stage 6: Client Documents Dispatch (Welcome Letter, Agreement, Survey)
    Route::get('/bookings/{id}/documents/{type}', [BookingLifecycleController::class, 'getDocument']);

    // Stage Transitions
    Route::put('/bookings/{id}/stage', [BookingLifecycleController::class, 'updateStage']);

    // Agents & Inquiries
    Route::get('/agents', [AgentController::class, 'index']);
    Route::post('/agents', [AgentController::class, 'store']);
    Route::get('/inquiries', [InquiryController::class, 'index']);
    Route::post('/inquiries', [InquiryController::class, 'store']);
    Route::patch('/inquiries/{id}/status', [InquiryController::class, 'updateStatus']);
});
```
