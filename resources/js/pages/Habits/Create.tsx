import { Head, Link, router } from '@inertiajs/react'
import { useForm } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'
import AppLayout from '@/components/shared/app-layout'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useLanguage } from '@/hooks/use-language'

interface Category {
    name: string
    value: string
}

interface Props {
    categories: Category[]
}

export default function CreateHabit({ categories }: Props) {
    const { t } = useLanguage()
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        category: 'other',
        frequency: 'daily',
        reminder_time: '',
        reminder_enabled: false,
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        post('/habits')
    }

    return (
        <AppLayout>
            <Head title={t.habits.createHabit} />
            <PageHeader title={t.habits.createHabit} description="">
                <Link href="/habits">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t.action.back}
                    </Button>
                </Link>
            </PageHeader>

            <div className="p-6">
                <Card className="mx-auto max-w-2xl">
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">{t.habits.habitName}</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    placeholder="e.g., Read 30 minutes"
                                    className={errors.name ? 'border-destructive' : ''}
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">{t.habits.description}</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    placeholder="Why this habit matters..."
                                    rows={3}
                                />
                            </div>

                            {/* Category & Frequency */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>{t.habits.category}</Label>
                                    <Select
                                        value={data.category}
                                        onValueChange={v => setData('category', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                    {cat.value.charAt(0).toUpperCase() + cat.value.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>{t.habits.frequency}</Label>
                                    <Select
                                        value={data.frequency}
                                        onValueChange={v => setData('frequency', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">{t.habits.daily}</SelectItem>
                                            <SelectItem value="weekly">{t.habits.weekly}</SelectItem>
                                            <SelectItem value="monthly">{t.habits.monthly}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Reminder */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="reminder">{t.habits.reminder}</Label>
                                    <Switch
                                        id="reminder"
                                        checked={data.reminder_enabled}
                                        onCheckedChange={v => {
                                            setData('reminder_enabled', v)
                                            if (!v) setData('reminder_time', '')
                                        }}
                                    />
                                </div>
                                {data.reminder_enabled && (
                                    <Input
                                        type="time"
                                        value={data.reminder_time}
                                        onChange={e => setData('reminder_time', e.target.value)}
                                    />
                                )}
                            </div>

                            {/* Submit */}
                            <div className="flex items-center justify-end gap-4 pt-4">
                                <Link href="/habits">
                                    <Button type="button" variant="outline">{t.action.cancel}</Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    {t.habits.createHabit}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    )
}
