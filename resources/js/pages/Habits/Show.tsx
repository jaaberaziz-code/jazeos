import { Head, Link, router } from '@inertiajs/react'
import { ArrowLeft, Flame, CalendarDays, TrendingUp, CheckCircle, Circle, Edit3, Trash2 } from 'lucide-react'
import { useState } from 'react'
import AppLayout from '@/components/shared/app-layout'
import { PageHeader } from '@/components/shared/page-header'
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/hooks/use-language'

interface HabitLog {
    id: number
    completed_date: string
}

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
    reminder_time: string | null
    reminder_enabled: boolean
    logs: HabitLog[]
}

interface Props {
    habit: Habit
    completionRate30: number
    completionRate7: number
}

const categoryColors: Record<string, string> = {
    health: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    productivity: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    learning: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    fitness: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    mindfulness: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
}

export default function ShowHabit({ habit, completionRate30, completionRate7 }: Props) {
    const { t } = useLanguage()
    const [showDelete, setShowDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const handleDelete = () => {
        setDeleting(true)
        router.delete(`/habits/${habit.id}`, {
            onSuccess: () => setDeleting(false),
            onError: () => setDeleting(false),
        })
    }

    const handleToggleLog = () => {
        const today = new Date().toISOString().split('T')[0]
        const isLogged = habit.logs.some(l => l.completed_date === today)
        if (isLogged) {
            router.post(`/habits/${habit.id}/unlog`)
        } else {
            router.post(`/habits/${habit.id}/log`)
        }
    }

    // Generate last 30 days for the calendar view
    const today = new Date()
    const days: { date: string; completed: boolean }[] = []
    for (let i = 29; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        days.push({
            date: dateStr,
            completed: habit.logs.some(l => l.completed_date === dateStr),
        })
    }

    const todayLogged = habit.logs.some(l => {
        const todayStr = new Date().toISOString().split('T')[0]
        return l.completed_date === todayStr
    })

    return (
        <AppLayout>
            <Head title={habit.name} />
            <PageHeader title={habit.name} description="">
                <div className="flex items-center gap-2">
                    <Button
                        variant={todayLogged ? 'default' : 'outline'}
                        size="sm"
                        onClick={handleToggleLog}
                        className={todayLogged ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                        {todayLogged ? '✅ Logged' : '⬜ Log today'}
                    </Button>
                    <Link href={`/habits/${habit.id}/edit`}>
                        <Button variant="outline" size="sm">
                            <Edit3 className="mr-2 h-4 w-4" />
                            {t.action.edit}
                        </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => setShowDelete(true)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t.action.delete}
                    </Button>
                    <Link href="/habits">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {t.action.back}
                        </Button>
                    </Link>
                </div>
            </PageHeader>

            <div className="space-y-6 p-6">
                {/* Stats Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="flex items-center gap-4 p-4">
                            <div className="rounded-lg bg-orange-50 p-3 dark:bg-orange-500/10">
                                <Flame className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-orange-500">{habit.streak_current}</p>
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
                                <p className="text-2xl font-bold">{habit.streak_longest}</p>
                                <p className="text-xs text-muted-foreground">{t.habits.longestStreak}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 p-4">
                            <div className="rounded-lg bg-green-50 p-3 dark:bg-green-500/10">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{habit.total_completions}</p>
                                <p className="text-xs text-muted-foreground">{t.habits.totalCompletions}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex items-center gap-4 p-4">
                            <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-500/10">
                                <CalendarDays className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{completionRate30}%</p>
                                <p className="text-xs text-muted-foreground">{t.habits.completionRate} (30d)</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Info */}
                <Card>
                    <CardContent className="p-6">
                        <div className="grid gap-6 sm:grid-cols-3">
                            <div>
                                <p className="text-sm text-muted-foreground">{t.habits.category}</p>
                                <Badge className={`mt-1 ${categoryColors[habit.category] || categoryColors.other}`}>
                                    {habit.category}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t.habits.frequency}</p>
                                <p className="mt-1 font-medium capitalize">{habit.frequency}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t.habits.reminder}</p>
                                <p className="mt-1 font-medium">
                                    {habit.reminder_enabled && habit.reminder_time
                                        ? habit.reminder_time
                                        : '—'}
                                </p>
                            </div>
                        </div>
                        {habit.description && (
                            <div className="mt-4">
                                <p className="text-sm text-muted-foreground">{t.habits.description}</p>
                                <p className="mt-1">{habit.description}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Calendar heatmap (30 days) */}
                <Card>
                    <CardContent className="p-6">
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Last 30 Days
                        </h3>
                        <div className="grid grid-cols-7 gap-1.5">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                <div key={day} className="text-center text-xs text-muted-foreground">
                                    {day}
                                </div>
                            ))}
                            {days.map((day, i) => (
                                <div
                                    key={day.date}
                                    className={`flex aspect-square items-center justify-center rounded-md text-xs font-medium transition-colors ${
                                        day.completed
                                            ? 'bg-green-500 text-white dark:bg-green-600'
                                            : 'bg-muted text-muted-foreground'
                                    }`}
                                    title={`${day.date}: ${day.completed ? '✓' : '✗'}`}
                                >
                                    {new Date(day.date).getDate()}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <ConfirmationDialog
                open={showDelete}
                onOpenChange={setShowDelete}
                onConfirm={handleDelete}
                loading={deleting}
                title="Delete Habit"
                description="Are you sure? All progress will be lost."
            />
        </AppLayout>
    )
}
