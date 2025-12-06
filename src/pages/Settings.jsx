import React from 'react'
import { useState } from 'react'
import { useCurrentUser, useStore } from '@/lib/store'
import { API_URL } from '@/lib/constants'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'
import { GradesItem } from '@/components/custom/grades-item'

export async function fetchReferralData(user, changeUserData, {
  setReferralCode,
  setReferralStatus,
  setLoading,
} = {}) {
  if (!user) return
  if (setLoading) setLoading(true)
  try {
    const response = await fetch(`${API_URL}referral?username=${encodeURIComponent(user.username)}`)
    const data = await response.json()

    const referralCode = data.referralCode || 'N/A'
    const numberOfReferrals = data.numberOfReferrals ?? 0

    if (setReferralCode) setReferralCode(referralCode)
    if (setReferralStatus) setReferralStatus(numberOfReferrals)

    const isPremium = numberOfReferrals >= 0
    changeUserData('premium', isPremium)
  } catch (error) {
    console.error('Failed to fetch referral data:', error)
  } finally {
    if (setLoading) setLoading(false)
  }
}

export default function Settings() {
  const user = useCurrentUser()
  const changeUserData = useStore((s) => s.changeUserData)
  const { setTheme } = useTheme()
  const [referralStatus, setReferralStatus] = useState(null)
  const [referralCode, setReferralCode] = useState(null)
  const [loading, setLoading] = useState(false)

  React.useEffect(() => {
    if (user?.username) {
      fetchReferralData(user, changeUserData, { setReferralCode, setReferralStatus, setLoading })
    }
  }, [])

  if (!user) {
    return (
      <div className="p-4">
        <h1 className="text-4xl font-bold">Settings</h1>
        <p className="mt-2 text-muted-foreground">No user selected.</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold">Settings</h1>
      <p className="mt-2 text-muted-foreground">Application settings and preferences.</p>

      <div className="mt-6 space-y-8">
        <section>
          <h2 className="text-lg font-semibold">Referrals</h2>
          <p className="text-sm text-muted-foreground mt-1">Share this code to others when they sign-in for the first time to gain more referrals.</p>

          <div className="mt-4 flex items-center gap-10">
            {referralCode && (
              <div className="flex flex-col">
                <Label className="text-sm">Your Referral Code</Label>
                <p className="text-4xl font-bold font-mono mt-2">{referralCode}</p>
              </div>
            )}

            {referralStatus !== null && (
              <div className="flex flex-col">
                <Label className="text-sm">Referral Status</Label>
                <p className="text-4xl font-bold mt-2">{referralStatus}/5</p>
              </div>
            )}

            <Button onClick={() => fetchReferralData(user, changeUserData, { setReferralCode, setReferralStatus, setLoading })} disabled={loading} className="self-end">
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>

          {user.premium && (
            <div className="mt-4 p-3 bg-green-200 dark:bg-green-900 rounded-md w-fit">
              <p className="text-green-900 dark:text-green-100 font-semibold">Premium Unlocked</p>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold">Appearance</h2>
          <p className="text-sm text-muted-foreground mt-1">Theme and visual preferences.</p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col">
              <Label>Theme</Label>
              <div className="mt-2">
                <Select
                  value={user.theme}
                  onValueChange={(val) => {
                    changeUserData('theme', val)
                    if (val === 'light' || val === 'dark') setTheme(val)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Theme</SelectLabel>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='flex'>
              <div className="flex flex-col">
                <Label>Grades view</Label>
                <div className="mt-2 flex items-start gap-4">
                  <div className="w-48">
                    <Select
                      value={user.gradesView}
                      onValueChange={(val) => changeUserData('gradesView', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select view" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Grades</SelectLabel>
                          <SelectItem value="list">List</SelectItem>
                          <SelectItem value="card">Cards</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="absolute translate-x-50 h-24 w-36 flex items-center justify-center">
                <GradesItem
                  courseName="Preview Course"
                  id="MATH101"
                  grade={92}
                  variant={user.gradesView}
                />
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold">General</h2>
          <p className="text-sm text-muted-foreground mt-1">General app options.</p>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={!!user.showPageTitles}
                onCheckedChange={(checked) => changeUserData('showPageTitles', !!checked)}
              />
              <div>
                <Label>Show page titles</Label>
                <div className="text-sm text-muted-foreground">Show or hide page titles across the app.</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
