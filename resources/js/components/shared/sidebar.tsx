import { useState } from 'react'
import { Link, usePage } from '@inertiajs/react'
import {
    ChevronDown,
    ChevronLeft,
    LayoutDashboard,
    Wallet,
    Receipt,
    CreditCard,
    Zap,
    FileText,
    Users,
    FileBarChart,
    FileMinus,
    Percent,
    Tags,
    Briefcase,
    TrendingUp,
    FolderKanban,
    FileSignature,
    Shield,
    HandCoins,
    UtensilsCrossed,
    DollarSign,
    Calendar,
    Inbox,
    Bot,
    CheckCircle,
    type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/hooks/use-language'

interface NavItem {
    labelKey: string
    href: string
    icon: LucideIcon
    badgeKey?: 'pendingActionsCount'
}

interface NavGroup {
    labelKey: string
    icon: LucideIcon
    items: NavItem[]
}

interface SidebarProps {
    collapsed: boolean
    onToggle: () => void
}

interface SharedPageProps {
    pendingActions?: { count?: number }
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
    const { url, props } = usePage<SharedPageProps>()
    const { t } = useLanguage()
    const pendingActionsCount = props.pendingActions?.count ?? 0
    const badgeValues: Record<NonNullable<NavItem['badgeKey']>, number> = {
        pendingActionsCount,
    }

    const navigation: NavGroup[] = [
        {
            labelKey: 'nav.personalFinance',
            icon: Wallet,
            items: [
                { labelKey: 'nav.budgets', href: '/budgets', icon: Wallet },
                { labelKey: 'nav.expenses', href: '/expenses', icon: Receipt },
                { labelKey: 'nav.subscriptions', href: '/subscriptions', icon: CreditCard },
                { labelKey: 'nav.utilityBills', href: '/utility-bills', icon: Zap },
                { labelKey: 'nav.pendingActions', href: '/dashboard/pending-actions', icon: Inbox, badgeKey: 'pendingActionsCount' },
                { labelKey: 'nav.agents', href: '/dashboard/agents', icon: Bot },
                { labelKey: 'nav.habits', href: '/habits', icon: CheckCircle },
            ],
        },
        {
            labelKey: 'nav.business',
            icon: Briefcase,
            items: [
                { labelKey: 'nav.invoicing', href: '/invoicing/dashboard', icon: FileText },
                { labelKey: 'nav.customers', href: '/invoicing/customers', icon: Users },
                { labelKey: 'nav.invoices', href: '/invoicing/invoices', icon: FileBarChart },
                { labelKey: 'nav.creditNotes', href: '/invoicing/credit-notes', icon: FileMinus },
                { labelKey: 'nav.taxRates', href: '/invoicing/tax-rates', icon: Percent },
                { labelKey: 'nav.discounts', href: '/invoicing/discounts', icon: Tags },
                { labelKey: 'nav.jobApplications', href: '/job-applications', icon: Briefcase },
            ],
        },
        {
            labelKey: 'nav.assets',
            icon: TrendingUp,
            items: [
                { labelKey: 'nav.investments', href: '/investments', icon: TrendingUp },
                { labelKey: 'nav.projectInvestments', href: '/project-investments', icon: FolderKanban },
                { labelKey: 'nav.contracts', href: '/contracts', icon: FileSignature },
                { labelKey: 'nav.warranties', href: '/warranties', icon: Shield },
                { labelKey: 'nav.ious', href: '/ious', icon: HandCoins },
            ],
        },
        {
            labelKey: 'nav.lifestyle',
            icon: Calendar,
            items: [
                { labelKey: 'nav.habits', href: '/habits', icon: CheckCircle },
                { labelKey: 'nav.cycleMenus', href: '/cycle-menus', icon: UtensilsCrossed },
                { labelKey: 'nav.currency', href: '/currency', icon: DollarSign },
                { labelKey: 'nav.holidays', href: '/holidays', icon: Calendar },
            ],
        },
    ]

    const resolveLabel = (key: string): string => {
        const parts = key.split('.')
        if (parts[0] === 'nav') {
            const navKey = parts[1] as keyof typeof t.nav
            return t.nav[navKey] || key
        }
        return key
    }

    const [openGroups, setOpenGroups] = useState<string[]>(
        navigation.map(g => g.labelKey)
    )

    const toggleGroup = (labelKey: string) => {
        setOpenGroups(prev =>
            prev.includes(labelKey)
                ? prev.filter(l => l !== labelKey)
                : [...prev, labelKey]
        )
    }

    const isActive = (href: string) => {
        return url.startsWith(href)
    }

    return (
        <aside
            className={cn(
                'flex h-screen flex-col border-r border-border bg-sidebar-background transition-all duration-300',
                collapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
                {!collapsed && (
                    <Link href="/dashboard" className="text-xl font-semibold text-sidebar-foreground">
                        JazeOS
                    </Link>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    className="h-10 w-10 text-sidebar-foreground"
                >
                    <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
                </Button>
            </div>

            {/* Dashboard link */}
            <div className="px-3 py-2">
                <Link
                    href="/dashboard"
                    className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive('/dashboard')
                            ? 'border-l-2 border-foreground bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                >
                    <LayoutDashboard className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{t.nav.dashboard}</span>}
                </Link>
            </div>

            {/* Navigation groups */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
                {navigation.map((group) => (
                    <div key={group.labelKey}>
                        {!collapsed ? (
                            <button
                                onClick={() => toggleGroup(group.labelKey)}
                                className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-sidebar-foreground"
                            >
                                <span>{resolveLabel(group.labelKey)}</span>
                                <ChevronDown
                                    className={cn(
                                        'h-3 w-3 transition-transform',
                                        openGroups.includes(group.labelKey) && 'rotate-180'
                                    )}
                                />
                            </button>
                        ) : (
                            <div className="my-2 border-t border-border" />
                        )}
                        {(collapsed || openGroups.includes(group.labelKey)) && (
                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const badgeCount = item.badgeKey ? badgeValues[item.badgeKey] : 0
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                                                isActive(item.href)
                                                    ? 'border-l-2 border-foreground bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                                                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                                            )}
                                            title={collapsed ? resolveLabel(item.labelKey) : undefined}
                                        >
                                            <item.icon className="h-4 w-4 shrink-0" />
                                            {!collapsed && (
                                                <span className="flex flex-1 items-center justify-between">
                                                    <span>{resolveLabel(item.labelKey)}</span>
                                                    {badgeCount > 0 && (
                                                        <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-[10px]">
                                                            {badgeCount}
                                                        </Badge>
                                                    )}
                                                </span>
                                            )}
                                        </Link>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </nav>
        </aside>
    )
}
