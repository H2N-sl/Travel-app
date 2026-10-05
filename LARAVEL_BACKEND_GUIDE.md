# Serendib DMC — Laravel 12 REST API Backend Guide

This guide contains everything the backend developer needs to implement the Laravel 12 REST API backend for the Serendib DMC Tour Operations Vue 3 frontend.

---

## 1. Project Setup & CORS Configuration

### Create Laravel API Project:
```bash
composer create-project laravel/laravel serendib-backend
cd serendib-backend
```

### Configure CORS (`config/cors.php`):
Ensure the frontend SPA can communicate with the API without CORS errors:
```php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

---

## 2. Database Migrations (SQLite or MySQL)

### `create_agents_table.php`
```php
Schema::create('agents', function (Blueprint $table) {
    $table->id();
    $table->string('code')->unique(); // e.g. "ABC", "LON"
    $table->string('name');
    $table->string('country');
    $table->string('contact_person');
    $table->string('email');
    $table->string('phone');
    $table->integer('current_seq')->default(0);
    $table->timestamps();
});
```

### `create_bookings_table.php`
```php
Schema::create('bookings', function (Blueprint $table) {
    $table->id();
    $table->string('booking_number')->unique(); // {CODE}-{YEAR}-{0001}
    $table->foreignId('agent_id')->constrained('agents')->onDelete('cascade');
    $table->string('guest_name');
    $table->string('nationality');
    $table->integer('pax_adults')->default(2);
    $table->integer('pax_children')->default(0);
    $table->date('arrival_date');
    $table->date('departure_date');
    $table->string('arrival_flight')->default('UL504 @ 12:40 PM');
    $table->string('departure_flight')->default('UL503 @ 02:15 PM');
    $table->string('transport_type')->default('Luxury AC Van (Toyota KDH)');
    $table->string('driver_guide')->default('Samantha Bandara (National Guide)');
    $table->string('status')->default('In Operation');
    $table->text('special_requests')->nullable();
    $table->decimal('revenue_lkr', 14, 2);
    $table->decimal('expenses_hotels', 14, 2)->default(0);
    $table->decimal('expenses_transport', 14, 2)->default(0);
    $table->decimal('expenses_guide', 14, 2)->default(0);
    $table->decimal('expenses_activities', 14, 2)->default(0);
    $table->decimal('expenses_other', 14, 2)->default(0);
    $table->timestamps();
});
```

### `create_itinerary_days_table.php`
```php
Schema::create('itinerary_days', function (Blueprint $table) {
    $table->id();
    $table->foreignId('booking_id')->constrained('bookings')->onDelete('cascade');
    $table->integer('day_number');
    $table->date('date');
    $table->string('destination');
    $table->string('hotel_name');
    $table->string('meals');
    $table->text('activities');
    $table->string('transport');
    $table->timestamps();
});
```

### `create_inquiries_table.php`
```php
Schema::create('inquiries', function (Blueprint $table) {
    $table->id();
    $table->string('full_name');
    $table->string('email');
    $table->string('nationality');
    $table->date('arrival_date');
    $table->date('departure_date');
    $table->integer('travelers')->default(2);
    $table->string('package_interest')->default('custom');
    $table->string('interests')->nullable();
    $table->text('message');
    $table->string('status')->default('New'); // "New", "Contacted", "Closed"
    $table->timestamps();
});
```

---

## 3. Eloquent Models with Relationships

### `app/Models/Agent.php`
```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Agent extends Model
{
    protected $fillable = ['code', 'name', 'country', 'contact_person', 'email', 'phone', 'current_seq'];

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }
}
```

### `app/Models/Booking.php`
```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $guarded = ['id'];

    public function agent()
    {
        return $this->belongsTo(Agent::class);
    }

    public function itineraryDays()
    {
        return $this->hasMany(ItineraryDay::class)->orderBy('day_number');
    }
}
```

---

## 4. REST API Controllers (`app/Http/Controllers/API/`)

### `AgentController.php`
```php
namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use Illuminate\Http\Request;

class AgentController extends Controller
{
    public function index()
    {
        return response()->json(Agent::latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code'           => 'required|string|unique:agents,code|max:6',
            'name'           => 'required|string|max:255',
            'country'        => 'required|string|max:100',
            'contact_person' => 'required|string|max:255',
            'email'          => 'required|email',
            'phone'          => 'required|string|max:50',
        ]);

        $agent = Agent::create([
            ...$validated,
            'code' => strtoupper($validated['code']),
            'current_seq' => 0,
        ]);

