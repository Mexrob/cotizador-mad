'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Notification {
    id: string
    title: string
    message: string
    type: string
    link?: string
    isRead: boolean
    createdAt: string
}

export function NotificationsDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()
    const { data: session } = useSession()

    const fetchNotifications = async () => {
        if (!session) return
        
        try {
            const response = await fetch('/api/notifications')
            if (response.status === 401) return
            const data = await response.json()
            if (data.success) {
                setNotifications(data.data)
                setUnreadCount(data.data.filter((n: Notification) => !n.isRead).length)
            }
        } catch (error) {
            console.error('Error fetching notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session) {
            fetchNotifications()
            const interval = setInterval(fetchNotifications, 60000)
            return () => clearInterval(interval)
        }
    }, [session])

    const markAsRead = async (id: string, link?: string) => {
        try {
            // Optimistic update
            setNotifications(prev =>
                prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
            )
            setUnreadCount(prev => Math.max(0, prev - 1))

            await fetch(`/api/notifications/${id}/read`, { method: 'PUT' })

            if (link) {
                setIsOpen(false)
                router.push(link)
            }
        } catch (error) {
            console.error('Error marking as read:', error)
            // Revert on error (optional, but good practice)
            fetchNotifications()
        }
    }

    const markAllAsRead = async () => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            setUnreadCount(0)

            await fetch('/api/notifications/mark-all-read', { method: 'PUT' })
        } catch (error) {
            console.error('Error marking all as read:', error)
            fetchNotifications()
        }
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-96">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notificaciones</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto py-1 px-2"
                            onClick={markAllAsRead}
                        >
                            Marcar todas leídas
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px] sm:h-[400px]">
                    {loading ? (
                        <div className="flex items-center justify-center h-20">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                            <Bell className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-sm">No tienes notificaciones</p>
                        </div>
                    ) : (
                        <div className="py-1">
                            {notifications.map((notification) => (
                                <DropdownMenuItem
                                    key={notification.id}
                                    className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                        }`}
                                    onClick={() => markAsRead(notification.id, notification.link)}
                                >
                                    <div className="flex items-start justify-between w-full gap-2">
                                        <span className={`font-medium text-sm ${!notification.isRead ? 'text-blue-700 dark:text-blue-300' : ''}`}>
                                            {notification.title}
                                        </span>
                                        {!notification.isRead && (
                                            <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                                        {notification.message}
                                    </p>
                                    <div className="flex items-center justify-between w-full mt-1">
                                        <span className="text-[10px] text-gray-400">
                                            {formatDistanceToNow(new Date(notification.createdAt), {
                                                addSuffix: true,
                                                locale: es
                                            })}
                                        </span>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
