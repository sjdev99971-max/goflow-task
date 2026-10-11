'use client'

import { TelegramProvider, useTelegram } from '@/components/TelegramProvider'
import { useState } from 'react'
import HomeTab from '@/components/app/HomeTab'
import TasksTab from '@/components/app/TasksTab'
import RankTab from '@/components/app/RankTab'
import ActivityTab from '@/components/app/ActivityTab'
import ProfileTab from '@/components/app/ProfileTab'
import BottomNav from '@/components/app/BottomNav'

// Sub-pages
import CheckInPage from '@/components/app/pages/CheckInPage'
import LinkAccountsPage from '@/components/app/pages/LinkAccountsPage'
import HistoryPage from '@/components/app/pages/HistoryPage'
import RewardsPage from '@/components/app/pages/RewardsPage'
import SettingsPage from '@/components/app/pages/SettingsPage'
import SkillsPage from '@/components/app/pages/SkillsPage'
import NotificationsPage from '@/components/app/pages/NotificationsPage'
import PromotePage from '@/components/app/pages/PromotePage'

import { Home, Target, Trophy, Activity, User } from 'lucide-react'

export default function AppPage() {
  return (
    <TelegramProvider>
      <AppInner />
    </TelegramProvider>
  )
}

function AppInner() {
  const { user, loading, error, initData } = useTelegram()
  const [tab, setTab] = useState('home')
  const [page, setPage] = useState<string | null>(null)

  if (loading) return <Splash />
  if (error) return <ErrorScreen message={error} />
  if (!user) return <ErrorScreen message="User data পাওয়া যায়নি। Telegram bot থেকে আবার খুলুন।" />

  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'tasks', icon: Target, label: 'Tasks' },
    { id: 'rank', icon: Trophy, label: 'Rank' },
    { id: 'activity', icon: Activity, label: 'Activity' },
    { id: 'profile', icon: User, label: 'Profile' }
  ]

  const goBack = () => setPage(null)

  // Sub-page router
  if (page) {
    return (
      <div className="min-h-screen bg-bg pb-6">
        <div className="max-w-lg mx-auto">
          {page === 'checkin' && <CheckInPage user={user} initData={initData} onBack={goBack} />}
          {page === 'accounts' && <LinkAccountsPage user={user} initData={initData} onBack={goBack} />}
          {page === 'history' && <HistoryPage initData={initData} onBack={goBack} />}
          {page === 'rewards' && <RewardsPage user={user} initData={initData} onBack={goBack} />}
          {page === 'settings' && <SettingsPage user={user} initData={initData} onBack={goBack} setPage={setPage} />}
          {page === 'skills' && <SkillsPage user={user} initData={initData} onBack={goBack} />}
          {page === 'notifications' && <NotificationsPage initData={initData} onBack={goBack} />}
          {page === 'promote' && <PromotePage user={user} initData={initData} onBack={goBack} setPage={setPage} />}
          {page === 'withdraw' && <ProfileTab user={user} initData={initData} setTab={setTab} setPage={setPage} initialMode="withdraw" />}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="pb-24 max-w-lg mx-auto">
        {tab === 'home' && <HomeTab user={user} initData={initData} setTab={setTab} setPage={setPage} />}
        {tab === 'tasks' && <TasksTab initData={initData} setPage={setPage} />}
        {tab === 'rank' && <RankTab user={user} initData={initData} setPage={setPage} />}
        {tab === 'activity' && <ActivityTab initData={initData} />}
        {tab === 'profile' && <ProfileTab user={user} initData={initData} setTab={setTab} setPage={setPage} />}
      </div>
      <BottomNav tab={tab} setTab={setTab} tabs={tabs} />
    </div>
  )
}

function Splash() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-muted text-sm">Loading...</p>
      </div>
    </div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg">
      <div className="card text-center max-w-sm">
        <p className="text-3xl mb-3">⚠️</p>
        <p className="text-lg font-bold mb-2">Auth Failed</p>
        <p className="text-muted text-xs break-words whitespace-pre-wrap">{message}</p>
      </div>
    </div>
  )
}