        return response()->json($agent, 201);
    }
}
```

### `BookingController.php`
```php
namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\Booking;
use App\Models\ItineraryDay;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    public function index()
    {
        return response()->json(Booking::with(['agent', 'itineraryDays'])->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'agent_id'         => 'required|exists:agents,id',
            'guest_name'       => 'required|string|max:255',
            'nationality'      => 'required|string|max:100',
            'pax_adults'       => 'required|integer|min:1',
            'pax_children'     => 'integer|min:0',
            'arrival_date'     => 'required|date',
            'departure_date'   => 'required|date|after_or_equal:arrival_date',
            'arrival_flight'   => 'nullable|string',
            'departure_flight' => 'nullable|string',
            'transport_type'   => 'required|string',
            'driver_guide'     => 'required|string',
            'revenue_lkr'      => 'required|numeric|min:0',
            'special_requests' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            $agent = Agent::lockForUpdate()->findOrFail($validated['agent_id']);
            $agent->increment('current_seq');

            $seqPadded = str_pad($agent->current_seq, 4, '0', STR_PAD_LEFT);
            $bookingNumber = "{$agent->code}-" . date('Y') . "-{$seqPadded}";

            $revenue = $validated['revenue_lkr'];

            $booking = Booking::create([
                ...$validated,
                'booking_number'     => $bookingNumber,
                'status'             => 'In Operation',
                'expenses_hotels'    => $revenue * 0.45,
                'expenses_transport' => $revenue * 0.15,
                'expenses_guide'     => $revenue * 0.05,
                'expenses_activities'=> $revenue * 0.08,
                'expenses_other'     => $revenue * 0.02,
            ]);

            // Create Day 1 Arrival schedule
            ItineraryDay::create([
                'booking_id'  => $booking->id,
                'day_number'  => 1,
                'date'        => $validated['arrival_date'],
                'destination' => 'Colombo',
                'hotel_name'  => 'Cinnamon Grand Colombo',
                'meals'       => 'Dinner',
                'activities'  => 'Airport greeting, Colombo City Tour & Welcome Pack',
                'transport'   => $validated['transport_type'],
            ]);

            return response()->json($booking->load(['agent', 'itineraryDays']), 201);
        });
    }

    public function updateItinerary(Request $request, $id)
    {
        $booking = Booking::findOrFail($id);
        $days = $request->validate([
            'days' => 'required|array',
            'days.*.date' => 'required|date',
            'days.*.destination' => 'required|string',
            'days.*.hotel_name' => 'required|string',
            'days.*.meals' => 'required|string',
            'days.*.activities' => 'required|string',
            'days.*.transport' => 'required|string',
        ])['days'];

        DB::transaction(function () use ($booking, $days) {
            $booking->itineraryDays()->delete();
            foreach ($days as $idx => $day) {
                ItineraryDay::create([
                    'booking_id' => $booking->id,
                    'day_number' => $idx + 1,
                    ...$day,
                ]);
            }
        });

        return response()->json($booking->load(['agent', 'itineraryDays']));
    }
}
```

### `InquiryController.php`
```php
namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Inquiry;
use Illuminate\Http\Request;

class InquiryController extends Controller
{
    public function index()
    {
        return response()->json(Inquiry::latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name'        => 'required|string|max:255',
            'email'            => 'required|email',
            'nationality'      => 'required|string|max:100',
            'arrival_date'     => 'required|date',
            'departure_date'   => 'required|date',
            'travelers'        => 'required|integer|min:1',
            'package_interest' => 'nullable|string',
            'interests'        => 'nullable|string',
            'message'          => 'required|string',
        ]);

        $inquiry = Inquiry::create([
            ...$validated,
            'status' => 'New',
        ]);

        return response()->json($inquiry, 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $inquiry = Inquiry::findOrFail($id);
        $validated = $request->validate([
            'status' => 'required|in:New,Contacted,Closed',
        ]);

        $inquiry->update(['status' => $validated['status']]);
        return response()->json($inquiry);
    }
}
```

---

## 5. API Route Registration (`routes/api.php`)

```php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AgentController;
use App\Http\Controllers\API\BookingController;
use App\Http\Controllers\API\InquiryController;

// 1. Overseas Agents
Route::get('/agents', [AgentController::class, 'index']);
Route::post('/agents', [AgentController::class, 'store']);

// 2. Bookings & Itineraries
Route::get('/bookings', [BookingController::class, 'index']);
Route::post('/bookings', [BookingController::class, 'store']);
Route::put('/bookings/{id}/itinerary', [BookingController::class, 'updateItinerary']);

// 3. Client Inquiries
Route::get('/inquiries', [InquiryController::class, 'index']);
Route::post('/inquiries', [InquiryController::class, 'store']);
Route::patch('/inquiries/{id}/status', [InquiryController::class, 'updateStatus']);
```

---

## 6. How the Frontend Connects

The Vue 3 frontend contains an Axios service (`src/services/api.ts`).
- By default, it looks for the backend at `http://127.0.0.1:8000/api` (or `/api`).
- Anyone can change the URL directly in the UI by clicking the server indicator at the bottom of the sidebar.
- Run `php artisan serve` to start the Laravel API on `http://127.0.0.1:8000`.
- The Vue 3 app will immediately detect Laravel and switch from mock mode to live database mode!
