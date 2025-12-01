<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Trophy, Users, MapPin, Calendar, ArrowRight, CheckCircle2, Search, MessageCircle } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { onMounted, nextTick, ref } from 'vue'
import gsap from 'gsap'

const router = useRouter()

const features = [
  {
    icon: Users,
    title: 'Smart Matching',
    description: 'Find players who match your skill level and location preferences.'
  },
  {
    icon: Calendar,
    title: 'Availability',
    description: 'Set your playing schedule and see when others are free to play.'
  },
  {
    icon: MapPin,
    title: 'Location Based',
    description: 'Discover tennis partners in your immediate area with distance filtering.'
  },
  {
    icon: Trophy,
    title: 'Skill Levels',
    description: 'Filter players by NTRP rating or general skill level (Beginner to Pro).'
  }
]

const steps = [
  {
    icon: Search,
    title: 'Discover',
    description: 'Browse players in your area based on location and skill level.'
  },
  {
    icon: MessageCircle,
    title: 'Connect',
    description: 'Send a match request or chat to coordinate a time to play.'
  },
  {
    icon: Trophy,
    title: 'Play',
    description: 'Meet on the court, enjoy the game, and expand your tennis network.'
  }
]

const handleGetStarted = () => {
  router.push('/discover')
}

onMounted(() => {
  nextTick(() => {
    // Hero Animations
    const tl = gsap.timeline()

    // Animate hero title words (Match. Play. Win.)
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

    tl.fromTo('.hero-content-fade',
      {
        y: 30,
        opacity: 0
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.5
      }
    )

    // How It Works Animation
    const howItWorksTl = gsap.timeline({ paused: true })
    
    // Animate Line
    howItWorksTl.fromTo('.connecting-line', 
      { scaleX: 0, transformOrigin: 'left center' },
      { scaleX: 1, duration: 1.5, ease: 'power2.inOut' }
    )

    // Animate Steps sequentially
    steps.forEach((_, index) => {
      howItWorksTl.fromTo(`.step-${index} .step-icon`,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.7)' },
        `-=${index === 0 ? 0.8 : 1.2}` // Overlap slightly with line or previous step
      )
      
      howItWorksTl.fromTo(`.step-${index} .step-content`,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
        '-=0.4'
      )
    })

    const howItWorksObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          howItWorksTl.play()
          howItWorksObserver.unobserve(entry.target)
        }
      })
    }, { threshold: 0.3 })

    const howItWorksSection = document.querySelector('.how-it-works-section')
    if (howItWorksSection) howItWorksObserver.observe(howItWorksSection)

    // Scroll Animations for Features (existing)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          gsap.to(entry.target, {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out',
            overwrite: true
          })
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1 })

    document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
      gsap.set(el, { y: 50, opacity: 0 })
      observer.observe(el)
    })
  })
})
</script>

