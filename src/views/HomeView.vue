<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Users, MapPin, Calendar } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { onMounted, nextTick } from 'vue'
import gsap from 'gsap'

const router = useRouter()

const features = [
  {
    icon: Users,
    title: 'Find Partners',
    description: 'Discover tennis players near you with similar skill levels and availability.'
  },
  {
    icon: MapPin,
    title: 'Local Courts',
    description: 'Connect with players at your favorite tennis courts and venues.'
  },
  {
    icon: Calendar,
    title: 'Easy Scheduling',
    description: 'Match with players based on your schedule and availability.'
  },
  {
    icon: Trophy,
    title: 'Skill Matching',
    description: 'Play with others at your level - from beginner to pro.'
  }
]

const handleGetStarted = () => {
  router.push('/discover')
}

onMounted(() => {
  nextTick(() => {
    // Animate hero title words
    gsap.fromTo('.hero-word', 
      {
        opacity: 0,
        y: 50,
        rotateX: -90
      },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: 'back.out(1.7)'
      }
    )
    
    // Animate description
    gsap.fromTo('.hero-description',
      {
        opacity: 0,
        y: 30
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.8,
        ease: 'power2.out'
      }
    )
    
    // Animate buttons
    gsap.fromTo('.hero-button',
      {
        opacity: 0,
        scale: 0.8
      },
      {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        stagger: 0.1,
        delay: 1.2,
        ease: 'back.out(1.7)'
      }
    )
  })
})
</script>

<template>
  <div class="flex flex-col">
    <!-- Hero Section -->
    <section class="relative border-b overflow-hidden">
      <!-- Background Image -->
      <div class="absolute inset-0 z-0">
        <img 
          src="/src/assets/tennis_court_hero.png" 
          alt="Tennis Court"
          class="w-full h-full object-cover"
        />
        <!-- Gradient Overlay -->
        <div class="absolute inset-0 bg-gradient-to-b from-background/95 via-background/90 to-background/95"></div>
      </div>
      
      <!-- Content -->
      <div class="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div class="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto">
          <div class="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
            <Trophy class="h-4 w-4" />
            Find Your Perfect Tennis Partner
          </div>
          
          <h1 class="text-4xl md:text-6xl font-bold tracking-tight perspective-500">
            <span class="hero-word inline-block">Match.</span>
            <span class="hero-word inline-block ml-3">Play.</span>
            <span class="hero-word text-primary inline-block ml-3">Win.</span>
          </h1>
          
          <p class="hero-description text-xl text-muted-foreground max-w-2xl">
            Connect with tennis players in your area. Whether you're a beginner or a pro, 
            find partners who match your skill level and schedule.
          </p>
          
          <div class="flex flex-col sm:flex-row gap-4">
            <Button size="lg" @click="handleGetStarted" class="hero-button text-base">
              Get Started
            </Button>
            <Button size="lg" variant="outline" class="hero-button text-base">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-24 bg-background">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="text-center space-y-4 mb-16">
          <h2 class="text-3xl md:text-4xl font-bold">Why TennisMate?</h2>
          <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
            The easiest way to find tennis partners and grow your game
          </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card v-for="feature in features" :key="feature.title" class="transition-all hover:shadow-lg">
            <CardHeader>
              <div class="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <component :is="feature.icon" class="h-6 w-6 text-primary" />
              </div>
              <CardTitle class="text-xl">{{ feature.title }}</CardTitle>
              <CardDescription>{{ feature.description }}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-24 bg-muted/40 border-t">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col items-center text-center space-y-6 max-w-2xl mx-auto">
          <h2 class="text-3xl md:text-4xl font-bold">Ready to Play?</h2>
          <p class="text-lg text-muted-foreground">
            Join TennisMate today and start connecting with tennis players in your area
          </p>
          <Button size="lg" @click="handleGetStarted" class="text-base">
            Start Matching
          </Button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.perspective-500 {
  perspective: 500px;
}
</style>
