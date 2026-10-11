'use client'

import { TelegramProvider, useTelegram } from '@/components/TelegramProvider'
import { useState } from 'react'
import HomeTab from '@/components/app/HomeTab'
import TasksTab from '@/components/app/TasksTab'
import RankTab from '@/components/app/RankTab'
import ActivityTab from '@/components/app/ActivityTab'
import ProfileTab from '@/components/app/ProfileTab'
import BottomNav from '@/components/app/BottomNav'
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

  return (
    <div className="min-h-screen bg-bg">
      <div className="pb-24 max-w-lg mx-auto">
        {tab === 'home' && <HomeTab user={user} initData={initData} setTab={setTab} />}
        {tab === 'tasks' && <TasksTab initData={initData} />}
        {tab === 'rank' && <RankTab user={user} initData={initData} />}
        {tab === 'activity' && <ActivityTab initData={initData} />}
        {tab === 'profile' && <ProfileTab user={user} initData={initData} setTab={setTab} />}
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
        <p className="mt-4 text-muted text-sm">Loading Foxi...</p>
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
        <p className="text-[10px] text-dim mt-4">Telegram bot এর 🚀 Open App থেকে আবার try করুন।</p>
      </div>
    </div>
  )
}
