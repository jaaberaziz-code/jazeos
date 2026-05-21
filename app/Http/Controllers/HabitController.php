<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\HabitCategory;
use App\Http\Requests\StoreHabitRequest;
use App\Http\Requests\UpdateHabitRequest;
use App\Models\Habit;
use App\Services\Habits\HabitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class HabitController extends Controller
{
    public function __construct(
        private readonly HabitService $habitService,
    ) {}

    public function index(): Response
    {
        $habits = Habit::withCount(['logs as completed_today' => function ($q) {
            $q->whereDate('completed_date', today());
        }])
            ->where('user_id', auth()->id())
            ->orderByDesc('is_active')
            ->orderByDesc('streak_current')
            ->orderBy('name')
            ->get();

        return Inertia::render('Habits/Index', [
            'habits' => $habits,
            'categories' => HabitCategory::cases(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Habits/Create', [
            'categories' => HabitCategory::cases(),
        ]);
    }

    public function store(StoreHabitRequest $request): RedirectResponse
    {
        $this->habitService->create($request->validated());

        return redirect()->route('habits.index')
            ->with('success', __('Habit created successfully! Keep it up! 🔥'));
    }

    public function show(Habit $habit): Response
    {
        if ($habit->user_id !== auth()->id()) {
            abort(403);
        }

        $habit->load(['logs' => fn ($q) => $q->orderByDesc('completed_date')->limit(365)]);

        return Inertia::render('Habits/Show', [
            'habit' => $habit,
            'completionRate30' => $habit->completionRate(30),
            'completionRate7' => $habit->completionRate(7),
        ]);
    }

    public function edit(Habit $habit): Response
    {
        if ($habit->user_id !== auth()->id()) {
            abort(403);
        }

        return Inertia::render('Habits/Edit', [
            'habit' => $habit,
            'categories' => HabitCategory::cases(),
        ]);
    }

    public function update(UpdateHabitRequest $request, Habit $habit): RedirectResponse
    {
        if ($habit->user_id !== auth()->id()) {
            abort(403);
        }

        $this->habitService->update($habit, $request->validated());

        return redirect()->route('habits.index')
            ->with('success', __('Habit updated successfully.'));
    }

    public function destroy(Habit $habit): RedirectResponse
    {
        if ($habit->user_id !== auth()->id()) {
            abort(403);
        }

        $this->habitService->delete($habit);

        return redirect()->route('habits.index')
            ->with('success', __('Habit deleted successfully.'));
    }

    public function log(Habit $habit): RedirectResponse
    {
        if ($habit->user_id !== auth()->id()) {
            abort(403);
        }

        $this->habitService->logCompletion($habit);

        return redirect()->back()
            ->with('success', __('Logged today! ✅'));
    }

    public function unlog(Habit $habit): RedirectResponse
    {
        if ($habit->user_id !== auth()->id()) {
            abort(403);
        }

        $this->habitService->unlogCompletion($habit);

        return redirect()->back()
            ->with('success', __('Marked as not done.'));
    }

    public function calendar(Habit $habit): JsonResponse
    {
        if ($habit->user_id !== auth()->id()) {
            abort(403);
        }

        $logs = $habit->logs()
            ->orderBy('completed_date')
            ->pluck('completed_date')
            ->map(fn ($d) => $d->format('Y-m-d'));

        return response()->json($logs);
    }
}
