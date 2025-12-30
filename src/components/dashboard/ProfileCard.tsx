import { User } from '@prisma/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MapPin, Heart, UtensilsCrossed, Activity } from 'lucide-react'

interface ProfileCardProps {
  user: User
}

export function ProfileCard({ user }: ProfileCardProps) {
  const hasProfile = user.bio || user.country || user.city || user.favoriteFoods.length > 0 || user.activities.length > 0

  if (!hasProfile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">
          Your profile is empty. Add some information to help others get to know you!
        </p>
        <Button asChild>
          <Link href="/dashboard/profile">Create Your Profile</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Location */}
      {(user.city || user.country) && (
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <p className="font-medium">Location</p>
            <p className="text-muted-foreground">
              {[user.city, user.country].filter(Boolean).join(', ') || 'Not specified'}
            </p>
          </div>
        </div>
      )}

      {/* Bio */}
      {user.bio && (
        <div>
          <p className="font-medium mb-2">About Me</p>
          <p className="text-muted-foreground whitespace-pre-wrap">{user.bio}</p>
        </div>
      )}

      {/* Favorite Foods */}
      {user.favoriteFoods.length > 0 && (
        <div className="flex items-start gap-3">
          <UtensilsCrossed className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <p className="font-medium mb-2">Favorite Foods</p>
            <div className="flex flex-wrap gap-2">
              {user.favoriteFoods.map((food, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                >
                  {food}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Activities */}
      {user.activities.length > 0 && (
        <div className="flex items-start gap-3">
          <Activity className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <p className="font-medium mb-2">Activities</p>
            <div className="flex flex-wrap gap-2">
              {user.activities.map((activity, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                >
                  {activity}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Interests */}
      {user.interests.length > 0 && (
        <div className="flex items-start gap-3">
          <Heart className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <p className="font-medium mb-2">Interests</p>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

