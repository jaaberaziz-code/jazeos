import { Head, Link, router } from '@inertiajs/react'
import { useState } from 'react'
import { Plus, CheckCircle, Circle, Flame, CalendarDays, TrendingUp, Edit3, Trash2 } from 'lucide-react'
import AppLayout from '@/components/shared/app-layout'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/hooks/use-language'

interface Habit {
    id: number
    name: string
    description: string | null
    category: string
    frequency: string
    streak_current: number
    streak_longest: number
    total_completions: number
    is_active: boolean
    completed_today: number
    reminder_time: string | null
    reminder_enabled: boolean
}

interface Category {
    name: string
    value: string
}

interface Props {
    habits: Habit[]
    categories: Category[]
}

const categoryColors: Record<string, string> = {
    health: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    productivity: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    learning: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    fitness: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    mindfulness: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
}

const frequencyIcons: Record<string, string> = {
    daily: '📅',
    weekly: '📆',
    monthly: '📋',
}

export default function HabitsIndex({ habits, categories }: Props) {
    const { t } = useLanguage()
    const [deleteId, setDeleteId] = useState<number | null>(null)
    const [deleting, setDeleting] = useState(false)

    const handleDelete = () => {
        if (!deleteId) return
        setDeleting(true)
        router.delete(`/habits/${deleteId}`, {
            onSuccess: () => {
                setDeleteId(null)
                setDeleting(false)
            },
            onError: () => setDeleting(false),
        })
    }

    const handleToggleLog = (habit: Habit) => {
        if (habit.completed_today > 0) {
            router.post(`/habits/${habit.id}/unlog`)
        } else {
            router.post(`/habits/${habit.id}/log`)
        }
    }

    const activeHabits = habits.filter(h => h.is_active)
    const inactiveHabits = habits.filter(h => !h.is_active)

    return (
        <AppLayout>
            <Head title={t.habits.title} />
            <PageHeader
                title={t.habits.title}
                description=""
            >
                <Link href="/habits/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        {t.habits.createHabit}
                    </Button>
                </Link>
            </PageHeader>

            <div className="space-y-8 p-6">
                {/* Stats Overview */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="flex items-center gap-4 p-4">
                            <div className="rounded-lg bg-brand-50 p-3 dark:bg-brand-500/10">
                                <CheckCircle className="h-5 w-5 text-brand-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{habits.length}</p>
                                <p className="text-xs text-muted-foreground">{t.habits.title}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 p-4">
                            <div className="rounded-lg bg-green-50 p-3 dark:bg-green-500/10">
                                <Flame className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {Math.max(...habits.map(h => h.streak_current), 0)}
                                </p>
                                <p className="text-xs text-muted-foreground">{t.habits.currentStreak}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 p-4">
                            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-500/10">
                                <TrendingUp className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {Math.max(...habits.map(h => h.streak_longest), 0)}
                                </p>
                                <p className="text-xs text-muted-foreground">{t.habits.longestStreak}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 p-4">
                            <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-500/10">
                                <CalendarDays className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {habits.reduce((sum, h) => sum + h.total_completions, 0)}
                                </p>
                                <p className="text-xs text-muted-foreground">{t.habits.totalCompletions}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Active Habits */}
                {activeHabits.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="text-lg font-semibold">{t.habits.title} — {t.habits.daily}</h2>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {activeHabits.map((habit) => (
                                <Card key={habit.id} className="group relative overflow-hidden transition-all hover:shadow-md">
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{frequencyIcons[habit.frequency] || '📌'}</span>
                                                    <Link href={`/habits/${habit.id}`} className="font-semibold hover:underline">
                                                        {habit.name}
                                                    </Link>
                                                </div>
                                                {habit.description && (
                                                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{habit.description}</p>
                                                )}
                                            </div>
                                            <Button
                                                variant={habit.completed_today > 0 ? 'default' : 'outline'}
                                                size="sm"
                                                className={`shrink-0 ${habit.completed_today > 0 ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                                onClick={() => handleToggleLog(habit)}
                                            >
                                                {habit.completed_today > 0 ? '✅' : '⬜'}
                                            </Button>
                                        </div>

                                        <div className="mt-4 flex items-center gap-3">
                                            <Badge className={categoryColors[habit.category] || categoryColors.other}>
                                                {habit.category}
                                            </Badge>
                                            {habit.streak_current > 0 && (
                                                <span className="flex items-center gap-1 text-sm font-medium text-orange-500">
                                                    <Flame className="h-3.5 w-3.5" />
                                                    {habit.streak_current}
                                                </span>
                                            )}
                                            <span className="text-xs text-muted-foreground ml-auto">
                                                {habit.frequency}
                                            </span>
                                        </div>

                                        {/* Action buttons on hover */}
                                        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                            <Link href={`/habits/${habit.id}/edit`}>
                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                    <Edit3 className="h-3.5 w-3.5" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-destructive"
                                                onClick={() => setDeleteId(habit.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Inactive Habits */}
                {inactiveHabits.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="text-lg font-semibold text-muted-foreground">Inactive</h2>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {inactiveHabits.map((habit) => (
                                <Card key={habit.id} className="opacity-60 transition-all hover:opacity-100">
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <Link href={`/habits/${habit.id}`} className="font-medium hover:underline">
                                                    {habit.name}
                                                </Link>
                                                <p className="text-xs text-muted-foreground">
                                                    {habit.total_completions} completions · Best: {habit.streak_longest}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {habits.length === 0 && (
                    <EmptyState
                        icon={CheckCircle}
                        title={t.habits.noHabits}
                        description=""
                    >
                        <Link href="/habits/create">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                {t.habits.createHabit}
                            </Button>
                        </Link>
                    </EmptyState>
                )}
            </div>

            <ConfirmationDialog
                open={deleteId !== null}
                onOpenChange={() => setDeleteId(null)}
                onConfirm={handleDelete}
                loading={deleting}
                title="Delete Habit"
                description="Are you sure you want to delete this habit? All progress will be lost."
            />
        </AppLayout>
    )
}
