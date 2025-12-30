import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Shield, Heart, Globe, Zap, Brain, Smile, Users } from 'lucide-react'
import { PandaIcon } from '@/components/PandaIcon'
import { prisma } from '@/lib/prisma'
import { PandaLogo } from '@/components/PandaLogo'
import { RotatingText } from '@/components/RotatingText'
import { ScrollingPandas } from '@/components/ScrollingPandas'

async function getUserCount() {
  try {
    return await prisma.user.count()
  } catch {
    return 0
  }
}

export default async function Home() {
  const userCount = await getUserCount()

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-purple-50 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />

        <div className="container relative mx-auto px-4 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border bg-white/50 px-4 py-2 text-sm backdrop-blur-sm dark:bg-gray-900/50">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="font-medium">Matching Pendapals when we reach 1,000 users!</span>
            </div>

            <div className="mb-6 text-sm text-muted-foreground">
              {userCount}/1,000
            </div>

            <h1 className="mb-6 flex items-center justify-center gap-4 text-6xl font-bold tracking-tight sm:text-7xl">
              <PandaLogo />
              <span>Penda</span>
            </h1>

            <div className="mb-6 rounded-lg border border-purple-200 bg-purple-50/50 p-6 dark:border-purple-800 dark:bg-purple-950/20">
              <p className="text-2xl font-semibold leading-relaxed text-purple-900 dark:text-purple-100 sm:text-3xl">
                Meet your next{' '}
                <RotatingText />
              </p>
            </div>

            <p className="mb-4 text-xl text-muted-foreground sm:text-2xl">
              Your next penpal is waiting
            </p>

            <p className="mb-6 text-lg text-muted-foreground">
              Get randomly matched with someone from anywhere in the world. Share stories, make friends, and discover new cultures through secure, real-time messaging.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="text-base">
                <Link href="/auth/signin">
                  Get Started
                  <Zap className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base">
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Scrolling Pandas Divider */}
      <ScrollingPandas />

      {/* Mental Health Benefits Section */}
      <section className="border-t bg-gradient-to-b from-white to-purple-50/30 dark:from-gray-900 dark:to-purple-950/10">
        <div className="container mx-auto px-4 py-24">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 dark:bg-purple-900/20">
                <Brain className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-purple-900 dark:text-purple-100">
                  Your Mental Health Matters
                </span>
              </div>
              <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                Friendships That Heal
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                In a world that can feel isolating, genuine connections are more than just nice to have—they're essential for our wellbeing.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-24">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Help Pendapal Grow!</h2>
          <p className="text-lg text-muted-foreground">
            A safe, fun way to connect with people worldwide
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-2 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <Globe className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Random Matching</CardTitle>
              <CardDescription>
                Get paired with someone new from anywhere in the world. Every connection is a surprise!
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Safe & Secure</CardTitle>
              <CardDescription>
                Age-appropriate matching, content moderation, and verification system keep everyone safe.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <PandaIcon size={24} />
              </div>
              <CardTitle>Real-time Chat</CardTitle>
              <CardDescription>
                Instant messaging with stickers, emotes, and GIFs. Verified users can share photos and videos.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900/20">
                <Heart className="h-6 w-6 text-pink-600" />
              </div>
              <CardTitle>Meaningful Connections</CardTitle>
              <CardDescription>
                2-week minimum relationship period encourages real friendships that support your mental health, not just quick chats.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/20">
                <Sparkles className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Fun Stickers & Emotes</CardTitle>
              <CardDescription>
                Express yourself with custom app stickers, GIFs, and emotes designed just for Penda.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Verified Features</CardTitle>
              <CardDescription>
                Unlock multiple penpals and media sharing for just $1.99/month with verification.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-24 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Ready to meet your penpal?
          </h2>
          <p className="mb-4 text-lg text-muted-foreground">
            Join thousands of people making friends around the world
          </p>
          <p className="mb-8 text-base text-muted-foreground">
            Every friendship starts with a single message. Take that first step toward better mental health and genuine connection.
          </p>
          <Button asChild size="lg" className="text-base">
            <Link href="/auth/signin" className="flex items-center gap-2">
              Start Chatting Now
              <PandaIcon size={16} />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © 2024 Penda. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
              <Link href="/contact" className="hover:text-foreground">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
