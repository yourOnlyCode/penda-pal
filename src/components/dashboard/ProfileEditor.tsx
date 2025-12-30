'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { MapPin, UtensilsCrossed, Activity, Heart, FileText } from 'lucide-react'

interface ProfileEditorProps {
  user: User
}

export function ProfileEditor({ user }: ProfileEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    bio: user.bio || '',
    country: user.country || '',
    city: user.city || '',
    favoriteFoods: user.favoriteFoods.join(', ') || '',
    activities: user.activities.join(', ') || '',
    interests: user.interests.join(', ') || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: formData.bio,
          country: formData.country,
          city: formData.city,
          favoriteFoods: formData.favoriteFoods.split(',').map(f => f.trim()).filter(Boolean),
          activities: formData.activities.split(',').map(a => a.trim()).filter(Boolean),
          interests: formData.interests.split(',').map(i => i.trim()).filter(Boolean),
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Failed to update profile')
        return
      }

      // Redirect to PendaPass - will redirect to user's unique URL
      router.push('/pendapass')
      router.refresh()
    } catch (error) {
      console.error('Profile update error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Bio Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            <div>
              <CardTitle>About Me</CardTitle>
              <CardDescription>
                Write a blog-style bio about yourself
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell us about yourself! What makes you unique? What are you passionate about? Share your story..."
            className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            rows={8}
          />
        </CardContent>
      </Card>

      {/* Location Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-purple-600" />
            <div>
              <CardTitle>Location</CardTitle>
              <CardDescription>
                Where are you from?
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Country</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="e.g., United States"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g., New York"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Interests Section - Highly Considered in Matching */}
      <Card className="border-2 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-purple-600" />
            <div>
              <CardTitle>Interests ⭐</CardTitle>
              <CardDescription>
                These are highly considered when matching you with a penpal! (comma-separated)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <input
            type="text"
            value={formData.interests}
            onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
            placeholder="e.g., reading, photography, cooking, travel, music"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </CardContent>
      </Card>

      {/* Favorite Foods */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5 text-purple-600" />
            <div>
              <CardTitle>Favorite Foods</CardTitle>
              <CardDescription>
                What foods do you love? (comma-separated)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <input
            type="text"
            value={formData.favoriteFoods}
            onChange={(e) => setFormData({ ...formData, favoriteFoods: e.target.value })}
            placeholder="e.g., pizza, sushi, tacos, pasta"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </CardContent>
      </Card>

      {/* Activities */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
            <div>
              <CardTitle>Activities</CardTitle>
              <CardDescription>
                What do you like to do? (comma-separated)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <input
            type="text"
            value={formData.activities}
            onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
            placeholder="e.g., hiking, painting, gaming, dancing"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button type="submit" size="lg" disabled={loading} className="flex-1">
          {loading ? 'Saving...' : 'Save Profile'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.push('/pendapass')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