<template>
  <div class="flex flex-col min-h-screen bg-background overflow-x-hidden">
    <!-- Hero Section -->
    <section class="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background dark:bg-[#020817]">
      <!-- Background Image -->
      <div class="absolute inset-0 z-0">
        <img 
          src="/src/assets/tennis_court_hero.png" 
          alt="Tennis Court"
          class="w-full h-full object-cover opacity-30 dark:opacity-60"
        />
        <!-- Gradient Overlay -->
        <div class="absolute inset-0 bg-gradient-to-b from-white/90 via-white/60 to-background dark:from-[#020817]/80 dark:via-[#020817]/50 dark:to-[#020817]"></div>
      </div>

      <!-- Hero Content -->
      <div class="relative z-10 container mx-auto px-4 md:px-6">
        <div class="flex flex-col items-center text-center space-y-8 hero-content max-w-4xl mx-auto">
          
          <div class="hero-content-fade inline-flex items-center rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 backdrop-blur-xl">
            <Trophy class="h-4 w-4 mr-2 text-green-600 dark:text-green-500" />
            Find Your Perfect Tennis Partner
          </div>
          
          <h1 class="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-foreground dark:text-white perspective-500">
            <span class="hero-word inline-block">Match.</span>
            <span class="hero-word inline-block ml-3 md:ml-6">Play.</span>
            <span class="hero-word text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-700 dark:from-green-400 dark:to-emerald-600 inline-block ml-3 md:ml-6">Win.</span>
          </h1>
          
          <p class="hero-content-fade text-xl text-muted-foreground dark:text-gray-300 max-w-[600px] md:text-2xl leading-relaxed">
            Connect with local players, schedule matches, and level up your game. 
            TennisMate makes finding your next opponent effortless.
          </p>
          
          <div class="hero-content-fade flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4">
            <!-- Neon Beam Button Wrapper -->
            <div class="relative inline-flex group overflow-hidden rounded-full p-[2px]">
              <span class="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#0000_0%,#0000_85%,rgba(255,255,255,0.3)_100%)]" />
              <Button size="lg" class="relative h-14 px-8 text-lg bg-green-600 hover:bg-green-500 text-white rounded-full shadow-lg shadow-green-900/20 w-full transition-transform md:group-hover:scale-105 duration-300" @click="handleGetStarted">
                Start Matching
                <ArrowRight class="ml-2 h-5 w-5" />
              </Button>
            </div>
            <Button size="lg" variant="outline" class="h-14 px-8 text-lg rounded-full border-input dark:border-white/20 text-foreground dark:text-white hover:bg-accent/50 dark:bg-white/5 dark:hover:bg-white/20 backdrop-blur-md transition-all md:hover:scale-105">
              Learn More
            </Button>
          </div>

          <!-- Social Proof / Stats (Removed as requested) -->
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="py-24 md:py-32 bg-muted/30 dark:bg-[#020817]/50 relative overflow-hidden">
      <div class="absolute inset-0 bg-dot-pattern pointer-events-none"></div>
      <div class="absolute inset-0 bg-green-500/5 dark:bg-green-900/5 skew-y-3 transform origin-top-left scale-110"></div>
      
      <div class="container mx-auto px-4 md:px-6 relative z-10">
        <div class="text-center mb-16 reveal-on-scroll">
          <h2 class="text-3xl md:text-5xl font-bold mb-4 text-foreground dark:bg-clip-text dark:text-transparent dark:bg-gradient-to-b dark:from-white dark:to-white/60">
            Everything you need to play
          </h2>
          <p class="text-muted-foreground text-lg max-w-2xl mx-auto">
            Powerful features designed to help you spend less time organizing and more time playing.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            v-for="(feature, index) in features" 
            :key="index"
            class="group relative p-[1px] rounded-2xl bg-gradient-to-b from-border/50 to-transparent dark:from-white/10 dark:to-transparent hover:from-green-500/30 hover:to-green-100/60 dark:hover:to-green-900/20 transition-all duration-500 reveal-on-scroll"
            :style="{ transitionDelay: `${index * 100}ms` }"
          >
            <div class="absolute inset-0 bg-gradient-to-b from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl"></div>
            <div class="relative h-full bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-border/50 dark:border-white/10 p-6 rounded-xl overflow-hidden shadow-sm dark:shadow-none group-hover:border-green-500/20 transition-colors duration-500">
              <div class="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4 group-hover:scale-105 group-hover:bg-green-500/15 transition-all duration-300">
                <component :is="feature.icon" class="h-6 w-6 text-green-600 dark:text-green-500" />
              </div>
              <h3 class="text-xl font-bold mb-2 text-foreground dark:text-white">{{ feature.title }}</h3>
              <p class="text-muted-foreground leading-relaxed">
                {{ feature.description }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How it Works Section -->
    <section class="how-it-works-section py-24 md:py-32 bg-background dark:bg-[#020817] relative">
      <div class="absolute inset-0 bg-dot-pattern pointer-events-none"></div>
      <div class="container mx-auto px-4 md:px-6">
        <div class="text-center mb-20">
          <h2 class="text-3xl md:text-5xl font-bold mb-4 text-foreground dark:text-white">How it Works</h2>
          <p class="text-muted-foreground text-lg">Get on the court in 3 simple steps</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-12 relative max-w-5xl mx-auto">
          <!-- Connecting Line (Desktop) -->
          <!-- Connecting Line (Desktop) -->
          <div class="connecting-line hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-green-500/10 z-0 overflow-hidden rounded-full">
            <div class="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-flow-line"></div>
          </div>

          <!-- Connecting Line (Mobile) -->
          <div class="connecting-line-mobile block md:hidden absolute top-12 bottom-12 left-1/2 w-0.5 -translate-x-1/2 bg-green-500/10 z-0 overflow-hidden rounded-full">
            <div class="absolute left-0 right-0 h-1/2 bg-gradient-to-b from-transparent via-green-500 to-transparent animate-flow-line-vertical"></div>
          </div>

          <div 
            v-for="(step, index) in steps" 
            :key="index"
            :class="[
              `step-${index} relative z-10`,
              'grid grid-cols-[1fr_auto_1fr] gap-4 items-center w-full',
              'md:flex md:flex-col md:items-center md:text-center'
            ]"
          >
            <div class="step-icon w-24 h-24 rounded-full bg-background dark:bg-black border-2 border-green-500/20 flex items-center justify-center col-start-2 mb-0 md:mb-8 relative shadow-[0_0_30px_-5px_rgba(16,185,129,0.2)] group hover:border-green-500/50 transition-colors duration-300">
              <component :is="step.icon" class="h-10 w-10 text-green-600 dark:text-green-500 group-hover:scale-110 transition-transform duration-300" />
              <div class="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold border-4 border-background dark:border-black shadow-sm">
                {{ index + 1 }}
              </div>
            </div>
            <div :class="[
              'step-content row-start-1 md:row-auto',
              index % 2 === 0 ? 'col-start-1 text-right pr-4' : 'col-start-3 text-left pl-4',
              'md:col-auto md:text-center md:px-0'
            ]">
              <h3 class="text-2xl font-bold mb-3 text-foreground dark:text-white inline-block bg-background dark:bg-[#020817] px-2 rounded md:bg-transparent md:dark:bg-transparent md:px-0">{{ step.title }}</h3>
              <p class="text-muted-foreground max-w-xs leading-relaxed inline-block bg-background dark:bg-[#020817] px-2 rounded md:bg-transparent md:dark:bg-transparent md:px-0">{{ step.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-24 relative overflow-hidden">
      <div class="absolute inset-0 bg-green-600 z-0">
        <div class="absolute inset-0 bg-[url('/src/assets/grid.svg')] opacity-20"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>
      
      <div class="container mx-auto px-4 md:px-6 relative z-10 text-center reveal-on-scroll">
        <h2 class="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
          Ready to serve?
        </h2>
        <p class="text-green-100 text-xl max-w-2xl mx-auto mb-10">
          Join thousands of tennis enthusiasts and find your perfect match today.
        </p>
        <Button size="lg" class="h-16 px-10 text-lg bg-white text-green-700 hover:bg-green-50 rounded-full shadow-2xl transition-all hover:scale-105 font-bold" @click="handleGetStarted">
          Join TennisMate Now
        </Button>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Custom utility for grid background if asset is missing */
.bg-\[url\(\'\/src\/assets\/grid\.svg\'\)\] {
  background-image: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
  background-size: 30px 30px;
}

.bg-dot-pattern {
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.07) 1.5px, transparent 1.5px);
  background-size: 24px 24px;
}

/* Light mode adjustment if needed */
:root:not(.dark) .bg-dot-pattern {
  background-image: radial-gradient(circle, rgba(0, 0, 0, 0.05) 1.5px, transparent 1.5px);
}

.animate-flow-line {
  animation: flow-line 6s linear infinite;
}

.animate-flow-line-vertical {
  animation: flow-line-vertical 6s linear infinite;
}

@keyframes flow-line {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

@keyframes flow-line-vertical {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(200%); }
}
</style>
